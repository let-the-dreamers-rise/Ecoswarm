import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
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
import { formatEventToJSON, parseEventFromJSON } from './utils/EventParser.js';
import {
  CaseActionType,
  DemoControlMessage,
  HederaEventRecord,
  MetricsResponse,
  OptimizeResponse,
  PortfolioResponse,
  SubmitEventResponse,
  TokenBalancesResponse
} from './types/index.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3000);

const portfolio = new Portfolio();
const tokenBalances = new TokenBalances();
const aggregateMetrics = new AggregateMetrics();
const impactScoreCalculator = new ImpactScoreCalculator();
const hederaTokenManager = new HederaTokenManager(tokenBalances);
const hederaEventRecorder = new HederaEventRecorder();
const milestonePayoutEngine = new MilestonePayoutEngine();
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
  metrics: MetricsResponse;
  token_balances: TokenBalancesResponse;
}

let persistedState: PersistedState | null = null;

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

function saveState(): void {
  persistedState = {
    portfolio: getPortfolioSnapshot(),
    metrics: aggregateMetrics.toJSON(),
    token_balances: getTokenSnapshot()
  };

  console.log('[State] State saved to in-memory storage');
}

function loadState(): void {
  if (!persistedState) {
    console.log('[State] No persisted state found, starting fresh');
    return;
  }

  portfolio.allocations.set('Solar', persistedState.portfolio.allocations.Solar);
  portfolio.allocations.set('River_Cleanup', persistedState.portfolio.allocations.River_Cleanup);
  portfolio.allocations.set('Reforestation', persistedState.portfolio.allocations.Reforestation);
  portfolio.allocations.set('Carbon_Capture', persistedState.portfolio.allocations.Carbon_Capture);
  portfolio.last_rebalanced = new Date(persistedState.portfolio.last_rebalanced);

  aggregateMetrics.total_co2_reduced_kg = persistedState.metrics.total_co2_reduced_kg;
  aggregateMetrics.total_energy_generated_kwh = persistedState.metrics.total_energy_generated_kwh;
  aggregateMetrics.total_projects_funded = persistedState.metrics.total_projects_funded;
  aggregateMetrics.total_events_processed = persistedState.metrics.total_events_processed;
  aggregateMetrics.total_households_supported = persistedState.metrics.total_households_supported || 0;
  aggregateMetrics.total_capital_routed_usd = persistedState.metrics.total_capital_routed_usd || 0;
  aggregateMetrics.capital_ready_to_release_usd =
    persistedState.metrics.capital_ready_to_release_usd || 0;
  aggregateMetrics.average_verification_confidence =
    persistedState.metrics.average_verification_confidence || 0;
  aggregateMetrics.proofs_recorded = persistedState.metrics.proofs_recorded || 0;
  aggregateMetrics.release_ready_projects = persistedState.metrics.release_ready_projects || 0;
  aggregateMetrics.activeRegions = persistedState.metrics.active_regions || [];
  aggregateMetrics.activeSponsors = persistedState.metrics.active_sponsors || [];
  aggregateMetrics.activeVerifiers = persistedState.metrics.active_verifiers || [];
  aggregateMetrics.release_authorized_capital_usd =
    persistedState.metrics.release_authorized_capital_usd || 0;
  aggregateMetrics.released_capital_usd = persistedState.metrics.released_capital_usd || 0;
  aggregateMetrics.total_case_actions = persistedState.metrics.total_case_actions || 0;
  aggregateMetrics.activePrograms = persistedState.metrics.active_programs || 0;

  tokenBalances.balances.set('SolarImpactToken', persistedState.token_balances.SolarImpactToken);
  tokenBalances.balances.set('CleanupImpactToken', persistedState.token_balances.CleanupImpactToken);
  tokenBalances.balances.set('ReforestationToken', persistedState.token_balances.ReforestationToken);
  tokenBalances.balances.set('CarbonCaptureToken', persistedState.token_balances.CarbonCaptureToken);

  console.log('[State] State restored from in-memory storage');
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

  return `https://${rawUrl.replace(/\/+$/, '')}`;
}

