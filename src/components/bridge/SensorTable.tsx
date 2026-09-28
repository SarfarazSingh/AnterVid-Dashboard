import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sensor, Observation } from '../../types/domain';
import { QualityBadge } from '../shared/QualityBadge';
import { formatMetricValue } from '../../utils/formatters';
import { formatToIST, calculateAgeSeconds, formatAgeString } from '../../utils/dateUtils';
import { Filter, ChevronRight, SlidersHorizontal, CheckCircle2, Clock } from 'lucide-react';

export const SensorTable: React.FC = () => {
  const {
    sensors,
    observations,
    selectedPierId,
    selectedSensorId,
    selectSensor,
    demoClockIso,
  } = useApp();

  const [filterCommissionedOnly, setFilterCommissionedOnly] = useState(false);
  const [filterPierOnly, setFilterPierOnly] = useState(false);

  // Filter sensors
  let displayedSensors = [...sensors];
  if (filterCommissionedOnly) {
    displayedSensors = displayedSensors.filter((s) => s.capabilities.isCommissioned);
  }
  if (filterPierOnly && selectedPierId) {
    displayedSensors = displayedSensors.filter((s) => s.pierId === selectedPierId);
  }

  return (
    <div className="samast-card">
      <div className="samast-card-header flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="samast-card-title">Bridge 249 Channel Inventory & Telemetry Status</span>
          <span className="text-xs text-slate-500 font-medium">
            ({displayedSensors.length} Channels Listed)
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
            <input
              type="checkbox"
              checked={filterCommissionedOnly}
              onChange={(e) => setFilterCommissionedOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Commissioned Only</span>
          </label>

          {selectedPierId && (
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
              <input
                type="checkbox"
                checked={filterPierOnly}
                onChange={(e) => setFilterPierOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Filter Pier {selectedPierId}</span>
            </label>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="samast-table-container">
        <table className="samast-table">
          <thead>
            <tr>
              <th>Channel ID</th>
              <th>Asset / Pier</th>
              <th>Device Type</th>
              <th>Primary Metric</th>
              <th>Last Value</th>
              <th>Quality</th>
              <th>Observed At (IST)</th>
              <th>Latency</th>
              <th>Baseline ID</th>
              <th>Calibration</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedSensors.map((sensor) => {
              const obs = observations.find((o) => o.sensorId === sensor.id);
              const isSelected = selectedSensorId === sensor.id;
              const primaryMetric = sensor.channels[0] || 'telemetry';
              const unit = sensor.units[primaryMetric] || '';
              const ageSec = obs ? calculateAgeSeconds(obs.observedAt, demoClockIso) : null;

              return (
                <tr
                  key={sensor.id}
                  onClick={() => selectSensor(sensor.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'selected' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="font-mono font-medium text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          sensor.capabilities.isCommissioned ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                      />
                      <span>{sensor.id}</span>
                    </div>
                  </td>
                  <td className="font-medium text-slate-700">
                    {sensor.pierId} ({sensor.name.split('(')[0].trim()})
                  </td>
                  <td className="text-slate-600 capitalize">
                    {sensor.deviceType.replace('_', ' ')}
                  </td>
                  <td className="font-mono text-xs text-slate-600">
                    {primaryMetric}
                  </td>
                  <td>
                    {sensor.capabilities.isCommissioned ? (
                      obs && obs.value !== null ? (
                        <span className="font-bold text-slate-900 font-mono">
                          {formatMetricValue(obs.value, primaryMetric, unit)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not available</span>
                      )
                    ) : (
                      <span className="text-amber-700 text-xs font-medium">Uncommissioned</span>
                    )}
                  </td>
                  <td>
                    {sensor.capabilities.isCommissioned ? (
                      <QualityBadge
                        quality={obs ? obs.quality.state : 'missing'}
                        reasons={obs?.quality.reasons}
                      />
                    ) : (
                      <span className="badge badge-stale">Planned</span>
                    )}
                  </td>
                  <td className="text-xs text-slate-600">
                    {obs ? formatToIST(obs.observedAt, false, true) : 'N/A'}
                  </td>
                  <td className="text-xs text-slate-500">
                    {ageSec !== null ? formatAgeString(ageSec) : 'N/A'}
                  </td>
                  <td className="font-mono text-xs text-slate-500">
                    {sensor.baselineVersion}
                  </td>
                  <td>
                    <span
                      className={`text-xs font-medium ${
                        sensor.calibrationStatus === 'valid'
                          ? 'text-emerald-700'
                          : sensor.calibrationStatus === 'due_soon'
                          ? 'text-amber-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {sensor.calibrationStatus === 'valid'
                        ? 'Valid'
                        : sensor.calibrationStatus === 'due_soon'
                        ? 'Due Soon'
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectSensor(sensor.id);
                      }}
                    >
                      <span>Inspect</span>
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
