import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportSensorsCSV, exportEventsCSV, exportTransectsCSV } from '../../utils/exportUtils';
import { formatToIST } from '../../utils/dateUtils';
import { X, FileSpreadsheet, Printer, Download, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export const ReportsModal: React.FC = () => {
  const {
    isReportsModalOpen,
    setIsReportsModalOpen,
    observations,
    events,
    transects,
    insarPoints,
    asset,
    demoClockIso,
  } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'sensors' | 'events' | 'geospatial'>('sensors');

  if (!isReportsModalOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={() => setIsReportsModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-panel max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-blue-600" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Operator Reports & Compliance Exports</h2>
                <span className="badge badge-demo">Synthetic Demo Export</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Asset: {asset?.name} ({asset?.id}) | Controlled Time: {formatToIST(demoClockIso)}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
            onClick={() => setIsReportsModalOpen(false)}
            aria-label="Close Reports Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-white text-xs px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveReportTab('sensors')}
            className={`py-2 px-3 border-b-2 font-medium transition ${
              activeReportTab === 'sensors'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Daily Sensor Telemetry Report
          </button>
          <button
            type="button"
            onClick={() => setActiveReportTab('events')}
            className={`py-2 px-3 border-b-2 font-medium transition ${
              activeReportTab === 'events'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Event Evidence & Audit Report
          </button>
          <button
            type="button"
            onClick={() => setActiveReportTab('geospatial')}
            className={`py-2 px-3 border-b-2 font-medium transition ${
              activeReportTab === 'geospatial'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Geospatial & Bank Change Report
          </button>
        </div>

        {/* Body Preview */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Watermark Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
              <span>
                <strong>Demonstration Watermark:</strong> All exported artifacts contain permanent synthetic demo headers. Does not assert surveyed structural certification.
              </span>
            </div>
          </div>

          {activeReportTab === 'sensors' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-800 text-sm">
                  Daily Bridge Sensor Telemetry Report
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Generates an RFC 4180 compliant CSV file containing all commissioned channels (acoustic sonar ranges, cap vibration peak/RMS, bi-axial inclinometer tilt, and KLEON gateway power telemetry).
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => exportSensorsCSV(observations, asset?.name)}
                    className="btn btn-primary btn-sm"
                  >
                    <Download size={13} />
                    <span>Download Sensor Telemetry (CSV)</span>
                  </button>
                  <span className="text-slate-400">Includes ISO UTC & IST timestamps, units, and quality flags</span>
                </div>
              </div>
            </div>
          )}

          {activeReportTab === 'events' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-800 text-sm">
                  Operator Event Evidence & Acknowledgement Audit
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Compiles all active, acknowledged, and resolved bridge condition events, rule threshold origins, baseline IDs, operator handover notes, and immutable audit entries.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => exportEventsCSV(events)}
                    className="btn btn-primary btn-sm"
                  >
                    <Download size={13} />
                    <span>Download Event Audit Log (CSV)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeReportTab === 'geospatial' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-800 text-sm">
                  Geospatial Riverbank Migration & InSAR Displacement Log
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Exports reviewed transects with water stage offsets, detection limits, signed movement values, analyst verification notes, and NISAR provisional point measurements.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => exportTransectsCSV(transects, insarPoints)}
                    className="btn btn-primary btn-sm"
                  >
                    <Download size={13} />
                    <span>Download Geospatial Findings (CSV)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Compliant with Indian Railway Bridge Health Monitoring Specification</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsReportsModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
