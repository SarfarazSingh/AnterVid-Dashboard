import React from 'react';
import { SourcePolicy } from '../../types/domain';
import { evaluateFreshness } from '../../utils/dateUtils';
import { Clock, AlertCircle } from 'lucide-react';

interface FreshnessLabelProps {
  observedAtIso: string | null | undefined;
  policy: SourcePolicy;
  referenceClockIso?: string;
  showCadence?: boolean;
}

export const FreshnessLabel: React.FC<FreshnessLabelProps> = ({
  observedAtIso,
  policy,
  referenceClockIso,
  showCadence = false,
}) => {
  const { state, ageFormatted, isStale, cadenceDescription } = evaluateFreshness(
    observedAtIso,
    policy,
    referenceClockIso
  );

  let colorClass = 'text-slate-500';
  if (state === 'current') {
    colorClass = 'text-emerald-700 font-medium';
  } else if (state === 'delayed') {
    colorClass = 'text-amber-700 font-medium';
  } else if (state === 'stale') {
    colorClass = 'text-rose-700 font-semibold';
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 text-xs"
      title={`${cadenceDescription}. Age is computed strictly against observation timestamp, never HTTP fetch time.`}
    >
      {isStale ? <AlertCircle size={12} className="text-rose-600" /> : <Clock size={12} className="text-slate-400" />}
      <span className={colorClass}>{ageFormatted}</span>
      {showCadence && <span className="text-slate-400">({cadenceDescription})</span>}
    </div>
  );
};
