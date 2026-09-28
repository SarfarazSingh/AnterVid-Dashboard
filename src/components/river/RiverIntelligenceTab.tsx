import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../shared/MetricCard';
import { RiverStageChart } from './RiverStageChart';
import { RiverNetworkSchematic } from './RiverNetworkSchematic';
import { BarrageReleaseTable } from './BarrageReleaseTable';
import { RainfallPanel } from './RainfallPanel';
import { INITIAL_SOURCE_POLICIES } from '../../fixtures/baselineData';
import { FeedStateChip, LIVE_FEED_IDS, feedStateForSource } from '../shared/FeedStateChip';

export const RiverIntelligenceTab: React.FC = () => {
  const { observations, riverForecasts, rainfall, releaseBulletins, openProvenance, sourceStatuses } = useApp();

  const cwcPolicy = INITIAL_SOURCE_POLICIES['cwc-official'];
  const barragePolicy = INITIAL_SOURCE_POLICIES['barrage-bulletin'];
  const rainPolicy = INITIAL_SOURCE_POLICIES['open-meteo'] ?? INITIAL_SOURCE_POLICIES['nasa-imerg-early'];

  const cwcStatus = sourceStatuses.find((s) => s.sourceId === 'cwc-official');
  const rainStatus = sourceStatuses.find((s) => s.sourceId === 'open-meteo') ?? sourceStatuses.find((s) => s.sourceId === 'nasa-imerg-early');
  const glofasStatus = sourceStatuses.find((s) => s.sourceId === 'glofas');

  // CWC observation (ORB gauge)
  const cwcObs = observations.find((o) => o.metric === 'stage_m' && o.sensorId === null);
  const cwcDischarge = observations.find((o) => o.id === 'OBS-CWC-ORB-Q');
  const wazirabad = releaseBulletins.find(
    (b) => b.barrageId === 'STA-WAZIRABAD' && !b.isSuperseded,
  );

  // Upper basin rainfall
  const basinRain = rainfall.find((r) => r.locationType === 'upstream_basin');

  const officialFc = riverForecasts.find((f) => f.issuer === 'CWC Official');
  const glofasFc = riverForecasts.find((f) => f.issuer === 'GloFAS-ECMWF Model');
  const isHighStage = cwcObs && cwcObs.value !== null && cwcObs.value >= 204.50;
  const liveDischarge = glofasFc?.forecastPoints.find((p) => p.dischargeM3s != null)?.dischargeM3s;
  const rainHours = basinRain?.locationType === 'upstream_basin' ? 48 : 24;

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
          companion={
            liveDischarge != null
              ? {
                  label: 'GloFAS modelled discharge (not stage)',
                  value: `${Math.round(liveDischarge).toLocaleString('en-IN')} m³/s`,
                }
              : cwcDischarge && cwcDischarge.value !== null
              ? {
                  label: 'CWC daily discharge (fixture)',
                  value: `${Math.round(cwcDischarge.value).toLocaleString('en-IN')} cusecs`,
                }
              : undefined
          }
          feedState={feedStateForSource('cwc-official', cwcStatus?.accessState, LIVE_FEED_IDS)}
          onOpenProvenance={cwcObs ? () => openProvenance('Official CWC River Gauge (ORB)', cwcObs) : undefined}
        />

        {/* Card 2: Nearest upstream official release */}
        <MetricCard
          title="Wazirabad Release"
          subtitle="Nearest upstream barrage, 8.5 km"
          metric="discharge_cusecs"
          value={wazirabad?.originalDischarge}
          unit="cusecs"
          observedAt={wazirabad?.issueTime || ''}
          quality={{ state: 'good', reasons: [], uncertainty: null }}
          provenance={{
            sourceId: 'barrage-bulletin',
            origin: 'official_observation',
            sourceRecordId: wazirabad?.bulletinRef || '',
            methodVersion: 'gate-release-bulletin',
            baselineId: null,
            inputIds: ['STA-WAZIRABAD'],
            limitation: 'Observed barrage release. Not a water-level measurement at Bridge 249.',
          }}
          policy={barragePolicy}
          condition="within_range"
          feedState="fixture"
          companion={
            wazirabad
              ? {
                  label: 'Travel to Bridge 249',
                  value: wazirabad.travelTimeEstimateHours || 'Not modelled',
                }
              : undefined
          }
          onOpenProvenance={
            wazirabad
              ? () =>
                  openProvenance('Wazirabad Barrage Release Bulletin', {
                    sourceId: 'barrage-bulletin',
                    origin: 'official_observation',
                    sourceRecordId: wazirabad.bulletinRef,
                    issuer: wazirabad.issuer,
                    dischargeCusecs: wazirabad.originalDischarge,
                    dischargeM3s: Math.round(wazirabad.normalizedDischargeM3s),
                    limitation: 'Observed barrage release. Not a water-level measurement at Bridge 249.',
                  })
              : undefined
          }
        />

        {/* Card 3: Upstream Basin Rainfall */}
        <MetricCard
          title="Upstream Basin Rainfall"
          subtitle="Yamuna Catchment to Delhi"
          metric="rainfall_mm"
          value={basinRain?.accumulationMm}
          unit={`mm / ${rainHours}h`}
          observedAt={basinRain?.periodEnd || ''}
          quality={{ state: 'good', reasons: [], uncertainty: null }}
          provenance={{
            sourceId: basinRain?.source === 'Open-Meteo' ? 'open-meteo' : 'nasa-imerg-early',
            origin: 'model_forecast',
            sourceRecordId: basinRain?.id || '',
            methodVersion: 'open-meteo-forecast-v1',
            baselineId: null,
            inputIds: [],
            limitation: 'Grid-point precipitation, not a rain gauge at the bridge.',
          }}
          policy={rainPolicy}
          condition="within_range"
          feedState={feedStateForSource(
            basinRain?.source === 'Open-Meteo' ? 'open-meteo' : 'nasa-imerg-early',
            rainStatus?.accessState,
            LIVE_FEED_IDS
          )}
          onOpenProvenance={() =>
            openProvenance(basinRain?.source === 'Open-Meteo' ? 'Open-Meteo catchment rainfall' : 'Rainfall estimate', {
              sourceId: basinRain?.source === 'Open-Meteo' ? 'open-meteo' : 'nasa-imerg-early',
              origin: 'model_forecast',
              location: basinRain?.locationName,
              periodEnd: basinRain?.periodEnd,
              limitation: 'Not an in-situ rain gauge at the bridge.',
            })
          }
        />

        {/* Card 4: Forecast Status */}
        <div className="samast-card justify-between bg-white border-slate-200">
          <div>
            <div className="samast-card-header">
              <span className="samast-card-title">Forecast Outlook</span>
              {officialFc ? (
                <span className="badge badge-good">CWC stage</span>
              ) : glofasFc ? (
                <FeedStateChip state={feedStateForSource('glofas', glofasStatus?.accessState, LIVE_FEED_IDS)} />
              ) : (
                <span className="badge badge-warning">Outage</span>
              )}
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {officialFc
                  ? 'CWC bulletin'
                  : glofasFc
                  ? `${Math.round(liveDischarge ?? 0).toLocaleString('en-IN')} m³/s`
                  : 'No forecast'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {officialFc
                  ? 'Official CWC stage forecast is current.'
                  : glofasFc
                  ? 'GloFAS modelled discharge at the Bridge 249 grid cell. Not CWC gauge stage.'
                  : 'Official CWC forecast feed offline and GloFAS unavailable.'}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[11px]">{officialFc ? 'CWC Hydro Model' : 'GloFAS / Open-Meteo'}</span>
            <span className="text-[11px] text-slate-400">
              {officialFc
                ? `Issued ${officialFc.issueTime.slice(0, 16)}`
                : glofasFc
                ? `Issued ${glofasFc.issueTime.slice(0, 16)}`
                : ''}
            </span>
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
