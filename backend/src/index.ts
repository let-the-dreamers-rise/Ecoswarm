import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { Portfolio } from './models/Portfolio.js';
import { TokenBalances } from './models/TokenBalances.js';
import { AggregateMetrics } from './models/AggregateMetrics.js';
import { EnvironmentalEvent } from './models/EnvironmentalEvent.js';
import { ImpactScoreCalculator } from './services/ImpactScoreCalculator.js';
import { HederaTokenManager } from './services/HederaTokenManager.js';
import { HederaEventRecorder } from './services/HederaEventRecorder.js';
import { MilestonePayoutEngine } from './services/MilestonePayoutEngine.js';
import { SimulationEngine } from './services/SimulationEngine.js';
import { EcoSwarmAgentService } from './services/EcoSwarmAgentService.js';
import { mountEcoSwarmA2AService } from './services/EcoSwarmA2AService.js';
import { HederaSmartContractService } from './services/HederaSmartContractService.js';
import { HederaAccountService } from './services/HederaAccountService.js';
import { HederaMirrorService } from './services/HederaMirrorService.js';
import { formatEventToJSON, parseEventFromJSON } from './utils/EventParser.js';
import {
  CaseActionType,
  DemoControlMessage,
  HederaEventRecord,
  MetricsResponse,
  OnChainActionStep,
  OptimizeResponse,
  PortfolioResponse,
  RoleAccountBinding,
  RoleAccountType,
  SubmitCaseActionResponse,
  SubmitEventResponse,
  TokenBalancesResponse
} from './types/index.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3000);
const runtimeStatePath = process.env.BACKEND_STATE_PATH
  ? resolve(process.env.BACKEND_STATE_PATH)
  : resolve(process.cwd(), '.codex-runtime', 'backend-state.json');

const portfolio = new Portfolio();
const tokenBalances = new TokenBalances();
const aggregateMetrics = new AggregateMetrics();
const impactScoreCalculator = new ImpactScoreCalculator();
const hederaTokenManager = new HederaTokenManager(tokenBalances);
const hederaEventRecorder = new HederaEventRecorder();
const milestonePayoutEngine = new MilestonePayoutEngine();
const hederaSmartContract = new HederaSmartContractService();
const hederaAccountService = new HederaAccountService();
const hederaMirrorService = new HederaMirrorService(process.env.HEDERA_NETWORK || 'testnet');
const simulationEngine = new SimulationEngine(`http://localhost:${PORT}`);
const backendPublicUrl =
  process.env.HOL_AGENT_PUBLIC_URL ||
  process.env.BACKEND_PUBLIC_URL ||
  '';

interface QueuedEvent {
  requestBody: any;
  resolve: (response: SubmitEventResponse) => void;
  reject: (error: any) => void;
}

const eventQueue: QueuedEvent[] = [];
let isProcessingQueue = false;

interface PersistedState {
  portfolio: PortfolioResponse;
  token_balances: TokenBalancesResponse;
  case_registry: ReturnType<typeof formatEventToJSON>[];
  event_history: ReturnType<typeof formatEventToJSON>[];
  hedera_records: HederaEventRecord[];
  role_accounts_by_event_id: Record<string, Record<RoleAccountType, RoleAccountBinding>>;
}

let persistedState: PersistedState | null = null;
const hederaRecords: HederaEventRecord[] = [];
const projectRoleAccounts = new Map<string, Record<RoleAccountType, RoleAccountBinding>>();

app.use(cors());
app.use(express.json());

loadState();

const ecoSwarmAgentService = new EcoSwarmAgentService({
  getCases: () => portfolio.case_registry,
  getMetrics: () => aggregateMetrics.toJSON(),
  runCaseAction: async (eventId, actionType) => {
    const result = await processCaseAction(eventId, actionType);
    return {
      transaction_id: result.transaction_id
    };
  }
});

mountEcoSwarmA2AService(app, ecoSwarmAgentService, backendPublicUrl);

const wsClients = new Set<WebSocket>();

interface ComponentHealth {
  simulation_engine: 'operational' | 'stopped' | 'error';
  impact_calculator: 'operational' | 'error';
  portfolio_optimizer: 'operational' | 'error';
  token_manager: 'operational' | 'error';
  event_recorder: 'operational' | 'error';
}

const componentHealth: ComponentHealth = {
  simulation_engine: 'stopped',
  impact_calculator: 'operational',
  portfolio_optimizer: 'operational',
  token_manager: 'operational',
  event_recorder: 'operational'
};

