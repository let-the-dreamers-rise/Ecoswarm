import React, { useMemo } from 'react';
import type { CaseActionType, HederaEventRecord, MetricsResponse } from '../../types';
import type { EventMapData } from '../EventMap';

interface ClientPortalPageProps {
  events: EventMapData[];
  selectedCase: EventMapData | null;
  selectedCaseId: string | null;
  onSelectCase: (eventId: string) => void;
  metrics: MetricsResponse | null;
  hederaRecords: HederaEventRecord[];
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

const formatRelativeTime = (timestamp?: string) => {
  if (!timestamp) {
    return 'Awaiting sync';
  }

  const deltaMinutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (deltaMinutes < 1) {
    return 'Just now';
  }
  if (deltaMinutes < 60) {
    return `${deltaMinutes} min ago`;
  }
  return `${Math.round(deltaMinutes / 60)} hr ago`;
};

const ClientPortalPage: React.FC<ClientPortalPageProps> = ({
  events,
  selectedCase,
  selectedCaseId,
  onSelectCase,
  metrics,
  hederaRecords,
  activeCaseAction,
  onRunCaseAction
}) => {
  const commitments = useMemo(() => {
    return [...events]
      .filter((event) => event.deployment_profile)
      .sort((left, right) => (right.priority_score ?? right.impact_score) - (left.priority_score ?? left.impact_score))
      .slice(0, 4)
      .map((event) => {
        const profile = event.deployment_profile!;
        const syncRecord = hederaRecords.find((record) => record.project_name === event.project_name);

        return {
          id: event.id,
          projectName: event.project_name || 'Climate project',
          sponsor: profile.sponsor_name,
          verifier: profile.verifier_name,
          operator: profile.local_operator_name,
          releaseReadiness: profile.release_readiness,
          payout: profile.payout_recommendation_usd,
          upfrontRelease: profile.upfront_release_usd,
          nextMilestone: profile.milestone_plan[0],
          syncTimestamp: syncRecord?.timestamp
        };
      });
  }, [events, hederaRecords]);

  const alerts = useMemo(() => {
    return commitments.map((commitment) => ({
      id: commitment.id,
      title:
        commitment.releaseReadiness === 'release'
          ? 'Approval window open'
          : commitment.releaseReadiness === 'review'
            ? 'Verifier packet ready for committee review'
            : 'More proof required before sponsor release',
      detail: `${commitment.projectName} is synchronized with ${commitment.verifier} and ${commitment.operator}.`,
      tone:
        commitment.releaseReadiness === 'release'
          ? 'border-emerald-400/20 bg-emerald-500/5 text-emerald-200'
          : commitment.releaseReadiness === 'review'
            ? 'border-amber-400/20 bg-amber-500/5 text-amber-200'
            : 'border-rose-400/20 bg-rose-500/5 text-rose-200'
    }));
  }, [commitments]);

  const clientStats = [
    {
      label: 'Tracked commitments',
      value: String(commitments.length)
    },
    {
      label: 'Release-ready capital',
      value: currencyFormatter.format(metrics?.capital_ready_to_release_usd ?? 0)
    },
    {
      label: 'Active sponsors',
      value: String(metrics?.active_sponsors?.length ?? 0)
    },
    {
      label: 'Active verifiers',
      value: String(metrics?.active_verifiers?.length ?? 0)
    }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Client portal</div>
            <h1 className="mt-2 text-3xl font-semibold text-white">Sponsor and client synchronization</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              This portal is for funders and enterprise clients. It shows synced commitments, release alerts, and the next milestone each project must satisfy before capital moves.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm text-slate-300">
            Shared state with operator workspace<br />
            Hedera-backed release confirmations
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {clientStats.map((card) => (
          <div key={card.label} className="rounded-3xl border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#0f1518]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Currently synchronized case</h2>
            <p className="mt-1 text-sm text-slate-400">
              This is the exact case the operator workspace is currently focused on.
            </p>
          </div>

          {selectedCase?.deployment_profile ? (
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xl font-semibold text-white">{selectedCase.project_name}</div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  {selectedCase.deployment_profile.release_readiness} readiness
                </span>
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                {selectedCase.deployment_profile.deployment_summary}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Next release</div>
                  <div className="mt-2 text-xl font-semibold text-emerald-300">
                    {currencyFormatter.format(selectedCase.deployment_profile.upfront_release_usd)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Verifier</div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {selectedCase.deployment_profile.verifier_name}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Authorized</div>
                  <div className="mt-2 text-xl font-semibold text-cyan-200">
                    {currencyFormatter.format(selectedCase.deployment_profile.authorized_release_usd)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Released</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {currencyFormatter.format(selectedCase.deployment_profile.released_capital_usd)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => onRunCaseAction(selectedCase.id, 'sponsor_release_authorized')}
                  disabled={activeCaseAction !== null}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    activeCaseAction !== null
                      ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
                  }`}
                >
                  {activeCaseAction === 'sponsor_release_authorized' ? 'Running...' : 'Authorize Release'}
                </button>
                <button
                  onClick={() => onRunCaseAction(selectedCase.id, 'tranche_released')}
                  disabled={activeCaseAction !== null}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    activeCaseAction !== null
                      ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
                  }`}
                >
                  {activeCaseAction === 'tranche_released' ? 'Running...' : 'Release Capital'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-400">
              The synchronized case will appear here once a live payout case is available.
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Client case switcher</h2>
            <p className="mt-1 text-sm text-slate-400">
              Clients can move between active commitments without losing synchronization.
            </p>
          </div>
          <div className="space-y-3">
            {commitments.map((commitment) => (
              <button
                key={commitment.id}
                onClick={() => onSelectCase(commitment.id)}
                className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                  selectedCaseId === commitment.id
                    ? 'border-cyan-300/35 bg-cyan-500/10'
                    : 'border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{commitment.projectName}</div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {commitment.releaseReadiness}
                  </span>
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-400">
                  Sponsor: {commitment.sponsor}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#0f1518]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Client alerts</h2>
            <p className="mt-1 text-sm text-slate-400">
              Alerts stay aligned with the operator workspace so clients do not need separate status calls to know what is release-ready.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className={`rounded-3xl border p-5 ${alert.tone}`}>
                <div className="text-xs uppercase tracking-[0.18em] opacity-80">Live alert</div>
                <div className="mt-2 text-xl font-semibold text-white">{alert.title}</div>
                <div className="mt-3 text-sm leading-6 text-slate-200">{alert.detail}</div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-400 xl:col-span-3">
              No client alerts yet. Start the simulation to populate synced release cases.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div>
          <h2 className="text-2xl font-semibold text-white">Synchronized commitments</h2>
          <p className="mt-1 text-sm text-slate-400">
            Each commitment below reflects the same underlying proof and release state seen by the field team.
          </p>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {commitments.map((commitment) => (
            <div
              key={commitment.id}
              className={`rounded-3xl border p-5 ${
                selectedCaseId === commitment.id
                  ? 'border-cyan-300/35 bg-cyan-500/10'
                  : 'border-white/8 bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Commitment</div>
                  <div className="mt-2 text-xl font-semibold text-white">{commitment.projectName}</div>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  {commitment.releaseReadiness}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Total payout</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {currencyFormatter.format(commitment.payout)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/55 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Next release</div>
                  <div className="mt-2 text-xl font-semibold text-emerald-300">
                    {currencyFormatter.format(commitment.upfrontRelease)}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div>Sponsor: {commitment.sponsor}</div>
                <div>Verifier: {commitment.verifier}</div>
                <div>Operator: {commitment.operator}</div>
                <div>Last sync: {formatRelativeTime(commitment.syncTimestamp)}</div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Next milestone</div>
                <div className="mt-2 text-sm font-semibold text-white">{commitment.nextMilestone?.label}</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  {commitment.nextMilestone?.proof_requirement}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ClientPortalPage;
