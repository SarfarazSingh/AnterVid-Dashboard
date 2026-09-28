import React from 'react';
import { InSARFinding } from '../../types/domain';
import { AlertTriangle, Satellite, Info, ShieldAlert } from 'lucide-react';

interface InSARInspectorProps {
  point: InSARFinding | null;
  onClose?: () => void;
}

export const InSARInspector: React.FC<InSARInspectorProps> = ({ point, onClose }) => {
  if (!point) return null;

  return (
    <div className="samast-card h-full flex flex-col justify-between text-xs space-y-4">
      <div>
        <div className="samast-card-header">
          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase">
              InSAR Point: {point.pointId}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{point.locationName}</h3>
          </div>
          <span
            className={`badge ${
              point.isSufficientCoherence ? 'badge-good' : 'badge-warning'
            }`}
          >
            {point.isSufficientCoherence ? 'Coherent' : 'Low Coherence'}
          </span>
        </div>

        {/* Primary LOS Displacement Value */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          {point.isSufficientCoherence ? (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Relative Line-of-Sight (LOS) Displacement
              </div>
              <div
                className={`text-xl font-extrabold font-mono mt-1 ${
                  point.relativeLosDisplacementMm < -3
                    ? 'text-rose-700'
                    : point.relativeLosDisplacementMm > 3
                    ? 'text-blue-700'
                    : 'text-slate-800'
                }`}
              >
                {point.relativeLosDisplacementMm > 0 ? '+' : ''}
                {point.relativeLosDisplacementMm.toFixed(1)} mm
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Sign convention: Negative is motion away from satellite radar sensor
              </div>
            </div>
          ) : (
            <div className="py-2 text-center">
              <AlertTriangle size={20} className="mx-auto text-amber-600 mb-1" />
              <div className="font-bold text-slate-800">Insufficient Coherent Observations</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Coherence {point.coherence.toFixed(2)} is below the 0.35 quality threshold. Never substituted with zero displacement.
              </p>
            </div>
          )}
        </div>

        {/* Radar Stack Metadata */}
        <div className="space-y-2 mt-3 text-xs">
          <div className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            SAR Interferometric Parameters
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Period:</span>
              <span className="font-mono text-slate-900">
                {point.periodStart} to {point.periodEnd}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Orbit Track:</span>
              <span className="font-mono text-slate-900">{point.track}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Orbit Direction:</span>
              <span className="capitalize text-slate-900">{point.orbitDirection}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reference Benchmark:</span>
              <span className="font-medium text-slate-800">{point.referencePoint}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1">
              <span className="text-slate-500">Temporal Coherence:</span>
              <span className="font-mono font-semibold text-slate-900">
                {point.coherence.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Uncertainty Bounds:</span>
              <span className="font-mono text-slate-700">±{point.uncertaintyMm.toFixed(1)} mm</span>
            </div>
          </div>
        </div>

        {/* Science Caveat */}
        <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200 rounded text-xs text-amber-900 space-y-1">
          <div className="font-semibold flex items-center gap-1 text-[11px]">
            <ShieldAlert size={13} className="text-amber-700" />
            <span>Science Limitation: LOS vs Vertical Settlement</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            Line-of-sight displacement is projected along the radar look angle; it cannot be renamed "vertical settlement" without combined ascending and descending vector decomposition. Does not measure underwater pier piles.
          </p>
        </div>
      </div>
    </div>
  );
};
