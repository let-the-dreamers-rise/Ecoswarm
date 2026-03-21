import React, { useMemo, useState } from 'react';
import type { AgentChatResponse, CaseActionType, HederaEventRecord } from '../../types';
import type { EventMapData } from '../EventMap';
import { getApiBaseUrl } from '../../lib/runtimeConfig';
import {
  AGENT_NAMES,
  getAgentForAction,
  getLatestCaseTransactionId,
  getRecommendedAgentAction,
  getTrustScore,
  type AgentId
} from '../../lib/agentNetwork';

interface AgentNetworkPageProps {
  cases: EventMapData[];
  selectedCase: EventMapData | null;
  selectedCaseId: string | null;
  hederaRecords: HederaEventRecord[];
  activeCaseAction: Exclude<CaseActionType, 'proof_packet_locked'> | null;
  onSelectCase: (eventId: string) => void;
  onRunCaseAction: (
    eventId: string,
    actionType: Exclude<CaseActionType, 'proof_packet_locked'>
  ) => Promise<void>;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const agentTone: Record<AgentId, string> = {
  scout: 'border-cyan-300/20 bg-cyan-500/8',
  verifier: 'border-amber-300/20 bg-amber-500/8',
  treasury: 'border-emerald-300/20 bg-emerald-500/8',
  settlement: 'border-sky-300/20 bg-sky-500/8',
  reputation: 'border-fuchsia-300/20 bg-fuchsia-500/8'
};

const problemCards = [
  {
    title: 'Verification overhead is too manual',
    detail:
      'Results-based climate finance depends on proof before payout, but that usually means fragmented review packets and slow committee loops.'
  },
  {
    title: 'Small projects are expensive to underwrite',
    detail:
      'Community projects often lose on transaction costs because sponsors, verifiers, and operators coordinate across disconnected tools.'
  },
  {
    title: 'Capital moves too late',
    detail:
      'Proof may exist, but release decisions still stall when no system is continuously triaging, escalating, and settling the next eligible step.'
  },
  {
    title: 'Trust does not compound automatically',
    detail:
      'Every new project should inherit a richer reliability record for operators and verifiers instead of starting from scratch each time.'
  }
];

const agentPromptOptions = [
  'Summarize the active case.',
  'Show me the deployment blueprint.',
  'Why is this a fit for Hedera?',
  'Authorize the next release if eligible.',
  'Show me the top sponsor-ready case.'
] as const;

interface ChatEntry {
  id: string;
  role: 'user' | 'agent';
  message: string;
  command?: AgentChatResponse['command'];
  executedAction?: AgentChatResponse['executed_action'];
  agentFlow?: string[];
}

const API_BASE_URL = getApiBaseUrl();

const AgentNetworkPage: React.FC<AgentNetworkPageProps> = ({
  cases,
  selectedCase,
  selectedCaseId,
  hederaRecords,
  activeCaseAction,
  onSelectCase,
  onRunCaseAction
}) => {
  const [agentInput, setAgentInput] = useState('');
  const [isAgentBusy, setIsAgentBusy] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([
    {
      id: 'intro',
      role: 'agent',
      message:
        'I operate the current EcoSwarm case. Ask for a summary, blueprint, Hedera fit, queue ranking, or tell me to authorize the next release if the case is eligible.',
      command: 'help',
      agentFlow: [
        'A2A endpoint is mounted for machine-to-machine access.',
        'This chat is connected to the same live case state used by the client, operations, and audit workspaces.'
      ]
    }
  ]);
  const recommendation = useMemo(() => getRecommendedAgentAction(selectedCase), [selectedCase]);
  const latestTransactionId = useMemo(
    () => getLatestCaseTransactionId(hederaRecords, selectedCase),
    [hederaRecords, selectedCase]
  );
  const trustScore = useMemo(() => getTrustScore(selectedCase), [selectedCase]);

  const profile = selectedCase?.deployment_profile;
  const releasedMilestones = profile?.milestone_plan.filter((milestone) => milestone.status === 'released').length ?? 0;
  const nextMilestone =
    profile?.milestone_plan.find((milestone) => milestone.status !== 'released') ??
    profile?.milestone_plan[profile.milestone_plan.length - 1];

  const agentCards = selectedCase && profile
    ? [
        {
          id: 'scout' as const,
          name: AGENT_NAMES.scout,
          status: 'Ranking live cases',
          detail: `${selectedCase.project_name} was elevated because it combines urgency, proof confidence, and deployable payout structure.`,
          metricLabel: 'Priority signal',
          metricValue: `${(selectedCase.priority_score ?? selectedCase.impact_score).toFixed(2)}`,
          HederaLabel: 'Publishes case state for downstream agents'
        },
        {
          id: 'verifier' as const,
          name: AGENT_NAMES.verifier,
          status:
            profile.milestone_stage === 'proof_intake' || profile.milestone_stage === 'verifier_review'
              ? 'Awaiting dispatch'
              : 'Packet advanced',
          detail: `Checks ${nextMilestone?.proof_requirement ?? 'the current proof gate'} before escalating the case.`,
          metricLabel: 'Proof confidence',
          metricValue: `${Math.round((selectedCase.verification_confidence ?? 0) * 100)}%`,
          HederaLabel: 'Anchors review checkpoint events'
        },
        {
          id: 'treasury' as const,
          name: AGENT_NAMES.treasury,
          status:
            profile.release_readiness === 'release' || profile.authorized_release_usd > 0
              ? 'Release policy satisfied'
              : 'Watching committee queue',
          detail: `Applies payout guardrails to ${currencyFormatter.format(profile.payout_recommendation_usd)} of sponsor capital.`,
          metricLabel: 'Authorized capital',
          metricValue: currencyFormatter.format(profile.authorized_release_usd),
          HederaLabel: 'Writes release authorization records'
        },
        {
          id: 'settlement' as const,
          name: AGENT_NAMES.settlement,
          status:
            profile.authorized_release_usd > profile.released_capital_usd
              ? 'Ready to settle'
              : releasedMilestones > 0
                ? 'Monitoring next milestone'
                : 'Waiting for authorization',
          detail: `Releases the next eligible tranche and keeps the payout rail synchronized for the operator and sponsor.`,
          metricLabel: 'Released capital',
          metricValue: currencyFormatter.format(profile.released_capital_usd),
          HederaLabel: 'Anchors tranche release events'
        },
        {
          id: 'reputation' as const,
          name: AGENT_NAMES.reputation,
          status: 'Compounding trust',
          detail: `Turns case history, verifier confidence, and release follow-through into a reusable reliability score.`,
          metricLabel: 'Trust score',
          metricValue: `${trustScore}/100`,
          HederaLabel: 'Builds a reusable reliability layer from the audit rail'
        }
      ]
    : [];

  const agentJournal = profile
    ? [...profile.case_actions]
        .reverse()
        .map((action) => ({
          ...action,
          agentName: AGENT_NAMES[getAgentForAction(action.action_type)]
        }))
    : [];

  const runAgentPrompt = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isAgentBusy) {
      return;
    }

