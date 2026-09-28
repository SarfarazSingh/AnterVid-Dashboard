import React from 'react';
import { ObservationQuality, Provenance, SourcePolicy, ConditionState } from '../../types/domain';
import { QualityBadge } from './QualityBadge';
import { FreshnessLabel } from './FreshnessLabel';
import { EvidenceBadge } from './EvidenceBadge';
import { formatMetricValue } from '../../utils/formatters';
import { formatToIST } from '../../utils/dateUtils';
import { Info, ChevronRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  metric: string;
  value: number | null | undefined;
  unit: string;
  observedAt: string;
  quality: ObservationQuality;
  provenance: Provenance;
  policy: SourcePolicy;
  condition?: ConditionState;
  subtitle?: string;
  comparisonBaseline?: {
    label: string;
    baselineValue: number;
    delta: number;
    unit: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
  onOpenProvenance?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  metric,
  value,
  unit,
  observedAt,
  quality,
  provenance,
  policy,
  condition = 'within_range',
  subtitle,
  comparisonBaseline,
  isSelected = false,
  onClick,
  onOpenProvenance,
}) => {
  const isAvailable = value !== null && value !== undefined && !isNaN(value);
  const formattedVal = formatMetricValue(value, metric);
  const isWatch = condition === 'watch';
  const isWarning = condition === 'warning' || condition === 'critical';

  let borderStyle = 'border-slate-200';
  let bgStyle = 'bg-white';

  if (isSelected) {
    borderStyle = 'border-blue-500 ring-2 ring-blue-100';
  } else if (isWarning) {
    borderStyle = 'border-rose-300';
    bgStyle = 'bg-rose-50/40';
  } else if (isWatch) {
    borderStyle = 'border-amber-300';
    bgStyle = 'bg-amber-50/40';
  }

  return (
    <div
      className={`samast-card transition-all cursor-pointer ${bgStyle} ${borderStyle}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {title}
          </span>
          {subtitle && <span className="text-[11px] text-slate-400">({subtitle})</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <QualityBadge quality={quality.state} reasons={quality.reasons} />
          {onOpenProvenance && (
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition"
              title="Inspect Provenance & Evidence Chain"
              onClick={(e) => {
                e.stopPropagation();
                onOpenProvenance();
              }}
            >
              <Info size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="my-1.5 flex items-baseline justify-between">
        <div>
          {isAvailable ? (
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold tracking-tight ${
                  isWarning ? 'text-rose-700' : isWatch ? 'text-amber-800' : 'text-slate-900'
                }`}
              >
                {formattedVal}
              </span>
              <span className="text-xs font-medium text-slate-500">{unit}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold text-slate-400 italic">Not available</span>
              {quality.reasons.length > 0 && (
                <span className="text-xs text-rose-600">({quality.reasons[0]})</span>
              )}
            </div>
          )}
        </div>

        {/* Baseline Comparison Delta if supplied */}
        {comparisonBaseline && (
          <div className="text-right">
            <div className="text-[11px] text-slate-400">{comparisonBaseline.label}</div>
            <div
              className={`text-xs font-semibold ${
                comparisonBaseline.delta > 0
                  ? 'text-rose-600'
                  : comparisonBaseline.delta < 0
                  ? 'text-blue-600'
                  : 'text-slate-600'
              }`}
            >
              {comparisonBaseline.delta >= 0 ? '+' : ''}
              {comparisonBaseline.delta.toFixed(3)} {comparisonBaseline.unit}
            </div>
          </div>
        )}
      </div>

      {/* Footer Provenance & Observation Timestamp */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <EvidenceBadge origin={provenance.origin} sourceId={provenance.sourceId} />
        <FreshnessLabel observedAtIso={observedAt} policy={policy} />
      </div>

      <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Obs: {formatToIST(observedAt, false, true)}</span>
        {isSelected && (
          <span className="flex items-center text-blue-600 font-medium">
            Inspecting <ChevronRight size={12} />
          </span>
        )}
      </div>
    </div>
  );
};
