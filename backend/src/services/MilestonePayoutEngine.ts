import { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';
import {
  CaseAction,
  CaseActionType,
  DeploymentProfile,
  ImpactCategory,
  MilestoneCheckpoint,
  MilestoneStage,
  MilestoneStatus,
  OnChainActionStep,
  ReleaseReadiness
} from '../types/index.js';

interface CategoryPlaybook {
  launchWedge: string;
  uspStatement: string;
  pilotRegion: string;
  buyerPersona: string;
  sponsorType: string;
  defaultSponsor: string;
  verifierType: string;
  defaultVerifier: string;
  operatorModel: string;
  defaultOperator: string;
  contractModel: string;
  commercialModel: string;
  pricingModel: string;
  beneficiaryMetric: string;
  buyerSignal: string;
  marketNeedSignal: string;
  whyHederaNow: string;
  policyGuardrail: string;
  expansionPath: string;
  targetContractValueUsd: number;
  projectedNewAccountsPerProgram: number;
  projectedTransactionsPerProgram: number;
  deploymentPlan: Array<{
    label: string;
    timeline: string;
    outcome: string;
  }>;
  roiSnapshot: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  milestoneBlueprints: Array<{
    label: string;
    proofRequirement: string;
    targetOutcome: string;
  }>;
  payoutMultiplier: number;
}

const CATEGORY_PLAYBOOKS: Record<ImpactCategory, CategoryPlaybook> = {
  Solar: {
    launchWedge: 'community cold-chain and productive-use solar payouts',
    uspStatement: 'Release capital only when uptime and productive-use proof are visible, not when equipment is merely delivered.',
    pilotRegion: 'Rural cold-chain corridors and agri-processing clusters',
    buyerPersona: 'CSR heads, energy-access programs, and productive-use finance teams',
    sponsorType: 'CSR energy-access budget',
    defaultSponsor: 'Distributed energy resilience sponsor pool',
    verifierType: 'metering and field-audit partner',
    defaultVerifier: 'Independent solar telemetry verifier',
    operatorModel: 'community energy cooperative',
    defaultOperator: 'Local solar operations cooperative',
    contractModel: 'Milestone contract for installation, uptime, and household adoption',
    commercialModel: 'Annual platform subscription plus orchestration fee on released capital',
    pricingModel: 'Setup fee plus 5% fee on milestone payouts',
    beneficiaryMetric: 'Cost per household electrified with uptime proof',
    buyerSignal: 'Cold-chain operators and CSR programs need verified productive-use energy outcomes.',
    marketNeedSignal: 'Sponsors are under pressure to fund energy access, but still struggle to verify sustained usage and service quality.',
    whyHederaNow: 'Hedera keeps many small telemetry-backed proof updates and payout checkpoints economically viable.',
    policyGuardrail: 'Release only after installation evidence, meter telemetry, and beneficiary sign-off are attached.',
    expansionPath: 'Expand from sponsor-backed cold-chain pilots into municipal resilience and blended-finance energy programs.',
    targetContractValueUsd: 165000,
    projectedNewAccountsPerProgram: 34,
    projectedTransactionsPerProgram: 148,
    deploymentPlan: [
      {
        label: 'Partner alignment',
        timeline: 'Weeks 1-2',
        outcome: 'Sponsor, verifier, and community operator agree on proof schema and release thresholds.'
      },
      {
        label: 'Pilot launch',
        timeline: 'Weeks 3-6',
        outcome: 'Install the first productive-use sites and begin metered proof collection.'
      },
      {
        label: 'Recurring treasury cadence',
        timeline: 'Weeks 7-12',
        outcome: 'Move into repeated verification and release cycles with sponsor reporting.'
      }
    ],
    roiSnapshot: [
      {
        label: 'Sponsor ROI',
        value: 'Lower grant leakage',
        detail: 'Capital is staged against uptime and beneficiary proof instead of being released upfront.'
      },
      {
        label: 'Operator ROI',
        value: 'Faster working capital',
        detail: 'Local operators get earlier releases once verified outputs land.'
      },
      {
        label: 'Verifier ROI',
        value: 'Less manual packet chasing',
        detail: 'Proof objects arrive in one shared rail instead of fragmented reports and spreadsheets.'
      }
    ],
    milestoneBlueprints: [
      {
        label: 'Baseline approval',
        proofRequirement: 'Geo-tagged installation packet plus procurement receipts',
        targetOutcome: 'Site approved and community operator onboarded'
      },
      {
        label: 'Uptime checkpoint',
        proofRequirement: '7-day energy telemetry and service logs',
        targetOutcome: 'Stable productive-use solar operation'
      },
      {
        label: 'Household outcome release',
        proofRequirement: 'Beneficiary adoption proof and verifier co-sign',
        targetOutcome: 'Electrification impact confirmed at household level'
      }
    ],
    payoutMultiplier: 1.02
  },
  River_Cleanup: {
    launchWedge: 'verified cleanup milestone payouts for urban river wards',
    uspStatement: 'Turns cleanup procurement into a milestone payout system tied to removal and water-quality evidence.',
    pilotRegion: 'Urban river wards with municipal cleanup mandates',
    buyerPersona: 'City resilience teams, packaging brands, and circular-economy leads',
    sponsorType: 'municipal resilience and circularity budget',
    defaultSponsor: 'City circular-economy procurement sponsor',
    verifierType: 'water-quality and materials-audit partner',
    defaultVerifier: 'Independent river proof consortium',
    operatorModel: 'cleanup guild and waste-picker network',
    defaultOperator: 'Community cleanup operating guild',
    contractModel: 'Milestone contract for cleanup, diversion, and water-quality improvement',
    commercialModel: 'Program onboarding fee plus recurring operating fee per active cleanup corridor',
    pricingModel: 'Monthly platform fee plus 6% of released capital',
    beneficiaryMetric: 'Cost per kilogram removed and independently verified',
    buyerSignal: 'Cities and packaging brands pay for traceable cleanup and diversion outcomes.',
    marketNeedSignal: 'Municipal and brand-funded cleanups often lack trusted proof and consistent payout discipline.',
    whyHederaNow: 'Hedera makes frequent cleanup attestations and tokenized outcome receipts cheap enough to use operationally.',
    policyGuardrail: 'Release only after collection ledgers, disposal evidence, and water-quality checks align.',
    expansionPath: 'Expand from one watershed into citywide ward programs and multi-brand procurement pools.',
    targetContractValueUsd: 140000,
    projectedNewAccountsPerProgram: 28,
    projectedTransactionsPerProgram: 132,
    deploymentPlan: [
      {
        label: 'Corridor selection',
        timeline: 'Weeks 1-2',
        outcome: 'Pick high-priority cleanup wards with sponsor budget and operator availability.'
      },
      {
        label: 'Proof rail rollout',
        timeline: 'Weeks 3-5',
        outcome: 'Standardize collection ledgers, weigh-ins, and audit checkpoints.'
      },
      {
        label: 'Release operations',
        timeline: 'Weeks 6-12',
        outcome: 'Move from one-time cleanup campaigns into recurring results-based disbursements.'
      }
    ],
    roiSnapshot: [
      {
        label: 'Sponsor ROI',
        value: 'Traceable procurement',
        detail: 'Sponsors can prove that funded cleanup actually happened corridor by corridor.'
      },
      {
        label: 'Operator ROI',
        value: 'Shorter payout cycles',
        detail: 'Cleanup teams spend less time waiting for manual approvals and reimbursements.'
      },
      {
        label: 'Verifier ROI',
        value: 'Cleaner evidence chain',
        detail: 'Removal and water-quality records are synchronized in a single operating rail.'
      }
    ],
    milestoneBlueprints: [
      {
        label: 'Proof-of-need intake',
        proofRequirement: 'Hotspot survey, volume estimate, and operator commitment',
        targetOutcome: 'Cleanup corridor approved for treasury backing'
      },
      {
        label: 'Removal checkpoint',
        proofRequirement: 'Collection ledger, materials weigh-in, and route evidence',
        targetOutcome: 'Waste removed and diversion verified'
      },
      {
        label: 'Water-quality release',
        proofRequirement: 'Independent water-quality comparison and public report',
        targetOutcome: 'Restoration outcome validated'
      }
    ],
    payoutMultiplier: 0.96
  },
  Reforestation: {
    launchWedge: 'canopy-survival milestone payouts for community restoration',
    uspStatement: 'Pays for survival and stewardship, not just planting counts, which is the real trust gap in restoration finance.',
    pilotRegion: 'Mangrove, watershed, and community forestry corridors in climate-vulnerable districts',
    buyerPersona: 'Adaptation funds, CSR sustainability teams, and nature-positive procurement leads',
    sponsorType: 'adaptation and nature-restoration budget',
    defaultSponsor: 'Nature-positive adaptation sponsor pool',
    verifierType: 'ecology and remote-sensing verifier',
    defaultVerifier: 'Satellite canopy assurance partner',
    operatorModel: 'community forestry council',
    defaultOperator: 'Local restoration council',
    contractModel: 'Milestone contract for planting, survival, and community stewardship',
    commercialModel: 'Pilot setup fee plus recurring orchestration and assurance revenue per live program',
    pricingModel: 'Implementation fee plus 6% of released capital and verification coordination',
    beneficiaryMetric: 'Cost per hectare restored with survival proof',
    buyerSignal: 'Adaptation funds and nature-positive brands need credible survival-linked payouts.',
    marketNeedSignal: 'Restoration budgets are growing, but buyers still lack a trusted way to stage releases against survival and stewardship proof.',
    whyHederaNow: 'Hedera is a better fit than high-fee chains for many small proof, approval, and receipt events across community programs.',
    policyGuardrail: 'Release only after survival checkpoints, field attestations, and canopy evidence match.',
    expansionPath: 'Expand from one community restoration pilot into regional resilience programs, supply-chain restoration, and adaptation funds.',
    targetContractValueUsd: 185000,
    projectedNewAccountsPerProgram: 42,
    projectedTransactionsPerProgram: 176,
    deploymentPlan: [
      {
        label: 'Program design',
        timeline: 'Weeks 1-2',
        outcome: 'Lock the sponsor, verifier, operator, and milestone release design for one restoration corridor.'
      },
      {
        label: 'Proof onboarding',
        timeline: 'Weeks 3-6',
        outcome: 'Register nursery, canopy, and stewardship evidence flows for the pilot communities.'
      },
      {
        label: 'Recurring releases',
        timeline: 'Weeks 7-12',
        outcome: 'Move into survival-linked releases with visible sponsor reporting and Hedera receipts.'
      }
    ],
    roiSnapshot: [
      {
        label: 'Sponsor ROI',
        value: 'Higher confidence on impact spend',
        detail: 'Capital is staged against survival and stewardship proof instead of headline planting numbers.'
      },
      {
        label: 'Operator ROI',
        value: 'Working capital without opaque grant cycles',
        detail: 'Community operators unlock the next release once the required proof is in place.'
      },
      {
        label: 'Verifier ROI',
        value: 'Faster review operations',
        detail: 'Remote-sensing and field evidence land in the same shared payout case.'
      }
    ],
    milestoneBlueprints: [
      {
        label: 'Nursery and site readiness',
        proofRequirement: 'Seedling registry, site map, and local council approval',
        targetOutcome: 'Planting corridor prepared and labor mobilized'
      },
      {
        label: 'Survival checkpoint',
        proofRequirement: '60-day field audit and remote-sensing evidence',
        targetOutcome: 'Target canopy survival rate achieved'
      },
      {
        label: 'Stewardship release',
        proofRequirement: 'Community stewardship logs and verifier sign-off',
        targetOutcome: 'Longer-term restoration stewardship funded'
      }
    ],
    payoutMultiplier: 1.08
  },
  Carbon_Capture: {
    launchWedge: 'biochar and soil-carbon procurement payouts',
    uspStatement: 'Links batch-level capture proof to staged working-capital releases for distributed biochar operators.',
    pilotRegion: 'Agricultural districts with crop-residue surplus and soil-carbon programs',
    buyerPersona: 'Regenerative agriculture buyers, climate funds, and carbon procurement teams',
    sponsorType: 'soil-carbon procurement budget',
    defaultSponsor: 'Circular agriculture sponsor pool',
    verifierType: 'lab and telemetry verification partner',
    defaultVerifier: 'Independent carbon measurement lab',
    operatorModel: 'biochar production cooperative',
    defaultOperator: 'Local biochar processing cooperative',
    contractModel: 'Milestone contract for feedstock intake, capture proof, and soil application',
    commercialModel: 'Program setup plus fee on verified capture releases',
    pricingModel: 'Implementation fee plus 5.5% of released capital',
    beneficiaryMetric: 'Cost per ton captured with measurement evidence',
    buyerSignal: 'Climate funds and regenerative agriculture buyers need trusted carbon drawdown proof.',
    marketNeedSignal: 'Distributed carbon-capture projects still struggle to coordinate lab proof, operator cash flow, and buyer confidence.',
    whyHederaNow: 'Hedera supports frequent low-value but high-importance attestations without pushing operating costs out of range.',
    policyGuardrail: 'Release only after batch logs, measurement evidence, and soil application proof are recorded.',
    expansionPath: 'Expand from biochar cooperatives into broader regenerative agriculture and distributed carbon-removal programs.',
    targetContractValueUsd: 172000,
    projectedNewAccountsPerProgram: 31,
    projectedTransactionsPerProgram: 144,
    deploymentPlan: [
      {
        label: 'Buyer alignment',
        timeline: 'Weeks 1-2',
        outcome: 'Define capture milestones, measurement requirements, and batch economics.'
      },
      {
        label: 'Operator onboarding',
        timeline: 'Weeks 3-5',
        outcome: 'Bring cooperative operators and measurement partners onto one payout rail.'
      },
      {
        label: 'Release cadence',
        timeline: 'Weeks 6-12',
        outcome: 'Run repeatable capture-to-application payouts with verifiable batch records.'
      }
    ],
    roiSnapshot: [
      {
        label: 'Sponsor ROI',
        value: 'Higher confidence on drawdown claims',
        detail: 'Buyers see batch-level proof before capital is released.'
      },
      {
        label: 'Operator ROI',
        value: 'Predictable release cadence',
        detail: 'Operators gain staged working capital instead of waiting on end-of-cycle settlements.'
      },
      {
        label: 'Verifier ROI',
        value: 'Fewer disconnected datasets',
        detail: 'Lab, telemetry, and application evidence live in one case record.'
      }
    ],
    milestoneBlueprints: [
      {
        label: 'Feedstock lock-in',
        proofRequirement: 'Waste intake receipts and batch schedule',
        targetOutcome: 'Reliable feedstock secured for processing'
      },
      {
        label: 'Capture checkpoint',
        proofRequirement: 'Kiln telemetry and batch carbon measurement',
        targetOutcome: 'Measured carbon capture completed'
      },
      {
        label: 'Application release',
        proofRequirement: 'Soil deployment proof and agronomy validation',
        targetOutcome: 'Carbon benefits translated into field outcomes'
      }
    ],
    payoutMultiplier: 1.0
  }
};

const READINESS_RELEASE_SPLITS: Record<ReleaseReadiness, number[]> = {
  hold: [15, 35, 50],
  review: [25, 35, 40],
  release: [35, 30, 35]
};

const URGENCY_MULTIPLIERS: Record<EnvironmentalEvent['urgency_level'], number> = {
  stable: 0.95,
  elevated: 1.05,
  critical: 1.15
};

export class MilestonePayoutEngine {
  buildDeploymentProfile(event: EnvironmentalEvent, impactScore: number): DeploymentProfile {
    const playbook = CATEGORY_PLAYBOOKS[event.event_type];
    const releaseReadiness = this.getReleaseReadiness(event);
    const milestoneStage = this.getMilestoneStage(event, releaseReadiness);
    const payoutRecommendationUsd = this.calculatePayoutRecommendation(event, impactScore, playbook);
    const milestonePlan = this.buildMilestonePlan(
      playbook,
      payoutRecommendationUsd,
      releaseReadiness,
      milestoneStage
    );
    const upfrontReleaseUsd = milestonePlan[0]?.release_usd ?? 0;
    const reserveHoldbackUsd = Math.max(payoutRecommendationUsd - upfrontReleaseUsd, 0);
    const sponsorName = event.sponsor_name || playbook.defaultSponsor;
    const verifierName = event.verifier_name || playbook.defaultVerifier;
    const operatorName = event.local_operator_name || playbook.defaultOperator;
    const buyerSignal = event.buyer_signal || playbook.buyerSignal;
    const beneficiaryMetric = event.beneficiary_metric || playbook.beneficiaryMetric;
    const riskFlags = this.getRiskFlags(event, releaseReadiness, payoutRecommendationUsd);

    return {
      launch_wedge: playbook.launchWedge,
      usp_statement: playbook.uspStatement,
      pilot_region: playbook.pilotRegion,
      buyer_persona: playbook.buyerPersona,
      sponsor_name: sponsorName,
      sponsor_type: playbook.sponsorType,
      verifier_name: verifierName,
      verifier_type: playbook.verifierType,
      local_operator_name: operatorName,
      operator_model: playbook.operatorModel,
      contract_model: playbook.contractModel,
      commercial_model: playbook.commercialModel,
      pricing_model: playbook.pricingModel,
      beneficiary_metric: beneficiaryMetric,
      buyer_signal: buyerSignal,
      market_need_signal: playbook.marketNeedSignal,
      why_hedera_now: playbook.whyHederaNow,
      policy_guardrail: playbook.policyGuardrail,
      expansion_path: playbook.expansionPath,
      target_contract_value_usd: playbook.targetContractValueUsd,
      projected_new_accounts_per_program: playbook.projectedNewAccountsPerProgram,
      projected_transactions_per_program: playbook.projectedTransactionsPerProgram,
      deployment_plan: playbook.deploymentPlan,
      roi_snapshot: playbook.roiSnapshot,
      deployment_summary: this.buildDeploymentSummary(
        event,
        sponsorName,
        verifierName,
        operatorName,
        payoutRecommendationUsd,
        releaseReadiness
      ),
      risk_flags: riskFlags,
      payout_recommendation_usd: payoutRecommendationUsd,
      upfront_release_usd: upfrontReleaseUsd,
      reserve_holdback_usd: reserveHoldbackUsd,
      release_readiness: releaseReadiness,
      milestone_stage: milestoneStage,
      milestone_plan: milestonePlan,
      authorized_release_usd: 0,
      released_capital_usd: 0,
      next_action_label: this.getNextActionLabel(milestoneStage, releaseReadiness, milestonePlan),
      case_actions: [
        {
          action_type: 'proof_packet_locked',
          actor_label: operatorName,
          note: 'Initial proof packet is locked and the payout case has been prepared.',
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  applyCaseAction(
    event: EnvironmentalEvent,
    actionType: Exclude<CaseActionType, 'proof_packet_locked'>,
    transactionId?: string | null,
    requiredSteps?: OnChainActionStep[],
    optionalSteps?: OnChainActionStep[],
    failureReason?: string,
    milestoneIndex?: number
  ): DeploymentProfile {
    if (!event.deployment_profile) {
      throw new Error('Deployment profile not found for this event.');
    }

    const profile = event.deployment_profile;
    const milestonePlan = profile.milestone_plan.map((milestone) => ({ ...milestone }));
    let note = '';
    let actorLabel = profile.local_operator_name;

    if (actionType === 'verifier_review_requested') {
      actorLabel = profile.verifier_name;
      profile.release_readiness = profile.release_readiness === 'release' ? 'release' : 'review';
      profile.milestone_stage = 'committee_review';

      const firstPendingIndex = milestonePlan.findIndex((milestone) => milestone.status === 'pending');
      if (firstPendingIndex >= 0) {
        milestonePlan[firstPendingIndex].status = 'ready';
      }

      note = 'Verifier packet advanced to committee review with a sponsor-ready release memo.';
    }

    if (actionType === 'sponsor_release_authorized') {
      actorLabel = profile.sponsor_name;
      profile.release_readiness = 'release';
      profile.milestone_stage = 'release_ready';

      const firstReadyMilestone =
        milestonePlan.find((milestone) => milestone.status === 'ready') ??
        milestonePlan.find((milestone) => milestone.status === 'pending');

      if (firstReadyMilestone && firstReadyMilestone.status === 'pending') {
        firstReadyMilestone.status = 'ready';
      }

      profile.authorized_release_usd = Math.max(
        profile.authorized_release_usd,
        firstReadyMilestone?.release_usd ?? profile.upfront_release_usd
      );

      note = 'Sponsor approved the next release amount for disbursement.';
    }

    if (actionType === 'tranche_released') {
      actorLabel = profile.sponsor_name;

      let releaseTarget =
        typeof milestoneIndex === 'number'
          ? milestonePlan[milestoneIndex]
          : milestonePlan.find((milestone) => milestone.status === 'ready') ??
            milestonePlan.find((milestone) => milestone.status === 'pending');

      if (!releaseTarget) {
        releaseTarget = milestonePlan[milestonePlan.length - 1];
      }

      if (releaseTarget.status === 'pending') {
        releaseTarget.status = 'ready';
      }

      releaseTarget.status = 'released';
      profile.authorized_release_usd = Math.max(profile.authorized_release_usd, releaseTarget.release_usd);
      profile.released_capital_usd += releaseTarget.release_usd;

      const nextPendingMilestone = milestonePlan.find((milestone) => milestone.status === 'pending');
      if (nextPendingMilestone) {
        profile.release_readiness = 'review';
        profile.milestone_stage = 'verifier_review';
      } else {
        profile.release_readiness = 'release';
        profile.milestone_stage = 'release_ready';
      }

      note = `Released ${this.formatCurrency(releaseTarget.release_usd)} against ${releaseTarget.label}.`;
    }

    profile.milestone_plan = milestonePlan;
    profile.next_action_label = this.getNextActionLabel(
      profile.milestone_stage,
      profile.release_readiness,
      profile.milestone_plan
    );
    profile.case_actions = [
      ...profile.case_actions,
      this.createCaseAction(
        actionType,
        actorLabel,
        note,
        transactionId,
        requiredSteps,
        optionalSteps,
        failureReason
      )
    ];

    return profile;
  }

  private calculatePayoutRecommendation(
    event: EnvironmentalEvent,
    impactScore: number,
    playbook: CategoryPlaybook
  ): number {
    const baseCase =
      (impactScore * 54) +
      (event.households_supported * 18) +
      (event.ecosystem_restoration_units * 40);
    const confidenceMultiplier = 0.72 + (event.verification_confidence * 0.36);
    const urgencyMultiplier = URGENCY_MULTIPLIERS[event.urgency_level];
    const modelledValue = baseCase * confidenceMultiplier * urgencyMultiplier * playbook.payoutMultiplier;
    const roundedValue = Math.round(Math.max(modelledValue, 4500) / 250) * 250;

    if (event.funding_gap_usd > 0) {
      return Math.min(roundedValue, event.funding_gap_usd);
    }

    return roundedValue;
  }

  private getReleaseReadiness(event: EnvironmentalEvent): ReleaseReadiness {
    const confidence = event.verification_confidence;
    const hasProofPacket = Boolean(event.proof_hash);
    const households = event.households_supported;

    if (hasProofPacket && confidence >= 0.9 && households >= 120 && event.urgency_level !== 'stable') {
      return 'release';
    }

    if (hasProofPacket && confidence >= 0.82 && households >= 60) {
      return 'review';
    }

    return 'hold';
  }

  private getMilestoneStage(
    event: EnvironmentalEvent,
    releaseReadiness: ReleaseReadiness
  ): MilestoneStage {
    if (!event.proof_hash) {
      return 'proof_intake';
    }

    if (releaseReadiness === 'release') {
      return 'release_ready';
    }

    if (releaseReadiness === 'review') {
      return 'committee_review';
    }

    return 'verifier_review';
  }

  private buildMilestonePlan(
    playbook: CategoryPlaybook,
    payoutRecommendationUsd: number,
    releaseReadiness: ReleaseReadiness,
    milestoneStage: MilestoneStage
  ): MilestoneCheckpoint[] {
    const releaseSplits = READINESS_RELEASE_SPLITS[releaseReadiness];

    return playbook.milestoneBlueprints.map((milestone, index) => ({
      label: milestone.label,
      proof_requirement: milestone.proofRequirement,
      target_outcome: milestone.targetOutcome,
      release_percent: releaseSplits[index],
      release_usd: Math.round((payoutRecommendationUsd * releaseSplits[index]) / 100),
      status: this.getMilestoneStatus(index, milestoneStage)
    }));
  }

  private getMilestoneStatus(index: number, milestoneStage: MilestoneStage): MilestoneStatus {
    if (milestoneStage === 'release_ready') {
      return index < 2 ? 'ready' : 'pending';
    }

    if (milestoneStage === 'committee_review') {
      return index === 0 ? 'ready' : 'pending';
    }

    return 'pending';
  }

  private createCaseAction(
    actionType: Exclude<CaseActionType, 'proof_packet_locked'>,
    actorLabel: string,
    note: string,
    transactionId?: string | null,
    requiredSteps?: OnChainActionStep[],
    optionalSteps?: OnChainActionStep[],
    failureReason?: string
  ): CaseAction {
    return {
      action_type: actionType,
      actor_label: actorLabel,
      note,
      timestamp: new Date().toISOString(),
      transaction_id: transactionId || undefined,
      required_steps: requiredSteps,
      optional_steps: optionalSteps,
      failure_reason: failureReason
    };
  }

  private getNextActionLabel(
    milestoneStage: MilestoneStage,
    releaseReadiness: ReleaseReadiness,
    milestonePlan: MilestoneCheckpoint[]
  ): string {
    const readyMilestone = milestonePlan.find((milestone) => milestone.status === 'ready');
    const pendingMilestone = milestonePlan.find((milestone) => milestone.status === 'pending');

    if (readyMilestone && releaseReadiness === 'release') {
      return `Release ${readyMilestone.label}`;
    }

    if (milestoneStage === 'committee_review') {
      return 'Authorize sponsor release';
    }

    if (milestoneStage === 'verifier_review' || milestoneStage === 'proof_intake') {
      return pendingMilestone
        ? `Collect proof for ${pendingMilestone.label}`
        : 'Collect verifier proof';
    }

    return pendingMilestone
      ? `Prepare ${pendingMilestone.label}`
      : 'Program fully released';
  }

  private getRiskFlags(
    event: EnvironmentalEvent,
    releaseReadiness: ReleaseReadiness,
    payoutRecommendationUsd: number
  ): string[] {
    const riskFlags: string[] = [];

    if (event.verification_confidence < 0.8) {
      riskFlags.push('Proof confidence is still below institutional comfort.');
    }

    if (event.households_supported < 75) {
      riskFlags.push('Beneficiary reach is still narrow for a flagship pilot.');
    }

    if (event.funding_gap_usd > 0 && event.funding_gap_usd > payoutRecommendationUsd * 1.5) {
      riskFlags.push('Treasury commitment does not yet cover the full funding gap.');
    }

    if (releaseReadiness !== 'release') {
      riskFlags.push('Committee approval should stay gated until the next proof milestone lands.');
    }

    return riskFlags;
  }

  private buildDeploymentSummary(
    event: EnvironmentalEvent,
    sponsorName: string,
    verifierName: string,
    operatorName: string,
    payoutRecommendationUsd: number,
    releaseReadiness: ReleaseReadiness
  ): string {
    const readinessLabel = {
      hold: 'hold for more proof',
      review: 'move to committee review',
      release: 'prepare for immediate release'
    }[releaseReadiness];

    return (
      `${event.project_name} is structured as a milestone-backed payout case with ${sponsorName} ` +
      `funding, ${verifierName} providing assurance, and ${operatorName} operating locally. ` +
      `The treasury should ${readinessLabel} around ${this.formatCurrency(payoutRecommendationUsd)} ` +
      `against the current proof packet.`
    );
  }

  private formatCurrency(value: number): string {
    return `$${value.toLocaleString('en-US')}`;
  }
}
