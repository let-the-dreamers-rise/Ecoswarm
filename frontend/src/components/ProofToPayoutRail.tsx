import React from 'react';
import type { MetricsResponse, TokenBalancesResponse } from '../types';

interface ProofToPayoutRailProps {
  metrics: MetricsResponse | null;
  tokens: TokenBalancesResponse | null;
  queuedOpportunities: number;
  hederaRecords: number;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const ProofToPayoutRail: React.FC<ProofToPayoutRailProps> = ({
  metrics,
  tokens,
  queuedOpportunities,
  hederaRecords
}) => {
  const totalReceipts =
    (tokens?.SolarImpactToken ?? 0) +
    (tokens?.CleanupImpactToken ?? 0) +
    (tokens?.ReforestationToken ?? 0) +
    (tokens?.CarbonCaptureToken ?? 0);

  const stages = [
    {
      step: '01',
      title: 'Community Signal',
      value: String(queuedOpportunities),
      description: 'Field interventions enter the intake queue with community, geography, and urgency context.',
      tone: 'text-cyan-300'
    },
    {
      step: '02',
      title: 'Payout Memo',
      value: String(metrics?.proofs_recorded ?? 0),
      description: 'Each intervention becomes a milestone-backed payout case with sponsor, verifier, and operator roles.',
      tone: 'text-amber-300'
    },
    {
      step: '03',
      title: 'Release Ready',
      value: String(metrics?.release_ready_projects ?? 0),
      description: `${currencyFormatter.format(metrics?.capital_ready_to_release_usd ?? 0)} is currently ready for committee-backed release.`,
      tone: 'text-emerald-300'
    },
    {
      step: '04',
      title: 'HTS + HCS Audit',
      value: `${totalReceipts} / ${hederaRecords}`,
      description: 'Impact receipts and Hedera records reinforce the audit trail behind every treasury move.',
      tone: 'text-rose-300'
    }
  ];

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/30">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Proof-to-Payout Rail</h2>
          <p className="mt-1 text-sm text-slate-400">
            This is the part judges need to feel: community evidence becomes verifiable treasury action on Hedera.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
          Incentive mechanism + on-chain verification
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {stages.map((stage) => (
          <div key={stage.step} className="rounded-3xl border border-white/8 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-400">
                {stage.step}
              </span>
              <span className={`text-2xl font-semibold ${stage.tone}`}>{stage.value}</span>
            </div>
            <div className="mt-4 text-lg font-semibold text-white">{stage.title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{stage.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProofToPayoutRail;
