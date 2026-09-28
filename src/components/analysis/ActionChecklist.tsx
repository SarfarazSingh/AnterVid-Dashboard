import React from 'react';
import { ArrowRight, Check, ListChecks } from 'lucide-react';
import { AnalysisTab, RecommendedAction } from '../../utils/decisionEngine';

interface ActionChecklistProps {
  actions: RecommendedAction[];
  completedIds: string[];
  onToggle: (id: string) => void;
  onOpenTab: (tab: AnalysisTab) => void;
}

const PRIORITY_STYLE: Record<RecommendedAction['priority'], { label: string; className: string }> = {
  immediate: { label: 'Immediate', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  this_shift: { label: 'This shift', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  routine: { label: 'Routine', className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const ActionChecklist: React.FC<ActionChecklistProps> = ({ actions, completedIds, onToggle, onOpenTab }) => {
  const done = actions.filter((a) => completedIds.includes(a.id)).length;

  return (
    <div className="samast-card">
      <div className="samast-card-header">
        <span className="samast-card-title flex items-center gap-1.5">
          <ListChecks size={14} className="text-slate-400" />
          Recommended actions
        </span>
        <span className="text-xs text-slate-500">
          {done} of {actions.length} done this shift
        </span>
      </div>

      {actions.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          No actions needed. Continue routine monitoring.
        </p>
      ) : (
        <ul className="space-y-2">
          {actions.map((a) => {
            const isDone = completedIds.includes(a.id);
            const priority = PRIORITY_STYLE[a.priority];
            return (
              <li
                key={a.id}
                className={`rounded-md border p-3 transition-colors ${
                  isDone ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={`Mark "${a.title}" as ${isDone ? 'not done' : 'done'}`}
                    onClick={() => onToggle(a.id)}
                    className={`mt-0.5 w-5 h-5 shrink-0 rounded border flex items-center justify-center transition ${
                      isDone ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 hover:border-blue-500'
                    }`}
                  >
                    {isDone && <Check size={13} strokeWidth={3} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}
                      >
                        {a.title}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isDone ? 'text-slate-400' : 'text-slate-600'}`}>
                      {a.detail}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded border font-semibold ${priority.className}`}>
                        {priority.label}
                      </span>
                      <span className="text-slate-500">{a.owner}</span>
                      {a.procedure && <span className="font-mono text-slate-500">{a.procedure}</span>}
                      {a.tab && (
                        <button
                          type="button"
                          className="ml-auto inline-flex items-center gap-1 text-blue-700 hover:underline"
                          onClick={() => onOpenTab(a.tab as AnalysisTab)}
                        >
                          Open evidence <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
