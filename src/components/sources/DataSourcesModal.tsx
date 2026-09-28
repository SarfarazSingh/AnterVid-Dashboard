import React from 'react';
import { useApp } from '../../context/AppContext';
import { SourceStatus } from '../../types/domain';
import { formatToIST } from '../../utils/dateUtils';
import { X, Activity, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, Key } from 'lucide-react';

export const DataSourcesModal: React.FC = () => {
  const { sourceStatuses, isDataSourcesModalOpen, setIsDataSourcesModalOpen, refreshData } = useApp();

  if (!isDataSourcesModalOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={() => setIsDataSourcesModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-panel max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upstream Data Sources & Adapter Registry</h2>
              <span className="text-xs text-slate-500 font-medium">
                Independent provider status, heartbeat monitoring, and access failure diagnostics
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
            onClick={() => setIsDataSourcesModalOpen(false)}
            aria-label="Close Data Sources Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Table */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="samast-table-container">
            <table className="samast-table text-xs">
              <thead>
                <tr>
                  <th>Data Source</th>
                  <th>Category</th>
                  <th>Access State</th>
                  <th>Latest Observation</th>
                  <th>Last Successful Fetch</th>
                  <th>Cadence</th>
                  <th>Diagnostic Message</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sourceStatuses.map((source) => {
                  const isCurrent = source.accessState === 'current';
                  const isAuthReq = source.accessState === 'authentication_required';
                  const isDown = source.accessState === 'temporarily_unavailable';
                  const isStale = source.accessState === 'stale';

                  return (
                    <tr key={source.sourceId} className="hover:bg-slate-50">
                      <td className="font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
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
                          {source.accessState.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="font-mono text-slate-700">
                        {source.latestObservationAt ? formatToIST(source.latestObservationAt) : 'None'}
                      </td>
                      <td className="text-slate-500 font-mono text-[11px]">
                        {source.lastSuccessfulFetchAt ? formatToIST(source.lastSuccessfulFetchAt, false, true) : 'Never'}
                      </td>
                      <td className="text-slate-500">
                        {source.expectedCadenceSeconds ? `${source.expectedCadenceSeconds / 60}m` : 'Static / On-demand'}
                      </td>
                      <td className="max-w-xs text-slate-600 leading-snug">
                        <p className="text-[11px]">{source.message}</p>
                        {source.errorCode && (
                          <span className="font-mono text-[10px] text-rose-700 font-bold">
                            [{source.errorCode}]
                          </span>
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
                            className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                            title="Admin setup required; no operator credentials permitted in browser"
                          >
                            <Key size={11} />
                            <span>Admin Setup</span>
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
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Server Adapter Polling Architecture — Browser credentials strictly prohibited</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsDataSourcesModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
