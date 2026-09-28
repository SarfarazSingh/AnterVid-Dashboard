import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatToIST } from '../../utils/dateUtils';
import { SlidersHorizontal, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export const SensorTrendChart: React.FC = () => {
  const { observations, demoClockIso } = useApp();

  const [activeChannels, setActiveChannels] = useState<{ [key: string]: boolean }>({
    'P11-SON-01': true,
    'P11-SON-02': true,
    'P11-SON-03': true,
  });

  const [metricMode, setMetricMode] = useState<'sonar' | 'vibration' | 'tilt'>('sonar');

  const now = new Date(demoClockIso);
  const timeLabels = Array.from({ length: 13 }, (_, i) => {
    const t = new Date(now.getTime() - (12 - i) * 2 * 3600 * 1000);
    if (i === 12) return 'Now';
    return formatToIST(t.toISOString(), false, true).replace(' IST', '');
  });

  const latest = (id: string, fallback: number): number => {
    const obs = observations.find((o) => o.sensorId === id && o.metric === 'sonar_range');
    return obs && obs.value !== null ? obs.value : fallback;
  };

  const son1Now = latest('P11-SON-01', 8.424);
  const son2Now = latest('P11-SON-02', 8.75);
  const son3Now = latest('P11-SON-03', 8.462);

  const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
  const son1Points = Array.from({ length: 13 }, (_, i) => lerp(8.42, son1Now, i / 12));
  const son2Points = Array.from({ length: 13 }, (_, i) => lerp(8.41, son2Now, i / 12));
  const son3Points: (number | null)[] = Array.from({ length: 13 }, (_, i) =>
    i === 5 || i === 6 ? null : lerp(8.44, son3Now, i / 12)
  );

  const baselineRef = 8.420;
  const watchThreshold = 8.720; // +0.30m threshold

  // SVG Chart bounds
  const chartW = 760;
  const chartH = 220;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  const yMin = 8.35;
  const yMax = 8.85;

  const getX = (idx: number) => padLeft + (idx / (timeLabels.length - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

  // Render polyline segments handling gaps (never bridge missing data with straight line)
  const buildSegments = (points: (number | null)[]) => {
    const segments: string[] = [];
    let currentSegment: string[] = [];

    points.forEach((pt, idx) => {
      if (pt === null) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment.join(' '));
          currentSegment = [];
        }
      } else {
        const x = getX(idx);
        const y = getY(pt);
        currentSegment.push(`${x},${y}`);
      }
    });

    if (currentSegment.length > 0) {
      segments.push(currentSegment.join(' '));
    }

    return segments;
  };

  const toggleChannel = (ch: string) => {
    setActiveChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  return (
    <div className="samast-card">
      <div className="samast-card-header flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="samast-card-title">Telemetry Time-Series & Discontinuity Analysis</span>
          <span className="text-xs text-slate-400 font-normal">
            (Last point is the current fixture reading, rebased to now. Prior points are interpolated history.)
          </span>
        </div>

        {/* Channel & Metric Controls */}
        <div className="flex items-center gap-3 text-xs">
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setMetricMode('sonar')}
              className={`px-2 py-0.5 rounded font-medium ${metricMode === 'sonar' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'}`}
            >
              Sonar Scour (m)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('vibration')}
              className={`px-2 py-0.5 rounded font-medium ${metricMode === 'vibration' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'}`}
            >
              Vibration Peak (m/s²)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('tilt')}
              className={`px-2 py-0.5 rounded font-medium ${metricMode === 'tilt' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'}`}
            >
              Pier Tilt (deg)
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart Plot */}
      <div className="w-full overflow-x-auto py-2">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full min-w-[680px] h-auto select-none"
        >
          {/* Horizontal Gridlines */}
          {[8.40, 8.50, 8.60, 8.70, 8.80].map((level) => {
            const y = getY(level);
            return (
              <g key={level}>
                <line x1={padLeft} y1={y} x2={chartW - padRight} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={padLeft - 8} y={y + 3.5} fill="#94a3b8" fontSize="10" textAnchor="end" className="font-mono">
                  {level.toFixed(2)}m
                </text>
              </g>
            );
          })}

          {/* Baseline Reference Line */}
          <line
            x1={padLeft}
            y1={getY(baselineRef)}
            x2={chartW - padRight}
            y2={getY(baselineRef)}
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeDasharray="4,3"
          />
          <text x={chartW - padRight + 4} y={getY(baselineRef) + 3} fill="#64748b" fontSize="9">
            Baseline (8.42m)
          </text>

          {/* Watch Threshold Line */}
          <line
            x1={padLeft}
            y1={getY(watchThreshold)}
            x2={chartW - padRight}
            y2={getY(watchThreshold)}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
          <text x={chartW - padRight + 4} y={getY(watchThreshold) + 3} fill="#d97706" fontSize="9" fontWeight="600">
            Watch (+0.30m)
          </text>

          {/* Channel Lines */}
          {activeChannels['P11-SON-01'] &&
            buildSegments(son1Points).map((d, i) => (
              <polyline key={`s1-${i}`} fill="none" stroke="#2563eb" strokeWidth="2" points={d} />
            ))}

          {activeChannels['P11-SON-02'] &&
            buildSegments(son2Points).map((d, i) => (
              <polyline key={`s2-${i}`} fill="none" stroke="#dc2626" strokeWidth="2.5" points={d} />
            ))}

          {activeChannels['P11-SON-03'] &&
            buildSegments(son3Points).map((d, i) => (
              <polyline key={`s3-${i}`} fill="none" stroke="#059669" strokeWidth="2" points={d} />
            ))}

          {/* Discontinuity Annotation on Sonar 03 */}
          {activeChannels['P11-SON-03'] && (
            <g>
              <rect x={getX(4.5) - 20} y={getY(8.44) - 22} width="40" height="15" fill="#fef2f2" stroke="#fca5a5" rx="2" />
              <text x={getX(4.5)} y={getY(8.44) - 11} fill="#b91c1c" fontSize="8" fontWeight="600" textAnchor="middle">
                2h Gap
              </text>
            </g>
          )}

          {/* Time Labels on X-axis */}
          {timeLabels.map((lbl, idx) => {
            if (idx % 2 === 0 || idx === timeLabels.length - 1) {
              const x = getX(idx);
              return (
                <text
                  key={lbl}
                  x={x}
                  y={chartH - 10}
                  fill="#64748b"
                  fontSize="9.5"
                  textAnchor="middle"
                  className="font-mono"
                >
                  {lbl}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>

      {/* Chart Legend & Toggles */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => toggleChannel('P11-SON-01')}
            className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700"
          >
            <span className={`w-3 h-1 rounded ${activeChannels['P11-SON-01'] ? 'bg-blue-600' : 'bg-slate-300'}`} />
            <span>Sonar 01 (Nose)</span>
            {activeChannels['P11-SON-01'] ? <Eye size={12} className="text-slate-400" /> : <EyeOff size={12} className="text-slate-400" />}
          </button>

          <button
            type="button"
            onClick={() => toggleChannel('P11-SON-02')}
            className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700"
          >
            <span className={`w-3 h-1 rounded ${activeChannels['P11-SON-02'] ? 'bg-red-600' : 'bg-slate-300'}`} />
            <span className="text-red-700 font-semibold">Sonar 02 (Mid Scour Face)</span>
            {activeChannels['P11-SON-02'] ? <Eye size={12} className="text-slate-400" /> : <EyeOff size={12} className="text-slate-400" />}
          </button>

          <button
            type="button"
            onClick={() => toggleChannel('P11-SON-03')}
            className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700"
          >
            <span className={`w-3 h-1 rounded ${activeChannels['P11-SON-03'] ? 'bg-emerald-600' : 'bg-slate-300'}`} />
            <span>Sonar 03 (Vortex Tail - Degraded)</span>
            {activeChannels['P11-SON-03'] ? <Eye size={12} className="text-slate-400" /> : <EyeOff size={12} className="text-slate-400" />}
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <AlertTriangle size={12} className="text-amber-500" />
          <span>Short excursions preserved; no artificial moving average smoothing</span>
        </div>
      </div>
    </div>
  );
};
