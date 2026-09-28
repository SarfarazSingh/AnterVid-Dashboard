import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RiverStation } from '../../types/domain';
import { ArrowDown, Info, ShieldAlert, Waves, CheckCircle2 } from 'lucide-react';

export const RiverNetworkSchematic: React.FC = () => {
  const { riverStations, releaseBulletins } = useApp();
  const [selectedStationId, setSelectedStationId] = useState<string>('STA-HATHNIKUND');

  const selectedStation = riverStations.find((s) => s.id === selectedStationId);
  const stationRelease = releaseBulletins.find((b) => b.barrageId === selectedStationId);

  return (
    <div className="samast-card h-full flex flex-col justify-between">
      <div className="samast-card-header">
        <div className="flex items-center gap-1.5">
          <span className="samast-card-title">Yamuna Hydrological Reach Network</span>
          <span className="text-[11px] text-slate-400 italic">(Upstream to Downstream)</span>
        </div>
        <span className="badge badge-good">Hydrology Reach</span>
      </div>

      {/* Upstream to Downstream Schematic Chain */}
      <div className="space-y-2 py-1">
        {riverStations.map((station, idx) => {
          const isSelected = selectedStationId === station.id;
          const isBridgeSite = station.id === 'STA-BR249-RADAR';
          const isCwcOrb = station.id === 'STA-ORB-CWC';

          let bgClass = 'bg-slate-50 border-slate-200 hover:bg-slate-100';
          if (isSelected) {
            bgClass = 'bg-blue-50 border-blue-400 ring-1 ring-blue-300';
          } else if (isBridgeSite) {
            bgClass = 'bg-emerald-50/70 border-emerald-300';
          }

          return (
            <React.Fragment key={station.id}>
              <div
                onClick={() => setSelectedStationId(station.id)}
                className={`p-2.5 border rounded-md cursor-pointer transition-all ${bgClass}`}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900">{station.name}</span>
                      <span className="ml-1.5 text-[11px] text-slate-500 font-mono">
                        ({station.distanceKmFromBridge === 0
                          ? 'Site Zero'
                          : station.distanceKmFromBridge < 0
                          ? `${Math.abs(station.distanceKmFromBridge)} km Upstream`
                          : `${station.distanceKmFromBridge} km Downstream`})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {isCwcOrb && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Official CWC Datum
                      </span>
                    )}
                    {isBridgeSite && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Local Bridge Site
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {idx < riverStations.length - 1 && (
                <div className="flex justify-center my-0.5">
                  <ArrowDown size={14} className="text-slate-300" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Selected Station Detail Box */}
      {selectedStation && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center justify-between">
            <span>{selectedStation.name}</span>
            <span className="text-slate-500 font-normal capitalize">
              {selectedStation.type.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between py-0.5 border-t border-slate-200">
            <span className="text-slate-500">Vertical Datum:</span>
            <span className="font-medium text-slate-800">{selectedStation.datumName}</span>
          </div>

          {stationRelease && (
            <div className="space-y-1 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Latest Discharge:</span>
                <span className="font-mono font-bold text-blue-800">
                  {stationRelease.originalDischarge.toLocaleString()} {stationRelease.originalUnit} (
                  {Math.round(stationRelease.normalizedDischargeM3s).toLocaleString()} m³/s)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 italic">
                {stationRelease.travelTimeEstimateHours || 'Travel time dependent on river stage.'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