function broadcast(message: any): void {
  const messageStr = JSON.stringify(message);
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

function broadcastHealthUpdate(): void {
  broadcast({
    type: 'health_status',
    components: componentHealth
  });
}

function getPortfolioSnapshot(): PortfolioResponse {
  return {
    allocations: {
      Solar: portfolio.allocations.get('Solar') || 0,
      River_Cleanup: portfolio.allocations.get('River_Cleanup') || 0,
      Reforestation: portfolio.allocations.get('Reforestation') || 0,
      Carbon_Capture: portfolio.allocations.get('Carbon_Capture') || 0
    },
    last_rebalanced: portfolio.last_rebalanced.toISOString()
  };
}

function getTokenSnapshot(): TokenBalancesResponse {
  return {
    SolarImpactToken: tokenBalances.balances.get('SolarImpactToken') || 0,
    CleanupImpactToken: tokenBalances.balances.get('CleanupImpactToken') || 0,
    ReforestationToken: tokenBalances.balances.get('ReforestationToken') || 0,
    CarbonCaptureToken: tokenBalances.balances.get('CarbonCaptureToken') || 0
  };
}

function sanitizeRoleBinding(binding: RoleAccountBinding): Omit<RoleAccountBinding, 'private_key'> {
  return {
    role: binding.role,
    account_id: binding.account_id,
    solidity_address: binding.solidity_address,
    created_at: binding.created_at,
    transaction_id: binding.transaction_id
  };
}

function sanitizeRoleBindings(
  bindings?: Record<RoleAccountType, RoleAccountBinding>
): Record<RoleAccountType, Omit<RoleAccountBinding, 'private_key'>> | undefined {
  if (!bindings) {
    return undefined;
  }

  return {
    sponsor: sanitizeRoleBinding(bindings.sponsor),
    verifier: sanitizeRoleBinding(bindings.verifier),
    operator: sanitizeRoleBinding(bindings.operator)
  };
}

function attachRoleBindings(event: EnvironmentalEvent): void {
  const bindings = projectRoleAccounts.get(event.id);
  if (!event.deployment_profile) {
    return;
  }

  event.deployment_profile.role_accounts = sanitizeRoleBindings(bindings);
}

function setRoleBindings(eventId: string, bindings: Record<RoleAccountType, RoleAccountBinding>): void {
  projectRoleAccounts.set(eventId, bindings);
  const event = findCaseById(eventId);
  if (event) {
    attachRoleBindings(event);
  }
}

function saveState(): void {
  persistedState = {
    portfolio: getPortfolioSnapshot(),
    token_balances: getTokenSnapshot(),
    case_registry: portfolio.case_registry.map((event) => formatEventToJSON(event)),
    event_history: portfolio.event_history.map((event) => formatEventToJSON(event)),
    hedera_records: hederaRecords,
    role_accounts_by_event_id: Object.fromEntries(projectRoleAccounts.entries())
  };

  mkdirSync(dirname(runtimeStatePath), { recursive: true });
  writeFileSync(runtimeStatePath, JSON.stringify(persistedState, null, 2), 'utf8');
}

function loadState(): void {
  if (!existsSync(runtimeStatePath)) {
    console.log('[State] No persisted state file found, starting fresh');
    return;
  }

  persistedState = JSON.parse(readFileSync(runtimeStatePath, 'utf8')) as PersistedState;

  portfolio.allocations.set('Solar', persistedState.portfolio.allocations.Solar);
  portfolio.allocations.set('River_Cleanup', persistedState.portfolio.allocations.River_Cleanup);
  portfolio.allocations.set('Reforestation', persistedState.portfolio.allocations.Reforestation);
  portfolio.allocations.set('Carbon_Capture', persistedState.portfolio.allocations.Carbon_Capture);
  portfolio.last_rebalanced = new Date(persistedState.portfolio.last_rebalanced);

  tokenBalances.balances.set('SolarImpactToken', persistedState.token_balances.SolarImpactToken);
  tokenBalances.balances.set('CleanupImpactToken', persistedState.token_balances.CleanupImpactToken);
  tokenBalances.balances.set('ReforestationToken', persistedState.token_balances.ReforestationToken);
  tokenBalances.balances.set('CarbonCaptureToken', persistedState.token_balances.CarbonCaptureToken);

  projectRoleAccounts.clear();
  Object.entries(persistedState.role_accounts_by_event_id || {}).forEach(([eventId, bindings]) => {
    projectRoleAccounts.set(eventId, bindings);
  });

  hederaAccountService.restoreAccounts(
    Object.values(persistedState.role_accounts_by_event_id || {}).flatMap((bindings) => Object.values(bindings))
  );

  const restoredCaseRegistry = (persistedState.case_registry || []).map((event) => parseEventFromJSON(event));
  restoredCaseRegistry.forEach(attachRoleBindings);
  const restoredEventHistory = (persistedState.event_history || []).map((event) => parseEventFromJSON(event));
  portfolio.restoreEvents(restoredCaseRegistry, restoredEventHistory);
  aggregateMetrics.rebuildFromEvents(portfolio.case_registry);

  hederaRecords.splice(0, hederaRecords.length, ...(persistedState.hedera_records || []));

  console.log('[State] State restored from runtime storage');
}

function calculatePriorityScore(event: EnvironmentalEvent): number {
  const deploymentProfile = event.deployment_profile;
  const urgencyMultiplier = {
    stable: 1,
    elevated: 1.16,
    critical: 1.32
  }[event.urgency_level];
  const verificationMultiplier = 0.75 + (event.verification_confidence * 0.25);
  const householdMultiplier = 1 + Math.min(event.households_supported / 400, 0.35);
  const costPenalty = Math.max(event.cost_per_impact_unit_usd, 1);
  const impactScore = event.impact_score ?? impactScoreCalculator.calculateImpactScore(event);
  const readinessMultiplier = {
    hold: 0.82,
    review: 1.04,
    release: 1.16
  }[deploymentProfile?.release_readiness ?? 'hold'];
  const riskPenalty = Math.max(
    0.82,
    1 - Math.min((deploymentProfile?.risk_flags.length ?? 0) * 0.04, 0.18)
  );
  const releaseCoverageLift = deploymentProfile?.payout_recommendation_usd
    ? 1 + Math.min(
        (deploymentProfile.upfront_release_usd / Math.max(deploymentProfile.payout_recommendation_usd, 1)) *
          0.25,
        0.12
      )
    : 1;

  return Number(
    (
      (impactScore *
        urgencyMultiplier *
        verificationMultiplier *
        householdMultiplier *
        readinessMultiplier *
        riskPenalty *
        releaseCoverageLift) /
      costPenalty
    ).toFixed(2)
  );
}

function normalizeServiceUrl(rawUrl: string): string {
  if (/^https?:\/\//.test(rawUrl)) {
    return rawUrl.replace(/\/+$/, '');
  }

  return `http://${rawUrl.replace(/\/+$/, '')}`;
}

function createEventPayload(event: EnvironmentalEvent) {
  const locationLabel = [event.community_name, event.region, event.country].filter(Boolean).join(' / ');
  attachRoleBindings(event);

  return {
    ...formatEventToJSON(event),
    metrics: aggregateMetrics.toJSON(),
    priority_score: calculatePriorityScore(event),
    location_label: locationLabel,
    sponsor_name: event.sponsor_name,
    verifier_name: event.verifier_name,
    local_operator_name: event.local_operator_name,
    buyer_signal: event.buyer_signal,
    beneficiary_metric: event.beneficiary_metric,
    deployment_profile: event.deployment_profile
  };
}

function getTrackedAccountCount(): number {
  return new Set(
    Array.from(projectRoleAccounts.values()).flatMap((bindings) =>
      Object.values(bindings).map((binding) => binding.account_id)
    )
  ).size;
}

function getTokenIdForCategory(category: EnvironmentalEvent['event_type']): string {
  const tokenMap: Record<EnvironmentalEvent['event_type'], string> = {
    Solar: process.env.SOLAR_TOKEN_ID || '',
    River_Cleanup: process.env.CLEANUP_TOKEN_ID || '',
    Reforestation: process.env.REFORESTATION_TOKEN_ID || '',
    Carbon_Capture: process.env.CARBON_CAPTURE_TOKEN_ID || ''
  };

  return tokenMap[category];
}

function calculateEscrowHbarTotal(event: EnvironmentalEvent): number {
  const payout = event.deployment_profile?.payout_recommendation_usd ?? 0;
  return Math.max(1, Math.min(6, Math.round(payout / 6000) || 1));
}

function buildMilestoneEscrowPlan(event: EnvironmentalEvent) {
  const milestones = event.deployment_profile?.milestone_plan ?? [];
  const escrowTotalHbar = calculateEscrowHbarTotal(event);
  const totalPercent = milestones.reduce((sum, milestone) => sum + milestone.release_percent, 0) || 100;
  const now = new Date();

  let allocatedTinybar = 0;
  const milestoneStates = milestones.map((milestone, index) => {
    const milestoneHbar =
      index === milestones.length - 1
        ? Math.max(1, Math.round(escrowTotalHbar * 100_000_000) - allocatedTinybar) / 100_000_000
        : Math.max(
            0.25,
            Number(((escrowTotalHbar * milestone.release_percent) / totalPercent).toFixed(2))
          );
    const amountTinybar = Math.round(milestoneHbar * 100_000_000);
    allocatedTinybar += amountTinybar;
    const deadline = new Date(now.getTime() + (index + 1) * 7 * 24 * 60 * 60 * 1000);

    return {
      index,
      label: milestone.label,
      amount_tinybar: amountTinybar,
      deadline_at: deadline.toISOString()
    };
  });

  const escrowTotalTinybar = milestoneStates.reduce((sum, milestone) => sum + milestone.amount_tinybar, 0);

  return {
    escrowTotalHbar: Number((escrowTotalTinybar / 100_000_000).toFixed(2)),
    escrowTotalTinybar,
    milestoneStates
  };
}

interface ContractMilestoneSnapshot {
  index: number;
  description: string;
  amount: number;
  deadlineAt: number;
  status: number;
  refundEligible: boolean;
}

function describeContractMilestoneStatus(status: number): string {
  switch (status) {
    case 0:
      return 'pending';
    case 1:
      return 'approved';
    case 2:
      return 'released';
    case 3:
      return 'disputed';
    default:
      return `status_${status}`;
  }
}

function formatContractExecutionFailure(
  fallback: string,
  result: { status?: string; errorMessage?: string }
): string {
  const details = [result.status, result.errorMessage].filter(Boolean).join(' | ');
  return details ? `${fallback} ${details}` : fallback;
}

async function synchronizeEventOnChainState(event: EnvironmentalEvent): Promise<ContractMilestoneSnapshot[]> {
  if (!event.deployment_profile?.on_chain_status || hederaSmartContract.isMockMode()) {
    return [];
  }

  const onChainStatus = event.deployment_profile.on_chain_status;
  const milestoneCount = Math.max(
    onChainStatus.milestones.length,
    event.deployment_profile.milestone_plan.length
  );

  try {
    const projectInfo = await hederaSmartContract.getProjectInfo(event.id);
    if (projectInfo) {
      onChainStatus.contract_project_created = true;
      onChainStatus.escrow_contract_id = process.env.ESCROW_CONTRACT_ID || onChainStatus.escrow_contract_id;
      onChainStatus.escrow_total_tinybar = projectInfo.totalAmount;
      onChainStatus.escrow_total_hbar = Number((projectInfo.totalAmount / 100_000_000).toFixed(2));
      onChainStatus.escrow_funded = projectInfo.depositedAmount + projectInfo.releasedAmount > 0;
      onChainStatus.released_hbar = Number((projectInfo.releasedAmount / 100_000_000).toFixed(2));
    }

    const snapshots: ContractMilestoneSnapshot[] = [];
    for (let index = 0; index < milestoneCount; index += 1) {
      const [milestone, refundEligible] = await Promise.all([
        hederaSmartContract.getMilestone(event.id, index),
        hederaSmartContract.canRefundAfterDeadline(event.id, index)
      ]);

      if (!milestone) {
        continue;
      }

      const existingMilestoneState = onChainStatus.milestones[index];
      if (existingMilestoneState) {
        existingMilestoneState.amount_tinybar = milestone.amount;
        existingMilestoneState.deadline_at = new Date(milestone.deadlineAt * 1000).toISOString();
      }

      snapshots.push({
        index,
        description: milestone.description,
        amount: milestone.amount,
        deadlineAt: milestone.deadlineAt,
        status: milestone.status,
        refundEligible: refundEligible === true
      });
    }

    onChainStatus.refund_eligible = snapshots.some((milestone) => milestone.refundEligible);
    return snapshots;
  } catch (error) {
    console.warn('[SmartContract] Unable to synchronize on-chain state:', error);
    return [];
  }
}

function findReleaseMilestoneIndex(
  event: EnvironmentalEvent,
  contractMilestones: ContractMilestoneSnapshot[]
): number {
  const localReadyIndex =
    event.deployment_profile?.milestone_plan.findIndex((milestone) => milestone.status === 'ready') ?? -1;

  if (localReadyIndex >= 0) {
    return localReadyIndex;
  }

  const reconciledIndex = contractMilestones.find(
    (milestone) =>
      (milestone.status === 1 || milestone.status === 2) &&
      event.deployment_profile?.milestone_plan[milestone.index]?.status !== 'released'
  )?.index;

  return reconciledIndex ?? -1;
}

function createActionStep(
  key: OnChainActionStep['key'],
  label: string,
  status: OnChainActionStep['status'],
  transactionId?: string,
  detail?: string
): OnChainActionStep {
  return {
    key,
    label,
    status,
    transaction_id: transactionId,
    detail
  };
}

function getRoleBindingsOrThrow(eventId: string): Record<RoleAccountType, RoleAccountBinding> {
  const bindings = projectRoleAccounts.get(eventId);
  if (!bindings) {
    throw new Error('Role accounts are not provisioned for this project.');
  }

  return bindings;
}

function appendCaseActionAttempt(
  event: EnvironmentalEvent,
  actionType: Exclude<CaseActionType, 'proof_packet_locked'>,
  actorLabel: string,
  note: string,
  transactionId?: string | null,
  requiredSteps?: OnChainActionStep[],
  optionalSteps?: OnChainActionStep[],
  failureReason?: string
): void {
  if (!event.deployment_profile) {
    return;
  }

  event.deployment_profile.case_actions = [
    ...event.deployment_profile.case_actions,
    {
      action_type: actionType,
      actor_label: actorLabel,
      note,
      timestamp: new Date().toISOString(),
      transaction_id: transactionId || undefined,
      required_steps: requiredSteps,
      optional_steps: optionalSteps,
      failure_reason: failureReason
    }
  ];
}

function findCaseById(eventId: string): EnvironmentalEvent | undefined {
  return portfolio.case_registry.find((event) => event.id === eventId);
}

function getStageLabel(eventType: HederaEventRecord['event_type']): string {
  const labels: Record<HederaEventRecord['event_type'], string> = {
    impact_event_detected: 'Field signal detected',
    impact_score_calculated: 'Impact model scored',
    payout_case_prepared: 'Milestone payout memo prepared',
    portfolio_rebalanced: 'Treasury allocation updated',
    impact_verified: 'Proof anchored on Hedera',
    verifier_review_requested: 'Verifier review requested',
    sponsor_release_authorized: 'Sponsor release authorized',
    tranche_released: 'Tranche released'
  };

  return labels[eventType];
}

function getRecordSummary(eventType: HederaEventRecord['event_type'], payload: any): string {
  switch (eventType) {
    case 'impact_event_detected':
      return `${payload.project_name || payload.event_type} entered the proof queue.`;
    case 'impact_score_calculated':
      return `${payload.project_name || payload.event_type} scored ${payload.impact_score?.toFixed?.(1) ?? payload.impact_score}.`;
    case 'payout_case_prepared':
      return `${payload.project_name || payload.event_type} is ${payload.release_readiness || 'pending'} for a ${
        payload.payout_recommendation_usd
          ? `$${payload.payout_recommendation_usd.toLocaleString('en-US')}`
          : 'treasury'
      } payout case.`;
    case 'portfolio_rebalanced':
      return payload.rebalancing_needed === false
        ? 'AI review completed with no allocation change required.'
        : `AI shifted treasury weight toward ${payload.leading_category || 'the strongest category'}.`;
    case 'impact_verified':
      return `${payload.project_name || payload.event_type} proof packet finalized and ready for audit.`;
    case 'verifier_review_requested':
      return `${payload.project_name || payload.event_type} moved into verifier-led committee review.`;
    case 'sponsor_release_authorized':
      return `${payload.project_name || payload.event_type} received sponsor authorization for the next release.`;
    case 'tranche_released':
      return `${payload.project_name || payload.event_type} released ${payload.release_amount_usd ? `$${payload.release_amount_usd.toLocaleString('en-US')}` : 'capital'} to the operator.`;
    default:
      return 'Hedera record updated.';
  }
}

function broadcastHederaRecord(
  eventType: HederaEventRecord['event_type'],
  payload: any,
  transactionId: string | null
): void {
  const record: HederaEventRecord = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    payload,
    transaction_id: transactionId || undefined,
    stage_label: getStageLabel(eventType),
    summary: getRecordSummary(eventType, payload),
    project_name: payload.project_name
  };

  hederaRecords.unshift(record);
  if (hederaRecords.length > 50) {
    hederaRecords.length = 50;
  }

  broadcast({
    type: 'hedera_recorded',
    payload: record,
    timestamp: record.timestamp
  });

  saveState();
}

