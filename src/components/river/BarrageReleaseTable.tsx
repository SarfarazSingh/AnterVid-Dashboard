import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatToIST } from '../../utils/dateUtils';
import { cusecsToM3s, m3sToCusecs } from '../../utils/formatters';
import { ReleaseBulletin } from '../../types/domain';
import { FileText, Plus, AlertCircle, ArrowUpRight, History } from 'lucide-react';

export const BarrageReleaseTable: React.FC = () => {
  const { releaseBulletins } = useApp();
  const [unitMode, setUnitMode] = useState<'both' | 'cusecs' | 'm3s'>('both');
  const [showManualModal, setShowManualModal] = useState(false);

  return (
    <div className="samast-card">
      <div className="samast-card-header flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="samast-card-title">Inter-State Barrage Discharge & Gate Release Register</span>
          <span className="text-xs text-slate-500 font-medium">
            ({releaseBulletins.length} Bulletins Logged)
          </span>
        </div>

        {/* Unit Toggle and Manual Entry Action */}
        <div className="flex items-center gap-2 text-xs">
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setUnitMode('both')}
              className={`px-2 py-0.5 rounded font-medium ${unitMode === 'both' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'}`}
            >
              Dual (cfs / m³s)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('cusecs')}
              className={`px-2 py-0.5 rounded font-medium ${unitMode === 'cusecs' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'}`}
            >
              Cusecs (cfs)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('m3s')}
              className={`px-2 py-0.5 rounded font-medium ${unitMode === 'm3s' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'}`}
            >
              m³/s (SI)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="btn btn-secondary btn-sm"
            title="Import an official physical barrage bulletin entered manually"
          >
            <Plus size={12} />
            <span>Manual Bulletin Import</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="samast-table-container">
        <table className="samast-table text-xs">
          <thead>
            <tr>
              <th>Barrage / Control Gate</th>
              <th>Reported Discharge</th>
              <th>Type / Status</th>
              <th>Bulletin Ref</th>
              <th>Issue Time (IST)</th>
              <th>Receipt Latency</th>
              <th>Arrival at Bridge 249</th>
              <th>Issuing Authority</th>
            </tr>
          </thead>
          <tbody>
            {releaseBulletins.map((b) => (
              <tr key={b.id} className={b.isSuperseded ? 'opacity-60 bg-slate-50/80' : 'hover:bg-slate-50'}>
                <td className="font-semibold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <span>{b.barrageName}</span>
                    {b.revision > 1 && (
                      <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        Rev {b.revision}
                      </span>
                    )}
                    {b.isSuperseded && (
                      <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                        Superseded
                      </span>
                    )}
                  </div>
                </td>
                <td className="font-mono font-bold text-blue-900">
                  {unitMode === 'both' ? (
                    <div>
                      <span>{b.originalDischarge.toLocaleString()} cusecs</span>
                      <span className="text-[11px] text-slate-500 font-normal ml-1">
                        ({Math.round(b.normalizedDischargeM3s).toLocaleString()} m³/s)
                      </span>
                    </div>
                  ) : unitMode === 'cusecs' ? (
                    `${b.originalDischarge.toLocaleString()} cusecs`
                  ) : (
                    `${Math.round(b.normalizedDischargeM3s).toLocaleString()} m³/s`
                  )}
                </td>
                <td>
                  <span
                    className={`badge ${
                      b.type === 'observed'
                        ? 'badge-good'
                        : b.type === 'revised'
                        ? 'badge-watch'
                        : 'badge-stale'
                    }`}
                  >
                    {b.type}
                  </span>
                </td>
                <td className="font-mono text-slate-600 text-[11px]">
                  {b.bulletinRef}
                </td>
                <td className="text-slate-700">
                  {formatToIST(b.issueTime)}
                </td>
                <td className="text-slate-500">
                  {formatToIST(b.receiptTime, false, true)}
                </td>
                <td className="text-slate-600">
                  <span className="italic text-[11px]">
                    {b.travelTimeEstimateHours || 'Arrival at bridge not modelled'}
                  </span>
                </td>
                <td className="text-slate-500 text-[11px]">
                  {b.issuer}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Notice */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <AlertCircle size={13} className="text-amber-500" />
          <span>
            Engineering rule: 1 cfs = 0.0283168 m³/s. Gate opening percentages are never converted to discharge without rating calibration.
          </span>
        </div>
        <span>Delhi Flood Control Order 2025 Planning Window</span>
      </div>

      {/* Mock Manual Bulletin Modal */}
      {showManualModal && (
        <div className="modal-backdrop" onClick={() => setShowManualModal(false)}>
          <div className="modal-panel p-5 max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Import Official Bulletin Manually</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              When automated telemetry feeds are unavailable, an authorized engineer can register an official stamped bulletin. It remains permanently labelled "Official bulletin entered manually".
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Barrage Structure:</label>
                <input
                  type="text"
                  defaultValue="Hathnikund Barrage (Haryana)"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Discharge (Original Unit):</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    defaultValue="145000"
                    className="w-2/3 px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 font-mono"
                  />
                  <select className="w-1/3 px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-800">
                    <option>cusecs</option>
                    <option>m³/s</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Official Bulletin Reference:</label>
                <input
                  type="text"
                  defaultValue="HKB/MANUAL/2026-09-12/03"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 font-mono"
                />
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Manual bulletin recorded under audited operator provenance.');
                  setShowManualModal(false);
                }}
                className="btn btn-primary btn-sm"
              >
                Save & Register Bulletin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
