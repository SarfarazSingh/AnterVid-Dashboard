import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RainfallData } from '../../types/domain';
import { formatToIST } from '../../utils/dateUtils';
import { CloudRain, Satellite, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

export const RainfallPanel: React.FC = () => {
  const { rainfall, sourceStatuses } = useApp();
  const [selectedLocation, setSelectedLocation] = useState<
    'local_delhi' | 'upstream_basin' | 'subbasin_yamunanagar'
  >('upstream_basin');

  const imdStatus = sourceStatuses.find((s) => s.sourceId === 'imd-aws');
  const imergStatus = sourceStatuses.find((s) => s.sourceId === 'nasa-imerg-early');

  const activeRainfall = rainfall.find((r) => r.locationType === selectedLocation);

  return (
    <div className="samast-card">
      <div className="samast-card-header flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="samast-card-title">Catchment Precipitation & Hydrological Inflow</span>
          <span className="text-xs text-slate-400 font-normal">
            (Separates local city showers from upstream basin rainfall)
          </span>
        </div>

        {/* Catchment Scope Tabs */}
        <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50 text-xs">
          <button
            type="button"
            onClick={() => setSelectedLocation('upstream_basin')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              selectedLocation === 'upstream_basin'
                ? 'bg-white shadow-xs text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upper Yamuna Basin (Catchment)
          </button>
          <button
            type="button"
            onClick={() => setSelectedLocation('subbasin_yamunanagar')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              selectedLocation === 'subbasin_yamunanagar'
                ? 'bg-white shadow-xs text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yamunanagar Subbasin
          </button>
          <button
            type="button"
            onClick={() => setSelectedLocation('local_delhi')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              selectedLocation === 'local_delhi'
                ? 'bg-white shadow-xs text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Local Delhi District
          </button>
        </div>
      </div>

      {/* Main Rainfall Details */}
      {activeRainfall && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
          {/* Main Total Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                {activeRainfall.locationName}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {activeRainfall.accumulationMm.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-slate-500">mm total</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
              <CloudRain size={14} className="text-blue-600" />
              <span>Accumulation: 48h Period Depth</span>
            </div>
          </div>

          {/* Provenance & Algorithm Support */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
            <div className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
              Source & Science Support
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Sensor / Product:</span>
              <span className="font-medium text-slate-900">{activeRainfall.source}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Valid Spatial Coverage:</span>
              <span className="font-mono font-medium text-slate-900">
                {activeRainfall.validCoveragePct.toFixed(1)}% of basin
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Product Science Latency:</span>
              <span className="font-mono font-bold text-amber-800">
                ~{activeRainfall.observationLatencyHours}h true latency
              </span>
            </div>
          </div>

          {/* Floodplain & IMD Warning Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-col justify-between">
            <div>
              <div className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                Catchment Runoff Context
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                {selectedLocation === 'local_delhi'
                  ? 'Local Delhi rainfall influences urban drainage and storm outfalls near the bridge; does not dictate river channel surge.'
                  : 'Upstream Paonta Sahib & Hathnikund precipitation routes through regulated barrages with a 36-72 hour travel window.'}
              </p>
            </div>
            {activeRainfall.warningCategory && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                <ShieldCheck size={13} />
                <span>IMD Warning: {activeRainfall.warningCategory}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IMD Auth Notice / IMERG Disclaimer */}
      {imdStatus?.accessState === 'authentication_required' && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
            <span>
              IMD API Gateway unauthenticated (HTTP 401). Gridded rainfall estimates provided by NASA GPM IMERG Early (0.1° grid, ~4h nominal latency).
            </span>
          </div>
          <span className="badge badge-watch">IMERG Early Fallback</span>
        </div>
      )}
    </div>
  );
};
