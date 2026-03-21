import React from 'react';
import EventStream from '../EventStream';
import type { CaseActionType, HederaEventRecord, ReleaseReadiness } from '../../types';
import type { EventMapData } from '../EventMap';

interface SharedCaseRoomPageProps {
  cases: EventMapData[];
  selectedCase: EventMapData | null;
  hederaRecords: HederaEventRecord[];
  onSelectCase: (eventId: string) => void;
  activeCaseAction: Exclude<CaseActionType, 'proof_packet_locked'> | null;
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

const readinessTone: Record<ReleaseReadiness, string> = {
  hold: 'bg-rose-500/10 text-rose-200',
  review: 'bg-amber-500/10 text-amber-200',
  release: 'bg-emerald-500/10 text-emerald-200'
};

const milestoneTone = {
  pending: 'border-white/8 bg-white/5 text-slate-200',
  ready: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  released: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100'
} as const;

const formatReadiness = (value?: ReleaseReadiness) => {
  if (!value) {
    return 'Hold';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatActionLabel = (actionType: string) =>
  actionType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const SharedCaseRoomPage: React.FC<SharedCaseRoomPageProps> = ({
  cases,
  selectedCase,
  hederaRecords,
  onSelectCase,
  activeCaseAction,
  onRunCaseAction
}) => {
  const profile = selectedCase?.deployment_profile ?? null;
  const latestRecord = hederaRecords[0];
  const activeMilestone =
    profile?.milestone_plan.find((milestone) => milestone.status !== 'released') ??
    profile?.milestone_plan[0];

  if (!selectedCase || !profile) {
    return (
      <section className="rounded-[30px] border border-white/10 bg-slate-950/70 p-8 text-sm leading-7 text-slate-300 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        Start the scenario feed to populate the shared case room with sponsor-ready climate projects.
      </section>
    );
  }

  const availableActions: Array<{
    action: Exclude<CaseActionType, 'proof_packet_locked'>;
    label: string;
    disabled: boolean;
  }> = [
    {
      action: 'verifier_review_requested',
      label: 'Request Verifier Review',
      disabled: profile.milestone_stage === 'committee_review' || profile.milestone_stage === 'release_ready'
    },
    {
      action: 'sponsor_release_authorized',
      label: 'Authorize Sponsor Release',
      disabled: profile.milestone_stage !== 'committee_review' && profile.release_readiness !== 'release'
    },
    {
      action: 'tranche_released',
      label: 'Release Tranche',
      disabled: !profile.milestone_plan.some((milestone) => milestone.status === 'ready')
    }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Shared case room</div>
            <h1 className="mt-2 text-3xl font-semibold text-white">{selectedCase.project_name}</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
              One synchronized workspace for the operator, verifier, and sponsor. Everyone sees the same release state, proof packet, and Hedera-backed audit line.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-3 py-2 font-semibold ${readinessTone[profile.release_readiness]}`}>
              {formatReadiness(profile.release_readiness)} readiness
            </span>
            <span className="rounded-full bg-cyan-500/10 px-3 py-2 font-semibold text-cyan-200">
              {selectedCase.location_label}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {cases.slice(0, 5).map((event) => (
            <button
              key={event.id}
              onClick={() => onSelectCase(event.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                selectedCase.id === event.id
                  ? 'border-cyan-300/35 bg-cyan-500/10'
                  : 'border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/10'
              }`}
            >
              <div className="text-sm font-semibold text-white">{event.project_name}</div>
              <div className="mt-1 text-xs text-slate-400">
                {event.deployment_profile?.release_readiness || 'hold'} readiness
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#0f1518]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Release packet</h2>
            <p className="mt-1 text-sm text-slate-400">
              The core deployment memo that a sponsor or incubator partner can evaluate quickly.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended payout</div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {currencyFormatter.format(profile.payout_recommendation_usd)}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Immediate release</div>
              <div className="mt-3 text-3xl font-semibold text-emerald-300">
                {currencyFormatter.format(profile.upfront_release_usd)}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Authorized capital</div>
              <div className="mt-3 text-3xl font-semibold text-cyan-200">
                {currencyFormatter.format(profile.authorized_release_usd)}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Released capital</div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {currencyFormatter.format(profile.released_capital_usd)}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Funding gap</div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {currencyFormatter.format(selectedCase.funding_gap_usd ?? 0)}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Case actions</div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {profile.case_actions.length}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Deployment summary</div>
            <p className="mt-3 text-sm leading-7 text-slate-200">{profile.deployment_summary}</p>
          </div>

          <div className="mt-5 rounded-3xl border border-white/8 bg-slate-950/60 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Primary next action</div>
            <div className="mt-2 text-lg font-semibold text-white">{profile.next_action_label}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {availableActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => onRunCaseAction(selectedCase.id, action.action)}
                  disabled={action.disabled || activeCaseAction !== null}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    action.disabled || activeCaseAction !== null
                      ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
                  }`}
                >
                  {activeCaseAction === action.action ? 'Running...' : action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-slate-950/55 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Launch wedge</div>
              <div className="mt-3 text-lg font-semibold text-white">{profile.launch_wedge}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{profile.buyer_signal}</div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/55 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Contract structure</div>
              <div className="mt-3 text-lg font-semibold text-white">{profile.contract_model}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{profile.policy_guardrail}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white">Synchronized counterparties</h2>
              <p className="mt-1 text-sm text-slate-400">
                Each role is bound to the same proof packet and release plan.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                ['Sponsor', profile.sponsor_name, profile.sponsor_type],
                ['Verifier', profile.verifier_name, profile.verifier_type],
                ['Operator', profile.local_operator_name, profile.operator_model]
              ].map(([label, name, detail]) => (
                <div key={label} className="rounded-3xl border border-white/8 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{name}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{detail}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#101319]/85 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white">Shared sync state</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest anchor</div>
                <div className="mt-3 text-lg font-semibold text-white">
                  {latestRecord?.stage_label || 'Awaiting Hedera record'}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  {latestRecord?.summary || 'The next proof checkpoint will appear here once the flow advances.'}
                </div>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Next required proof</div>
                <div className="mt-3 text-lg font-semibold text-white">
                  {activeMilestone?.label || 'Proof intake'}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  {activeMilestone?.proof_requirement || 'Awaiting the first proof packet.'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-white">Milestone workflow</h2>
          <p className="mt-1 text-sm text-slate-400">
            Release gating is explicit. No capital moves until the required proof object is present.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {profile.milestone_plan.map((milestone) => (
            <div
              key={`${selectedCase.id}-${milestone.label}`}
              className={`rounded-3xl border p-5 ${milestoneTone[milestone.status]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-lg font-semibold">{milestone.label}</div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">
                  {milestone.status}
                </div>
              </div>
              <div className="mt-4 text-sm leading-6 text-slate-200">
                {milestone.proof_requirement}
              </div>
              <div className="mt-3 text-xs leading-6 text-slate-400">
                Target outcome: {milestone.target_outcome}
              </div>
              <div className="mt-4 text-sm font-semibold text-white">
                {milestone.release_percent}% / {currencyFormatter.format(milestone.release_usd)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Risk flags</h2>
            <p className="mt-1 text-sm text-slate-400">
              These are the blockers to deployment readiness.
            </p>
          </div>
          <div className="space-y-3">
            {profile.risk_flags.length > 0 ? (
              profile.risk_flags.map((flag) => (
                <div key={flag} className="rounded-3xl border border-rose-400/15 bg-rose-500/5 p-4 text-sm leading-6 text-rose-100">
                  {flag}
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-emerald-400/15 bg-emerald-500/5 p-4 text-sm leading-6 text-emerald-100">
                No blocking risks are currently open on this payout case.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#09141a]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Hedera audit line</h2>
            <p className="mt-1 text-sm text-slate-400">
              The filtered record for this case only.
            </p>
          </div>
          <EventStream events={hederaRecords} />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-white">Case action log</h2>
          <p className="mt-1 text-sm text-slate-400">
            Repeated sponsor, verifier, and operator actions create the recurring workflow judges want to believe in.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {profile.case_actions.slice().reverse().map((action) => (
            <div key={`${action.action_type}-${action.timestamp}`} className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-white">{formatActionLabel(action.action_type)}</div>
                <div className="text-xs text-slate-400">{new Date(action.timestamp).toLocaleTimeString()}</div>
              </div>
              <div className="mt-2 text-sm font-medium text-cyan-200">{action.actor_label}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{action.note}</div>
              {action.transaction_id && (
                <div className="mt-3 text-xs text-slate-400">TX: {action.transaction_id}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SharedCaseRoomPage;