async function processEventQueue(): Promise<void> {
  if (isProcessingQueue || eventQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (eventQueue.length > 0) {
    const queuedEvent = eventQueue.shift()!;

    try {
      const response = await processEvent(queuedEvent.requestBody);
      queuedEvent.resolve(response);
    } catch (error) {
      queuedEvent.reject(error);
    }
  }

  isProcessingQueue = false;
}

async function processEvent(requestBody: any): Promise<SubmitEventResponse> {
  const event = parseEventFromJSON(requestBody);
  if (!event.validate()) {
    throw new Error('Event payload failed validation.');
  }

  const impactScore = impactScoreCalculator.calculateImpactScore(event);
  event.impact_score = impactScore;
  event.deployment_profile = milestonePayoutEngine.buildDeploymentProfile(event, impactScore);
  const milestoneEscrowPlan = buildMilestoneEscrowPlan(event);
  event.deployment_profile.on_chain_status = {
    network: process.env.HEDERA_NETWORK || 'testnet',
    escrow_contract_id: process.env.ESCROW_CONTRACT_ID,
    contract_project_created: false,
    escrow_funded: false,
    escrow_total_hbar: milestoneEscrowPlan.escrowTotalHbar,
    escrow_total_tinybar: milestoneEscrowPlan.escrowTotalTinybar,
    released_hbar: 0,
    refund_eligible: false,
    milestones: milestoneEscrowPlan.milestoneStates
  };

  portfolio.addEvent(event);

  const [sponsorAccount, verifierAccount, operatorAccount] = await Promise.all([
    hederaAccountService.createRoleAccount(
      'sponsor',
      event.project_name,
      milestoneEscrowPlan.escrowTotalHbar + 2
    ),
    hederaAccountService.createRoleAccount('verifier', event.project_name, 1.5),
    hederaAccountService.createRoleAccount('operator', event.project_name, 1.5)
  ]);

  if (!sponsorAccount.success || !verifierAccount.success || !operatorAccount.success) {
    throw new Error('One or more role accounts failed to provision.');
  }

  const roleBindings: Record<RoleAccountType, RoleAccountBinding> = {
    sponsor: {
      role: 'sponsor',
      account_id: sponsorAccount.accountId,
      solidity_address: sponsorAccount.solidityAddress,
      created_at: sponsorAccount.createdAt,
      transaction_id: sponsorAccount.transactionId,
      private_key: sponsorAccount.privateKey
    },
    verifier: {
      role: 'verifier',
      account_id: verifierAccount.accountId,
      solidity_address: verifierAccount.solidityAddress,
      created_at: verifierAccount.createdAt,
      transaction_id: verifierAccount.transactionId,
      private_key: verifierAccount.privateKey
    },
    operator: {
      role: 'operator',
      account_id: operatorAccount.accountId,
      solidity_address: operatorAccount.solidityAddress,
      created_at: operatorAccount.createdAt,
      transaction_id: operatorAccount.transactionId,
      private_key: operatorAccount.privateKey
    }
  };

  setRoleBindings(event.id, roleBindings);

  broadcast({
    type: 'accounts_provisioned',
    payload: {
      project_name: event.project_name,
      event_id: event.id,
      role_accounts: sanitizeRoleBindings(roleBindings),
      total_accounts_created: getTrackedAccountCount()
    },
    timestamp: new Date().toISOString()
  });

  try {
    const milestoneDescriptions = milestoneEscrowPlan.milestoneStates.map((milestone) => milestone.label);
    const milestoneAmountsTinybar = milestoneEscrowPlan.milestoneStates.map(
      (milestone) => milestone.amount_tinybar
    );
    const milestoneDeadlinesEpochSeconds = milestoneEscrowPlan.milestoneStates.map((milestone) =>
      Math.floor(new Date(milestone.deadline_at).getTime() / 1000)
    );

    const projectCreateResult = await hederaSmartContract.createProject(
      roleBindings.sponsor,
      event.id,
      roleBindings.verifier.solidity_address,
      roleBindings.operator.solidity_address,
      milestoneDescriptions,
      milestoneAmountsTinybar,
      milestoneDeadlinesEpochSeconds
    );

    if (projectCreateResult.success) {
      event.deployment_profile.on_chain_status.contract_project_created = true;
      event.deployment_profile.on_chain_status.contract_project_transaction_id =
        projectCreateResult.transactionId;
      broadcast({
        type: 'contract_project_registered',
        payload: {
          project_name: event.project_name,
          event_id: event.id,
          transaction_id: projectCreateResult.transactionId,
          verifier_address: roleBindings.verifier.solidity_address,
          operator_address: roleBindings.operator.solidity_address,
          milestones: milestoneDescriptions.length
        },
        timestamp: new Date().toISOString()
      });
    } else {
      event.deployment_profile.on_chain_status.last_failure_reason =
        'Escrow project registration failed.';
    }

    if (projectCreateResult.success) {
      const depositResult = await hederaSmartContract.depositFunds(
        roleBindings.sponsor,
        event.id,
        milestoneEscrowPlan.escrowTotalHbar
      );

      if (depositResult.success) {
        event.deployment_profile.on_chain_status.escrow_funded = true;
        event.deployment_profile.on_chain_status.escrow_transaction_id = depositResult.transactionId;
        broadcast({
          type: 'contract_funds_deposited',
          payload: {
            event_id: event.id,
            project_name: event.project_name,
            amount_hbar: milestoneEscrowPlan.escrowTotalHbar,
            transaction_id: depositResult.transactionId
          },
          timestamp: new Date().toISOString()
        });
      } else {
        event.deployment_profile.on_chain_status.last_failure_reason =
          'Escrow funding failed after role account provisioning.';
      }
    }
  } catch (contractError) {
    event.deployment_profile.on_chain_status.last_failure_reason =
      contractError instanceof Error ? contractError.message : String(contractError);
    console.log('[SmartContract] Project registration skipped:', contractError);
  }

  const firstMilestone = milestoneEscrowPlan.milestoneStates[0];
  if (firstMilestone) {
    try {
      const reminderResult = await hederaAccountService.createScheduledMilestoneDeadline(
        event.id,
        `${event.project_name}: review ${firstMilestone.label} before ${new Date(firstMilestone.deadline_at).toLocaleDateString('en-US')}`
      );
      if (reminderResult.success) {
        event.deployment_profile.on_chain_status.deadline_reminder_schedule_id = reminderResult.scheduleId;
        event.deployment_profile.on_chain_status.deadline_reminder_tx_id = reminderResult.transactionId;
        broadcast({
          type: 'milestone_deadline_scheduled',
          payload: {
            event_id: event.id,
            project_name: event.project_name,
            schedule_id: reminderResult.scheduleId,
            transaction_id: reminderResult.transactionId,
            reminder_note: 'Hedera schedule created as a deadline reminder, not an unstoppable auto-refund.'
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (scheduleError) {
      console.log('[Schedule] Deadline scheduling skipped:', scheduleError);
    }
  }

  let eventPayload = createEventPayload(event);

  const detectedRecordPayload = {
    event_id: event.id,
    project_name: event.project_name,
    event_type: event.event_type,
    location_coordinates: event.location_coordinates,
    verification_confidence: event.verification_confidence,
    urgency_level: event.urgency_level,
    proof_hash: event.proof_hash,
    sponsor_name: event.deployment_profile.sponsor_name,
    verifier_name: event.deployment_profile.verifier_name,
    local_operator_name: event.deployment_profile.local_operator_name
  };
  const eventDetectedTxId = await hederaEventRecorder.recordEvent(
    'impact_event_detected',
    detectedRecordPayload
  );
  broadcastHederaRecord('impact_event_detected', detectedRecordPayload, eventDetectedTxId);

  let aiAnalysis: any = null;
  try {
    const optimizerUrl = normalizeServiceUrl(process.env.AI_SERVICE_URL || 'http://localhost:8000');
    const analyzeResponse = await fetch(`${optimizerUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_name: event.project_name,
        event_type: event.event_type,
        impact_score: impactScore,
        urgency_level: event.urgency_level,
        verification_confidence: event.verification_confidence,
        households_supported: event.households_supported,
        cost_per_impact_unit_usd: event.cost_per_impact_unit_usd,
        release_readiness: event.deployment_profile.release_readiness,
        payout_recommendation_usd: event.deployment_profile.payout_recommendation_usd,
        proof_hash: event.proof_hash,
        sponsor_name: event.deployment_profile.sponsor_name,
        verifier_name: event.deployment_profile.verifier_name,
        local_operator_name: event.deployment_profile.local_operator_name,
        risk_flags: event.deployment_profile.risk_flags,
        location_label: eventPayload.location_label
      })
    });

    if (analyzeResponse.ok) {
      aiAnalysis = await analyzeResponse.json();
      broadcast({
        type: 'ai_analysis_complete',
        payload: {
          event_id: event.id,
          project_name: event.project_name,
          ...aiAnalysis
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (aiError) {
    console.log('[AI] Analysis unavailable:', aiError);
  }

  const scoreRecordPayload = {
    event_id: event.id,
    project_name: event.project_name,
    event_type: event.event_type,
    impact_score: impactScore,
    priority_score: eventPayload.priority_score,
    households_supported: event.households_supported,
    cost_per_impact_unit_usd: event.cost_per_impact_unit_usd,
    release_readiness: event.deployment_profile.release_readiness,
    payout_recommendation_usd: event.deployment_profile.payout_recommendation_usd,
    ai_risk_assessment: aiAnalysis?.risk_assessment || null,
    ai_funding_recommendation: aiAnalysis?.funding_recommendation || null
  };
  const scoreCalculatedTxId = await hederaEventRecorder.recordEvent(
    'impact_score_calculated',
    scoreRecordPayload
  );
  broadcastHederaRecord('impact_score_calculated', scoreRecordPayload, scoreCalculatedTxId);

  const payoutCasePayload = {
    event_id: event.id,
    project_name: event.project_name,
    event_type: event.event_type,
    sponsor_name: event.deployment_profile.sponsor_name,
    verifier_name: event.deployment_profile.verifier_name,
    local_operator_name: event.deployment_profile.local_operator_name,
    launch_wedge: event.deployment_profile.launch_wedge,
    contract_model: event.deployment_profile.contract_model,
    beneficiary_metric: event.deployment_profile.beneficiary_metric,
    payout_recommendation_usd: event.deployment_profile.payout_recommendation_usd,
    upfront_release_usd: event.deployment_profile.upfront_release_usd,
    reserve_holdback_usd: event.deployment_profile.reserve_holdback_usd,
    release_readiness: event.deployment_profile.release_readiness,
    milestone_stage: event.deployment_profile.milestone_stage,
    risk_flags: event.deployment_profile.risk_flags,
    role_accounts: sanitizeRoleBindings(roleBindings),
    on_chain_status: event.deployment_profile.on_chain_status
  };
  const payoutCaseTxId = await hederaEventRecorder.recordEvent(
    'payout_case_prepared',
    payoutCasePayload
  );
  broadcastHederaRecord('payout_case_prepared', payoutCasePayload, payoutCaseTxId);

  let tokenMintTxId: string | null = null;
  const tokensMinted = Math.floor(impactScore / 10);

  if (impactScore > 0) {
    tokenMintTxId = await hederaTokenManager.mintTokens(event.event_type, impactScore);
    const tokenSnapshot = getTokenSnapshot();

    broadcast({
      type: 'tokens_minted',
      payload: {
        ...tokenSnapshot,
        details: {
          event_id: event.id,
          project_name: event.project_name,
          event_type: event.event_type,
          tokens_minted: tokensMinted,
          transaction_id: tokenMintTxId,
          proof_hash: event.proof_hash,
          payout_recommendation_usd: event.deployment_profile.payout_recommendation_usd
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  aggregateMetrics.rebuildFromEvents(portfolio.case_registry);
  saveState();

  const verificationRecordPayload = {
    event_id: event.id,
    project_name: event.project_name,
    event_type: event.event_type,
    impact_score: impactScore,
    priority_score: eventPayload.priority_score,
    tokens_minted: tokensMinted,
    token_mint_tx_id: tokenMintTxId,
    proof_hash: event.proof_hash,
    verification_confidence: event.verification_confidence,
    release_readiness: event.deployment_profile.release_readiness,
    payout_recommendation_usd: event.deployment_profile.payout_recommendation_usd,
    milestone_stage: event.deployment_profile.milestone_stage,
    on_chain_status: event.deployment_profile.on_chain_status
  };
  const impactVerifiedTxId = await hederaEventRecorder.recordEvent(
    'impact_verified',
    verificationRecordPayload
  );
  broadcastHederaRecord('impact_verified', verificationRecordPayload, impactVerifiedTxId);

  eventPayload = createEventPayload(event);

  broadcast({
    type: 'event_detected',
    payload: {
      ...eventPayload,
      metrics: {
        ...aggregateMetrics.toJSON(),
        accounts_created: getTrackedAccountCount()
      }
    },
    timestamp: new Date().toISOString()
  });

  if (portfolio.event_history.length >= 5) {
    try {
      componentHealth.portfolio_optimizer = 'operational';

      const currentAllocation = getPortfolioSnapshot().allocations;
      const recentEvents = portfolio.event_history.map((historyEvent) => ({
        event_type: historyEvent.event_type,
        impact_score: historyEvent.impact_score,
        urgency_level: historyEvent.urgency_level,
        verification_confidence: historyEvent.verification_confidence,
        households_supported: historyEvent.households_supported,
        cost_per_impact_unit_usd: historyEvent.cost_per_impact_unit_usd,
        project_name: historyEvent.project_name,
        release_readiness: historyEvent.deployment_profile?.release_readiness,
        payout_recommendation_usd: historyEvent.deployment_profile?.payout_recommendation_usd,
        upfront_release_usd: historyEvent.deployment_profile?.upfront_release_usd,
        risk_flag_count: historyEvent.deployment_profile?.risk_flags.length ?? 0
      }));

      const optimizerUrl = normalizeServiceUrl(process.env.AI_SERVICE_URL || 'http://localhost:8000');
      const optimizerResponse = await fetch(`${optimizerUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_allocation: currentAllocation,
          recent_events: recentEvents
        })
      });

      if (!optimizerResponse.ok) {
        throw new Error(`Optimizer returned status ${optimizerResponse.status}`);
      }

      const optimizerData = await optimizerResponse.json() as OptimizeResponse;
      const recommendedAllocation = optimizerData.recommended_allocation;
      let maxChange = 0;
      const leadingCategory = Object.keys(optimizerData.impact_per_dollar_ratios).reduce(
        (best, category) =>
          optimizerData.impact_per_dollar_ratios[category] >
          (optimizerData.impact_per_dollar_ratios[best] ?? Number.NEGATIVE_INFINITY)
            ? category
            : best,
        'Solar'
      );

      for (const category of Object.keys(currentAllocation) as Array<keyof typeof currentAllocation>) {
        const change = Math.abs(recommendedAllocation[category] - currentAllocation[category]);
        maxChange = Math.max(maxChange, change);
      }

      const shouldRebalance = optimizerData.rebalancing_needed && maxChange > 5;

      if (shouldRebalance) {
        portfolio.updateAllocations(recommendedAllocation as any);
        saveState();
      }

      const portfolioPayload = {
        previous_allocation: currentAllocation,
        new_allocation: shouldRebalance ? recommendedAllocation : currentAllocation,
        decision_logic: optimizerData.decision_logic,
        impact_ratios: optimizerData.impact_per_dollar_ratios,
        rebalancing_needed: shouldRebalance,
        leading_category: leadingCategory
      };

      broadcast({
        type: 'portfolio_rebalanced',
        payload: portfolioPayload,
        timestamp: new Date().toISOString()
      });

      if (shouldRebalance) {
        const rebalanceTxId = await hederaEventRecorder.recordEvent(
          'portfolio_rebalanced',
          portfolioPayload
        );
        broadcastHederaRecord('portfolio_rebalanced', portfolioPayload, rebalanceTxId);
      }
    } catch (optimizerError) {
      const errorMsg = optimizerError instanceof Error ? optimizerError.message : 'Unknown optimizer error';
      console.log(`[Optimizer] Service unavailable: ${errorMsg}. Maintaining current allocation.`);
      componentHealth.portfolio_optimizer = 'error';
      broadcastHealthUpdate();
    }
  }

  return {
    success: true,
    event_id: event.id,
    impact_score: impactScore,
    hedera_transaction_id: impactVerifiedTxId || undefined
  };
}



async function processCaseAction(
  eventId: string,
  actionType: Exclude<CaseActionType, 'proof_packet_locked'>
): Promise<SubmitCaseActionResponse> {
  const event = findCaseById(eventId);
  if (!event || !event.deployment_profile) {
    throw new Error('Case not found');
  }

  const bindings = getRoleBindingsOrThrow(eventId);
  const onChainStatus = event.deployment_profile.on_chain_status;
  if (!onChainStatus) {
    throw new Error('On-chain project status is not initialized for this case.');
  }

  const requiredSteps: OnChainActionStep[] = [];
  const optionalSteps: OnChainActionStep[] = [];
  const transactionIds: string[] = [];
  let failureReason: string | undefined;
  let hcsTransactionId: string | null = null;
  let shouldApplyAction = false;
  let actorLabel = event.deployment_profile.local_operator_name;
  let appliedMilestoneIndex: number | undefined;

  const actionPayloadBase = {
    event_id: event.id,
    project_name: event.project_name,
    event_type: event.event_type,
    release_readiness: event.deployment_profile.release_readiness,
    milestone_stage: event.deployment_profile.milestone_stage,
    next_action_label: event.deployment_profile.next_action_label,
    authorized_release_usd: event.deployment_profile.authorized_release_usd,
    released_capital_usd: event.deployment_profile.released_capital_usd,
    on_chain_status: onChainStatus
  };

  let actionPayload: Record<string, unknown> = actionPayloadBase;

  if (actionType === 'verifier_review_requested') {
    actorLabel = event.deployment_profile.verifier_name;
    actionPayload = {
      ...actionPayloadBase,
      verifier_name: event.deployment_profile.verifier_name
    };
  }

  if (actionType === 'sponsor_release_authorized') {
    actorLabel = event.deployment_profile.sponsor_name;
    actionPayload = {
      ...actionPayloadBase,
      sponsor_name: event.deployment_profile.sponsor_name,
      release_amount_usd: event.deployment_profile.authorized_release_usd
    };
  }

  if (actionType !== 'tranche_released') {
    hcsTransactionId = await hederaEventRecorder.recordEvent(actionType, actionPayload);
    if (hcsTransactionId) {
      requiredSteps.push(
        createActionStep('hcs_recorded', 'HCS audit record anchored', 'completed', hcsTransactionId)
      );
      transactionIds.push(hcsTransactionId);
      shouldApplyAction = true;
    } else {
      failureReason = 'Required HCS audit record failed. Case state was not advanced.';
      requiredSteps.push(
        createActionStep('hcs_recorded', 'HCS audit record anchored', 'failed', undefined, failureReason)
      );
      appendCaseActionAttempt(
        event,
        actionType,
        actorLabel,
        'Attempted workflow step could not be anchored on Hedera.',
        undefined,
        requiredSteps,
        optionalSteps,
        failureReason
      );
    }
  } else {
    actorLabel = event.deployment_profile.sponsor_name;
    const contractMilestones = await synchronizeEventOnChainState(event);
    const milestoneIndex = findReleaseMilestoneIndex(event, contractMilestones);

    if (milestoneIndex === -1) {
      failureReason = 'No release-ready milestone is available.';
      requiredSteps.push(
        createActionStep(
          'milestone_released',
          'Milestone release on escrow contract',
          'failed',
          undefined,
          failureReason
        )
      );
      appendCaseActionAttempt(
        event,
        actionType,
        actorLabel,
        'Release attempt blocked because no milestone is in a ready state.',
        undefined,
        requiredSteps,
        optionalSteps,
        failureReason
      );
    } else {
      appliedMilestoneIndex = milestoneIndex;
      const milestoneState = onChainStatus.milestones[milestoneIndex];
      const milestoneReleaseUsd = event.deployment_profile.milestone_plan[milestoneIndex]?.release_usd ?? 0;
      const contractMilestone = contractMilestones.find((milestone) => milestone.index === milestoneIndex);
      const alreadyApprovedOnChain =
        contractMilestone?.status === 1 || contractMilestone?.status === 2;
      const alreadyReleasedOnChain = contractMilestone?.status === 2;

      if (alreadyApprovedOnChain) {
        requiredSteps.push(
          createActionStep(
            'milestone_approved',
            'Verifier approved milestone on escrow contract',
            'completed',
            undefined,
            alreadyReleasedOnChain
              ? 'Milestone was already approved and released on-chain before this action.'
              : 'Milestone was already approved on-chain before this action.'
          )
        );
      } else {
        const approveResult = await hederaSmartContract.approveMilestone(bindings.verifier, event.id, milestoneIndex);
        if (approveResult.success) {
          requiredSteps.push(
            createActionStep(
              'milestone_approved',
              'Verifier approved milestone on escrow contract',
              'completed',
              approveResult.transactionId
            )
          );
          transactionIds.push(approveResult.transactionId);
          milestoneState.approved_at = new Date().toISOString();
        } else {
          failureReason = formatContractExecutionFailure(
            'Verifier milestone approval failed on the escrow contract.',
            approveResult
          );
          requiredSteps.push(
            createActionStep(
              'milestone_approved',
              'Verifier approved milestone on escrow contract',
              'failed',
              approveResult.transactionId || undefined,
              failureReason
            )
          );
        }
      }

      if (!failureReason) {
        if (alreadyReleasedOnChain) {
          requiredSteps.push(
            createActionStep(
              'milestone_released',
              'Sponsor released milestone from escrow contract',
              'completed',
              undefined,
              `Milestone is already ${describeContractMilestoneStatus(contractMilestone?.status ?? 2)} on-chain.`
            )
          );
        } else {
          const releaseResult = await hederaSmartContract.releaseMilestone(bindings.sponsor, event.id, milestoneIndex);
          if (releaseResult.success) {
            requiredSteps.push(
              createActionStep(
                'milestone_released',
                'Sponsor released milestone from escrow contract',
                'completed',
                releaseResult.transactionId
              )
            );
            transactionIds.push(releaseResult.transactionId);
            milestoneState.released_at = new Date().toISOString();
          } else {
            failureReason = formatContractExecutionFailure(
              'Sponsor release failed on the escrow contract.',
              releaseResult
            );
            requiredSteps.push(
              createActionStep(
                'milestone_released',
                'Sponsor released milestone from escrow contract',
                'failed',
                releaseResult.transactionId || undefined,
                failureReason
              )
            );
          }
        }
      }

      if (!failureReason) {
        await synchronizeEventOnChainState(event);

        const projectedPayload = {
          ...actionPayloadBase,
          sponsor_name: event.deployment_profile.sponsor_name,
          operator_name: event.deployment_profile.local_operator_name,
          release_amount_usd: milestoneReleaseUsd,
          milestone_index: milestoneIndex,
          on_chain_status: onChainStatus
        };

        hcsTransactionId = await hederaEventRecorder.recordEvent(actionType, projectedPayload);
        if (hcsTransactionId) {
          requiredSteps.push(
            createActionStep('hcs_recorded', 'HCS audit record anchored', 'completed', hcsTransactionId)
          );
          transactionIds.push(hcsTransactionId);
          shouldApplyAction = true;
          actionPayload = projectedPayload;
        } else {
          failureReason = 'Milestone was released, but the required HCS audit record failed.';
          requiredSteps.push(
            createActionStep('hcs_recorded', 'HCS audit record anchored', 'failed', undefined, failureReason)
          );
          shouldApplyAction = true;
          actionPayload = projectedPayload;
        }
      }

      if (!failureReason || shouldApplyAction) {
        const tokenId = getTokenIdForCategory(event.event_type);
        if (tokenId) {
          const receiptAmount = Math.max(1, Math.round(Math.max(milestoneReleaseUsd, 1) / 1000));
          const transferResult = await hederaAccountService.transferTokens(
            tokenId,
            process.env.HEDERA_ACCOUNT_ID || '',
            bindings.operator.account_id,
            receiptAmount,
            bindings.operator
          );
          if (transferResult.success) {
            optionalSteps.push(
              createActionStep(
                'hts_receipt_transferred',
                'HTS impact receipt transferred to operator',
                'completed',
                transferResult.transactionId,
                transferResult.associationTxId
                  ? `Operator token association: ${transferResult.associationTxId}`
                  : undefined
              )
            );
            transactionIds.push(transferResult.transactionId);
          } else {
            optionalSteps.push(
              createActionStep(
                'hts_receipt_transferred',
                'HTS impact receipt transferred to operator',
                'failed',
                undefined,
                'Receipt transfer failed but required escrow actions completed.'
              )
            );
          }
        } else {
          optionalSteps.push(
            createActionStep(
              'hts_receipt_transferred',
              'HTS impact receipt transferred to operator',
              'skipped',
              undefined,
              'No category token is configured for this impact type.'
            )
          );
        }

        const certificateTokenId = process.env.IMPACT_CERTIFICATE_TOKEN_ID || '';
        if (certificateTokenId) {
          const nftResult = await hederaAccountService.mintImpactCertificateNFT(certificateTokenId, {
            event_id: event.id,
            project_name: event.project_name,
            event_type: event.event_type,
            milestone_index: milestoneIndex,
            release_amount_usd: milestoneReleaseUsd,
            impact_score: event.impact_score,
            operator_account_id: bindings.operator.account_id,
            release_recorded_at: new Date().toISOString()
          });

          if (nftResult.success) {
            optionalSteps.push(
              createActionStep(
                'impact_certificate_minted',
                'Shared HTS NFT impact certificate minted',
                'completed',
                nftResult.transactionId,
                `Token ${nftResult.tokenId} serial ${nftResult.serialNumber}`
              )
            );
            transactionIds.push(nftResult.transactionId);
          } else {
            optionalSteps.push(
              createActionStep(
                'impact_certificate_minted',
                'Shared HTS NFT impact certificate minted',
                'failed',
                undefined,
                'Impact certificate mint failed but required escrow actions completed.'
              )
            );
          }
        } else {
          optionalSteps.push(
            createActionStep(
              'impact_certificate_minted',
              'Shared HTS NFT impact certificate minted',
              'skipped',
              undefined,
              'IMPACT_CERTIFICATE_TOKEN_ID is not configured.'
            )
          );
        }
      }

      if (!shouldApplyAction) {
        appendCaseActionAttempt(
          event,
          actionType,
          actorLabel,
          'Release attempt did not complete all required on-chain steps.',
          hcsTransactionId,
          requiredSteps,
          optionalSteps,
          failureReason
        );
      }
    }
  }

  if (shouldApplyAction) {
    milestonePayoutEngine.applyCaseAction(
      event,
      actionType,
      hcsTransactionId,
      requiredSteps,
      optionalSteps,
      failureReason,
      appliedMilestoneIndex
    );
  }

  const latestAction = event.deployment_profile.case_actions[event.deployment_profile.case_actions.length - 1];
  if (latestAction && hcsTransactionId) {
    latestAction.transaction_id = hcsTransactionId;
  }

  aggregateMetrics.rebuildFromEvents(portfolio.case_registry);
  saveState();

  broadcast({
    type: 'case_updated',
    payload: {
      ...createEventPayload(event),
      metrics: {
        ...aggregateMetrics.toJSON(),
        accounts_created: getTrackedAccountCount()
      }
    },
    timestamp: new Date().toISOString()
  });

  if (hcsTransactionId) {
    broadcastHederaRecord(actionType, actionPayload, hcsTransactionId);
  }

  return {
    success: failureReason ? false : true,
    event_id: event.id,
    action_type: actionType,
    transaction_id: hcsTransactionId || undefined,
    required_steps: requiredSteps,
    optional_steps: optionalSteps,
    transaction_ids: transactionIds,
    failure_reason: failureReason
  };
}
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ecoswarm-backend' });
});

app.post('/agent/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message : '';

    if (!message.trim()) {
      return res.status(400).json({
        error: 'Message is required.'
      });
    }

    const response = await ecoSwarmAgentService.handleChat({
      message,
      selected_case_id:
        typeof req.body?.selected_case_id === 'string' ? req.body.selected_case_id : null
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('[Agent] Chat failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({
      error: errorMessage
    });
  }
});

