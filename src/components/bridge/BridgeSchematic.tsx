import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Pier } from '../../types/domain';
import { AlertTriangle, CheckCircle, Info, Layers, Eye, Maximize2, Compass } from 'lucide-react';
import bridgeScourDiagramImg from '../../assets/images/bridge249_scour_diagram.jpg';

export const BridgeSchematic: React.FC = () => {
  const { piers, selectedPierId, selectPier, observations, sensors, selectSensor } = useApp();
  const [viewMode, setViewMode] = useState<'schematic' | 'cross_section'>('schematic');

  // Find scour delta for P11
  const s1Obs = observations.find((o) => o.sensorId === 'P11-SON-01');
  const s2Obs = observations.find((o) => o.sensorId === 'P11-SON-02');
  const s3Obs = observations.find((o) => o.sensorId === 'P11-SON-03');
  const isP11ScourAlert = s2Obs && s2Obs.value !== null && s2Obs.value > 8.6;

  return (
    <div className="samast-card h-full flex flex-col justify-between shadow-md border-slate-200">
      <div className="samast-card-header flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="samast-card-title flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Bridge 249 Elevation & Instrument Architecture
          </span>
          <span className="text-[11px] text-slate-400 italic hidden sm:inline">
            (Yamuna River Railway Crossing)
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('schematic')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === 'schematic'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pier Elevation
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cross_section')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === 'cross_section'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3D Scour Model
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Commissioned (P11)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Uninstrumented
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Requested (P10)
            </span>
          </div>
        </div>
      </div>

      {viewMode === 'cross_section' ? (
        /* 3D Engineering Cross-Section View */
        <div className="relative w-full rounded overflow-hidden my-2 border border-slate-200 bg-slate-900 min-h-[300px]">
          <img
            src={bridgeScourDiagramImg}
            alt="Bridge 249 Pier Scour Engineering Cross-Section"
            className="w-full h-auto max-h-[380px] object-cover object-center"
          />

          {/* Interactive Live Telemetry Hotspots */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/85 backdrop-blur-xs text-white p-2.5 rounded shadow-lg border border-slate-700 text-xs max-w-xs">
            <div className="font-bold text-slate-100 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Pier 11 Acoustic Scour Telemetry
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Sonar 01 (Upstream):</span>
                <span className="text-emerald-400 font-bold">{s1Obs?.value?.toFixed(2) ?? '8.42'} m</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Sonar 02 (Center Bed):</span>
                <span className={isP11ScourAlert ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {s2Obs?.value?.toFixed(2) ?? '8.42'} m ({isP11ScourAlert ? 'SCOUR ALERT' : 'Normal'})
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Sonar 03 (Downstream):</span>
                <span className="text-emerald-400 font-bold">{s3Obs?.value?.toFixed(2) ?? '8.40'} m</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-700 pt-1">
              Geotechnical Stratum: Dense Gravel & Sand over Alluvial Stiff Clay. Caisson Embedment Depth: 36.0m.
            </div>
          </div>

          <div className="absolute bottom-3 right-3 z-10 bg-slate-900/80 backdrop-blur-xs text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-700">
            Acoustic Transducers A, B & C | Dual-Frequency Narrow Beam Array
          </div>
        </div>
      ) : (
        /* SVG Interactive Bridge Schematic */
        <div className="w-full overflow-x-auto py-2">
          <svg
            viewBox="0 0 920 270"
            className="w-full min-w-[760px] h-auto select-none"
            role="img"
            aria-label="Bridge 249 pier schematic diagram"
          >
            <defs>
              {/* Sky Gradient */}
              <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>

              {/* Water Gradient */}
              <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#2563eb" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.5" />
              </linearGradient>

              {/* Scour Hole Radial Gradient */}
              <radialGradient id="scourGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>

              {/* Sonar Beam Gradient */}
              <linearGradient id="sonarBeam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Sky Background */}
            <rect x="0" y="0" width="920" height="150" fill="url(#skyGradient)" />

            {/* Water Body (Yamuna River) */}
            <rect x="45" y="115" width="830" height="100" fill="url(#waterGradient)" />

            {/* High Water Danger Line (205.33m RL) */}
            <line x1="45" y1="105" x2="875" y2="105" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,4" />
            <text x="52" y="100" fill="#b91c1c" fontSize="9.5" fontWeight="700">
              Official Danger Level: 205.33m MSL
            </text>

            {/* Current River Surface Water Line */}
            <line x1="45" y1="115" x2="875" y2="115" stroke="#2563eb" strokeWidth="2.5" />
            <text x="760" y="128" fill="#1e3a8a" fontSize="9.5" fontWeight="700">
              Current Stage ~204.28m
            </text>

            {/* Riverbed / Alluvial Subsurface Profile */}
            <path
              d="M 45,215 Q 300,215 500,218 Q 670,218 695,236 Q 715,236 735,218 Q 800,215 875,215 L 875,270 L 45,270 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* Scour Depression Zone under P11 */}
            <ellipse cx="705" cy="234" rx="40" ry="14" fill="url(#scourGlow)" />
            <text x="655" y="258" fill="#991b1b" fontSize="9" fontWeight="700">
              {isP11ScourAlert ? 'Scour Anomaly -0.37m' : 'Monsoon Scour Trench'}
            </text>

            {/* Bridge Steel Girder Superstructure */}
            <rect x="35" y="55" width="850" height="16" fill="#1e293b" rx="2" />
            <rect x="35" y="48" width="850" height="7" fill="#475569" />
            {/* Railway Tracks & Overhead Catenary */}
            <line x1="35" y1="47" x2="890" y2="47" stroke="#0f172a" strokeWidth="2.5" />
            <line x1="35" y1="36" x2="890" y2="36" stroke="#64748b" strokeWidth="1" strokeDasharray="6,4" />

            {/* Abutment A1 (West) */}
            <g
              className="cursor-pointer transition-all hover:opacity-85"
              onClick={() => selectPier('A1')}
            >
              <polygon points="35,71 65,71 75,235 25,235" fill={selectedPierId === 'A1' ? '#bfdbfe' : '#94a3b8'} stroke="#334155" strokeWidth="1.5" />
              <text x="40" y="250" fill="#334155" fontSize="8.5" fontWeight="600">A1 (West)</text>
            </g>

            {/* Intermediate Piers P1 through P14 */}
            {piers.map((pier, index) => {
              const px = 100 + index * 52;
              const isP11 = pier.id === 'P11';
              const isP10 = pier.id === 'P10';
              const isSelected = selectedPierId === pier.id;

              return (
                <g
                  key={pier.id}
                  className="cursor-pointer transition-all"
                  onClick={() => selectPier(pier.id)}
                >
                  {/* Pier Caisson Base in riverbed */}
                  <rect
                    x={px - 8}
                    y={215}
                    width={16}
                    height={38}
                    fill={isSelected ? '#3b82f6' : isP11 ? '#1e40af' : '#64748b'}
                    stroke="#0f172a"
                    strokeWidth="1"
                    rx="1"
                  />

                  {/* Pier Shaft Body */}
                  <rect
                    x={px - 6}
                    y={71}
                    width={12}
                    height={144}
                    fill={isSelected ? '#60a5fa' : isP11 ? '#2563eb' : isP10 ? '#fde047' : '#94a3b8'}
                    stroke={isSelected ? '#1d4ed8' : '#334155'}
                    strokeWidth={isSelected ? '2' : '1'}
                    rx="1"
                  />

                  {/* Pier Cap */}
                  <rect
                    x={px - 9}
                    y={68}
                    width={18}
                    height={6}
                    fill={isSelected ? '#1d4ed8' : '#334155'}
                    rx="1"
                  />

                  {/* P11 Active Acoustic Sounding Cones */}
                  {isP11 && (
                    <g>
                      {/* Left Sonar Conical Beam (Upstream) */}
                      <polygon points={`${px - 6},155 ${px - 32},228 ${px - 14},232`} fill="url(#sonarBeam)" />
                      {/* Center Sonar Conical Beam (Center Scour Trench) */}
                      <polygon points={`${px},155 ${px - 10},233 ${px + 10},233`} fill="url(#sonarBeam)" />
                      {/* Right Sonar Conical Beam (Downstream) */}
                      <polygon points={`${px + 6},155 ${px + 14},232 ${px + 32},228`} fill="url(#sonarBeam)" />

                      {/* Transducer mounting brackets on pier shaft */}
                      <rect x={px - 8} y={153} width={4} height={5} fill="#0284c7" />
                      <rect x={px - 2} y={153} width={4} height={5} fill="#0284c7" />
                      <rect x={px + 4} y={153} width={4} height={5} fill="#0284c7" />

                      {/* Pier Cap Vibration & Inclinometer sensor */}
                      <circle cx={px} cy={66} r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                    </g>
                  )}

                  {/* Pier Label */}
                  <text
                    x={px}
                    y={264}
                    fill={isSelected ? '#1d4ed8' : isP11 ? '#1e3a8a' : '#475569'}
                    fontSize="8.5"
                    fontWeight={isP11 || isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {pier.label}
                  </text>
                </g>
              );
            })}

            {/* Abutment A2 (East) */}
            <g
              className="cursor-pointer transition-all hover:opacity-85"
              onClick={() => selectPier('A2')}
            >
              <polygon points="855,71 885,71 895,235 845,235" fill={selectedPierId === 'A2' ? '#bfdbfe' : '#94a3b8'} stroke="#334155" strokeWidth="1.5" />
              <text x="860" y="250" fill="#334155" fontSize="8.5" fontWeight="600">A2 (East)</text>
            </g>
          </svg>
        </div>
      )}

      {/* Selected Pier Quick Summary Bar */}
      <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">
            Selected: Pier {selectedPierId}
          </span>
          <span className="text-slate-400">•</span>
          {selectedPierId === 'P11' ? (
            <span className="text-blue-700 font-semibold flex items-center gap-1">
              <CheckCircle size={13} className="text-blue-600" />
              Commissioned Sensor Suite Active (3 Sonar, 1 Vib/Tilt, KLEON Gateway)
            </span>
          ) : selectedPierId === 'P10' ? (
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              <AlertTriangle size={13} className="text-amber-500" />
              Requested Reference Vibration Sensor (Pending Commissioning)
            </span>
          ) : (
            <span className="text-slate-500">Uninstrumented Pier — Monitored via Visual Inspection</span>
          )}
        </div>

        {selectedPierId === 'P11' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectSensor('P11-SON-02')}
              className="btn btn-secondary btn-sm"
            >
              Inspect Sonar 02 (Center Scour)
            </button>
            <button
              type="button"
              onClick={() => selectSensor('P11-VT-01')}
              className="btn btn-secondary btn-sm"
            >
              Inspect Vibration & Tilt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
