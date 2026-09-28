import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatToIST } from '../../utils/dateUtils';
import { TimeRangeSelector } from '../shared/TimeRangeSelector';
import { ALL_SCENARIOS } from '../../fixtures/scenariosData';
import { Activity, FileSpreadsheet, Settings, Bell, Pause, Play } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    asset,
    events,
    sourceStatuses,
    demoClockIso,
    isClockPaused,
    toggleClockPause,
    selectedTimeRange,
    setTimeRange,
    currentScenario,
    setIsEventsDrawerOpen,
    setIsDataSourcesModalOpen,
    setIsReportsModalOpen,
    setIsScenarioSwitcherOpen,
  } = useApp();

  const scenarioName =
    ALL_SCENARIOS.find((s) => s.id === currentScenario)?.name.replace(/^\d+\.\s*/, '') ?? currentScenario;
  const unacknowledgedEvents = events.filter((e) => e.workflowStatus === 'unacknowledged');
  const hasCritical = unacknowledgedEvents.some((e) => e.condition === 'warning' || e.condition === 'critical');
  const hasAuthRequired = sourceStatuses.some((s) => s.accessState === 'authentication_required');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-14 py-2 gap-3">
          {/* Brand & Asset Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  SAMAST
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  by AnterVid
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium leading-none">
                Bridge River & Ground Intelligence
              </span>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Asset Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-800">{asset?.name || 'Bridge 249'}</span>
              <span className="text-slate-400 text-[11px] hidden md:inline">
                ({asset?.river}, Delhi)
              </span>
            </div>

            {/* Explicit Demo Badge */}
            <button
              type="button"
              className="badge badge-demo cursor-pointer max-w-[16rem] truncate"
              onClick={() => setIsScenarioSwitcherOpen(true)}
              title={`What-if scenario: ${scenarioName}. Live weather and satellite stay current. Click to change.`}
            >
              <span>{currentScenario === 'normal' ? 'Live' : 'What-if'}</span>
              <span className="hidden xl:inline normal-case font-semibold truncate">· {scenarioName}</span>
            </button>
          </div>

          {/* Clock, Time Range & Tools */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live IST clock */}
            <div
              className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs"
              title="Wall-clock in Asia/Kolkata. Live public feeds are evaluated against this time."
            >
              <div className="flex flex-col text-right">
                <span className="font-mono font-semibold text-slate-800 text-[12px]">
                  {formatToIST(demoClockIso, true)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isClockPaused ? 'Clock paused' : 'IST now'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleClockPause}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                title={isClockPaused ? 'Resume Clock' : 'Pause Clock for Inspection'}
              >
                {isClockPaused ? <Play size={12} className="text-blue-600" /> : <Pause size={12} />}
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="hidden md:block">
              <TimeRangeSelector selected={selectedTimeRange} onChange={setTimeRange} />
            </div>

            {/* Event Notification Button */}
            <button
              type="button"
              onClick={() => setIsEventsDrawerOpen(true)}
              className={`btn btn-sm relative ${
                hasCritical
                  ? 'btn-danger'
                  : unacknowledgedEvents.length > 0
                  ? 'btn-secondary text-amber-700 border-amber-300 bg-amber-50'
                  : 'btn-secondary text-slate-700'
              }`}
              title="Open Operator Event Timeline & Drawer"
              aria-label={`Events, ${unacknowledgedEvents.length} unacknowledged`}
            >
              <Bell size={14} />
              <span className="hidden sm:inline">Events</span>
              {unacknowledgedEvents.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {unacknowledgedEvents.length}
                </span>
              )}
            </button>

            {/* Data Sources Status */}
            <button
              type="button"
              onClick={() => setIsDataSourcesModalOpen(true)}
              className="btn btn-secondary btn-sm"
              title="Inspect Upstream Data Feed Connections & Latency"
              aria-label="Data sources"
            >
              <Activity size={14} className={hasAuthRequired ? 'text-amber-600' : 'text-slate-500'} />
              <span className="hidden sm:inline">Data Sources</span>
            </button>

            {/* Reports Export */}
            <button
              type="button"
              onClick={() => setIsReportsModalOpen(true)}
              className="btn btn-secondary btn-sm"
              title="Generate Synthetic CSV and Print Summaries"
              aria-label="Reports"
            >
              <FileSpreadsheet size={14} className="text-slate-500" />
              <span className="hidden sm:inline">Reports</span>
            </button>

            {/* Scenarios / Demo Switcher */}
            <button
              type="button"
              onClick={() => setIsScenarioSwitcherOpen(true)}
              className="btn btn-primary btn-sm"
              title="Switch Demo Scenarios (Scour, River Warning, Outage, etc.)"
              aria-label="Scenarios"
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Scenarios</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
