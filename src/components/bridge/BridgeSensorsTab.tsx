import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../shared/MetricCard';
import { BridgeSchematic } from './BridgeSchematic';
import { SensorTable } from './SensorTable';
import { SensorTrendChart } from './SensorTrendChart';
import { SensorInspectorDrawer } from './SensorInspectorDrawer';
import { INITIAL_SOURCE_POLICIES } from '../../fixtures/baselineData';
import { THRESHOLDS } from '../../utils/decisionEngine';
import { AlertTriangle, CheckCircle2, CircleHelp } from 'lucide-react';

export const BridgeSensorsTab: React.FC = () => {
  const {
    observations,
    sensors,
    piers,
    selectedPierId,
    selectSensor,
    selectedSensorId,
    openProvenance,
  } = useApp();

  const samasthPolicy = INITIAL_SOURCE_POLICIES['samasth-gateway'];

  const son2 = observations.find((o) => o.sensorId === 'P11-SON-02');
  const vib = observations.find((o) => o.sensorId === 'P11-VT-01' && o.metric === 'vibration_peak');
  const tilt = observations.find((o) => o.sensorId === 'P11-VT-01' && o.metric === 'tilt_transverse');
  const pwr = observations.find((o) => o.sensorId === 'GW-KLEON-01' && o.metric === 'battery_voltage');

  const sonarRows = sensors
    .filter((s) => s.deviceType === 'sonar' && s.pierId === 'P11')
    .map((s) => {
      const obs = observations.find((o) => o.sensorId === s.id && o.metric === 'sonar_range');
      const baseline = s.baselineValues.sonar_range;
      const delta = obs && obs.value !== null && baseline !== undefined ? obs.value - baseline : null;
      return { sensor: s, obs, baseline, delta };
    });
  const s2Row = sonarRows.find((r) => r.sensor.id === 'P11-SON-02');
  const s2Baseline = s2Row?.baseline ?? 8.41;
  const s2Delta = s2Row?.delta ?? null;
  const isS2ScourAlert = s2Delta !== null && s2Delta >= THRESHOLDS.scourWatchM;
  const allSonarUnavailable = sonarRows.length > 0 && sonarRows.every((r) => r.delta === null);
  const selectedPierLabel = piers.find((p) => p.id === selectedPierId)?.label ?? 'Pier 11';

  return (
    <div className="space-y-6">
      {/* 4 Primary Top Summary Cards */}
      <div className="grid-4-col">
        {/* Card 1: Sonar Coverage & Scour Depth */}
        <MetricCard
          title="Sonar Scour & Bed Range"
          subtitle="Pier 11 Mid Flow-Face"
          metric="sonar_range"
          value={son2?.value}
          unit="m"
          observedAt={son2?.observedAt || ''}
          quality={son2?.quality || { state: 'missing', reasons: [], uncertainty: null }}
          provenance={son2?.provenance || { sourceId: 'samasth-gateway', origin: 'manufacturer_sensor', sourceRecordId: '', methodVersion: null, baselineId: null, inputIds: [] }}
          policy={samasthPolicy}
          condition={isS2ScourAlert ? 'warning' : 'within_range'}
          comparisonBaseline={
            s2Delta === null
              ? undefined
              : {
                  label: 'Delta from monsoon baseline',
                  baselineValue: s2Baseline,
                  delta: s2Delta,
                  unit: 'm',
                }
          }
          isSelected={selectedSensorId === 'P11-SON-02'}
          onClick={() => selectSensor('P11-SON-02')}
          onOpenProvenance={son2 ? () => openProvenance('Sonar 02 (Mid Flow-Face)', son2) : undefined}
        />

        {/* Card 2: Pier Dynamic Vibration */}
        <MetricCard
          title="Pier Vibration (Peak)"
          subtitle="P11 Cap Transverse Axis"
          metric="vibration_peak"
          value={vib?.value}
          unit="m/s²"
          observedAt={vib?.observedAt || ''}
          quality={vib?.quality || { state: 'good', reasons: [], uncertainty: null }}
          provenance={vib?.provenance || { sourceId: 'samasth-gateway', origin: 'manufacturer_sensor', sourceRecordId: '', methodVersion: null, baselineId: null, inputIds: [] }}
          policy={samasthPolicy}
          condition="within_range"
          isSelected={selectedSensorId === 'P11-VT-01'}
          onClick={() => selectSensor('P11-VT-01')}
          onOpenProvenance={vib ? () => openProvenance('Pier 11 Vibration Sensor', vib) : undefined}
        />

        {/* Card 3: Inclinometer / Bi-axial Tilt */}
        <MetricCard
          title="Pier Tilt / Inclination"
          subtitle="Bi-axial Transverse"
          metric="tilt_transverse"
          value={tilt?.value}
          unit="deg"
          observedAt={tilt?.observedAt || ''}
          quality={tilt?.quality || { state: 'good', reasons: [], uncertainty: null }}
          provenance={tilt?.provenance || { sourceId: 'samasth-gateway', origin: 'manufacturer_sensor', sourceRecordId: '', methodVersion: null, baselineId: null, inputIds: [] }}
          policy={samasthPolicy}
          condition="within_range"
          isSelected={selectedSensorId === 'P11-VT-01'}
          onClick={() => selectSensor('P11-VT-01')}
          onOpenProvenance={tilt ? () => openProvenance('Pier 11 Tilt Sensor', tilt) : undefined}
        />

        {/* Card 4: Gateway Telemetry & Solar Power */}
        <MetricCard
          title="KLEON Gateway & Power"
          subtitle="Cabinet Shared Battery"
          metric="battery_voltage"
          value={pwr?.value}
          unit="V"
          observedAt={pwr?.observedAt || ''}
          quality={pwr?.quality || { state: 'good', reasons: [], uncertainty: null }}
          provenance={pwr?.provenance || { sourceId: 'samasth-gateway', origin: 'manufacturer_sensor', sourceRecordId: '', methodVersion: null, baselineId: null, inputIds: [] }}
          policy={samasthPolicy}
          condition="within_range"
          isSelected={selectedSensorId === 'GW-KLEON-01'}
          onClick={() => selectSensor('GW-KLEON-01')}
          onOpenProvenance={pwr ? () => openProvenance('KLEON Gateway Telemetry', pwr) : undefined}
        />
      </div>

      {/* Middle Row: Bridge Elevation Schematic (2/3) + Pier Evidence Summary (1/3) */}
      <div className="grid-2-col">
        {/* Bridge Schematic */}
        <div>
          <BridgeSchematic />
        </div>

        {/* Pier Status & Evidence Summary Card */}
        <div className="samast-card justify-between">
          <div>
            <div className="samast-card-header">
              <span className="samast-card-title">Pier Evidence & Procedural Guidance</span>
              <span className={`badge ${allSonarUnavailable ? 'badge-stale' : 'badge-good'}`}>
                {allSonarUnavailable ? 'P11 sonar offline' : 'P11 monitored'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div className="font-semibold text-slate-800 mb-1 flex items-center justify-between gap-2">
                  <span>Selected: {selectedPierLabel}</span>
                  <span className="text-[11px] font-mono text-slate-500">Asset: BR-249</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Three downward acoustic sonar transducers are mounted on P11 at +208.50m RL. One combined vibration and bi-axial inclinometer measures dynamic cap response.
                </p>
              </div>

              {allSonarUnavailable ? (
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-md text-slate-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CircleHelp size={14} className="text-slate-500" />
                    <span>Bed condition unknown</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    No sonar channel is reporting. Missing readings are not treated as zero; arrange a manual sounding if
                    the river is high.
                  </p>
                </div>
              ) : isS2ScourAlert && s2Delta !== null ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-md text-rose-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800">
                    <AlertTriangle size={15} className="text-rose-600" />
                    <span>Watch level exceeded: Sonar 02 bed lowering</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Bed lowered {s2Delta.toFixed(3)} m below the monsoon baseline (watch at{' '}
                    {THRESHOLDS.scourWatchM.toFixed(2)} m).
                  </p>
                  <div className="mt-2 pt-2 border-t border-rose-200/60 text-[11px] font-semibold text-rose-950">
                    Procedural action: SOP-NR-BHM-04
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Verify acoustic return quality and channel agreement before field escalation.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Bed elevation within baseline tolerance</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Reporting sonar channels are below the {THRESHOLDS.scourWatchM.toFixed(2)} m watch level.
                  </p>
                </div>
              )}

              {/* Channel Availability breakdown */}
              <div className="p-3 bg-white border border-slate-200 rounded-md space-y-1.5">
                <div className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Pier 11 acoustic concordance
                </div>
                {sonarRows.map(({ sensor, obs, delta }) => {
                  const exceeds = delta !== null && delta >= THRESHOLDS.scourWatchM;
                  const degraded = obs?.quality.state === 'degraded' || obs?.quality.state === 'suspect';
                  return (
                    <div key={sensor.id} className="flex justify-between gap-2 py-0.5">
                      <span className="text-slate-500">{sensor.name.split(' (')[0]}:</span>
                      <span className={`font-mono text-right ${exceeds ? 'font-bold text-rose-700' : 'text-slate-800'}`}>
                        {obs && obs.value !== null && delta !== null
                          ? `${obs.value.toFixed(3)} m (${delta >= 0 ? '+' : ''}${delta.toFixed(3)} m)`
                          : 'Not available'}
                        {degraded && <span className="text-amber-700 text-[10px] ml-1">(degraded return)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Baseline: v1.2-monsoon26</span>
            <span className="text-slate-400">Approved by P. Sharma</span>
          </div>
        </div>
      </div>

      {/* Sensor Channel Inventory Table */}
      <SensorTable />

      {/* Linked Telemetry Time Series Chart */}
      <SensorTrendChart />

      {/* Keyboard-accessible Sensor Inspector Drawer */}
      <SensorInspectorDrawer />
    </div>
  );
};
