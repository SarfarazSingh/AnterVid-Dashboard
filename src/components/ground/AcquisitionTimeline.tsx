import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatToIST } from '../../utils/dateUtils';
import { Satellite, Cloud, CheckCircle2, XCircle, Info, Calendar } from 'lucide-react';

interface AcquisitionTimelineProps {
  selectedSceneId: string;
  onSelectScene: (id: string) => void;
}

export const AcquisitionTimeline: React.FC<AcquisitionTimelineProps> = ({
  selectedSceneId,
  onSelectScene,
}) => {
  const { scenes, openProvenance } = useApp();

  return (
    <div className="samast-card">
      <div className="samast-card-header flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="samast-card-title">Satellite Mission Acquisition & Local QA Timeline</span>
          <span className="text-xs text-slate-500 font-medium">
            (Separates tile-level cloud percentage from bridge corridor usability)
          </span>
        </div>

        <div className="text-[11px] text-slate-500">
          Showing {scenes.length} Intersecting Granules (CDSE & NASA CMR)
        </div>
      </div>

      {/* Horizontal Timeline Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-2">
        {scenes.map((scene) => {
          const isSelected = selectedSceneId === scene.id;
          const isUsable = scene.localUsabilityState === 'usable';
          const isCloudy = scene.localUsabilityState === 'cloud_obscured';
          const isProvisional = scene.maturity === 'provisional';

          let borderStyle = 'border-slate-200 hover:border-slate-300';
          let bgStyle = 'bg-white';

          if (isSelected) {
            borderStyle = 'border-blue-500 ring-2 ring-blue-100';
            bgStyle = 'bg-blue-50/30';
          } else if (isCloudy) {
            borderStyle = 'border-amber-200';
            bgStyle = 'bg-amber-50/30';
          }

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`p-3 rounded-md border cursor-pointer transition-all ${borderStyle} ${bgStyle}`}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center justify-between gap-1 text-xs mb-1.5">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <Satellite size={13} className="text-blue-600" />
                  <span>{scene.mission}</span>
                </div>
                <span
                  className={`badge ${
                    isUsable ? 'badge-good' : isCloudy ? 'badge-watch' : 'badge-stale'
                  }`}
                >
                  {isUsable ? 'Usable' : isCloudy ? 'Cloud Obscured' : 'Provisional'}
                </span>
              </div>

              {/* Date */}
              <div className="text-xs font-mono font-medium text-slate-700">
                {formatToIST(scene.acquisitionTimes[0])}
              </div>

              {/* Quality & Cloud Stats */}
              <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Local Corridor Cloud:</span>
                  <span className={`font-mono font-bold ${scene.localCorridorCloudPct > 50 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {scene.localCorridorCloudPct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Whole Tile Cloud:</span>
                  <span className="font-mono">{scene.cloudCoverTotalPct.toFixed(1)}%</span>
                </div>
              </div>

              {/* Exclusion Reason or Maturity Note */}
              {scene.rejectionReason && (
                <div className="mt-2 text-[10px] text-amber-800 italic bg-amber-50 p-1.5 rounded border border-amber-200">
                  {scene.rejectionReason}
                </div>
              )}

              {isProvisional && (
                <div className="mt-2 text-[10px] text-blue-800 font-semibold bg-blue-50 p-1 rounded border border-blue-200">
                  Provisional V1 (NASA ASF)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
