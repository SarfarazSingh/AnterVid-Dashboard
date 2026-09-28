import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DecisionDomain } from '../../types/domain';
import { AnalysisTab } from '../../utils/decisionEngine';
import { exportHandoverBrief } from '../../utils/exportUtils';
import { PostureBanner } from './PostureBanner';
import { FactorMatrix } from './FactorMatrix';
import { ActionChecklist } from './ActionChecklist';
import { OutlookTimeline } from './OutlookTimeline';
import { DecisionPanel } from './DecisionPanel';
import { EvidenceGaps } from './EvidenceGaps';
import { DOMAIN_LABEL, LEVEL_STYLE } from './levelStyles';

const DOMAINS: DecisionDomain[] = ['structure', 'hydrology', 'ground', 'data'];

export const AnalysisDecisionsTab: React.FC = () => {
  const {
    assessment,
    decisions,
    completedActionIds,
    toggleActionComplete,
    setActiveTab,
    setIsDataSourcesModalOpen,
    demoClockIso,
  } = useApp();
  const [domainFilter, setDomainFilter] = useState<DecisionDomain | null>(null);

  if (!assessment) {
    return (
      <div className="samast-card items-center text-center py-12 text-sm text-slate-500">
        Waiting for bridge, river and ground evidence to load.
      </div>
    );
  }

  const openTab = (tab: AnalysisTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const focusDecisionForm = () => {
    const panel = document.getElementById('decision-panel');
    panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    panel?.querySelector<HTMLInputElement>('input[name="posture"]:checked')?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-6">
      <PostureBanner
        assessment={assessment}
        onRecordDecision={focusDecisionForm}
        onDownloadBrief={() => exportHandoverBrief(assessment, decisions, completedActionIds)}
      />

      <div className="grid-4-col" role="group" aria-label="Filter evidence by domain">
        {DOMAINS.map((domain) => {
          const level = assessment.domainLevels[domain];
          const style = LEVEL_STYLE[level];
          const Icon = style.icon;
          const factors = assessment.factors.filter((f) => f.domain === domain);
          const flagged = factors.filter((f) => f.level !== 'normal').length;
          const isActive = domainFilter === domain;
          return (
            <button
              key={domain}
              type="button"
              onClick={() => setDomainFilter(isActive ? null : domain)}
              aria-pressed={isActive}
              className={`samast-card text-left transition ${
                isActive ? 'ring-2 ring-blue-200 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {DOMAIN_LABEL[domain].label}
                </span>
                <span className={`badge ${style.badge}`}>{style.label}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Icon size={20} className={style.text} aria-hidden="true" />
                <span className="text-lg font-bold text-slate-900">
                  {flagged === 0 ? 'Nothing flagged' : `${flagged} of ${factors.length} flagged`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{DOMAIN_LABEL[domain].description}</p>
            </button>
          );
        })}
      </div>

      <div className="grid-2-col">
        <FactorMatrix
          factors={assessment.factors}
          domainFilter={domainFilter}
          onClearFilter={() => setDomainFilter(null)}
          onOpenTab={openTab}
        />
        <OutlookTimeline items={assessment.outlook} clockIso={demoClockIso} />
      </div>

      <div className="grid-2-col">
        <ActionChecklist
          actions={assessment.actions}
          completedIds={completedActionIds}
          onToggle={toggleActionComplete}
          onOpenTab={openTab}
        />
        <DecisionPanel assessment={assessment} />
      </div>

      <EvidenceGaps gaps={assessment.gaps} onOpenSources={() => setIsDataSourcesModalOpen(true)} />
    </div>
  );
};
