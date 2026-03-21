import React, { useEffect, useRef } from 'react';
import type { HederaEventRecord } from '../types';

interface EventStreamProps {
  events: HederaEventRecord[];
}

const stageTone: Record<string, string> = {
  impact_event_detected: 'text-cyan-300',
  impact_score_calculated: 'text-amber-300',
  portfolio_rebalanced: 'text-emerald-300',
  impact_verified: 'text-slate-200',
  verifier_review_requested: 'text-amber-200',
  sponsor_release_authorized: 'text-cyan-200',
  tranche_released: 'text-emerald-200'
};

const fallbackStageLabels: Record<string, string> = {
  impact_event_detected: 'Field signal detected',
  impact_score_calculated: 'Impact score calculated',
  portfolio_rebalanced: 'Portfolio updated',
  impact_verified: 'Proof anchored',
  verifier_review_requested: 'Verifier review requested',
  sponsor_release_authorized: 'Sponsor release authorized',
  tranche_released: 'Tranche released'
};

const EventStream: React.FC<EventStreamProps> = ({ events }) => {
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = 0;
    }
  }, [events]);

  const displayEvents = events.slice(0, 20);

  return (
    <div
      ref={streamRef}
      className="space-y-3 max-h-[360px] overflow-y-auto pr-1"
      data-testid="event-stream"
    >
      {displayEvents.length > 0 ? (
        displayEvents.map((event, index) => {
          const stageLabel = event.stage_label || fallbackStageLabels[event.event_type] || event.event_type;
          const summary = event.summary || event.payload?.project_name || event.payload?.event_type || '';

          return (
            <div
              key={`${event.timestamp}-${index}`}
              className="rounded-2xl border border-white/8 bg-white/5 p-4"
              data-testid="event-item"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={`text-sm font-semibold ${stageTone[event.event_type] || 'text-slate-100'}`}>
                    {stageLabel}
                  </div>
                  <div className="mt-1 text-lg font-medium text-white">
                    {event.project_name || event.payload?.project_name || event.event_type}
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {summary && (
                <div className="mt-3 text-sm leading-6 text-slate-300">
                  {summary}
                </div>
              )}

              {event.payload?.proof_hash && (
                <div className="mt-3 text-xs text-slate-400">
                  Proof hash: <span className="text-slate-200">{event.payload.proof_hash}</span>
                </div>
              )}

              {event.transaction_id && (
                <div className="mt-3 text-xs text-slate-400">
                  <span>TX: </span>
                  <a
                    href={`https://hashscan.io/testnet/transaction/${event.transaction_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:text-cyan-200 underline"
                    data-testid="transaction-link"
                  >
                    {event.transaction_id}
                  </a>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-slate-400 text-center py-8">
          No events recorded yet
        </div>
      )}
    </div>
  );
};

export default EventStream;
