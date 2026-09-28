import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QualityBadge } from '../shared/QualityBadge';
import { formatMetricValue } from '../../utils/formatters';
import { formatToIST, calculateAgeSeconds, formatAgeString } from '../../utils/dateUtils';
import { X, Cpu, Sliders, Shield, FileText, Activity, AlertOctagon, HelpCircle } from 'lucide-react';

export const SensorInspectorDrawer: React.FC = () => {
  const {
    selectedSensorId,
    sensors,
    observations,
    isSensorInspectorOpen,
    setIsSensorInspectorOpen,
    demoClockIso,
    openProvenance,
  } = useApp();

  const [activeInspectorTab, setActiveInspectorTab] = useState<
    'overview' | 'quality' | 'mount_config' | 'raw_data'
  >('overview');

  if (!isSensorInspectorOpen || !selectedSensorId) return null;

  const sensor = sensors.find((s) => s.id === selectedSensorId);
  if (!sensor) return null;

  const obs = observations.find((o) => o.sensorId === sensor.id);
  const primaryMetric = sensor.channels[0] || 'telemetry';
  const ageSec = obs ? calculateAgeSeconds(obs.observedAt, demoClockIso) : null;

  return (
    <div
      className="drawer-backdrop"
      onClick={() => setIsSensorInspectorOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded">
              <Cpu size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-slate-800">{sensor.id}</span>
                <QualityBadge quality={obs?.quality.state || 'missing'} reasons={obs?.quality.reasons} />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">{sensor.name}</h2>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
            onClick={() => setIsSensorInspectorOpen(false)}
            aria-label="Close Sensor Inspector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation inside Inspector */}
        <div className="flex border-b border-slate-200 bg-white text-xs px-4">
          <button
            type="button"
            onClick={() => setActiveInspectorTab('overview')}
            className={`py-2.5 px-3 border-b-2 font-medium transition ${
              activeInspectorTab === 'overview'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveInspectorTab('quality')}
            className={`py-2.5 px-3 border-b-2 font-medium transition ${
              activeInspectorTab === 'quality'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Quality & Diagnostics
          </button>
          <button
            type="button"
            onClick={() => setActiveInspectorTab('mount_config')}
            className={`py-2.5 px-3 border-b-2 font-medium transition ${
              activeInspectorTab === 'mount_config'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Mount Configuration
          </button>
          <button
            type="button"
            onClick={() => setActiveInspectorTab('raw_data')}
            className={`py-2.5 px-3 border-b-2 font-medium transition ${
              activeInspectorTab === 'raw_data'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Raw Data & Waveform
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-5 text-sm overflow-y-auto">
          {activeInspectorTab === 'overview' && (
            <div className="space-y-4">
              {/* Primary Value Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                    {primaryMetric}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                    {obs && obs.value !== null
                      ? formatMetricValue(obs.value, primaryMetric, sensor.units[primaryMetric])
                      : 'Not available'}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Obs: {obs ? formatToIST(obs.observedAt) : 'N/A'}</div>
                  <div className="font-semibold text-slate-700">
                    Age: {ageSec !== null ? formatAgeString(ageSec) : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Baseline Comparison */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2 text-xs">
                <div className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                  Approved Baseline Context ({sensor.baselineVersion})
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Baseline Target Value:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {sensor.baselineValues[primaryMetric]
                      ? `${sensor.baselineValues[primaryMetric].toFixed(3)} ${sensor.units[primaryMetric] || ''}`
                      : 'None set'}
                  </span>
                </div>
                {obs && obs.value !== null && sensor.baselineValues[primaryMetric] && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Delta from Baseline:</span>
                    <span
                      className={`font-mono font-bold ${
                        obs.value - sensor.baselineValues[primaryMetric] > 0.3
                          ? 'text-rose-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {(obs.value - sensor.baselineValues[primaryMetric] >= 0 ? '+' : '') +
                        (obs.value - sensor.baselineValues[primaryMetric]).toFixed(3)}{' '}
                      {sensor.units[primaryMetric]}
                    </span>
                  </div>
                )}
              </div>

              {/* Channel Capabilities List */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-800 uppercase tracking-wider text-xs">
                  Hardware Capability Profile
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                    <span className="text-slate-600">Commissioned:</span>
                    <span
                      className={`font-semibold ${
                        sensor.capabilities.isCommissioned ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {sensor.capabilities.isCommissioned ? 'Yes' : 'Planned'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                    <span className="text-slate-600">Calibration:</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {sensor.calibrationStatus}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                    <span className="text-slate-600">Raw Waveform:</span>
                    <span className="font-medium text-slate-500">
                      {sensor.capabilities.hasWaveform ? 'Available' : 'Gated / Scalar only'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                    <span className="text-slate-600">Modal Freq:</span>
                    <span className="font-medium text-slate-500">
                      {sensor.capabilities.hasModalFrequency ? 'Available' : 'Not supported'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provenance Button */}
              {obs && (
                <button
                  type="button"
                  onClick={() => openProvenance(`Sensor: ${sensor.name}`, obs)}
                  className="btn btn-secondary w-full text-xs"
                >
                  <FileText size={14} />
                  <span>View Full Provenance & Evidence Chain</span>
                </button>
              )}
            </div>
          )}

          {activeInspectorTab === 'quality' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div className="font-semibold text-slate-800 mb-1">Observation Quality Flag</div>
                <div className="flex items-center gap-2 mt-1">
                  <QualityBadge quality={obs?.quality.state || 'missing'} reasons={obs?.quality.reasons} />
                  <span className="text-slate-600 capitalize font-medium">{obs?.quality.state}</span>
                </div>
              </div>

              {obs?.quality.reasons && obs.quality.reasons.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900">
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <AlertOctagon size={13} className="text-amber-700" />
                    <span>Reported Quality Flags:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {obs.quality.reasons.map((r, i) => (
                      <li key={i} className="font-mono text-[11px]">
                        {r}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-800 mt-2 italic">
                    Note: A weak acoustic return flag indicates poor signal-to-noise ratio; it does not independently prove suspended sediment or high turbidity without water sampling.
                  </p>
                </div>
              )}

              <div className="p-3 bg-white border border-slate-200 rounded-md space-y-1.5">
                <div className="font-semibold text-slate-800">Uncertainty Bounds</div>
                {obs?.quality.uncertainty ? (
                  <div className="text-slate-700 font-mono">
                    ±{obs.quality.uncertainty.plusMinus} {obs.quality.uncertainty.unit}{' '}
                    (Coverage: {obs.quality.uncertainty.confidenceLevelPct || 95}% CL)
                  </div>
                ) : (
                  <div className="text-slate-400 italic">
                    Uncertainty not supplied in manufacturer packet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeInspectorTab === 'mount_config' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Physical Bracket & Mount Geometry
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Mount Bracket ID:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {sensor.mountReference.id}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Mount Type:</span>
                  <span className="capitalize text-slate-900">{sensor.mountReference.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Vertical Datum:</span>
                  <span className="font-semibold text-slate-900">
                    {sensor.mountReference.verticalDatum || 'Local Sensor Reference'}
                  </span>
                </div>
                {sensor.mountReference.mountingElevationM && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Mount Elevation:</span>
                    <span className="font-mono text-slate-900">
                      +{sensor.mountReference.mountingElevationM.toFixed(2)} m RL
                    </span>
                  </div>
                )}
                {sensor.mountReference.sensorOrientationDeg !== undefined && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Sensor Orientation:</span>
                    <span className="font-mono text-slate-900">
                      {sensor.mountReference.sensorOrientationDeg}° (Looking downstream)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeInspectorTab === 'raw_data' && (
            <div className="space-y-4 text-xs">
              {sensor.capabilities.hasWaveform ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="font-semibold text-slate-800 mb-2">Bounded Waveform Window (2.0s)</div>
                  <div className="h-28 bg-slate-900 text-emerald-400 p-2 font-mono text-[10px] rounded flex items-center justify-center">
                    [Waveform graph: 200 Hz sample rate, 400 samples, peak 0.046 m/s²]
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-2">
                  <Activity size={24} className="mx-auto text-slate-400" />
                  <div className="font-bold text-slate-800">
                    Waveform & Spectral Decomposition Gated
                  </div>
                  <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
                    The manufacturer's commissioned platform exports scalar Peak and RMS acceleration. A scalar peak value cannot reconstruct a frequency spectrum or identify structural natural modes.
                  </p>
                  <div className="inline-block px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-mono">
                    Capability: SCALAR_ONLY_BASELINE
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Channel: {sensor.id} on Pier {sensor.pierId}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsSensorInspectorOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
