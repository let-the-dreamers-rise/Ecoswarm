import React from 'react';
import type { MetricsResponse } from '../types';

interface MetricsDisplayProps {
  metrics: MetricsResponse | null;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0
});

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics }) => {
  if (!metrics) {
    return <div className="text-slate-400">Loading metrics...</div>;
  }

  const metricCards = [
    {
      label: 'Total CO2 Reduced',
      value: `${metrics.total_co2_reduced_kg.toFixed(2)} kg`,
      tone: 'text-emerald-300'
    },
    {
      label: 'Total Energy Generated',
      value: `${metrics.total_energy_generated_kwh.toFixed(2)} kWh`,
      tone: 'text-amber-300'
    },
    {
      label: 'Projects Funded',
      value: String(metrics.total_projects_funded),
      tone: 'text-cyan-300'
    },
    {
      label: 'Events Processed',
      value: String(metrics.total_events_processed),
      tone: 'text-fuchsia-300'
    },
    {
      label: 'Households Supported',
      value: String(metrics.total_households_supported ?? 0),
      tone: 'text-rose-300'
    },
    {
      label: 'Capital Routed',
      value: currencyFormatter.format(metrics.total_capital_routed_usd ?? 0),
      tone: 'text-lime-300'
    },
    {
      label: 'Capital Ready To Release',
      value: currencyFormatter.format(metrics.capital_ready_to_release_usd ?? 0),
      tone: 'text-orange-300'
    },
    {
      label: 'Proofs Recorded',
      value: String(metrics.proofs_recorded ?? 0),
      tone: 'text-sky-300'
    },
    {
      label: 'Avg. Verification',
      value: percentFormatter.format(metrics.average_verification_confidence ?? 0),
      tone: 'text-teal-300'
    },
    {
      label: 'Release-Ready Projects',
      value: String(metrics.release_ready_projects ?? 0),
      tone: 'text-pink-300'
    },
    {
      label: 'Authorized Capital',
      value: currencyFormatter.format(metrics.release_authorized_capital_usd ?? 0),
      tone: 'text-cyan-300'
    },
    {
      label: 'Released Capital',
      value: currencyFormatter.format(metrics.released_capital_usd ?? 0),
      tone: 'text-emerald-300'
    },
    {
      label: 'Case Actions',
      value: String(metrics.total_case_actions ?? 0),
      tone: 'text-amber-300'
    },
    {
      label: 'Active Programs',
      value: String(metrics.active_programs ?? 0),
      tone: 'text-indigo-300'
    },
    {
      label: 'Active Verifiers',
      value: String(metrics.active_verifiers?.length ?? 0),
      tone: 'text-violet-300'
    }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {metricCards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
          <div className={`mt-2 text-2xl font-semibold ${card.tone}`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
};

export default MetricsDisplay;
