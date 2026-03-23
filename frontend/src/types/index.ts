// Frontend type definitions for EcoSwarm platform

export type ImpactCategory = 'Solar' | 'River_Cleanup' | 'Reforestation' | 'Carbon_Capture';
export type UrgencyLevel = 'stable' | 'elevated' | 'critical';
export type ReleaseReadiness = 'hold' | 'review' | 'release';
export type MilestoneStage = 'proof_intake' | 'verifier_review' | 'committee_review' | 'release_ready';
export type MilestoneStatus = 'pending' | 'ready' | 'released';
export type RoleAccountType = 'sponsor' | 'verifier' | 'operator';
export type OnChainStepStatus = 'completed' | 'failed' | 'skipped';
export type CaseActionType =
  | 'proof_packet_locked'
  | 'verifier_review_requested'
  | 'sponsor_release_authorized'
  | 'tranche_released';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MilestoneCheckpoint {
  label: string;
  proof_requirement: string;
  target_outcome: string;
  release_percent: number;
  release_usd: number;
  status: MilestoneStatus;
}

export interface CaseAction {
  action_type: CaseActionType;
  actor_label: string;
  note: string;
  timestamp: string;
  transaction_id?: string;
  required_steps?: OnChainActionStep[];
  optional_steps?: OnChainActionStep[];
  failure_reason?: string;
}

export interface OnChainActionStep {
  key:
    | 'contract_project_created'
    | 'escrow_funded'
    | 'milestone_approved'
    | 'milestone_released'
    | 'refund_after_deadline'
    | 'hcs_recorded'
    | 'hts_receipt_transferred'
    | 'impact_certificate_minted';
  label: string;
  status: OnChainStepStatus;
  transaction_id?: string;
  detail?: string;
}

export interface RoleAccountBinding {
  role: RoleAccountType;
  account_id: string;
  solidity_address: string;
  created_at: string;
  transaction_id?: string;
}

export interface EscrowMilestoneState {
  index: number;
  label: string;
  amount_tinybar: number;
  deadline_at: string;
  approved_at?: string;
  released_at?: string;
  refund_tx_id?: string;
}

export interface OnChainProjectStatus {
  network: string;
  escrow_contract_id?: string;
  contract_project_created: boolean;
  escrow_funded: boolean;
  escrow_transaction_id?: string;
  contract_project_transaction_id?: string;
  deadline_reminder_schedule_id?: string;
  deadline_reminder_tx_id?: string;
  escrow_total_hbar: number;
  escrow_total_tinybar: number;
  released_hbar: number;
  refund_eligible: boolean;
  last_failure_reason?: string;
  milestones: EscrowMilestoneState[];
}

export interface DeploymentBlueprintStep {
  label: string;
  timeline: string;
  outcome: string;
}

export interface ROIIndicator {
  label: string;
  value: string;
  detail: string;
}

export interface DeploymentProfile {
  launch_wedge: string;
  usp_statement: string;
  pilot_region: string;
  buyer_persona: string;
  sponsor_name: string;
  sponsor_type: string;
  verifier_name: string;
  verifier_type: string;
  local_operator_name: string;
  operator_model: string;
  contract_model: string;
  commercial_model: string;
  pricing_model: string;
  beneficiary_metric: string;
  buyer_signal: string;
  market_need_signal: string;
  why_hedera_now: string;
  policy_guardrail: string;
  expansion_path: string;
  target_contract_value_usd: number;
  projected_new_accounts_per_program: number;
  projected_transactions_per_program: number;
  deployment_plan: DeploymentBlueprintStep[];
  roi_snapshot: ROIIndicator[];
  deployment_summary: string;
  risk_flags: string[];
  payout_recommendation_usd: number;
  upfront_release_usd: number;
  reserve_holdback_usd: number;
  release_readiness: ReleaseReadiness;
  milestone_stage: MilestoneStage;
  milestone_plan: MilestoneCheckpoint[];
  authorized_release_usd: number;
  released_capital_usd: number;
  next_action_label: string;
  case_actions: CaseAction[];
  role_accounts?: Record<RoleAccountType, RoleAccountBinding>;
  on_chain_status?: OnChainProjectStatus;
}