    const userEntry: ChatEntry = {
      id: `user-${Date.now()}`,
      role: 'user',
      message: trimmedPrompt
    };

    setChatHistory((previous) => [...previous, userEntry]);
    setAgentInput('');
    setIsAgentBusy(true);

    try {
      const response = await fetch(`${API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: trimmedPrompt,
          selected_case_id: selectedCaseId
        })
      });

      if (!response.ok) {
        throw new Error(`Agent request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as AgentChatResponse;

      if (payload.selected_case_id && payload.selected_case_id !== selectedCaseId) {
        onSelectCase(payload.selected_case_id);
      }

      const agentEntry: ChatEntry = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        message: payload.message,
        command: payload.command,
        executedAction: payload.executed_action,
        agentFlow: payload.agent_flow
      };

      setChatHistory((previous) => [...previous, agentEntry]);
    } catch (error) {
      setChatHistory((previous) => [
        ...previous,
        {
          id: `agent-error-${Date.now()}`,
          role: 'agent',
          message:
            error instanceof Error
              ? error.message
              : 'Agent request failed.'
        }
      ]);
    } finally {
      setIsAgentBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Agent network</div>
            <h1 className="mt-2 text-3xl font-semibold text-white">Semi-autonomous climate payout operations</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
              This workspace is where agents earn their place. They do not replace the sustainability product. They compress proof triage, release authorization, settlement, and trust building across the same Hedera-backed payout case.
            </p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/5 px-5 py-4 text-sm leading-6 text-slate-300">
            Same case state as Case Room, Operations, Client Portal, and Audit Trail
            <br />
            Designed for humans to observe and override agent flow
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {problemCards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Why agents belong here</div>
            <div className="mt-2 text-xl font-semibold text-white">{card.title}</div>
            <div className="mt-3 text-sm leading-6 text-slate-300">{card.detail}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#0f1518]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Focused agent case</h2>
              <p className="mt-1 text-sm text-slate-400">
                Pick one case and let the network show which agent should move next.
              </p>
            </div>
          </div>

          {selectedCase && profile ? (
            <>
              <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xl font-semibold text-white">{selectedCase.project_name}</div>
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {profile.release_readiness} readiness
                  </span>
                </div>
                <div className="mt-3 text-sm leading-6 text-slate-300">{profile.deployment_summary}</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Next proof gate</div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {nextMilestone?.label || 'Completed'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest Hedera anchor</div>
                    <div className="mt-2 text-sm font-semibold text-white break-all">
                      {latestTransactionId || 'Awaiting next write'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-white/8 bg-slate-950/60 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended next agent step</div>
                {recommendation ? (
                  <>
                    <div className="mt-2 text-2xl font-semibold text-white">{recommendation.agentName}</div>
                    <div className="mt-3 text-sm leading-6 text-slate-300">{recommendation.rationale}</div>
                    <button
                      onClick={() => onRunCaseAction(selectedCase.id, recommendation.actionType)}
                      disabled={activeCaseAction !== null}
                      className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        activeCaseAction !== null
                          ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                          : 'bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
                      }`}
                    >
                      {activeCaseAction === recommendation.actionType ? 'Dispatching...' : recommendation.buttonLabel}
                    </button>
                  </>
                ) : (
                  <div className="mt-3 text-sm leading-6 text-slate-300">
                    The agent network is now monitoring follow-through and waiting for the next case state change.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-400">
              Start the scenario feed or create a live case to activate the agent network.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white">Case switcher</h2>
              <p className="mt-1 text-sm text-slate-400">
                The network follows whichever payout case is currently being operated.
              </p>
            </div>
            <div className="space-y-3">
              {cases.slice(0, 5).map((caseEvent) => (
                <button
                  key={caseEvent.id}
                  onClick={() => onSelectCase(caseEvent.id)}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                    selectedCaseId === caseEvent.id
                      ? 'border-cyan-300/35 bg-cyan-500/10'
                      : 'border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{caseEvent.project_name}</div>
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      {(caseEvent.priority_score ?? caseEvent.impact_score).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-400">
                    {caseEvent.deployment_profile?.next_action_label || 'Queued for triage'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#10161d]/85 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="flex flex-col gap-3 border-b border-white/8 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">HOL-ready operator console</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Natural-language control over the same live case state exposed to the A2A endpoint.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                <span className="rounded-full bg-cyan-500/10 px-3 py-2 text-cyan-200">A2A</span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-emerald-200">HOL target</span>
                <span className="rounded-full bg-slate-100/5 px-3 py-2 text-slate-300">Hedera audit rail</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                <div className="uppercase tracking-[0.16em] text-slate-500">Agent card</div>
                <div className="mt-2 break-all text-slate-300">/.well-known/agent-card.json</div>
              </div>
              <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                <div className="uppercase tracking-[0.16em] text-slate-500">Chat path</div>
                <div className="mt-2 break-all text-slate-300">/agent/chat and /a2a</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {agentPromptOptions.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => runAgentPrompt(prompt)}
                  disabled={isAgentBusy}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    isAgentBusy
                      ? 'cursor-not-allowed border-white/10 bg-slate-900/60 text-slate-500'
                      : 'border-cyan-300/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3 rounded-3xl border border-white/8 bg-slate-950/60 p-4">
              {chatHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-3xl border px-4 py-4 ${
                    entry.role === 'user'
                      ? 'border-cyan-300/20 bg-cyan-500/8'
                      : 'border-white/8 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {entry.role === 'user' ? 'Operator prompt' : 'Agent response'}
                    </div>
                    {entry.command && (
                      <div className="rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                        {entry.command.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-200">{entry.message}</div>

                  {entry.executedAction && (
                    <div className="mt-4 rounded-2xl bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
                      <div>{entry.executedAction.agent_label} executed {entry.executedAction.action_type.replace(/_/g, ' ')}.</div>
                      <div className="mt-2 break-all text-slate-400">
                        Transaction: {entry.executedAction.transaction_id || 'Pending network write'}
                      </div>
                    </div>
                  )}

                  {entry.agentFlow && entry.agentFlow.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {entry.agentFlow.map((flowItem) => (
                        <div key={flowItem} className="rounded-2xl bg-slate-950/60 px-4 py-3 text-xs leading-5 text-slate-400">
                          {flowItem}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isAgentBusy && (
                <div className="rounded-3xl border border-cyan-300/15 bg-cyan-500/8 px-4 py-3 text-sm text-cyan-100">
                  Agent is reasoning over the current case state.
                </div>
              )}
            </div>

            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                runAgentPrompt(agentInput);
              }}
            >
              <textarea
                value={agentInput}
                onChange={(event) => setAgentInput(event.target.value)}
                placeholder="Ask for a summary, switch cases, explain Hedera fit, or authorize the next release."
                className="min-h-[110px] rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-300/30"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Actions sent here use the same case actions and Hedera event flow as the rest of the product.
                </div>
                <button
                  type="submit"
                  disabled={isAgentBusy || agentInput.trim().length === 0}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isAgentBusy || agentInput.trim().length === 0
                      ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
                  }`}
                >
                  {isAgentBusy ? 'Running agent...' : 'Send to agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {agentCards.map((agent) => (
          <div key={agent.id} className={`rounded-3xl border p-5 ${agentTone[agent.id]}`}>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Agent</div>
            <div className="mt-2 text-xl font-semibold text-white">{agent.name}</div>
            <div className="mt-3 text-sm font-medium text-cyan-100">{agent.status}</div>
            <div className="mt-3 text-sm leading-6 text-slate-300">{agent.detail}</div>
            <div className="mt-4 rounded-2xl bg-slate-950/55 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{agent.metricLabel}</div>
              <div className="mt-2 text-lg font-semibold text-white">{agent.metricValue}</div>
            </div>
            <div className="mt-4 text-xs leading-5 text-slate-400">{agent.HederaLabel}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Agent operating sequence</h2>
            <p className="mt-1 text-sm text-slate-400">
              This is the workflow we want judges to remember: agent triage, verified release, and visible settlement.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              ['1', AGENT_NAMES.scout, 'Rank the case and expose a clean sponsor-ready packet.'],
              ['2', AGENT_NAMES.verifier, 'Check proof completeness and push the case into review.'],
              ['3', AGENT_NAMES.treasury, 'Apply payout guardrails and authorize only the next eligible amount.'],
              ['4', AGENT_NAMES.settlement, 'Release the tranche and anchor the state change to Hedera.'],
              ['5', AGENT_NAMES.reputation, 'Update operator and verifier reliability for future cases.']
            ].map(([step, label, detail]) => (
              <div key={step} className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-100">
                    {step}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{label}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-300">{detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#101319]/85 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Agent journal</h2>
            <p className="mt-1 text-sm text-slate-400">
              Every case action is attached to an agent role and remains visible to clients, operators, and auditors.
            </p>
          </div>
          <div className="space-y-3">
            {agentJournal.length > 0 ? (
              agentJournal.map((entry) => (
                <div key={`${entry.action_type}-${entry.timestamp}`} className="rounded-3xl border border-white/8 bg-white/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{entry.agentName}</div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{entry.note}</div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-400">
                    <div>Actor of record: {entry.actor_label}</div>
                    <div>Action: {entry.action_type.replace(/_/g, ' ')}</div>
                    <div className="break-all">Transaction: {entry.transaction_id || 'Pending network write'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-400">
                Agent journal entries will appear once the case starts moving.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AgentNetworkPage;
