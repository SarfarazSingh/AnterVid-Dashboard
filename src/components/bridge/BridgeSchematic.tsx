import React from 'react';
import { useApp } from '../../context/AppContext';
import { Pier } from '../../types/domain';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const BridgeSchematic: React.FC = () => {
  const { piers, selectedPierId, selectPier, observations, sensors } = useApp();

  // Find scour delta for P11
  const s2Obs = observations.find((o) => o.sensorId === 'P11-SON-02');
  const isP11ScourAlert = s2Obs && s2Obs.value !== null && s2Obs.value > 8.6;

  return (
    <div className="samast-card h-full flex flex-col justify-between">
      <div className="samast-card-header">
        <div className="flex items-center gap-2">
          <span className="samast-card-title">Bridge 249 Elevation & Instrument Schematic</span>
          <span className="text-[11px] text-slate-400 italic">
            (Interactive schematic — Not surveyed CAD geometry)
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Commissioned P11
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Uninstrumented
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Requested (P10)
          </span>
        </div>
      </div>

      {/* SVG Interactive Bridge Schematic */}
      <div className="w-full overflow-x-auto py-2">
        <svg
          viewBox="0 0 920 260"
          className="w-full min-w-[760px] h-auto select-none"
          role="img"
          aria-label="Bridge 249 pier schematic diagram"
        >
          <defs>
            {/* Water Gradient */}
            <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.25" />
            </linearGradient>

            {/* Scour Hole Radial Gradient */}
            <radialGradient id="scourGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky / Air Background */}
          <rect x="0" y="0" width="920" height="150" fill="#f8fafc" />

          {/* Water Body (Yamuna River) */}
          <rect x="50" y="115" width="820" height="95" fill="url(#waterGradient)" />

          {/* High Water Danger Line (205.33m RL) */}
          <line x1="50" y1="105" x2="870" y2="105" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,4" />
          <text x="55" y="101" fill="#b91c1c" fontSize="9" fontWeight="600">
            Official Danger Level: 205.33m MSL
          </text>

          {/* Current River Surface Water Line */}
          <line x1="50" y1="115" x2="870" y2="115" stroke="#3b82f6" strokeWidth="2" />
          <text x="760" y="127" fill="#1e40af" fontSize="9" fontWeight="500">
            Current Stage ~204.28m
          </text>

          {/* Riverbed / Alluvial Subsurface Profile */}
          <path
            d="M 50,210 Q 300,210 500,212 Q 670,212 690,228 Q 710,228 730,212 Q 800,210 870,210 L 870,260 L 50,260 Z"
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Scour Depression Zone under P11 */}
          <ellipse cx="700" cy="226" rx="35" ry="12" fill="url(#scourGlow)" />
          <text x="655" y="248" fill="#991b1b" fontSize="8.5" fontWeight="600">
            {isP11ScourAlert ? 'Scour Anomaly -0.37m' : 'Monsoon Scour Trench'}
          </text>

          {/* Bridge Steel Girder Superstructure */}
          <rect x="40" y="55" width="840" height="16" fill="#334155" rx="2" />
          <rect x="40" y="48" width="840" height="7" fill="#64748b" />
          {/* Railway Tracks */}
          <line x1="40" y1="47" x2="880" y2="47" stroke="#0f172a" strokeWidth="2" />

          {/* Abutment A1 (West) */}
          <g
            className="cursor-pointer transition-all hover:opacity-85"
            onClick={() => selectPier('A1')}
          >
            <polygon points="35,71 65,71 75,230 25,230" fill={selectedPierId === 'A1' ? '#bfdbfe' : '#94a3b8'} stroke="#475569" strokeWidth="1.5" />
            <text x="32" y="90" fill="#0f172a" fontSize="9" fontWeight="600">A1 (West)</text>
          </g>

          {/* Piers 1 to 14 */}
          {piers
            .filter((p) => p.type === 'pier')
            .map((pier) => {
              const xPos = 65 + pier.number * 53;
              const isSelected = selectedPierId === pier.id;
              const isP11 = pier.id === 'P11';
              const isP10 = pier.id === 'P10';

              let pierFill = '#cbd5e1';
              let pierStroke = '#94a3b8';

              if (isSelected) {
                pierFill = '#93c5fd';
                pierStroke = '#2563eb';
              } else if (isP11) {
                pierFill = isP11ScourAlert ? '#fecaca' : '#dbeafe';
                pierStroke = isP11ScourAlert ? '#dc2626' : '#2563eb';
              } else if (isP10) {
                pierFill = '#fef3c7';
                pierStroke = '#d97706';
              }

              return (
                <g
                  key={pier.id}
                  className="cursor-pointer transition-transform hover:scale-101"
                  onClick={() => selectPier(pier.id)}
                >
                  {/* Pier Stem */}
                  <rect
                    x={xPos - 8}
                    y="71"
                    width="16"
                    height="142"
                    fill={pierFill}
                    stroke={pierStroke}
                    strokeWidth={isSelected ? '2' : '1.5'}
                    rx="1"
                  />

                  {/* Pier Cap */}
                  <rect
                    x={xPos - 12}
                    y="69"
                    width="24"
                    height="6"
                    fill={pierStroke}
                    rx="1"
                  />

                  {/* Well Foundation Below Bed */}
                  <rect
                    x={xPos - 10}
                    y="213"
                    width="20"
                    height="32"
                    fill="#94a3b8"
                    stroke="#64748b"
                    strokeDasharray="2,2"
                  />

                  {/* Pier Label */}
                  <text
                    x={xPos}
                    y="85"
                    fill="#0f172a"
                    fontSize="8.5"
                    fontWeight={isSelected || isP11 ? '700' : '500'}
                    textAnchor="middle"
                  >
                    {isP11 ? 'P11★' : `P${pier.number}`}
                  </text>

                  {/* Instrumentation Markers on P11 */}
                  {isP11 && (
                    <g>
                      {/* KLEON Gateway on Pier Cap */}
                      <rect x={xPos - 14} y="58" width="6" height="8" fill="#2563eb" rx="1" />
                      <line x1={xPos - 11} y1="58" x2={xPos - 11} y2="52" stroke="#2563eb" strokeWidth="1" />

                      {/* Sonar Transducers Bracket (submerged) */}
                      <circle cx={xPos - 10} cy="140" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
                      <circle cx={xPos + 10} cy="140" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
                      <circle cx={xPos} cy="145" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />

                      {/* Acoustic Sonar Sounding Cones */}
                      <path
                        d={`M ${xPos - 10},144 L ${xPos - 22},222 L ${xPos - 2},222 Z`}
                        fill="#3b82f6"
                        opacity="0.25"
                      />
                      <path
                        d={`M ${xPos},149 L ${xPos - 8},226 L ${xPos + 12},226 Z`}
                        fill={isP11ScourAlert ? '#ef4444' : '#3b82f6'}
                        opacity="0.35"
                      />
                      <path
                        d={`M ${xPos + 10},144 L ${xPos + 2},222 L ${xPos + 22},222 Z`}
                        fill="#3b82f6"
                        opacity="0.25"
                      />
                    </g>
                  )}

                  {/* P10 Planned Indicator */}
                  {isP10 && (
                    <circle cx={xPos} cy="63" r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.8" />
                  )}
                </g>
              );
            })}

          {/* Abutment A2 (East) */}
          <g
            className="cursor-pointer transition-all hover:opacity-85"
            onClick={() => selectPier('A2')}
          >
            <polygon points="855,71 885,71 895,230 845,230" fill={selectedPierId === 'A2' ? '#bfdbfe' : '#94a3b8'} stroke="#475569" strokeWidth="1.5" />
            <text x="850" y="90" fill="#0f172a" fontSize="9" fontWeight="600">A2 (East)</text>
          </g>
        </svg>
      </div>

      {/* Schematic Action Strip */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            Selected: {selectedPierId ? `Pier ${selectedPierId}` : 'None'}
          </span>
          <span className="text-slate-300">•</span>
          <span>Click any pier to inspect instrument manifest and filter telemetry</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedPierId === 'P11' && (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200">
              5 Channels Commissioned
            </span>
          )}
          {selectedPierId === 'P10' && (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
              Requested Reference Sensor (Uncommissioned)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
