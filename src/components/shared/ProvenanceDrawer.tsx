import React from 'react';
import { X, ShieldAlert, CheckCircle, Database, Calendar, Tag, AlertTriangle } from 'lucide-react';
import { formatToIST } from '../../utils/dateUtils';

interface ProvenanceDrawerProps {
  target: {
    title: string;
    metadata: Record<string, any>;
  } | null;
  onClose: () => void;
}

export const ProvenanceDrawer: React.FC<ProvenanceDrawerProps> = ({ target, onClose }) => {
  if (!target) return null;

  const { title, metadata } = target;

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-demo">DEMO PROVENANCE</span>
              <span className="text-xs font-semibold uppercase text-slate-500">Audit & Origin</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">{title}</h2>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
            onClick={onClose}
            aria-label="Close Provenance Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 text-sm">
          {/* Summary Box */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-md">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Database size={14} className="text-blue-700" /> Evidence Chain Verification
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              Every displayed metric maintains an immutable chain linking raw instrument telemetry or satellite acquisition metadata to the current display card.
            </p>
          </div>

          {/* Core Provenance Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Observation Identity
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 divide-y divide-slate-200 text-xs">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Source Identifier:</span>
                <span className="font-mono font-medium text-slate-900">
                  {metadata.sourceId || metadata.provenance?.sourceId || 'N/A'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Origin Classification:</span>
                <span className="font-medium text-slate-900">
                  {metadata.origin || metadata.provenance?.origin || 'N/A'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Source Packet/Record ID:</span>
                <span className="font-mono text-slate-900">
                  {metadata.sourceRecordId || metadata.provenance?.sourceRecordId || 'N/A'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Observed At (IST):</span>
                <span className="font-medium text-slate-900">
                  {formatToIST(metadata.observedAt || metadata.publishedAt)}
                </span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Observed At (UTC ISO):</span>
                <span className="font-mono text-slate-700">
                  {metadata.observedAt || metadata.publishedAt || 'N/A'}
                </span>
              </div>
              {metadata.receivedAt && (
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Received at Server:</span>
                  <span className="font-medium text-slate-900">{formatToIST(metadata.receivedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reference & Vertical Datum */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Spatial & Vertical Reference
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference Type:</span>
                <span className="font-medium text-slate-900">{metadata.reference?.type || 'Local Mount'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vertical Datum:</span>
                <span className="font-semibold text-slate-900">
                  {metadata.reference?.verticalDatum || 'Unspecified (No cross-datum math permitted)'}
                </span>
              </div>
              {metadata.reference?.mountingElevationM && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mounting RL:</span>
                  <span className="font-mono text-slate-900">
                    +{metadata.reference.mountingElevationM.toFixed(2)} m RL
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Method, Algorithm & Baseline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Processing & Calibration Baseline
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Method Version:</span>
                <span className="font-mono font-medium text-slate-900">
                  {metadata.methodVersion || metadata.provenance?.methodVersion || 'vendor_raw_scalar_v1'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Approved Baseline ID:</span>
                <span className="font-mono font-medium text-slate-900">
                  {metadata.baselineId || metadata.provenance?.baselineId || 'None'}
                </span>
              </div>
              {metadata.uncertainty && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Measurement Uncertainty:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ±{metadata.uncertainty.plusMinus} {metadata.uncertainty.unit}{' '}
                    {metadata.uncertainty.confidenceLevelPct ? `(${metadata.uncertainty.confidenceLevelPct}% CL)` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Limitations & Caveats */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" /> Operational Limitations & Caveats
            </h4>
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-md text-xs text-amber-900 space-y-1.5">
              <p>
                {metadata.limitation ||
                  metadata.provenance?.limitation ||
                  'No structural safety certification is inferred solely from this metric. Review official procedures prior to dispatching maintenance.'}
              </p>
              {metadata.limitations && Array.isArray(metadata.limitations) && (
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {metadata.limitations.map((lim: string, idx: number) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">Samast Audit Record #PROV-BR249</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
