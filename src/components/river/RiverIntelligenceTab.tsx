import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../shared/MetricCard';
import { RiverStageChart } from './RiverStageChart';
import { RiverNetworkSchematic } from './RiverNetworkSchematic';
import { BarrageReleaseTable } from './BarrageReleaseTable';
import { RainfallPanel } from './RainfallPanel';
import { INITIAL_SOURCE_POLICIES } from '../../fixtures/baselineData';
import { Waves, CloudRain, Radio, Compass } from 'lucide-react';

export const RiverIntelligenceTab: React.FC = () => {
  const { observations, riverForecasts, rainfall, sourceStatuses, openProvenance } = useApp();

  const cwcPolicy = INITIAL_SOURCE_POLICIES['cwc-official'];
  const samasthPolicy = INITIAL_SOURCE_POLICIES['samasth-gateway'];
  const imergPolicy = INITIAL_SOURCE_POLICIES['nasa-imerg-early'];

  // CWC observation (ORB gauge)
  const cwcObs = observations.find((o) => o.metric === 'stage_m' && o.sensorId === null);
  // Local radar observation
  const radarObs = observations.find((o) => o.sensorId === 'RADAR-BR249-01');

  // Upper basin rainfall
  const basinRain = rainfall.find((r) => r.locationType === 'upstream_basin');

  // Active forecast count
  const activeFc = riverForecasts.find((f) => f.issuer === 'CWC Official');
  const isHighStage = cwcObs && cwcObs.value !== null && cwcObs.value >= 204.50;

  return (
    <div className="space-y-6">
      {/* 4 Top Summary Cards */}
      <div className="grid-4-col">
        {/* Card 1: Official CWC Gauge (ORB) */}
        <MetricCard
          title="Official CWC Stage"
          subtitle="Old Railway Bridge (ORB)"
          metric="stage_m"
          value={cwcObs?.value}
          unit="m MSL"
          observedAt={cwcObs?.observedAt || ''}
          quality={cwcObs?.quality || { state: 'good', reasons: [], uncertainty: null }}
          provenance={cwcObs?.provenance || { sourceId: 'cwc-official', origin: 'official_observation', sourceRecordId: '', methodVersion: null, baselineId: null, inputIds: [] }}
          policy={cwcPolicy}
          condition={isHighStage ? 'warning' : 'within_range'}
          comparisonBaseline={{
            label: 'Margin to Warning Level (204.50m)',
            baselineValue: 204.50,
            delta: cwcObs?.value ? cwcObs.value - 204.50 : 0,
            unit: 'm',
          }}
          onOpenProvenance={cwcObs ? () => openProvenance('Official CWC River Gauge (ORB)', cwcObs) : undefined}
        />

        {/* Card 2: Local River Radar (Bridge 249) */}
        <MetricCard
          title="Local River Radar"
          subtitle="Bridge 249 Span 11 (Independent from CWC)"
          metric="distance_to_water"
          value={radarObs?.value}
          unit="m"
          observedAt={radarObs?.observedAt || ''}
          quality={radarObs?.quality || { state: 'good', reasons: [], uncertainty: null }}
          provenance={radarObs?.provenance || { sourceId: 'samasth-gateway', origin: 'manufacturer_sensor', sourceRecordId: '', methodVersion: null, baselineId: null, inputIds: [] }}
          policy={samasthPolicy}
          condition="within_range"
          onOpenProvenance={radarObs ? () => openProvenance('Local River Radar (Bridge 249)', radarObs) : undefined}
        />

        {/* Card 3: Upstream Basin Rainfall */}
        <MetricCard
          title="Upstream Basin Rainfall"
          subtitle="Yamuna Catchment to Delhi"
          metric="rainfall_mm"
          value={basinRain?.accumulationMm}
          unit="mm / 48h"
          observedAt={basinRain?.periodEnd || ''}
          quality={{ state: 'good', reasons: [], uncertainty: null }}
          provenance={{
            sourceId: 'nasa-imerg-early',
            origin: 'satellite_observation',
            sourceRecordId: 'GPM-IMERG-20260912',
            methodVersion: 'IMERG-V07-Early',
            baselineId: null,
            inputIds: [],
          }}
          policy={imergPolicy}
          condition="within_range"
          onOpenProvenance={() =>
            openProvenance('NASA IMERG Early Gridded Rainfall', {
              sourceId: 'nasa-imerg-early',
              origin: 'satellite_observation',
              methodVersion: 'IMERG-Early-0.1deg',
              coverage: '94.2% valid catchment cells',
              limitation: 'Delayed gridded satellite estimate; not an in-situ rain gauge at the bridge.',
            })
          }
        />

        {/* Card 4: Forecast Status */}
        <div className="samast-card justify-between bg-white border-slate-200">
          <div>
            <div className="samast-card-header">
              <span className="samast-card-title">Forecast Outlook</span>
              <span className="badge badge-good">24h Horizon</span>
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeFc ? 'Active Bulletin' : 'Outage'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {activeFc
                  ? `Peak projection ~204.82m MSL at +15h horizon`
                  : 'Official CWC forecast feed offline'}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[11px]">CWC Hydro Model</span>
            <span className="text-[11px] text-slate-400">Issued 06:00 UTC</span>
          </div>
        </div>
      </div>

      {/* Middle Row: River Stage Chart (2/3) + Hydrological Sequence (1/3) */}
      <div className="grid-2-col">
        <div>
          <RiverStageChart />
        </div>
        <div>
          <RiverNetworkSchematic />
        </div>
      </div>

      {/* Barrage Release Bulletins Register */}
      <BarrageReleaseTable />

      {/* Catchment Precipitation Panel */}
      <RainfallPanel />
    </div>
  );
};