function createEventPayload(event: EnvironmentalEvent) {
  const locationLabel = [event.community_name, event.region, event.country].filter(Boolean).join(' / ');

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

  broadcast({
    type: 'hedera_recorded',
    payload: record,
    timestamp: record.timestamp
  });
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
  const impactScore = impactScoreCalculator.calculateImpactScore(event);
  event.impact_score = impactScore;
  event.deployment_profile = milestonePayoutEngine.buildDeploymentProfile(event, impactScore);

  portfolio.addEvent(event);
  aggregateMetrics.rebuildFromEvents(portfolio.case_registry);
  saveState();

  const eventPayload = createEventPayload(event);
  broadcast({
    type: 'event_detected',
    payload: eventPayload,
    timestamp: new Date().toISOString()
  });

  const detectedRecordPayload = {
    event_id: event.id,
    project_name: event.project_name,
    event_type: event.event_type,
    location_coordinates: event.location_coordinates,
    verification_confidence: event.verification_confidence,
    urgency_level: event.urgency_level,
    proof_hash: event.proof_hash,
    sponsor_name: event.sponsor_name,
    verifier_name: event.verifier_name,
    local_operator_name: event.local_operator_name
  };
  const eventDetectedTxId = await hederaEventRecorder.recordEvent(
    'impact_event_detected',
    detectedRecordPayload
  );
  broadcastHederaRecord('impact_event_detected', detectedRecordPayload, eventDetectedTxId);

  const scoreRecordPayload = {
    event_id: event.id,
    project_name: event.project_name,
    event_type: event.event_type,
    impact_score: impactScore,
    priority_score: eventPayload.priority_score,
    households_supported: event.households_supported,
    cost_per_impact_unit_usd: event.cost_per_impact_unit_usd,
    release_readiness: event.deployment_profile?.release_readiness,
    payout_recommendation_usd: event.deployment_profile?.payout_recommendation_usd
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
    sponsor_name: event.deployment_profile?.sponsor_name,
    verifier_name: event.deployment_profile?.verifier_name,
    local_operator_name: event.deployment_profile?.local_operator_name,
    launch_wedge: event.deployment_profile?.launch_wedge,
    contract_model: event.deployment_profile?.contract_model,
    beneficiary_metric: event.deployment_profile?.beneficiary_metric,
    payout_recommendation_usd: event.deployment_profile?.payout_recommendation_usd,
    upfront_release_usd: event.deployment_profile?.upfront_release_usd,
    reserve_holdback_usd: event.deployment_profile?.reserve_holdback_usd,
    release_readiness: event.deployment_profile?.release_readiness,
    milestone_stage: event.deployment_profile?.milestone_stage,
    risk_flags: event.deployment_profile?.risk_flags
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
          payout_recommendation_usd: event.deployment_profile?.payout_recommendation_usd
        }
      },
      timestamp: new Date().toISOString()
    });
  }

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
    release_readiness: event.deployment_profile?.release_readiness,
    payout_recommendation_usd: event.deployment_profile?.payout_recommendation_usd,
    milestone_stage: event.deployment_profile?.milestone_stage
  };
  const impactVerifiedTxId = await hederaEventRecorder.recordEvent(
    'impact_verified',
    verificationRecordPayload
  );
  broadcastHederaRecord('impact_verified', verificationRecordPayload, impactVerifiedTxId);

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
): Promise<{ success: true; event_id: string; action_type: CaseActionType; transaction_id?: string }> {
  const event = findCaseById(eventId);

  if (!event || !event.deployment_profile) {
    throw new Error('Case not found');
  }

  milestonePayoutEngine.applyCaseAction(event, actionType);

  const actionPayloadBase = {
    event_id: event.id,
    project_name: event.project_name,
    event_type: event.event_type,
    release_readiness: event.deployment_profile.release_readiness,
    milestone_stage: event.deployment_profile.milestone_stage,
    next_action_label: event.deployment_profile.next_action_label,
    authorized_release_usd: event.deployment_profile.authorized_release_usd,
    released_capital_usd: event.deployment_profile.released_capital_usd
  };

  let actionPayload: Record<string, unknown> = actionPayloadBase;

  if (actionType === 'verifier_review_requested') {
    actionPayload = {
      ...actionPayloadBase,
      verifier_name: event.deployment_profile.verifier_name
    };
  }

  if (actionType === 'sponsor_release_authorized') {
    actionPayload = {
      ...actionPayloadBase,
      sponsor_name: event.deployment_profile.sponsor_name,
      release_amount_usd: event.deployment_profile.authorized_release_usd
    };
  }

  if (actionType === 'tranche_released') {
    const latestAction = event.deployment_profile.case_actions[event.deployment_profile.case_actions.length - 1];
    const releasedMilestone = [...event.deployment_profile.milestone_plan]
      .reverse()
      .find((milestone) => milestone.status === 'released');

    actionPayload = {
      ...actionPayloadBase,
      sponsor_name: event.deployment_profile.sponsor_name,
      operator_name: event.deployment_profile.local_operator_name,
      release_amount_usd: releasedMilestone?.release_usd ?? event.deployment_profile.released_capital_usd,
      latest_case_note: latestAction?.note
    };
  }

  const transactionId = await hederaEventRecorder.recordEvent(actionType, actionPayload);
  const latestAction = event.deployment_profile.case_actions[event.deployment_profile.case_actions.length - 1];
  if (latestAction) {
    latestAction.transaction_id = transactionId || undefined;
  }
  aggregateMetrics.rebuildFromEvents(portfolio.case_registry);
  saveState();

  broadcast({
    type: 'case_updated',
    payload: {
      ...createEventPayload(event),
      metrics: aggregateMetrics.toJSON()
    },
    timestamp: new Date().toISOString()
  });

  broadcastHederaRecord(actionType, actionPayload, transactionId);

  return {
    success: true,
    event_id: event.id,
    action_type: actionType,
    transaction_id: transactionId || undefined
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
  res.json(aggregateMetrics.toJSON());
});

app.get('/tokens', (_req, res) => {
  res.json(getTokenSnapshot());
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
  wss.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
