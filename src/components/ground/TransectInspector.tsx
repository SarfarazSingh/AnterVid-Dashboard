import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TransectFinding } from '../../types/domain';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, FileEdit, Info } from 'lucide-react';

interface TransectInspectorProps {
  transect: TransectFinding | null;
  onClose?: () => void;
}

export const TransectInspector: React.FC<TransectInspectorProps> = ({ transect, onClose }) => {
  const { reviewTransect, openProvenance } = useApp();
  const [analystNote, setAnalystNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!transect) {
    return (
      <div className="samast-card h-full flex flex-col justify-center items-center text-center p-6 text-slate-400 text-xs">
        <Info size={24} className="mb-2 text-slate-300" />
        <span className="font-semibold text-slate-600">No Transect Selected</span>
        <span className="mt-1 max-w-[200px] leading-relaxed">
          Click any transect pin (e.g. T-01, T-02) on the map or findings list to inspect migration evidence.
        </span>
      </div>
    );
  }

  const isErosion = transect.signedMovementM < -transect.detectionLimitM;
  const isAccretion = transect.signedMovementM > transect.detectionLimitM;

  const handleReviewAction = async (status: 'reviewed' | 'rejected') => {
    setIsSubmitting(true);
    try {
      await reviewTransect(
        transect.id,
        status,
        analystNote || (status === 'reviewed' ? 'Approved for field inspection.' : 'Rejected due to stage artifact.')
      );
      setAnalystNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="samast-card h-full flex flex-col justify-between text-xs space-y-4">
      <div>
        <div className="samast-card-header">
          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase">
              Transect ID: {transect.transectId}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{transect.name}</h3>
          </div>
          <span
            className={`badge ${
              transect.reviewState === 'reviewed'
                ? 'badge-good'
                : transect.reviewState === 'rejected'
                ? 'badge-warning'
                : 'badge-watch'
            }`}
          >
            {transect.reviewState}
          </span>
        </div>

        {/* Primary Metric Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Signed Movement</div>
            <div
              className={`text-xl font-extrabold font-mono ${
                isErosion ? 'text-rose-700' : isAccretion ? 'text-emerald-700' : 'text-slate-800'
              }`}
            >
              {transect.signedMovementM > 0 ? '+' : ''}
              {transect.signedMovementM.toFixed(1)} metres
            </div>
            <div className="text-[11px] text-slate-500">
              {isErosion ? 'Bank Retreat (Erosion)' : isAccretion ? 'Sediment Accretion' : 'No Resolvable Change'}
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 font-mono">
            <div>Uncertainty: ±{transect.uncertaintyM.toFixed(1)}m</div>
            <div>Limit: {transect.detectionLimitM.toFixed(1)}m</div>
          </div>
        </div>

        {/* Observation Envelope & Stage Delta */}
        <div className="space-y-2 mt-3 text-xs">
          <div className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            Comparison Baseline Context
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Baseline Date:</span>
              <span className="font-mono text-slate-900">{transect.baselineDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Comparison Date:</span>
              <span className="font-mono text-slate-900">{transect.comparisonDate}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1">
              <span className="text-slate-500">Water Stage Delta:</span>
              <span
                className={`font-mono font-semibold ${
                  transect.stageDifferenceM > 0.3 ? 'text-amber-700' : 'text-slate-800'
                }`}
              >
                +{transect.stageDifferenceM.toFixed(2)}m RL
              </span>
            </div>
            {transect.stageDifferenceM > 0.3 && (
              <p className="text-[10px] text-amber-800 italic pt-1">
                Caution: Stage difference exceeds 0.30m. Waterline retreat may be partially caused by rising stage.
              </p>
            )}
          </div>
        </div>

        {/* Analyst Audit Log */}
        {transect.analystNote && (
          <div className="mt-3 p-3 bg-blue-50/50 border border-blue-200 rounded text-xs text-blue-900 space-y-1">
            <div className="font-semibold flex items-center justify-between text-[11px]">
              <span>Analyst Review Record</span>
              <span className="text-[10px] text-blue-700 font-normal">
                {transect.reviewedBy || 'Analyst Queue'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-800 italic">
              "{transect.analystNote}"
            </p>
          </div>
        )}
      </div>

      {/* Review Actions (Demo Analyst Workflow) */}
      <div className="pt-3 border-t border-slate-200 space-y-2">
        <label className="block text-[11px] font-semibold text-slate-700">
          Analyst Review & Verification Note:
        </label>
        <textarea
          rows={2}
          value={analystNote}
          onChange={(e) => setAnalystNote(e.target.value)}
          placeholder="Enter field inspection recommendation or reject explanation..."
          className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleReviewAction('reviewed')}
            className="btn btn-primary btn-sm flex-1 text-xs"
          >
            <CheckCircle size={12} />
            <span>Approve for Field Check</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleReviewAction('rejected')}
            className="btn btn-secondary btn-sm text-xs"
          >
            <XCircle size={12} />
            <span>Reject Finding</span>
          </button>
        </div>
      </div>
    </div>
  );
};
