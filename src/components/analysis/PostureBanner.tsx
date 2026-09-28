import React from 'react';
import { ClipboardCheck, Download, ShieldCheck } from 'lucide-react';
import { Assessment, POSTURE_COPY } from '../../utils/decisionEngine';
import { formatToIST } from '../../utils/dateUtils';
import { POSTURE_STYLE } from './levelStyles';

interface PostureBannerProps {
  assessment: Assessment;
  onRecordDecision: () => void;
  onDownloadBrief: () => void;
}

const CONFIDENCE_COPY: Record<Assessment['confidence'], { label: string; className: string; note: string }> = {
  high: { label: 'High confidence', className: 'badge-good', note: 'All key evidence is current.' },
  medium: {
    label: 'Medium confidence',
    className: 'badge-watch',
    note: 'Some supporting feeds are missing or delayed.',
  },
  low: {
    label: 'Low confidence',
    className: 'badge-warning',
    note: 'Bridge sensor evidence is missing or stale.',
  },
};

export const PostureBanner: React.FC<PostureBannerProps> = ({ assessment, onRecordDecision, onDownloadBrief }) => {
  const style = POSTURE_STYLE[assessment.posture];
  const copy = POSTURE_COPY[assessment.posture];
  const confidence = CONFIDENCE_COPY[assessment.confidence];

  return (
    <section
      className={`rounded-lg border p-4 sm:p-5 ${style.panel}`}
      aria-labelledby="posture-heading"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <ShieldCheck size={14} className="text-slate-400" />
            <span>Recommended operating posture</span>
            <span className={`badge ${confidence.className}`} title={confidence.note}>
              {confidence.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="posture-heading" className={`text-xl sm:text-2xl font-bold tracking-tight ${style.accent}`}>
              {copy.label}
            </h2>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${style.chip}`}>
              Decision support
            </span>
          </div>
          <p className={`text-sm ${style.accent}`}>{copy.summary}</p>

          {assessment.postureDrivers.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {assessment.postureDrivers.map((d) => (
                <li
                  key={d}
                  className="text-xs bg-white/80 border border-slate-200 rounded px-2 py-0.5 text-slate-700"
                >
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={onRecordDecision}>
              <ClipboardCheck size={15} />
              Record decision
            </button>
            <button type="button" className="btn btn-secondary" onClick={onDownloadBrief}>
              <Download size={15} />
              Shift handover brief
            </button>
          </div>
          <div className="text-[11px] text-slate-500 sm:text-right">
            Evaluated {formatToIST(assessment.evaluatedAt)} · Rule set{' '}
            <span className="font-mono">{assessment.ruleSetVersion}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 pt-3 border-t border-slate-200/70 text-[11px] text-slate-600 leading-relaxed">
        Samast recommends; it does not restrict traffic. Speed restrictions and suspensions are issued by the Section
        Engineer (Bridges) under Northern Railway procedure. Thresholds are demonstration values until replaced by the
        approved Bridge 249 monitoring plan.
      </p>
    </section>
  );
};
