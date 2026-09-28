import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TransectFinding, InSARFinding } from '../../types/domain';
import {
  Compass,
  Layers,
  Split,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  MapPin,
  Info,
} from 'lucide-react';

interface GroundComparisonMapProps {
  layerVisibility: Record<string, boolean>;
  layerOpacity: Record<string, number>;
  comparisonMode: 'single' | 'swipe' | 'side_by_side';
  datePair: [string, string];
  onSelectTransect: (id: string) => void;
  onSelectInSARPoint: (id: string) => void;
}

export const GroundComparisonMap: React.FC<GroundComparisonMapProps> = ({
  layerVisibility,
  layerOpacity,
  comparisonMode,
  datePair,
  onSelectTransect,
  onSelectInSARPoint,
}) => {
  const { transects, insarPoints, selectedTransectId, selectedInSARPointId } = useApp();

  const [swipePosition, setSwipePosition] = useState<number>(50); // % across map
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Check stage delta between the selected date pair
  const sampleTransect = transects[0];
  const hasStageDifferenceWarning = sampleTransect && sampleTransect.stageDifferenceM > 0.25;

  return (
    <div className="samast-card relative overflow-hidden flex flex-col h-[520px]">
      {/* Top Map Header & View Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 uppercase tracking-wider">
            Yamuna Reach Corridor (Bridge 249 Vicinity)
          </span>
          <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
            UTM Zone 43N / WGS84
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">
            Date Pair: <strong className="text-slate-800">{datePair[0]}</strong> vs{' '}
            <strong className="text-slate-800">{datePair[1]}</strong>
          </span>
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 rounded hover:bg-slate-100 text-slate-600"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              className="p-1 rounded hover:bg-slate-100 text-slate-600"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Stage Variation Warning Banner (Critical Science Rule) */}
      {hasStageDifferenceWarning && (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <span>
              <strong>Interpretation Notice:</strong> Water stage difference between dates is{' '}
              {sampleTransect.stageDifferenceM.toFixed(2)}m. Waterline shift may reflect stage variation, not permanent riverbank retreat.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-amber-800">Review Required</span>
        </div>
      )}

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 bg-slate-100 rounded border border-slate-200 overflow-hidden select-none">
        {/* SVG Vector Map Rendering */}
        <svg
          viewBox="0 0 800 440"
          className="w-full h-full object-cover"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <defs>
            {/* Low Coherence Pattern */}
            <pattern id="lowCoherenceHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="1.5" />
            </pattern>

            {/* Inundation Water Gradient */}
            <linearGradient id="riverWaterFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#2563eb" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* Background Floodplain Land (Newer Alluvium Plain) */}
          <rect x="0" y="0" width="800" height="440" fill="#f1f5f9" />

          {/* GSI Geomorphology Zone (if layer visible) */}
          {layerVisibility['LAYER-GSI-GEOLOGY'] && (
            <g opacity={layerOpacity['LAYER-GSI-GEOLOGY'] || 0.8}>
              <polygon points="0,0 260,0 230,440 0,440" fill="#fef9c3" />
              <text x="20" y="30" fill="#854d0e" fontSize="9" fontWeight="600">
                GSI: Newer Alluvium (Active Floodplain)
              </text>
            </g>
          )}

          {/* JRC Historical Surface Water Occurrence (1984-2021) */}
          {layerVisibility['LAYER-JRC-WATER'] && (
            <path
              d="M 330,0 Q 420,180 370,440 L 490,440 Q 520,200 430,0 Z"
              fill="#bfdbfe"
              opacity={(layerOpacity['LAYER-JRC-WATER'] || 0.8) * 0.6}
            />
          )}

          {/* Date 1 Water Extent (15 Aug 2026 Baseline - Shaded boundary) */}
          <path
            d="M 360,0 Q 430,160 380,440 L 450,440 Q 480,180 410,0 Z"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="4,3"
          />

          {/* Date 2 Water Extent (20 Sep 2026 Comparison - Solid Water Body) */}
          {layerVisibility['LAYER-S2-RGB'] && (
            <path
              d="M 345,0 Q 425,170 375,440 L 465,440 Q 495,190 425,0 Z"
              fill="url(#riverWaterFill)"
              opacity={layerOpacity['LAYER-S2-RGB'] || 1.0}
            />
          )}

          {/* Sentinel-1 SAR High-Inundation Mask */}
          {layerVisibility['LAYER-S1-SAR-FLOOD'] && (
            <path
              d="M 335,0 Q 415,160 365,440 L 475,440 Q 505,180 435,0 Z"
              fill="#1d4ed8"
              opacity={(layerOpacity['LAYER-S1-SAR-FLOOD'] || 0.8) * 0.35}
            />
          )}

          {/* Low Coherence / Vegetated Floodplain Mask */}
          {layerVisibility['LAYER-NISAR-INSAR'] && (
            <g opacity={layerOpacity['LAYER-NISAR-INSAR'] || 0.8}>
              <polygon points="260,30 330,30 320,160 250,160" fill="url(#lowCoherenceHatch)" stroke="#64748b" strokeWidth="0.8" />
              <text x="262" y="85" fill="#475569" fontSize="8" fontWeight="600">
                InSAR Low Coherence Mask
              </text>
            </g>
          )}

          {/* Bridge 249 Girder Superstructure Overlay */}
          <g>
            <line x1="120" y1="220" x2="680" y2="220" stroke="#0f172a" strokeWidth="5" />
            <line x1="120" y1="220" x2="680" y2="220" stroke="#f8fafc" strokeWidth="1" strokeDasharray="3,3" />

            {/* Pier Indicators across river channel */}
            {[260, 313, 366, 419, 472, 525].map((px, i) => (
              <circle
                key={px}
                cx={px}
                cy={220}
                r="3.5"
                fill={px === 419 ? '#ef4444' : '#334155'}
                stroke="#ffffff"
                strokeWidth="1"
              />
            ))}
            <text x="419" y="210" fill="#991b1b" fontSize="8.5" fontWeight="700" textAnchor="middle">
              Bridge 249 (Pier 11)
            </text>
          </g>

          {/* Transect Measurement Markers */}
          {layerVisibility['LAYER-BANKLINE-CHANGE'] &&
            transects.map((tr) => {
              // Synthetic map positions along channel
              let tx = 360;
              let ty = 140;
              if (tr.id === 'FIND-TR-01') { tx = 360; ty = 100; }
              if (tr.id === 'FIND-TR-02') { tx = 430; ty = 160; }
              if (tr.id === 'FIND-TR-03') { tx = 375; ty = 220; }
              if (tr.id === 'FIND-TR-04') { tx = 460; ty = 340; }

              const isSelected = selectedTransectId === tr.id;
              const isErosion = tr.signedMovementM < -tr.detectionLimitM;
              const isAccretion = tr.signedMovementM > tr.detectionLimitM;

              return (
                <g
                  key={tr.id}
                  className="cursor-pointer"
                  onClick={() => onSelectTransect(tr.id)}
                >
                  {/* Transect line segment */}
                  <line
                    x1={tx - 25}
                    y1={ty}
                    x2={tx + 25}
                    y2={ty}
                    stroke={isSelected ? '#2563eb' : isErosion ? '#dc2626' : isAccretion ? '#16a34a' : '#64748b'}
                    strokeWidth={isSelected ? '3' : '2'}
                  />
                  {/* Transect Pin */}
                  <circle
                    cx={tx}
                    cy={ty}
                    r={isSelected ? '6' : '4.5'}
                    fill={isErosion ? '#ef4444' : isAccretion ? '#10b981' : '#94a3b8'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={tx + 12}
                    y={ty - 4}
                    fill={isSelected ? '#1d4ed8' : '#0f172a'}
                    fontSize="9"
                    fontWeight={isSelected ? '700' : '600'}
                  >
                    {tr.transectId} ({tr.isResolvable ? `${tr.signedMovementM > 0 ? '+' : ''}${tr.signedMovementM.toFixed(1)}m` : 'Stable'})
                  </text>
                </g>
              );
            })}

          {/* InSAR Line-of-Sight Ground Displacement Points */}
          {layerVisibility['LAYER-NISAR-INSAR'] &&
            insarPoints.map((pt) => {
              let px = 220;
              let py = 210;
              if (pt.id === 'INSAR-PT-01') { px = 180; py = 225; }
              if (pt.id === 'INSAR-PT-02') { px = 620; py = 215; }
              if (pt.id === 'INSAR-PT-03') { px = 290; py = 90; }

              const isSelected = selectedInSARPointId === pt.id;

              return (
                <g
                  key={pt.id}
                  className="cursor-pointer"
                  onClick={() => onSelectInSARPoint(pt.id)}
                >
                  <polygon
                    points={`${px},${py - 7} ${px + 6},${py + 4} ${px - 6},${py + 4}`}
                    fill={pt.isSufficientCoherence ? (pt.relativeLosDisplacementMm < -3 ? '#dc2626' : '#2563eb') : '#94a3b8'}
                    stroke={isSelected ? '#0f172a' : '#ffffff'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={px}
                    y={py + 15}
                    fill="#334155"
                    fontSize="8.5"
                    fontWeight={isSelected ? '700' : '500'}
                    textAnchor="middle"
                  >
                    {pt.pointId} ({pt.isSufficientCoherence ? `${pt.relativeLosDisplacementMm.toFixed(1)}mm` : 'Masked'})
                  </text>
                </g>
              );
            })}

          {/* North Arrow & Scale Bar */}
          <g>
            {/* North Compass */}
            <circle cx="760" cy="40" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <polygon points="760,30 763,42 757,42" fill="#ef4444" />
            <polygon points="760,50 763,42 757,42" fill="#64748b" />
            <text x="760" y="26" fill="#0f172a" fontSize="8" fontWeight="700" textAnchor="middle">N</text>

            {/* Scale Bar (500m) */}
            <rect x="670" y="415" width="100" height="4" fill="#0f172a" />
            <line x1="670" y1="412" x2="670" y2="422" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="770" y1="412" x2="770" y2="422" stroke="#0f172a" strokeWidth="1.5" />
            <text x="720" y="410" fill="#0f172a" fontSize="9" fontWeight="600" textAnchor="middle">
              500 metres
            </text>
          </g>
        </svg>

        {/* Swipe Divider Tool (when in swipe mode) */}
        {comparisonMode === 'swipe' && (
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none"
            style={{ left: `${swipePosition}%` }}
          >
            <div className="w-0.5 h-full bg-blue-600 shadow-md relative">
              <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg text-[10px] font-bold">
                ⬌
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Swipe Position Slider Controller */}
      {comparisonMode === 'swipe' && (
        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-medium">Swipe Divider:</span>
          <input
            type="range"
            min="5"
            max="95"
            value={swipePosition}
            onChange={(e) => setSwipePosition(parseFloat(e.target.value))}
            className="flex-1 accent-blue-600 h-1 bg-slate-200 rounded"
          />
          <span className="font-mono text-slate-700 w-12 text-right">{swipePosition}%</span>
        </div>
      )}

      {/* Footer Spatial Reference */}
      <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Coordinate System: UTM 43N / WGS84 Datum</span>
        <span>Click any transect pin or InSAR point to inspect full uncertainty envelope</span>
      </div>
    </div>
  );
};