app.post('/events', async (req, res) => {
  try {
    if (eventQueue.length >= 100) {
      console.warn(`[Queue] Warning: Event queue size is ${eventQueue.length}, exceeding threshold of 100`);
    }

    const responsePromise = new Promise<SubmitEventResponse>((resolve, reject) => {
      eventQueue.push({
        requestBody: req.body,
        resolve,
        reject
      });
    });

    processEventQueue().catch((error) => {
      console.error('[Queue] Error processing event queue:', error);
    });

    const response = await responsePromise;
    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
});

app.post('/cases/:eventId/actions', async (req, res) => {
  try {
    const { action_type } = req.body as { action_type?: Exclude<CaseActionType, 'proof_packet_locked'> };

    if (
      action_type !== 'verifier_review_requested' &&
      action_type !== 'sponsor_release_authorized' &&
      action_type !== 'tranche_released'
    ) {
      throw new Error('Invalid case action');
    }

    const response = await processCaseAction(req.params.eventId, action_type);
    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
});

app.get('/portfolio', (_req, res) => {
  res.json(getPortfolioSnapshot());
});

app.get('/metrics', (_req, res) => {
  res.json({
    ...aggregateMetrics.toJSON(),
    accounts_created: getTrackedAccountCount()
  });
});

app.get('/tokens', (_req, res) => {
  res.json(getTokenSnapshot());
});

app.get('/hedera/records', (_req, res) => {
  res.json({
    records: hederaRecords.slice(0, 20)
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Smart Contract Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.post('/contracts/projects', async (req, res) => {
  res.status(400).json({
    error: 'Projects are provisioned through /events so role accounts and escrow metadata stay synchronized.'
  });
});

app.post('/contracts/projects/:id/deposit', async (req, res) => {
  try {
    const bindings = getRoleBindingsOrThrow(req.params.id);
    const { amountHbar } = req.body;
    const result = await hederaSmartContract.depositFunds(bindings.sponsor, req.params.id, amountHbar);
    broadcast({
      type: 'contract_funds_deposited',
      payload: { projectId: req.params.id, amountHbar, ...result },
      timestamp: new Date().toISOString()
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.post('/contracts/projects/:id/milestones/:index/approve', async (req, res) => {
  try {
    const bindings = getRoleBindingsOrThrow(req.params.id);
    const result = await hederaSmartContract.approveMilestone(
      bindings.verifier,
      req.params.id,
      Number(req.params.index)
    );
    broadcast({
      type: 'contract_milestone_approved',
      payload: { projectId: req.params.id, milestoneIndex: req.params.index, ...result },
      timestamp: new Date().toISOString()
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.post('/contracts/projects/:id/milestones/:index/release', async (req, res) => {
  try {
    const bindings = getRoleBindingsOrThrow(req.params.id);
    const result = await hederaSmartContract.releaseMilestone(
      bindings.sponsor,
      req.params.id,
      Number(req.params.index)
    );
    broadcast({
      type: 'contract_funds_released',
      payload: { projectId: req.params.id, milestoneIndex: req.params.index, ...result },
      timestamp: new Date().toISOString()
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.post('/contracts/projects/:id/milestones/:index/refund', async (req, res) => {
  try {
    const bindings = getRoleBindingsOrThrow(req.params.id);
    const result = await hederaSmartContract.refundAfterDeadline(
      bindings.sponsor,
      req.params.id,
      Number(req.params.index)
    );
    broadcast({
      type: 'contract_refund_triggered',
      payload: { projectId: req.params.id, milestoneIndex: req.params.index, ...result },
      timestamp: new Date().toISOString()
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.get('/contracts/projects/:id', async (req, res) => {
  try {
    const info = await hederaSmartContract.getProjectInfo(req.params.id);
    res.json(info);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.get('/contracts/projects/:id/milestones/:index', async (req, res) => {
  try {
    const milestoneIndex = Number(req.params.index);
    const milestone = await hederaSmartContract.getMilestone(req.params.id, milestoneIndex);
    const refundEligible = await hederaSmartContract.canRefundAfterDeadline(req.params.id, milestoneIndex);
    res.json({
      milestone,
      refund_eligible: refundEligible
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/contracts/balance', async (_req, res) => {
  try {
    const balance = await hederaSmartContract.getContractBalance();
    res.json({ balance, contractId: process.env.ESCROW_CONTRACT_ID || 'not-deployed' });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Account Creation Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.post('/accounts/create', async (req, res) => {
  try {
    const { role, projectName } = req.body;
    if (!['sponsor', 'verifier', 'operator'].includes(role)) {
      return res.status(400).json({ error: 'Role must be sponsor, verifier, or operator' });
    }
    const result = await hederaAccountService.createRoleAccount(role, projectName || 'EcoSwarm');
    broadcast({ type: 'hedera_account_created', payload: result, timestamp: new Date().toISOString() });
    broadcastHederaRecord('impact_event_detected', {
      event_type: 'account_created',
      project_name: projectName || 'EcoSwarm',
      role,
      account_id: result.accountId
    }, result.transactionId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.get('/accounts', (_req, res) => {
  res.json({
    accounts: hederaAccountService.getCreatedAccounts(),
    total: hederaAccountService.getAccountCount()
  });
});

app.post('/accounts/transfer-tokens', async (req, res) => {
  try {
    const { tokenId, fromAccountId, toAccountId, amount } = req.body;
    const receiverBinding = toAccountId ? hederaAccountService.getAccountBinding(toAccountId) : undefined;
    const result = await hederaAccountService.transferTokens(
      tokenId,
      fromAccountId,
      toAccountId,
      amount,
      receiverBinding
    );
    broadcast({
      type: 'token_transferred',
      payload: { tokenId, from: fromAccountId, to: toAccountId, amount, ...result },
      timestamp: new Date().toISOString()
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.post('/accounts/transfer-hbar', async (req, res) => {
  try {
    const { toAccountId, amountHbar, sourceAccountId } = req.body;
    const sourceBinding = sourceAccountId
      ? hederaAccountService.getAccountBinding(sourceAccountId)
      : undefined;
    const result = await hederaAccountService.transferHbar(toAccountId, amountHbar, sourceBinding);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Mirror Node Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/hedera/topic-messages', async (_req, res) => {
  try {
    const topicId = process.env.HEDERA_TOPIC_ID;
    if (!topicId) return res.json({ messages: [], count: 0 });
    const data = await hederaMirrorService.getTopicMessages(topicId, 25);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.get('/hedera/token-info', async (_req, res) => {
  try {
    const tokens = await hederaMirrorService.getAllTokenInfos();
    res.json({ tokens });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.get('/hedera/transactions', async (_req, res) => {
  try {
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    if (!accountId) return res.json({ transactions: [], count: 0 });
    const data = await hederaMirrorService.getAccountTransactions(accountId, 25);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

app.get('/hedera/network-summary', async (_req, res) => {
  try {
    const topicId = process.env.HEDERA_TOPIC_ID || '';
    const accountId = process.env.HEDERA_ACCOUNT_ID || '';
    const summary = await hederaMirrorService.getNetworkSummary(topicId, accountId);
    res.json({
      ...summary,
      accounts_created: getTrackedAccountCount(),
      smart_contract_id: process.env.ESCROW_CONTRACT_ID || 'not-deployed',
      hedera_services_used: [
        'Hedera Consensus Service (HCS)',
        'Hedera Token Service (HTS) - Fungible Receipts',
        'Hedera Token Service (HTS) - NFT Certificates',
        'Hedera Smart Contract Service',
        'Hedera Account Service',
        'Hedera Scheduled Transactions',
        'Mirror Node REST API'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  wsClients.add(ws);

  ws.send(JSON.stringify({
    type: 'health_status',
    components: componentHealth
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString()) as DemoControlMessage;
      console.log('Received message:', data);

      if (data.action === 'start_simulation') {
        simulationEngine.startSimulation();
        componentHealth.simulation_engine = 'operational';
        broadcastHealthUpdate();
      } else if (data.action === 'stop_simulation') {
        simulationEngine.stopSimulation();
        componentHealth.simulation_engine = 'stopped';
        broadcastHealthUpdate();
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`EcoSwarm Backend API running on port ${PORT}`);
  console.log('WebSocket server ready');
});

function shutdown(): void {
  console.log('Shutting down gracefully...');
  simulationEngine.stopSimulation();
  hederaTokenManager.close();
  hederaEventRecorder.close();
  hederaSmartContract.close();
  hederaAccountService.close();
  wss.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);



