import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatToIST } from '../../utils/dateUtils';
import { CANDIDATE_SOURCES } from '../../fixtures/candidateSources';
import { X, Activity, RefreshCw, Key, ExternalLink } from 'lucide-react';

type SourcesView = 'connected' | 'candidates';

export const DataSourcesModal: React.FC = () => {
  const { sourceStatuses, isDataSourcesModalOpen, setIsDataSourcesModalOpen, refreshData } = useApp();
  const [view, setView] = useState<SourcesView>('connected');

  if (!isDataSourcesModalOpen) return null;

  const close = () => setIsDataSourcesModalOpen(false);

  return (
    <div
      className="modal-backdrop"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sources-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <div className="modal-panel max-w-5xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <Activity size={18} className="text-blue-600 shrink-0" />
            <div className="min-w-0">
              <h2 id="sources-title" className="text-sm font-bold text-slate-900">
                Data sources
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Connected feed health, and public feeds that could be connected next
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
            onClick={close}
            aria-label="Close data sources"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-3 border-b border-slate-200 flex gap-4 text-xs" role="tablist">
          {(
            [
              ['connected', `Connected (${sourceStatuses.length})`],
              ['candidates', `Candidate integrations (${CANDIDATE_SOURCES.length})`],
            ] as [SourcesView, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={`pb-2 border-b-2 font-semibold transition ${
                view === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {view === 'connected' ? (
            <div className="samast-table-container">
              <table className="samast-table text-xs">
                <thead>
                  <tr>
                    <th>Data source</th>
                    <th>Category</th>
                    <th>Access state</th>
                    <th>Latest observation</th>
                    <th>Last successful fetch</th>
                    <th>Cadence</th>
                    <th>Diagnostic message</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceStatuses.map((source) => {
                    const isCurrent = source.accessState === 'current';
                    const isAuthReq = source.accessState === 'authentication_required';
                    const isDown = source.accessState === 'temporarily_unavailable';

                    return (
                      <tr key={source.sourceId} className="hover:bg-slate-50">
                        <td className="font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isCurrent
                                  ? 'bg-emerald-500'
                                  : isAuthReq
                                  ? 'bg-amber-500'
                                  : isDown
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{source.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 ml-3.5">
                            ID: {source.sourceId}
                          </div>
                        </td>
                        <td className="capitalize text-slate-600">{source.category}</td>
                        <td>
                          <span
                            className={`badge ${
                              isCurrent
                                ? 'badge-good'
                                : isAuthReq
                                ? 'badge-watch'
                                : isDown
                                ? 'badge-warning'
                                : 'badge-stale'
                            }`}
                          >
                            {source.accessState.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="font-mono text-slate-700 whitespace-nowrap">
                          {source.latestObservationAt ? formatToIST(source.latestObservationAt) : 'None'}
                        </td>
                        <td className="text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {source.lastSuccessfulFetchAt ? formatToIST(source.lastSuccessfulFetchAt, false, true) : 'Never'}
                        </td>
                        <td className="text-slate-500 whitespace-nowrap">
                          {source.expectedCadenceSeconds ? formatCadence(source.expectedCadenceSeconds) : 'Static / on demand'}
                        </td>
                        <td className="min-w-[16rem] text-slate-600 leading-snug">
                          <p className="text-[11px]">{source.message}</p>
                          {source.errorCode && (
                            <span className="font-mono text-[10px] text-rose-700 font-bold">[{source.errorCode}]</span>
                          )}
                        </td>
                        <td className="text-right">
                          {source.retryableByOperator ? (
                            <button
                              type="button"
                              onClick={() => refreshData()}
                              className="btn btn-secondary btn-sm"
                              title="Retry provider connection"
                            >
                              <RefreshCw size={11} />
                              <span>Retry</span>
                            </button>
                          ) : isAuthReq ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap"
                              title="Admin setup required; no operator credentials permitted in browser"
                            >
                              <Key size={11} />
                              <span>Admin setup</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Nominal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600">
                Public feeds that are not connected yet. Open-Meteo, GloFAS, USGS and the Copernicus scene catalogue are on the Connected tab.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CANDIDATE_SOURCES.map((s) => (
                  <li key={s.id} className="rounded-md border border-slate-200 p-3 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                      >
                        {s.name}
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                      <span className={`badge ${s.status === 'fixture_only' ? 'badge-watch' : 'badge-stale'}`}>
                        {s.status === 'fixture_only' ? 'Fixture only' : 'Not connected'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{s.provider}</div>
                    <p className="text-xs text-slate-700 leading-relaxed">{s.adds}</p>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold">Decision use:</span> {s.decisionUse}
                    </p>
                    <div className="mt-auto pt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100">{s.access}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100">{s.cadence}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 capitalize">{s.category}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>Live Open-Meteo, GloFAS, USGS and Copernicus STAC are fetched in the browser. No API keys are stored here. Manufacturer sensors and barrage bulletins remain fixtures.</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function formatCadence(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86400)} d`;
}
