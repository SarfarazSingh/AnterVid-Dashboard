import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ALL_SCENARIOS } from '../../fixtures/scenariosData';
import { ScenarioId, DemoScenario } from '../../types/domain';
import { X, Settings, CheckCircle2, ChevronRight, AlertTriangle, Layers, Play } from 'lucide-react';

export const ScenarioSwitcherModal: React.FC = () => {
  const {
    currentScenario,
    setScenario,
    isScenarioSwitcherOpen,
    setIsScenarioSwitcherOpen,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  if (!isScenarioSwitcherOpen) return null;

  const categories = ['All', 'Bridge Sensors', 'River Intelligence', 'Ground and Banks', 'Sources & Comms'];

  const filteredScenarios =
    activeCategory === 'All'
      ? ALL_SCENARIOS
      : ALL_SCENARIOS.filter((s) => s.category === activeCategory);

  const handleSelectScenario = async (id: ScenarioId) => {
    setIsSwitching(true);
    try {
      await setScenario(id);
      setIsScenarioSwitcherOpen(false);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => setIsScenarioSwitcherOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-panel max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-600" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Deterministic Scenario Controller</h2>
                <span className="badge badge-demo">Demo Tooling</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Test degraded sensors, river warning, and outages. Live rainfall, GloFAS, USGS and Sentinel catalogue stay current.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
            onClick={() => setIsScenarioSwitcherOpen(false)}
            aria-label="Close Scenario Switcher"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex border-b border-slate-200 bg-white text-xs px-5 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`py-2 px-3 border-b-2 font-medium transition ${
                activeCategory === cat
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scenario Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh] grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {filteredScenarios.map((sc) => {
            const isActive = currentScenario === sc.id;

            return (
              <div
                key={sc.id}
                onClick={() => handleSelectScenario(sc.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-100 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-bold text-slate-900 text-xs">{sc.name}</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {sc.category}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-[11px] mb-2">
                    {sc.shortDescription}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    Expected Visible Behavior:
                  </div>
                  <p className="text-[10px] text-slate-700 leading-snug font-mono">
                    {sc.expectedVisibleBehavior}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 font-bold text-blue-700 text-[11px]">
                        <CheckCircle2 size={13} /> Active Scenario
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] group-hover:text-blue-600 flex items-center gap-1">
                        <Play size={11} /> Load Scenario
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Active Scenario ID: {currentScenario}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsScenarioSwitcherOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
