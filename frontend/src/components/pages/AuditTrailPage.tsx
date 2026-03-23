import React, { useEffect, useState } from 'react';
import EventStream from '../EventStream';
import TokenBalancesDisplay from '../TokenBalancesDisplay';
import MetricsDisplay from '../MetricsDisplay';
import type { EventMapData } from '../EventMap';
import type { HederaEventRecord, MetricsResponse, TokenBalancesResponse } from '../../types';
import { getApiBaseUrl } from '../../lib/runtimeConfig';

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

interface TopicMessage {
  sequence_number: number;
  consensus_timestamp: string;
  message: string;
  payer_account_id: string;
}

interface TokenInfo {
  token_id: string;
  name: string;
  symbol: string;
  total_supply: string;
  type: string;
}

interface AccountTransaction {
  transaction_id: string;
  consensus_timestamp: string;
  name: string;
  result: string;
  charged_tx_fee: number;
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

  // ─── Live Mirror Node Data ───
  const [topicMessages, setTopicMessages] = useState<TopicMessage[]>([]);
  const [tokenInfos, setTokenInfos] = useState<TokenInfo[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [mirrorLoading, setMirrorLoading] = useState(false);
  const [mirrorError, setMirrorError] = useState<string | null>(null);

  const fetchMirrorData = async () => {
    setMirrorLoading(true);
    setMirrorError(null);
    const apiUrl = getApiBaseUrl();
    try {
      const [topicRes, tokenRes, txRes] = await Promise.all([
        fetch(`${apiUrl}/hedera/topic-messages`).catch(() => null),
        fetch(`${apiUrl}/hedera/token-info`).catch(() => null),
        fetch(`${apiUrl}/hedera/transactions`).catch(() => null)
      ]);

      if (topicRes?.ok) {
        const data = await topicRes.json();
        setTopicMessages(data.messages || []);
      }
      if (tokenRes?.ok) {
        const data = await tokenRes.json();
        setTokenInfos(data.tokens || []);
      }
      if (txRes?.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      setMirrorError('Mirror node data unavailable');
    } finally {
      setMirrorLoading(false);
    }
  };

  useEffect(() => {
    fetchMirrorData();
    const interval = setInterval(fetchMirrorData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (ts: string) => {
    try {
      const seconds = parseFloat(ts.split('.')[0]);
      return new Date(seconds * 1000).toLocaleString();
    } catch {
      return ts;
    }
  };

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

      {/* ───── Live Hedera Ledger (Mirror Node Data) ───── */}
      <section className="rounded-[28px] border border-emerald-400/15 bg-[#0a1614]/90 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">Live Hedera Ledger</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Real On-Chain Data</h2>
            <p className="mt-1 text-sm text-slate-400">
              Live data from Hedera testnet mirror node — verifiable on{' '}
              <a href="https://hashscan.io/testnet" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">HashScan</a>
            </p>
          </div>
          <button
            onClick={fetchMirrorData}
            disabled={mirrorLoading}
            className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200 transition hover:bg-emerald-500/20"
          >
            {mirrorLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {mirrorError && (
          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-400/20 px-4 py-3 text-sm text-amber-200">
            {mirrorError}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* HCS Topic Messages */}
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg">📜</span>
              <div className="text-xs uppercase tracking-[0.12em] text-cyan-200">HCS Consensus Messages</div>
            </div>
            <div className="mt-1 text-xs text-slate-500">{topicMessages.length} messages loaded</div>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {topicMessages.length === 0 ? (
                <div className="text-xs text-slate-500">No messages yet — start a simulation to generate HCS records</div>
              ) : (
                topicMessages.slice(0, 8).map((msg) => {
                  let parsed: any = null;
                  try { parsed = JSON.parse(msg.message); } catch {}
                  return (
                    <div key={msg.sequence_number} className="rounded-xl border border-white/5 bg-slate-950/40 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-200">#{msg.sequence_number}</span>
                        <span className="text-[10px] text-slate-500">{formatTimestamp(msg.consensus_timestamp)}</span>
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-300">
                        {parsed?.event_type || parsed?.project_name || msg.message.slice(0, 80)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* HTS Token Supply */}
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🪙</span>
              <div className="text-xs uppercase tracking-[0.12em] text-amber-200">HTS Token Supply (On-Chain)</div>
            </div>
            <div className="mt-1 text-xs text-slate-500">{tokenInfos.length} tokens tracked</div>
            <div className="mt-4 space-y-3">
              {tokenInfos.length === 0 ? (
                <div className="text-xs text-slate-500">No HTS tokens configured</div>
              ) : (
                tokenInfos.map((token) => (
                  <div key={token.token_id} className="rounded-xl border border-white/5 bg-slate-950/40 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{token.name || token.symbol}</span>
                      <span className="text-[10px] text-slate-500">{token.token_id}</span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-200">
                      {Number(token.total_supply).toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">Total supply on-chain</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔗</span>
              <div className="text-xs uppercase tracking-[0.12em] text-violet-200">Recent Transactions</div>
            </div>
            <div className="mt-1 text-xs text-slate-500">{transactions.length} transactions loaded</div>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-xs text-slate-500">No transactions yet</div>
              ) : (
                transactions.slice(0, 8).map((tx) => (
                  <div key={tx.transaction_id} className="rounded-xl border border-white/5 bg-slate-950/40 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        tx.result === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
                      }`}>
                        {tx.result}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatTimestamp(tx.consensus_timestamp)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-300">{tx.name?.replace('CRYPTO', '').replace('_', ' ') || 'Transaction'}</div>
                    <div className="mt-1 text-[10px] text-slate-500 truncate">{tx.transaction_id}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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

      {selectedCase?.deployment_profile?.on_chain_status && (
        <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Contract-backed case state</h2>
              <p className="mt-1 text-sm text-slate-400">
                This is the persisted escrow state for the selected case, including real deadlines and refund eligibility.
              </p>
            </div>
            <div className="rounded-full bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
              {selectedCase.deployment_profile.on_chain_status.network}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Project Registered</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {selectedCase.deployment_profile.on_chain_status.contract_project_created ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Escrow Funded</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {selectedCase.deployment_profile.on_chain_status.escrow_funded ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Released HBAR</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {selectedCase.deployment_profile.on_chain_status.released_hbar.toFixed(2)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Refund Eligible</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {selectedCase.deployment_profile.on_chain_status.refund_eligible ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          {selectedCase.deployment_profile.on_chain_status.last_failure_reason && (
            <div className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-500/5 px-4 py-3 text-sm leading-6 text-rose-100">
              {selectedCase.deployment_profile.on_chain_status.last_failure_reason}
            </div>
          )}

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {selectedCase.deployment_profile.on_chain_status.milestones.map((milestone) => (
              <div key={`${selectedCase.id}-${milestone.index}`} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{milestone.label}</div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    M{milestone.index + 1}
                  </div>
                </div>
                <div className="mt-3 text-xs leading-5 text-slate-300">
                  Deadline: {new Date(milestone.deadline_at).toLocaleString()}
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-300">
                  Approved: {milestone.approved_at ? new Date(milestone.approved_at).toLocaleString() : 'Not yet'}
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-300">
                  Released: {milestone.released_at ? new Date(milestone.released_at).toLocaleString() : 'Not yet'}
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-300">
                  Amount: {(milestone.amount_tinybar / 100_000_000).toFixed(2)} HBAR
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
