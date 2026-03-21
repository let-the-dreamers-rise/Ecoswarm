import React from 'react';
import type { MetricsResponse } from '../../types';
import type { EventMapData } from '../EventMap';

interface DeploymentBlueprintPageProps {
  cases: EventMapData[];
  selectedCase: EventMapData | null;
  selectedCaseId: string | null;
  metrics: MetricsResponse | null;
  onSelectCase: (eventId: string) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const DeploymentBlueprintPage: React.FC<DeploymentBlueprintPageProps> = ({
  cases,
  selectedCase,
  selectedCaseId,
  metrics,
  onSelectCase
}) => {
  const profile = selectedCase?.deployment_profile;

  if (!selectedCase || !profile) {
    return (
      <section className="rounded-[30px] border border-white/10 bg-slate-950/70 p-8 text-sm leading-7 text-slate-300 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        Start the scenario feed to populate the deployment blueprint with a live sponsor-ready program.
      </section>
    );
  }

  const blueprintMetrics = [
    {
      label: 'Pilot contract value',
      value: currencyFormatter.format(profile.target_contract_value_usd)
    },
    {
      label: 'Projected new accounts',
      value: String(profile.projected_new_accounts_per_program)
    },
    {
      label: 'Projected transactions',
      value: String(profile.projected_transactions_per_program)
    },
    {
      label: 'Live release-ready capital',
      value: currencyFormatter.format(metrics?.capital_ready_to_release_usd ?? 0)
    }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Deployment blueprint</div>
            <h1 className="mt-2 text-3xl font-semibold text-white">Why this should exist beyond the hackathon</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
              This workspace turns the selected case into an incubator-grade operating thesis: clear wedge, real buyer, deployment path, repeatable Hedera usage, and a revenue model that can survive outside demo mode.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/8 px-5 py-4 text-sm leading-6 text-emerald-100">
            USP: {profile.usp_statement}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {blueprintMetrics.map((card) => (
          <div key={card.label} className="rounded-3xl border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#0f1518]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Market wedge</h2>
            <p className="mt-1 text-sm text-slate-400">
              A narrow wedge is what makes this incubator-credible.
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Launch wedge</div>
              <div className="mt-2 text-xl font-semibold text-white">{profile.launch_wedge}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{profile.market_need_signal}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Buyer</div>
                <div className="mt-2 text-lg font-semibold text-white">{profile.buyer_persona}</div>
                <div className="mt-3 text-sm leading-6 text-slate-300">{profile.buyer_signal}</div>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Pilot region</div>
                <div className="mt-2 text-lg font-semibold text-white">{profile.pilot_region}</div>
                <div className="mt-3 text-sm leading-6 text-slate-300">{profile.expansion_path}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Case switcher</h2>
            <p className="mt-1 text-sm text-slate-400">
              The blueprint follows the same live case used elsewhere in the product.
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
                    {caseEvent.deployment_profile?.release_readiness || 'hold'}
                  </span>
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-400">
                  {caseEvent.deployment_profile?.usp_statement || 'Deployment blueprint pending'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Commercial model</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Revenue structure</div>
              <div className="mt-2 text-xl font-semibold text-white">{profile.commercial_model}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{profile.pricing_model}</div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Beneficiary metric</div>
              <div className="mt-2 text-xl font-semibold text-white">{profile.beneficiary_metric}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{profile.contract_model}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#101319]/85 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Why Hedera is core</h2>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Hedera moat</div>
            <div className="mt-3 text-sm leading-7 text-slate-200">{profile.why_hedera_now}</div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Projected new accounts</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {profile.projected_new_accounts_per_program}
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                Sponsor, verifier, operator, and community-side activity creates repeatable account growth.
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Projected transactions</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {profile.projected_transactions_per_program}
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                Proof updates, approvals, receipts, and payout events create repeat network activity instead of one-off writes.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">90-day pilot plan</h2>
            <p className="mt-1 text-sm text-slate-400">
              This is the shortest credible path from demo to deployment.
            </p>
          </div>
          <div className="grid gap-4">
            {profile.deployment_plan.map((step, index) => (
              <div key={`${step.label}-${step.timeline}`} className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-100">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{step.label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{step.timeline}</div>
                    <div className="mt-3 text-sm leading-6 text-slate-300">{step.outcome}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#0f1518]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">ROI and stakeholder value</h2>
            <p className="mt-1 text-sm text-slate-400">
              The business case has to work for the funder, the operator, and the verifier.
            </p>
          </div>
          <div className="space-y-4">
            {profile.roi_snapshot.map((entry) => (
              <div key={entry.label} className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{entry.label}</div>
                <div className="mt-2 text-xl font-semibold text-white">{entry.value}</div>
                <div className="mt-3 text-sm leading-6 text-slate-300">{entry.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeploymentBlueprintPage;
