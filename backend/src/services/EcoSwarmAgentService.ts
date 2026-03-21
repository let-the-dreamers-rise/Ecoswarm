import type { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';
import type { CaseActionType, MetricsResponse } from '../types/index.js';

export type SupportedAgentAction = Exclude<CaseActionType, 'proof_packet_locked'>;

export interface AgentChatRequest {
  message: string;
  selected_case_id?: string | null;
}

export interface AgentActionExecution {
  action_type: SupportedAgentAction;
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

interface EcoSwarmAgentServiceOptions {
  getCases: () => EnvironmentalEvent[];
  getMetrics: () => MetricsResponse;
  runCaseAction: (
    eventId: string,
    actionType: SupportedAgentAction
  ) => Promise<{ transaction_id?: string }>;
}

const AGENT_FOR_ACTION: Record<SupportedAgentAction, string> = {
  verifier_review_requested: 'Verifier Agent',
  sponsor_release_authorized: 'Treasury Agent',
  tranche_released: 'Settlement Agent'
};

const DEFAULT_PROMPTS = [
  'Summarize the active case.',
  'Why is this a fit for Hedera?',
  'Show me the deployment blueprint.',
  'Authorize the next release if eligible.'
];

export class EcoSwarmAgentService {
  constructor(private readonly options: EcoSwarmAgentServiceOptions) {}

  async handleChat(request: AgentChatRequest): Promise<AgentChatResponse> {
    const cases = [...this.options.getCases()].sort((left, right) => {
      const leftScore = left.impact_score ?? 0;
      const rightScore = right.impact_score ?? 0;
      return rightScore - leftScore;
    });
    const normalizedMessage = request.message.trim().toLowerCase();
    const targetCase = this.resolveCase(cases, request.selected_case_id ?? null, normalizedMessage);
    const metrics = this.options.getMetrics();

    if (!targetCase || !targetCase.deployment_profile) {
      return {
        message: 'No payout case is available yet. Start the simulation or create a live project case first.',
        command: 'help',
        agent_flow: [
          'Scout Agent is waiting for the first community climate case.',
          'Verifier, Treasury, and Settlement Agents stay idle until a proof-backed case exists.'
        ],
        suggested_prompts: DEFAULT_PROMPTS
      };
    }

    const matchedCaseSwitch = this.resolveCaseSwitch(cases, normalizedMessage);
    if (matchedCaseSwitch && matchedCaseSwitch.id !== targetCase.id) {
      return {
        message:
          `Switched focus to ${matchedCaseSwitch.project_name}. ` +
          this.buildCaseSummary(matchedCaseSwitch),
        command: 'case_switch',
        selected_case_id: matchedCaseSwitch.id,
        agent_flow: this.buildAgentFlow(matchedCaseSwitch),
        suggested_prompts: DEFAULT_PROMPTS
      };
    }

    const requestedAction = this.detectAction(normalizedMessage);
    if (requestedAction) {
      const eligibility = this.getActionEligibility(targetCase, requestedAction);

      if (!eligibility.eligible) {
        return {
          message:
            `${AGENT_FOR_ACTION[requestedAction]} cannot run that step yet. ` +
            `${eligibility.reason} Current next step: ${targetCase.deployment_profile.next_action_label}.`,
          command: 'case_action',
          selected_case_id: targetCase.id,
          agent_flow: this.buildAgentFlow(targetCase),
          suggested_prompts: DEFAULT_PROMPTS
        };
      }

      const execution = await this.options.runCaseAction(targetCase.id, requestedAction);

      return {
        message:
          `${AGENT_FOR_ACTION[requestedAction]} completed ${requestedAction.replace(/_/g, ' ')} ` +
          `for ${targetCase.project_name}. ` +
          (execution.transaction_id
            ? `Hedera transaction: ${execution.transaction_id}.`
            : 'The action completed without a transaction ID.'),
        command: 'case_action',
        selected_case_id: targetCase.id,
        executed_action: {
          action_type: requestedAction,
          agent_label: AGENT_FOR_ACTION[requestedAction],
          transaction_id: execution.transaction_id
        },
        agent_flow: this.buildAgentFlow(targetCase),
        suggested_prompts: DEFAULT_PROMPTS
      };
    }

    if (this.matchesBlueprintIntent(normalizedMessage)) {
      return {
        message: this.buildBlueprintSummary(targetCase),
        command: 'deployment_blueprint',
        selected_case_id: targetCase.id,
        agent_flow: this.buildAgentFlow(targetCase),
        suggested_prompts: DEFAULT_PROMPTS
      };
    }

    if (this.matchesHederaIntent(normalizedMessage)) {
      return {
        message:
          `${targetCase.project_name} is a Hedera-native fit because it needs many low-cost proof, approval, and payout checkpoints. ` +
          `${targetCase.deployment_profile.why_hedera_now} ` +
          `Projected per-program usage is ${targetCase.deployment_profile.projected_new_accounts_per_program} new accounts and ` +
          `${targetCase.deployment_profile.projected_transactions_per_program} recurring transactions.`,
        command: 'hedera_fit',
        selected_case_id: targetCase.id,
        agent_flow: this.buildAgentFlow(targetCase),
        suggested_prompts: DEFAULT_PROMPTS
      };
    }

    if (this.matchesQueueIntent(normalizedMessage)) {
      const topCases = cases
        .slice(0, 3)
        .map((event, index) => {
          const profile = event.deployment_profile;
          return `${index + 1}. ${event.project_name} (${profile?.release_readiness ?? 'hold'} readiness, $${
            profile?.payout_recommendation_usd?.toLocaleString('en-US') ?? 0
          } payout, ${event.households_supported} households)`;
        })
        .join(' ');

      return {
        message:
          `Top sponsor-ready cases right now: ${topCases}. ` +
          `Release-ready capital across the platform is $${(metrics.capital_ready_to_release_usd ?? 0).toLocaleString('en-US')}.`,
        command: 'case_queue',
        selected_case_id: targetCase.id,
        agent_flow: this.buildAgentFlow(targetCase),
        suggested_prompts: DEFAULT_PROMPTS
      };
    }

    return {
      message: this.buildCaseSummary(targetCase),
      command: 'case_summary',
      selected_case_id: targetCase.id,
      agent_flow: this.buildAgentFlow(targetCase),
      suggested_prompts: DEFAULT_PROMPTS
    };
  }

  private resolveCase(
    cases: EnvironmentalEvent[],
    selectedCaseId: string | null,
    normalizedMessage: string
  ): EnvironmentalEvent | null {
    if (selectedCaseId) {
      const selected = cases.find((event) => event.id === selectedCaseId);
      if (selected) {
        return selected;
      }
    }

    const matched = this.resolveCaseSwitch(cases, normalizedMessage);
    if (matched) {
      return matched;
    }

    return cases[0] ?? null;
  }

  private resolveCaseSwitch(cases: EnvironmentalEvent[], normalizedMessage: string): EnvironmentalEvent | null {
    const messageTokens = normalizedMessage
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4);

    let bestMatch: EnvironmentalEvent | null = null;
    let bestScore = 0;

    for (const event of cases) {
      const haystack = [
        event.project_name,
        event.community_name,
        event.region,
        event.country,
        event.event_type
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      for (const token of messageTokens) {
        if (haystack.includes(token)) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = event;
      }
    }

    return bestScore > 0 ? bestMatch : null;
  }

  private detectAction(message: string): SupportedAgentAction | null {
    if (/\b(verifier|review|committee)\b/.test(message)) {
      return 'verifier_review_requested';
    }

    if (/\b(authorize|authorise|approve|approval|sponsor)\b/.test(message)) {
      return 'sponsor_release_authorized';
    }

    if (/\b(release|disburse|settle|payout|pay)\b/.test(message)) {
      return 'tranche_released';
    }

    return null;
  }

  private matchesQueueIntent(message: string): boolean {
    return /\b(queue|opportunit|top case|top project|list case|show case|show queue)\b/.test(message);
  }

  private matchesBlueprintIntent(message: string): boolean {
    return /\b(blueprint|usp|buyer|pricing|revenue|deploy|rollout|pilot|incubator|market)\b/.test(message);
  }

  private matchesHederaIntent(message: string): boolean {
    return /\b(hedera|hcs|hts|why does this need web3|why web3|network usage)\b/.test(message);
  }

  private getActionEligibility(
    event: EnvironmentalEvent,
    actionType: SupportedAgentAction
  ): { eligible: boolean; reason: string } {
    const profile = event.deployment_profile!;

    if (actionType === 'verifier_review_requested') {
      const eligible = profile.milestone_stage !== 'committee_review' && profile.milestone_stage !== 'release_ready';
      return {
        eligible,
        reason: eligible
          ? 'The proof packet can advance.'
          : 'The case has already moved beyond verifier dispatch.'
      };
    }

    if (actionType === 'sponsor_release_authorized') {
      const eligible = profile.milestone_stage === 'committee_review' || profile.release_readiness === 'release';
      return {
        eligible,
        reason: eligible
          ? 'The committee stage is satisfied.'
          : 'The case still needs verifier-led review before sponsor authorization.'
      };
    }

    const eligible = profile.milestone_plan.some((milestone) => milestone.status === 'ready');
    return {
      eligible,
      reason: eligible
        ? 'A tranche is ready to settle.'
        : 'No milestone is marked ready for settlement yet.'
    };
  }

  private buildCaseSummary(event: EnvironmentalEvent): string {
    const profile = event.deployment_profile!;
    return (
      `${event.project_name} is a ${profile.launch_wedge} case in ${event.region}, ${event.country}. ` +
      `It is currently ${profile.release_readiness} readiness with a recommended payout of ` +
      `$${profile.payout_recommendation_usd.toLocaleString('en-US')}. ` +
      `Next step: ${profile.next_action_label}. Sponsor: ${profile.sponsor_name}. ` +
      `Verifier: ${profile.verifier_name}. Operator: ${profile.local_operator_name}.`
    );
  }

  private buildBlueprintSummary(event: EnvironmentalEvent): string {
    const profile = event.deployment_profile!;
    const firstStep = profile.deployment_plan[0];

    return (
      `${profile.usp_statement} ` +
      `Initial buyer: ${profile.buyer_persona}. ` +
      `Commercial model: ${profile.commercial_model}. Pricing: ${profile.pricing_model}. ` +
      `Pilot region: ${profile.pilot_region}. First rollout step: ${firstStep?.label ?? 'Pilot design'} (${firstStep?.timeline ?? 'Weeks 1-2'}). ` +
      `Target pilot contract value is $${profile.target_contract_value_usd.toLocaleString('en-US')}.`
    );
  }

  private buildAgentFlow(event: EnvironmentalEvent): string[] {
    const profile = event.deployment_profile!;
    return [
      `Scout Agent ranked ${event.project_name} at ${event.impact_score?.toFixed(1) ?? '0.0'} impact score.`,
      `Verifier Agent watches the next proof gate: ${profile.milestone_plan.find((milestone) => milestone.status !== 'released')?.label ?? 'Completed'}.`,
      `Treasury Agent tracks ${profile.release_readiness} readiness and $${profile.authorized_release_usd.toLocaleString('en-US')} authorized capital.`,
      `Settlement Agent tracks $${profile.released_capital_usd.toLocaleString('en-US')} already released on Hedera.`
    ];
  }
}
