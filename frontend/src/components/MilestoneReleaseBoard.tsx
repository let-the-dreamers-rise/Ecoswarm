import React, { useMemo } from 'react';
import type { EventMapData } from './EventMap';
import type { ReleaseReadiness } from '../types';

interface MilestoneReleaseBoardProps {
  events: EventMapData[];
  selectedCaseId?: string | null;
  onSelectCase?: (eventId: string) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const readinessRank: Record<ReleaseReadiness, number> = {
  hold: 0,
  review: 1,
  release: 2
};

const readinessTone: Record<ReleaseReadiness, string> = {
  hold: 'bg-rose-500/10 text-rose-200',
  review: 'bg-amber-500/10 text-amber-200',
  release: 'bg-emerald-500/10 text-emerald-200'
};

const formatReadiness = (value?: ReleaseReadiness) => {
  if (!value) {
    return 'Hold';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const MilestoneReleaseBoard: React.FC<MilestoneReleaseBoardProps> = ({
  events,
  selectedCaseId,
  onSelectCase
}) => {
  const cases = useMemo(() => {
    return [...events]
      .filter((event) => event.deployment_profile)
      .sort((left, right) => {
        const leftReadiness = readinessRank[left.deployment_profile?.release_readiness ?? 'hold'];
        const rightReadiness = readinessRank[right.deployment_profile?.release_readiness ?? 'hold'];

        if (leftReadiness !== rightReadiness) {
          return rightReadiness - leftReadiness;
        }

        return (right.priority_score ?? right.impact_score) - (left.priority_score ?? left.impact_score);
      })
      .slice(0, 3);
  }, [events]);

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0e1518]/80 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/30">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Milestone Release Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            This is the treasury committee view: which climate projects are closest to release, how much capital unlocks now, and what proof still gates the next milestone.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
          Deployable payout cases
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-400">
          Start the simulation to generate release-ready payout cases with milestone gates and treasury sizing.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {cases.map((item) => {
            const profile = item.deployment_profile!;
            return (
            <div
              key={item.id}
              className={`rounded-3xl border p-5 ${
                selectedCaseId === item.id
                  ? 'border-cyan-300/35 bg-cyan-500/10'
                  : 'border-white/8 bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Lead case</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {item.project_name || 'Treasury case'}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-300">
                      {profile.launch_wedge}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      readinessTone[profile.release_readiness]
                    }`}
                  >
                    {formatReadiness(profile.release_readiness)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Recommended payout</div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {currencyFormatter.format(profile.payout_recommendation_usd)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Upfront release</div>
                    <div className="mt-2 text-xl font-semibold text-emerald-300">
                      {currencyFormatter.format(profile.upfront_release_usd)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">
                    Sponsor: {profile.sponsor_name}
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">
                    Verifier: {profile.verifier_name}
                  </span>
                  <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-200">
                    Operator: {profile.local_operator_name}
                  </span>
                </div>

                {onSelectCase && (
                  <button
                    onClick={() => onSelectCase(item.id)}
                    className="mt-4 inline-flex rounded-full border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
                  >
                    {selectedCaseId === item.id ? 'Focused Case' : 'Focus Case'}
                  </button>
                )}

                <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Release memo</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{profile.deployment_summary}</p>
                </div>

                <div className="mt-4 space-y-3">
                  {profile.milestone_plan.map((milestone) => (
                    <div key={`${item.id}-${milestone.label}`} className="rounded-2xl bg-slate-950/55 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-100">{milestone.label}</div>
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          {milestone.release_percent}% / {currencyFormatter.format(milestone.release_usd)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs leading-6 text-slate-400">
                        {milestone.proof_requirement}
                      </div>
                      <div className="mt-1 text-xs leading-6 text-slate-500">
                        Target: {milestone.target_outcome}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MilestoneReleaseBoard;
