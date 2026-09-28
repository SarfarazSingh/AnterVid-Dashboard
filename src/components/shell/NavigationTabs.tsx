import React from 'react';
import { useApp, PrimaryTab } from '../../context/AppContext';
import { Cpu, Waves, Mountain } from 'lucide-react';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, events, transects } = useApp();

  const scourEvents = events.filter(
    (e) => (e.category === 'scour' || e.category === 'sensor_health') && e.workflowStatus === 'unacknowledged'
  );
  const riverEvents = events.filter(
    (e) => e.category === 'river' && e.workflowStatus === 'unacknowledged'
  );
  const candidateTransects = transects.filter((t) => t.reviewState === 'candidate');

  const tabs: {
    id: PrimaryTab;
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeVariant?: 'warning' | 'watch' | 'info';
  }[] = [
    {
      id: 'bridge_sensors',
      label: 'Bridge sensors',
      icon: Cpu,
      badgeCount: scourEvents.length,
      badgeVariant: scourEvents.some((e) => e.condition === 'warning') ? 'warning' : 'watch',
    },
    {
      id: 'river_intelligence',
      label: 'River intelligence',
      icon: Waves,
      badgeCount: riverEvents.length,
      badgeVariant: 'warning',
    },
    {
      id: 'ground_and_banks',
      label: 'Ground and banks',
      icon: Mountain,
      badgeCount: candidateTransects.length,
      badgeVariant: 'info',
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200" aria-label="Main analytical views">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-1 border-b-2 font-semibold text-sm transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{tab.label}</span>

                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      tab.badgeVariant === 'warning'
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : tab.badgeVariant === 'watch'
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}
                  >
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
