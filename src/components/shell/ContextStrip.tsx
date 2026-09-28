import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin } from 'lucide-react';

export const ContextStrip: React.FC = () => {
  const {
    asset,
    piers,
    selectedPierId,
    sensors,
    observations,
    sourceStatuses,
  } = useApp();

  // Calculate commissioned channels count
  const commissionedSensors = sensors.filter((s) => s.capabilities.isCommissioned);
  const totalCommissioned = commissionedSensors.length;
  const degradedObservations = observations.filter((o) => o.quality.state === 'degraded' || o.quality.state === 'suspect');
  const missingObservations = observations.filter((o) => o.quality.state === 'missing' || o.quality.state === 'invalid');

  const samasthSource = sourceStatuses.find((s) => s.sourceId === 'samasth-gateway');
  const cwcSource = sourceStatuses.find((s) => s.sourceId === 'cwc-official');
  const imdSource = sourceStatuses.find((s) => s.sourceId === 'imd-aws');

  return (
    <div className="bg-slate-100/80 border-b border-slate-200 py-1.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
        {/* Left: Location & Channel Coverage */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <MapPin size={12} className="text-slate-400" />
            <span>Asset {asset?.id || 'BR-249'}</span>
            <span className="text-slate-400 font-normal">/</span>
            <span className="text-blue-700 font-medium">
              {selectedPierId
                ? piers.find((p) => p.id === selectedPierId)?.label.replace(/\s*\(.*\)$/, '') ?? selectedPierId
                : 'All spans'}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-300" />

          {/* Commissioned Channel Coverage */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Commissioned Channels:</span>
            <span className="font-semibold text-slate-800">
              {totalCommissioned - missingObservations.length}/{totalCommissioned} Active
            </span>
            {degradedObservations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {degradedObservations.length} Degraded
              </span>
            )}
            {missingObservations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                {missingObservations.length} Missing
              </span>
            )}
          </div>
        </div>

        {/* Right: Feeds Health Summary & Spatial Disclaimer */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Feed Health:</span>
            <span
              className={`inline-flex items-center gap-1 ${
                samasthSource?.accessState === 'current' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${samasthSource?.accessState === 'current' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              Samasth ({samasthSource?.accessState || 'current'})
            </span>
            <span className="text-slate-300">•</span>
            <span
              className={`inline-flex items-center gap-1 ${
                cwcSource?.accessState === 'current' ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cwcSource?.accessState === 'current' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              CWC ({cwcSource?.accessState || 'current'})
            </span>
            <span className="text-slate-300">•</span>
            <span
              className={`inline-flex items-center gap-1 ${
                imdSource?.accessState === 'current' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${imdSource?.accessState === 'current' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              IMD ({imdSource?.accessState === 'current' ? 'current' : 'auth req'})
            </span>
          </div>

          <div className="h-3 w-px bg-slate-300 hidden md:block" />

          {/* Spatial Notice */}
          <span className="text-slate-400 italic hidden lg:inline">
            Approx. 28.68°N, 77.25°E is demo viewport only — not surveyed coordinates
          </span>
        </div>
      </div>
    </div>
  );
};
