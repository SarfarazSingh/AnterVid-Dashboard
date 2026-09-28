import React from 'react';
import { ArrowRight } from 'lucide-react';
import { DecisionDomain } from '../../types/domain';
import { AnalysisTab, DecisionFactor } from '../../utils/decisionEngine';
import { formatToIST } from '../../utils/dateUtils';
import { DOMAIN_LABEL, LEVEL_STYLE } from './levelStyles';

interface FactorMatrixProps {
  factors: DecisionFactor[];
  domainFilter: DecisionDomain | null;
  onClearFilter: () => void;
  onOpenTab: (tab: AnalysisTab) => void;
}

const TAB_LABEL: Record<AnalysisTab, string> = {
  bridge_sensors: 'Bridge sensors',
  river_intelligence: 'River intelligence',
  ground_and_banks: 'Ground and banks',
};

const LEVEL_ORDER = { warning: 0, unknown: 1, watch: 2, normal: 3 } as const;

export const FactorMatrix: React.FC<FactorMatrixProps> = ({ factors, domainFilter, onClearFilter, onOpenTab }) => {
  const visible = factors
    .filter((f) => !domainFilter || f.domain === domainFilter)
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

  return (
    <div className="samast-card">
      <div className="samast-card-header flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="samast-card-title">Evidence behind the recommendation</span>
          <span className="text-xs text-slate-500">
            {visible.length} factor{visible.length === 1 ? '' : 's'}
            {domainFilter ? ` · ${DOMAIN_LABEL[domainFilter].label}` : ''}
          </span>
        </div>
        {domainFilter && (
          <button type="button" className="btn btn-subtle btn-sm" onClick={onClearFilter}>
            Show all factors
          </button>
        )}
      </div>

      <ul className="divide-y divide-slate-100">
        {visible.map((f) => {
          const style = LEVEL_STYLE[f.level];
          const Icon = style.icon;
          return (
            <li key={f.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:w-44 shrink-0">
                  <Icon size={16} className={style.text} aria-hidden="true" />
                  <span className={`badge ${style.badge}`}>{style.label}</span>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="text-sm font-semibold text-slate-900">{f.label}</span>
                    <span className="font-mono text-sm font-semibold text-slate-800">{f.value}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.rationale}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span>{f.threshold}</span>
                    <span className="text-slate-300">|</span>
                    <span>{f.source}</span>
                    {f.observedAt && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span>
                          {f.observedAt.length > 10 ? formatToIST(f.observedAt) : f.observedAt}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-subtle btn-sm self-start text-blue-700"
                  onClick={() => onOpenTab(f.tab)}
                  aria-label={`Open ${TAB_LABEL[f.tab]} for ${f.label}`}
                >
                  {TAB_LABEL[f.tab]}
                  <ArrowRight size={12} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
