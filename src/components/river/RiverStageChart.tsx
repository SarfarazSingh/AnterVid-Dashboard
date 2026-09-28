import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RiverForecast } from '../../types/domain';
import { formatToIST } from '../../utils/dateUtils';
import { AlertTriangle, Info, Calendar } from 'lucide-react';

export const RiverStageChart: React.FC = () => {
  const { riverForecasts, observations, sourceStatuses } = useApp();

  const [activeTab, setActiveTab] = useState<'stage' | 'discharge_model'>('stage');

  const cwcSource = sourceStatuses.find((s) => s.sourceId === 'cwc-official');
  const isForecastOutage = cwcSource && cwcSource.accessState === 'temporarily_unavailable';

  // 12-hour hourly observation points for CWC Old Railway Bridge Gauge
  const obsPoints = [
    { time: '11 Sep 20:00', stage: 203.95 },
    { time: '11 Sep 22:00', stage: 204.02 },
    { time: '12 Sep 00:00', stage: 204.08 },
    { time: '12 Sep 02:00', stage: 204.14 },
    { time: '12 Sep 04:00', stage: 204.18 },
    { time: '12 Sep 06:00', stage: 204.22 },
    { time: '12 Sep 08:00', stage: 204.28 }, // Current latest observation
  ];

  // Official CWC forecast points (dashed line)
  const officialFc = riverForecasts.find((f) => f.issuer === 'CWC Official');
  const fcPoints = officialFc && !isForecastOutage ? officialFc.forecastPoints : [];

  // GloFAS daily discharge points
  const glofasFc = riverForecasts.find((f) => f.issuer === 'GloFAS-ECMWF Model');

  // Chart Dimensions
  const chartW = 760;
  const chartH = 240;
  const padLeft = 55;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 40;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  const yMin = 203.5;
  const yMax = 205.6;

  const totalPoints = 14; // Combined time span
  const getX = (idx: number) => padLeft + (idx / (totalPoints - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

  // Build SVG path string for observations
  const obsPathD = obsPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)},${getY(pt.stage)}`)
    .join(' ');

  // Build SVG path for forecast starting from last observation
  let fcPathD = '';
  if (fcPoints.length > 0) {
    const startX = getX(obsPoints.length - 1);
    const startY = getY(obsPoints[obsPoints.length - 1].stage);
    fcPathD = `M ${startX},${startY} ` + fcPoints
      .map((pt, idx) => `L ${getX(obsPoints.length + idx)},${getY(pt.stageM || 204.4)}`)
      .join(' ');
  }

  const warningY = getY(204.50);
  const dangerY = getY(205.33);

  return (
    <div className="samast-card">
      <div className="samast-card-header flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="samast-card-title">Old Railway Bridge (ORB) Stage & CWC Forecast</span>
          <span className="text-[11px] text-slate-400">
            (Survey of India MSL Datum — Station ID: STA-ORB-CWC)
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 text-xs">
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setActiveTab('stage')}
              className={`px-2.5 py-0.5 rounded font-medium ${
                activeTab === 'stage' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'
              }`}
            >
              Stage (m MSL)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discharge_model')}
              className={`px-2.5 py-0.5 rounded font-medium ${
                activeTab === 'discharge_model' ? 'bg-white shadow-xs text-blue-700 font-semibold' : 'text-slate-600'
              }`}
            >
              GloFAS Discharge (m³/s)
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'stage' ? (
        <div className="w-full overflow-x-auto py-2">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full min-w-[680px] h-auto select-none">
            {/* Horizontal Gridlines */}
            {[203.5, 204.0, 204.5, 205.0, 205.5].map((lvl) => {
              const y = getY(lvl);
              return (
                <g key={lvl}>
                  <line x1={padLeft} y1={y} x2={chartW - padRight} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={padLeft - 8} y={y + 3.5} fill="#94a3b8" fontSize="10" textAnchor="end" className="font-mono">
                    {lvl.toFixed(2)}m
                  </text>
                </g>
              );
            })}

            {/* Official Danger Level (205.33m) */}
            <line x1={padLeft} y1={dangerY} x2={chartW - padRight} y2={dangerY} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="5,4" />
            <text x={chartW - padRight - 5} y={dangerY - 4} fill="#b91c1c" fontSize="9.5" fontWeight="700" textAnchor="end">
              Official Danger Level: 205.33m MSL
            </text>

            {/* Official Warning Level (204.50m) */}
            <line x1={padLeft} y1={warningY} x2={chartW - padRight} y2={warningY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" />
            <text x={chartW - padRight - 5} y={warningY - 4} fill="#d97706" fontSize="9.5" fontWeight="700" textAnchor="end">
              Official Warning Level: 204.50m MSL
            </text>

            {/* Shaded Forecast Horizon Background */}
            <rect
              x={getX(obsPoints.length - 1)}
              y={padTop}
              width={plotW - (getX(obsPoints.length - 1) - padLeft)}
              height={plotH}
              fill="#f8fafc"
              opacity="0.8"
            />
            <text x={getX(obsPoints.length - 1) + 8} y={padTop + 14} fill="#64748b" fontSize="9" fontWeight="600">
              FORECAST HORIZON (Issue: 12 Sep 06:00 UTC)
            </text>

            {/* Observation Line (Solid Blue) */}
            <path d={obsPathD} fill="none" stroke="#2563eb" strokeWidth="2.5" />

            {/* Observed Data Points */}
            {obsPoints.map((pt, idx) => (
              <circle key={pt.time} cx={getX(idx)} cy={getY(pt.stage)} r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
            ))}

            {/* Current Observation Anchor Callout */}
            <circle cx={getX(obsPoints.length - 1)} cy={getY(obsPoints[obsPoints.length - 1].stage)} r="4.5" fill="#1e40af" stroke="#ffffff" strokeWidth="2" />

            {/* Forecast Line (Dashed Red/Purple) or Outage Notice */}
            {!isForecastOutage && fcPathD ? (
              <path d={fcPathD} fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="6,4" />
            ) : isForecastOutage ? (
              <g>
                <rect
                  x={getX(obsPoints.length) + 10}
                  y={plotH / 2}
                  width={220}
                  height={32}
                  fill="#fef2f2"
                  stroke="#fecaca"
                  rx="4"
                />
                <text x={getX(obsPoints.length) + 120} y={plotH / 2 + 16} fill="#991b1b" fontSize="9.5" fontWeight="600" textAnchor="middle">
                  CWC Forecast Outage (HTTP 503)
                </text>
                <text x={getX(obsPoints.length) + 120} y={plotH / 2 + 26} fill="#b91c1c" fontSize="8.5" textAnchor="middle">
                  Dashed projection suppressed per spec
                </text>
              </g>
            ) : null}

            {/* X-axis time points */}
            {obsPoints.map((pt, idx) => (
              <text key={`x-${idx}`} x={getX(idx)} y={chartH - 12} fill="#64748b" fontSize="9" textAnchor="middle" className="font-mono">
                {pt.time.split(' ')[1]}
              </text>
            ))}

            {fcPoints.map((pt, idx) => (
              <text key={`fc-x-${idx}`} x={getX(obsPoints.length + idx)} y={chartH - 12} fill="#7c3aed" fontSize="9" textAnchor="middle" className="font-mono">
                +{idx * 3 + 3}h
              </text>
            ))}
          </svg>
        </div>
      ) : (
        /* GloFAS Daily Discharge Ensemble Panel */
        <div className="py-4 space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-blue-700" />
              <span>
                GloFAS v4.0 Global River Discharge Ensemble Outlook (5 km grid cell, Yamuna reach).
              </span>
            </div>
            <span className="badge badge-stale">Model Product</span>
          </div>

          <div className="samast-table-container">
            <table className="samast-table text-xs">
              <thead>
                <tr>
                  <th>Forecast Valid Date</th>
                  <th>Ensemble Median Discharge</th>
                  <th>Interquartile Range (IQR)</th>
                  <th>Model Horizon</th>
                  <th>Regulation Notice</th>
                </tr>
              </thead>
              <tbody>
                {glofasFc?.forecastPoints.map((pt, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-slate-900">{formatToIST(pt.timestamp)}</td>
                    <td className="font-mono font-bold text-blue-800">
                      {pt.dischargeM3s?.toLocaleString()} m³/s
                    </td>
                    <td className="font-mono text-slate-600">
                      [{pt.lowerBoundM?.toLocaleString()} – {pt.upperBoundM?.toLocaleString()} m³/s]
                    </td>
                    <td className="text-slate-500">Day +{idx + 1}</td>
                    <td className="text-slate-400 italic text-[11px]">
                      Hydraulic regulation by Wazirabad Barrage not included in global grid
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart Footer Legend */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium text-blue-700">
            <span className="w-3 h-0.5 bg-blue-600 inline-block" />
            <span>Official CWC Gauge (Solid)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-purple-700">
            <span className="w-3 h-0.5 bg-purple-600 border-t border-dashed inline-block" />
            <span>CWC Forecast (Dashed)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-amber-700">
            <span className="w-3 h-0.5 bg-amber-500 inline-block" />
            <span>Warning 204.50m</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-red-700">
            <span className="w-3 h-0.5 bg-red-600 inline-block" />
            <span>Danger 205.33m</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Source: CWC Delhi Flood Cell (Daily Bulletin 12-Sep-2026)
        </div>
      </div>
    </div>
  );
};
