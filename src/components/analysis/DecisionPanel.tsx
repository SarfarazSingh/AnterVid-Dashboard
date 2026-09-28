import React, { useState } from 'react';
import { History } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OperatingPosture } from '../../types/domain';
import { Assessment, POSTURE_COPY } from '../../utils/decisionEngine';
import { formatToIST } from '../../utils/dateUtils';

interface DecisionPanelProps {
  assessment: Assessment;
}

const POSTURES: OperatingPosture[] = ['normal', 'heightened_watch', 'restriction_review', 'suspension_review'];

export const DecisionPanel: React.FC<DecisionPanelProps> = ({ assessment }) => {
  const { decisions, recordDecision, completedActionIds } = useApp();
  // A choice only applies to the recommendation it was made against; a new recommendation resets it.
  const [choice, setChoice] = useState<{ against: OperatingPosture; posture: OperatingPosture } | null>(null);
  const selected = choice && choice.against === assessment.posture ? choice.posture : assessment.posture;
  const setSelected = (posture: OperatingPosture) => setChoice({ against: assessment.posture, posture });
  const [recordedBy, setRecordedBy] = useState('Operator (Control Room Delhi)');
  const [rationale, setRationale] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const isOverride = selected !== assessment.posture;
  const actionIds = new Set(assessment.actions.map((a) => a.id));
  const completedHere = completedActionIds.filter((id) => actionIds.has(id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmation(null);
    setIsSaving(true);
    try {
      const record = await recordDecision({
        recordedBy,
        recommendedPosture: assessment.posture,
        selectedPosture: selected,
        rationale,
        ruleSetVersion: assessment.ruleSetVersion,
        factorSnapshot: assessment.factors.map((f) => ({ factorId: f.id, level: f.level, value: f.value })),
        completedActionIds: completedHere,
      });
      setConfirmation(`Recorded ${record.id} at ${formatToIST(record.recordedAt)}.`);
      setRationale('');
    } catch (err: any) {
      setError(err?.message || 'The decision could not be recorded.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="samast-card h-full" id="decision-panel">
      <div className="samast-card-header">
        <span className="samast-card-title">Operator decision</span>
        <span className="text-xs text-slate-500">Append-only log</span>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit} aria-describedby="decision-help">
        <fieldset>
          <legend className="text-xs font-semibold text-slate-700 mb-1.5">Posture for this shift</legend>
          <div className="grid grid-cols-1 gap-1.5">
            {POSTURES.map((p) => {
              const isRecommended = p === assessment.posture;
              const isChecked = selected === p;
              return (
                <label
                  key={p}
                  className={`flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm cursor-pointer transition ${
                    isChecked ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="posture"
                      value={p}
                      checked={isChecked}
                      onChange={() => setSelected(p)}
                      className="accent-blue-600"
                    />
                    <span className="font-medium text-slate-800">{POSTURE_COPY[p].label}</span>
                  </span>
                  {isRecommended && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Recommended</span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="decision-by" className="block text-xs font-semibold text-slate-700 mb-1">
            Recorded by
          </label>
          <input
            id="decision-by"
            type="text"
            value={recordedBy}
            onChange={(e) => setRecordedBy(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="decision-rationale" className="block text-xs font-semibold text-slate-700 mb-1">
            Rationale {isOverride ? <span className="text-rose-700">(required when overriding)</span> : '(optional)'}
          </label>
          <textarea
            id="decision-rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={3}
            placeholder={
              isOverride
                ? 'Explain why this posture differs from the recommendation.'
                : 'Add context for the next shift, such as field reports.'
            }
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500"
            required={isOverride}
            minLength={isOverride ? 10 : undefined}
          />
        </div>

        <p id="decision-help" className="text-[11px] text-slate-500">
          Saves the posture, all {assessment.factors.length} factor readings and {completedHere.length} completed
          action{completedHere.length === 1 ? '' : 's'}. Records cannot be edited.
        </p>

        {error && (
          <p role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded px-2 py-1.5">
            {error}
          </p>
        )}
        {confirmation && (
          <p role="status" className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
            {confirmation}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={isSaving}>
          {isSaving ? 'Recording…' : isOverride ? 'Record override' : 'Record decision'}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
          <History size={12} />
          Decision log
        </div>
        {decisions.length === 0 ? (
          <p className="text-xs text-slate-500">No decisions recorded yet this shift.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {decisions.map((d) => {
              const overridden = d.selectedPosture !== d.recommendedPosture;
              return (
                <li key={d.id} className="text-xs rounded border border-slate-200 bg-slate-50 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-semibold text-slate-800">{POSTURE_COPY[d.selectedPosture].label}</span>
                    <span className="font-mono text-[10px] text-slate-500">{d.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatToIST(d.recordedAt)} · {d.recordedBy}
                  </div>
                  {overridden && (
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      Override of {POSTURE_COPY[d.recommendedPosture].label.toLowerCase()}
                    </div>
                  )}
                  {d.rationale && <p className="text-slate-700 mt-1 leading-snug">{d.rationale}</p>}
                  <div className="text-[10px] text-slate-400 mt-1">
                    {d.completedActionIds.length} action{d.completedActionIds.length === 1 ? '' : 's'} done ·
                    scenario {d.scenarioId}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
