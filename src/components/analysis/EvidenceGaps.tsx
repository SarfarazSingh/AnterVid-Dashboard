import React from 'react';
import { ExternalLink, Plug } from 'lucide-react';
import { CANDIDATE_SOURCES } from '../../fixtures/candidateSources';
import { DataGap } from '../../utils/decisionEngine';

interface EvidenceGapsProps {
  gaps: DataGap[];
  onOpenSources: () => void;
}

export const EvidenceGaps: React.FC<EvidenceGapsProps> = ({ gaps, onOpenSources }) => {
  return (
    <div className="samast-card">
      <div className="samast-card-header flex-wrap gap-2">
        <span className="samast-card-title flex items-center gap-1.5">
          <Plug size={14} className="text-slate-400" />
          Evidence gaps and sources that would close them
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenSources}>
          All candidate sources
        </button>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {gaps.map((gap) => {
          const sources = gap.candidateSourceIds
            .map((id) => CANDIDATE_SOURCES.find((s) => s.id === id))
            .filter((s): s is NonNullable<typeof s> => Boolean(s));
          return (
            <li key={gap.id} className="rounded-md border border-slate-200 bg-slate-50/60 p-3 flex flex-col gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">{gap.label}</div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{gap.impact}</p>
              </div>
              {sources.length > 0 ? (
                <ul className="space-y-1.5 mt-auto">
                  {sources.map((s) => (
                    <li key={s.id} className="text-xs bg-white border border-slate-200 rounded p-2">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                      >
                        {s.name}
                        <ExternalLink size={11} />
                      </a>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {s.access} · {s.cadence}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-500 mt-auto">Needs a field check rather than a new feed.</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
