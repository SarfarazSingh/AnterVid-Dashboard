import React from 'react';
import { CalendarClock } from 'lucide-react';
import { OutlookItem } from '../../utils/decisionEngine';
import { formatToIST } from '../../utils/dateUtils';
import { formatRelativeToClock, LEVEL_STYLE } from './levelStyles';

interface OutlookTimelineProps {
  items: OutlookItem[];
  clockIso: string;
}

const BASIS_LABEL: Record<OutlookItem['basis'], string> = {
  official_observation: 'Official bulletin',
  official_forecast: 'Official forecast',
  model_forecast: 'Model',
  nominal_revisit: 'Planned revisit',
};

export const OutlookTimeline: React.FC<OutlookTimelineProps> = ({ items, clockIso }) => {
  return (
    <div className="samast-card h-full">
      <div className="samast-card-header">
        <span className="samast-card-title flex items-center gap-1.5">
          <CalendarClock size={14} className="text-slate-400" />
          What is coming
        </span>
        <span className="text-xs text-slate-500">From {formatToIST(clockIso, false, true)}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">No forecast or scheduled evidence in view.</p>
      ) : (
        <ol className="relative border-l border-slate-200 ml-2 space-y-4">
          {items.map((item) => {
            const style = LEVEL_STYLE[item.level];
            return (
              <li key={item.id} className="pl-4 relative">
                <span
                  className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${style.dot}`}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="text-xs font-bold text-slate-800">
                    {formatRelativeToClock(item.windowStart, clockIso, item.windowEnd)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                    {BASIS_LABEL[item.basis]}
                  </span>
                </div>
                <div className="text-sm text-slate-900 font-medium leading-snug mt-0.5">{item.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatToIST(item.windowStart)}
                  {item.windowEnd ? ` to ${formatToIST(item.windowEnd)}` : ''}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
