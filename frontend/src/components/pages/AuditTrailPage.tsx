import React from 'react';
import EventStream from '../EventStream';
import TokenBalancesDisplay from '../TokenBalancesDisplay';
import MetricsDisplay from '../MetricsDisplay';
import type { EventMapData } from '../EventMap';
import type { HederaEventRecord, MetricsResponse, TokenBalancesResponse } from '../../types';

interface AuditTrailPageProps {
  events: EventMapData[];
  syncedCases: EventMapData[];
  selectedCase: EventMapData | null;
  selectedCaseId: string | null;
  selectedCaseRecords: HederaEventRecord[];
  onSelectCase: (eventId: string) => void;
  metrics: MetricsResponse | null;
  tokens: TokenBalancesResponse | null;
  hederaRecords: HederaEventRecord[];
}

const AuditTrailPage: React.FC<AuditTrailPageProps> = ({
  events,
  syncedCases,
  selectedCase,
  selectedCaseId,
  selectedCaseRecords,
  onSelectCase,
  metrics,
  tokens,
  hederaRecords
}) => {
  const proofPackets = selectedCase
    ? events
        .filter((event) => event.project_name === selectedCase.project_name)
        .slice(-6)
        .reverse()
    : events.slice(-6).reverse();
  const displayRecords = selectedCaseRecords.length > 0 ? selectedCaseRecords : hederaRecords;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">Audit trail</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Proof packets, receipts, and network records</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          This page is for verifiers, finance teams, and deployment partners that need a clean operational record of what happened, when it happened, and why capital moved.
        </p>

        {syncedCases.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {syncedCases.slice(0, 4).map((event) => (
              <button
                key={event.id}
                onClick={() => onSelectCase(event.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  selectedCaseId === event.id
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
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#0f1518]/80 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Treasury metrics</h2>
          </div>
          <MetricsDisplay metrics={metrics} />
          <TokenBalancesDisplay tokens={tokens} />
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Hedera event stream</h2>
            <p className="mt-1 text-sm text-slate-400">
              {selectedCase
                ? `Filtered audit line for ${selectedCase.project_name}.`
                : 'The ordered record of proof intake, payout memo preparation, treasury shifts, and final verification.'}
            </p>
          </div>
          <EventStream events={displayRecords} />
        </section>
      </div>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div>
          <h2 className="text-2xl font-semibold text-white">Recent proof packets</h2>
          <p className="mt-1 text-sm text-slate-400">
            These packets are the raw operational objects that back client approvals and verifier actions.
          </p>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {proofPackets.map((packet) => (
            <div key={packet.id} className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Proof packet</div>
              <div className="mt-2 text-xl font-semibold text-white">{packet.project_name}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                {packet.location_label || [packet.community_name, packet.region, packet.country].filter(Boolean).join(' / ')}
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div>Proof hash: {packet.proof_hash || 'Pending'}</div>
                <div>Verifier: {packet.deployment_profile?.verifier_name || packet.verifier_name || 'Pending'}</div>
                <div>Readiness: {packet.deployment_profile?.release_readiness || 'hold'}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AuditTrailPage;