export interface SustainabilityMetadata {
  project_name?: string;
  community_name?: string;
  region?: string;
  country?: string;
  households_supported?: number;
  funding_gap_usd?: number;
  cost_per_impact_unit_usd?: number;
  verification_confidence?: number;
  urgency_level?: UrgencyLevel;
  verification_source?: string;
  proof_hash?: string;
  sdg_tags?: string[];
  priority_score?: number;
  sponsor_name?: string;
  verifier_name?: string;
  local_operator_name?: string;
  buyer_signal?: string;
  beneficiary_metric?: string;
  deployment_profile?: DeploymentProfile;
}

export interface SubmitEventRequest extends SustainabilityMetadata {
  event_type: ImpactCategory;
  location_coordinates: Coordinates;
  energy_kwh: number;
  co2_reduction_kg: number;
  ecosystem_restoration_units: number;
  timestamp: string; // ISO 8601
}

export interface SubmitEventResponse {
  success: boolean;
  event_id: string;
  impact_score: number;
  hedera_transaction_id?: string;
}

export interface SubmitCaseActionResponse {
  success: boolean;
  event_id: string;
  action_type: CaseActionType;
  transaction_id?: string;
  required_steps: OnChainActionStep[];
  optional_steps: OnChainActionStep[];
  transaction_ids: string[];
  failure_reason?: string;
}

export interface PortfolioResponse {
  allocations: {
    Solar: number;
    River_Cleanup: number;
    Reforestation: number;
    Carbon_Capture: number;
  };
  last_rebalanced: string;
}

export interface MetricsResponse {
  total_co2_reduced_kg: number;
  total_energy_generated_kwh: number;
  total_projects_funded: number;
  total_events_processed: number;
  total_households_supported?: number;
  total_capital_routed_usd?: number;
  capital_ready_to_release_usd?: number;
  average_verification_confidence?: number;
  proofs_recorded?: number;
  release_ready_projects?: number;
  release_authorized_capital_usd?: number;
  released_capital_usd?: number;
  total_case_actions?: number;
  active_programs?: number;
  active_regions?: string[];
  active_sponsors?: string[];
  active_verifiers?: string[];
  accounts_created?: number;
}

export interface TokenBalancesResponse {
  SolarImpactToken: number;
  CleanupImpactToken: number;
  ReforestationToken: number;
  CarbonCaptureToken: number;
}

export interface DashboardUpdate {
  type: 'event_detected' | 'score_calculated' | 'portfolio_rebalanced' | 'tokens_minted' | 'hedera_recorded' | 'case_updated';
  payload: any;
  timestamp: string;
}

export interface EnvironmentalEvent extends SustainabilityMetadata {
  id: string;
  event_type: ImpactCategory;
  location_coordinates: Coordinates;
  energy_kwh: number;
  co2_reduction_kg: number;
  ecosystem_restoration_units: number;
  timestamp: string;
  impact_score?: number;
}

export interface SystemHealthUpdate {
  type: 'health_status';
  components: {
    simulation_engine: 'operational' | 'stopped' | 'error';
    impact_calculator: 'operational' | 'error';
    portfolio_optimizer: 'operational' | 'error';
    token_manager: 'operational' | 'error';
    event_recorder: 'operational' | 'error';
  };
}

export interface DemoControlMessage {
  action: 'start_simulation' | 'stop_simulation';
}

export interface HederaEventRecord {
  event_type:
    | 'impact_event_detected'
    | 'impact_score_calculated'
    | 'payout_case_prepared'
    | 'portfolio_rebalanced'
    | 'impact_verified'
    | 'verifier_review_requested'
    | 'sponsor_release_authorized'
    | 'tranche_released';
  timestamp: string;
  payload: any;
  transaction_id?: string;
  stage_label?: string;
  summary?: string;
  project_name?: string;
}

export interface OptimizeResponse {
  recommended_allocation: Record<string, number>;
  decision_logic: string;
  impact_per_dollar_ratios: Record<string, number>;
  rebalancing_needed: boolean;
}

export interface AgentActionExecution {
  action_type: Exclude<CaseActionType, 'proof_packet_locked'>;
  agent_label: string;
  transaction_id?: string;
}

export interface AgentChatResponse {
  message: string;
  command:
    | 'case_summary'
    | 'case_queue'
    | 'deployment_blueprint'
    | 'hedera_fit'
    | 'case_action'
    | 'case_switch'
    | 'help';
  selected_case_id?: string;
  executed_action?: AgentActionExecution;
  agent_flow: string[];
  suggested_prompts: string[];
}
