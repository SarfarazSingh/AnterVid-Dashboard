import React from 'react';
import { TimeRangeOption } from '../../context/AppContext';
import { Calendar } from 'lucide-react';

interface TimeRangeSelectorProps {
  selected: TimeRangeOption;
  onChange: (option: TimeRangeOption) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ selected, onChange }) => {
  const options: { id: TimeRangeOption; label: string }[] = [
    { id: '24h', label: 'Last 24h' },
    { id: '7d', label: 'Last 7d' },
    { id: '30d', label: 'Last 30d' },
    { id: 'monsoon_season', label: 'Monsoon 2026' },
  ];

  return (
    <div className="inline-flex items-center rounded-md border border-slate-300 bg-white p-0.5 shadow-sm text-xs">
      <div className="px-2 py-1 text-slate-400 flex items-center gap-1 border-r border-slate-200">
        <Calendar size={13} />
        <span className="font-medium text-slate-600">Range:</span>
      </div>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`px-2.5 py-1 font-medium transition rounded ${
            selected === opt.id
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
