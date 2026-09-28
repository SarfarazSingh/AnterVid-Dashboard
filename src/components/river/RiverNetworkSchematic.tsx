import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RiverStation } from '../../types/domain';
import { ArrowDown, Info, ShieldAlert, Waves, CheckCircle2, Map, List, Compass } from 'lucide-react';

export const RiverNetworkSchematic: React.FC = () => {
  const { riverStations, releaseBulletins } = useApp();
  const [selectedStationId, setSelectedStationId] = useState<string>('STA-HATHNIKUND');
  const [viewMode, setViewMode] = useState<'chain' | 'map'>('chain');

  const selectedStation = riverStations.find((s) => s.id === selectedStationId);
  const stationRelease = releaseBulletins.find((b) => b.barrageId === selectedStationId);

  return (
    <div className="samast-card h-full flex flex-col justify-between shadow-md border-slate-200">
      <div className="samast-card-header flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="samast-card-title flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Yamuna Hydrological Reach Network
          </span>
          <span className="text-[11px] text-slate-400 italic hidden sm:inline">(Upstream to Downstream)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('chain')}
              className={`px-2 py-0.5 rounded font-medium text-xs transition ${
                viewMode === 'chain'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reach Stations
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-2 py-0.5 rounded font-medium text-xs transition ${
                viewMode === 'map'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Basin Map
            </button>
          </div>

          <span className="badge badge-good hidden md:inline">Hydrology Reach</span>
        </div>
      </div>

      {viewMode === 'map' ? (
        /* Visual Hydrological Basin Map */
        <div className="relative w-full rounded overflow-hidden my-2 border border-slate-200 bg-slate-950 flex flex-col items-center">
          <img
            src="/images/yamuna_hydrology_network.jpg"
            alt="Yamuna River Hydrological Monitoring Network"
            className="w-full h-auto max-h-[380px] object-cover"
          />
          <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-xs text-white p-2 rounded shadow-md border border-slate-700 text-xs">
            <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Compass size={13} className="text-blue-400" />
              Catchment Telemetry & Elevation Gradient
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Hathnikund 215.3m → Wazirabad 202.8m → ORB 198.5m → Okhla 196.1m
            </div>
          </div>
        </div>
      ) : (
        /* Upstream to Downstream Schematic Chain */
        <div className="space-y-2 py-2">
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

                    <div className="flex items-center gap-2">
                      {station.type === 'barrage' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Barrage Control
                        </span>
                      )}
                      {station.type === 'cwc_gauge' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          Official CWC Gauge
                        </span>
                      )}
                      {station.type === 'local_radar' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Local Radar Site
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hydraulic Flow Vector between nodes */}
                {idx < riverStations.length - 1 && (
                  <div className="flex items-center justify-center text-blue-500 py-0.5">
                    <ArrowDown size={14} className="opacity-60" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Selected Station Telemetry Detail Drawer / Box */}
      {selectedStation && (
        <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-800">{selectedStation.name} Station Metadata</span>
            <span className="text-[11px] font-mono text-slate-500">ID: {selectedStation.id}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="text-slate-400">Station Type:</span>{' '}
              <strong className="text-slate-700 capitalize">{selectedStation.type.replace('_', ' ')}</strong>
            </div>
            <div>
              <span className="text-slate-400">Travel Time to Bridge:</span>{' '}
              <strong className="text-slate-700">
                {stationRelease?.travelTimeEstimateHours || '36 - 72h (Variable planning window)'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Vertical Datum:</span>{' '}
              <strong className="text-slate-700">{selectedStation.datumName || 'Unverified'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Official Warning Level:</span>{' '}
              <strong className="text-slate-700">
                {selectedStation.warningLevelM ? `${selectedStation.warningLevelM.toFixed(2)} m` : 'Not Defined'}
              </strong>
            </div>
          </div>

          {stationRelease && (
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">Latest Reported Release:</span>
              <span className="font-mono font-bold text-blue-700">
                {stationRelease.normalizedDischargeM3s.toLocaleString()} m³/s ({stationRelease.originalDischarge.toLocaleString()} cfs)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
