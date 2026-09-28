import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/shell/Header';
import { ContextStrip } from './components/shell/ContextStrip';
import { NavigationTabs } from './components/shell/NavigationTabs';
import { BridgeSensorsTab } from './components/bridge/BridgeSensorsTab';
import { RiverIntelligenceTab } from './components/river/RiverIntelligenceTab';
import { GroundAndBanksTab } from './components/ground/GroundAndBanksTab';
import { EventDrawer } from './components/events/EventDrawer';
import { DataSourcesModal } from './components/sources/DataSourcesModal';
import { ReportsModal } from './components/reports/ReportsModal';
import { ScenarioSwitcherModal } from './components/scenarios/ScenarioSwitcherModal';
import { ProvenanceDrawer } from './components/shared/ProvenanceDrawer';
import { AlertCircle, Shield, Info } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, provenanceTarget, closeProvenance, isLoading, error } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Initializing Samast Operator Workspace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-center">
        <AlertCircle size={28} className="mx-auto text-rose-600 mb-2" />
        <h2 className="text-base font-bold">Failed to Initialize Samast Repository</h2>
        <p className="text-xs text-rose-700 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Persistent Shell Header */}
      <Header />

      {/* Context Strip (Asset, Pier, Commissioned Channels, Health) */}
      <ContextStrip />

      {/* Primary Analytical Tabs Navigation */}
      <NavigationTabs />

      {/* Main Analytical Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'bridge_sensors' && <BridgeSensorsTab />}
        {activeTab === 'river_intelligence' && <RiverIntelligenceTab />}
        {activeTab === 'ground_and_banks' && <GroundAndBanksTab />}
      </main>

      {/* Persistent Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">SAMAST</span>
            <span className="text-slate-300">|</span>
            <span>AnterVid Bridge Health Monitoring Specification (Bridge 249, Yamuna, Delhi)</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Synthetic Demonstration Environment</span>
            <span>•</span>
            <span>Version 1.0-monsoon26</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <EventDrawer />
      <DataSourcesModal />
      <ReportsModal />
      <ScenarioSwitcherModal />
      <ProvenanceDrawer target={provenanceTarget} onClose={closeProvenance} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
