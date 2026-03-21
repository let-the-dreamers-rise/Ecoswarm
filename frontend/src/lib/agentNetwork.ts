import type { CaseActionType, HederaEventRecord } from '../types';
import type { EventMapData } from '../components/EventMap';

export type AgentId = 'scout' | 'verifier' | 'treasury' | 'settlement' | 'reputation';

export interface AgentActionRecommendation {
  agentId: AgentId;
  agentName: string;
  actionType: Exclude<CaseActionType, 'proof_packet_locked'>;
  buttonLabel: string;
  rationale: string;
}

export const AGENT_NAMES: Record<AgentId, string> = {
  scout: 'Scout Agent',
  verifier: 'Verifier Agent',
  treasury: 'Treasury Agent',
  settlement: 'Settlement Agent',
  reputation: 'Reputation Agent'
};

const ACTION_TO_AGENT: Record<CaseActionType, AgentId> = {
  proof_packet_locked: 'scout',
  verifier_review_requested: 'verifier',
  sponsor_release_authorized: 'treasury',
  tranche_released: 'settlement'
};

export function getAgentForAction(actionType: CaseActionType): AgentId {
  return ACTION_TO_AGENT[actionType];
}

export function hasCaseAction(caseEvent: EventMapData | null, actionType: CaseActionType): boolean {
  return (
    caseEvent?.deployment_profile?.case_actions.some((action) => action.action_type === actionType) ?? false
  );
}

export function getRecommendedAgentAction(
  caseEvent: EventMapData | null
): AgentActionRecommendation | null {
  const profile = caseEvent?.deployment_profile;

  if (!caseEvent || !profile) {
    return null;
  }

  const hasVerifierReview = hasCaseAction(caseEvent, 'verifier_review_requested');
  const hasSponsorAuthorization = hasCaseAction(caseEvent, 'sponsor_release_authorized');
  const readyMilestone = profile.milestone_plan.find((milestone) => milestone.status === 'ready');

  if (!hasVerifierReview || profile.milestone_stage === 'proof_intake' || profile.milestone_stage === 'verifier_review') {
    return {
      agentId: 'verifier',
      agentName: AGENT_NAMES.verifier,
      actionType: 'verifier_review_requested',
      buttonLabel: 'Dispatch Verifier Agent',
      rationale: 'The proof packet is assembled, but the case still needs verifier-led committee review.'
    };
  }

  if (!hasSponsorAuthorization || profile.milestone_stage === 'committee_review' || profile.release_readiness === 'review') {
    return {
      agentId: 'treasury',
      agentName: AGENT_NAMES.treasury,
      actionType: 'sponsor_release_authorized',
      buttonLabel: 'Dispatch Treasury Agent',
      rationale: 'The case is through review and is ready for policy-checked release authorization.'
    };
  }

  if (readyMilestone || profile.authorized_release_usd > profile.released_capital_usd) {
    return {
      agentId: 'settlement',
      agentName: AGENT_NAMES.settlement,
      actionType: 'tranche_released',
      buttonLabel: 'Dispatch Settlement Agent',
      rationale: 'Capital is authorized and the next milestone can be released and anchored to Hedera.'
    };
  }

  return null;
}

export function getLatestCaseTransactionId(
  hederaRecords: HederaEventRecord[],
  caseEvent: EventMapData | null
): string | null {
  if (!caseEvent) {
    return hederaRecords.find((record) => record.transaction_id)?.transaction_id ?? null;
  }

  const match = hederaRecords.find((record) => {
    const eventId = record.payload?.event_id;
    const projectName = record.project_name || record.payload?.project_name;
    return eventId === caseEvent.id || projectName === caseEvent.project_name;
  });

  return match?.transaction_id ?? null;
}

export function getTrustScore(caseEvent: EventMapData | null): number {
  if (!caseEvent?.deployment_profile) {
    return 0;
  }

  const verificationConfidence = caseEvent.verification_confidence ?? 0;
  const caseActionCount = caseEvent.deployment_profile.case_actions.length;
  const releaseCoverage =
    caseEvent.deployment_profile.payout_recommendation_usd > 0
      ? caseEvent.deployment_profile.released_capital_usd /
        caseEvent.deployment_profile.payout_recommendation_usd
      : 0;

  return Math.min(
    100,
    Math.round(verificationConfidence * 55 + Math.min(caseActionCount * 8, 24) + Math.min(releaseCoverage * 35, 21))
  );
}
