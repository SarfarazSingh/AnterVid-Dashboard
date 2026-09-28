import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
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
  Eye,
  Camera,
} from 'lucide-react';

// Direct Vite asset imports for guaranteed path resolution on GitHub Pages & Localhost
import baselineLowWaterImg from '../../assets/images/yamuna_baseline_lowwater.jpg';
import monsoonSurgeImg from '../../assets/images/yamuna_monsoon_surge.jpg';

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
  const [mapStyle, setMapStyle] = useState<'satellite' | 'vector'>('satellite');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Check stage delta between the selected date pair
  const sampleTransect = transects[0];
  const hasStageDifferenceWarning = sampleTransect && sampleTransect.stageDifferenceM > 0.25;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(rect.width - 5, e.clientX - rect.left));
    setSwipePosition((x / rect.width) * 100);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(5, Math.min(rect.width - 5, touch.clientX - rect.left));
    setSwipePosition((x / rect.width) * 100);
  };

  return (
    <div className="samast-card relative overflow-hidden flex flex-col min-h-[560px] shadow-md border-slate-200">
      {/* Top Map Header & View Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Yamuna Reach Corridor (Bridge 249 Vicinity)
          </span>
          <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline">
            UTM Zone 43N / WGS84
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Basemap Style Toggle */}
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                mapStyle === 'satellite'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('vector')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                mapStyle === 'vector'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vector GIS
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setSwipePosition(50);
              }}
              className="px-1.5 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition"
              title="Reset View"
            >
              Reset
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
              <strong>Interpretation Notice:</strong> Water stage delta between dates is{' '}
              {sampleTransect.stageDifferenceM.toFixed(2)}m. Apparent waterline shifts may reflect stage change, not permanent bank retreat.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-300">
            Review Required
          </span>
        </div>
      )}

      {/* Main Map Canvas Area */}
      <div
        ref={mapContainerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative flex-1 bg-slate-100 rounded border border-slate-300 overflow-hidden select-none min-h-[460px]"
      >
        {/* Layer 0: Always-Visible Rich Vector Fallback & Basemap */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <svg
            viewBox="0 0 800 460"
            className="w-full h-full object-cover"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            <defs>
              <linearGradient id="vectorWaterGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#2563eb" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="sandbarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
            </defs>

            {/* Alluvial Floodplain Terrain */}
            <rect x="0" y="0" width="800" height="460" fill="#f8fafc" />

            {/* Urban Settlement Embankments on East & West */}
            <path d="M 0,0 L 260,0 L 230,460 L 0,460 Z" fill="#f1f5f9" stroke="#e2e8f0" />
            <path d="M 540,0 L 800,0 L 800,460 L 570,460 Z" fill="#f1f5f9" stroke="#e2e8f0" />

            {/* Winding Yamuna River Channel */}
            <path
              d="M 280,0 C 340,120 310,220 330,320 C 350,390 380,430 400,460 L 540,460 C 510,400 480,310 470,220 C 460,130 490,50 510,0 Z"
              fill="url(#vectorWaterGradient)"
            />

            {/* Braided Sandbars / Sediment Islands */}
            <path
              d="M 370,140 Q 400,180 385,250 Q 365,220 370,140 Z"
              fill="url(#sandbarGradient)"
              stroke="#eab308"
              strokeWidth="0.8"
            />
            <path
              d="M 420,290 Q 445,340 430,380 Q 410,350 420,290 Z"
              fill="url(#sandbarGradient)"
              stroke="#eab308"
              strokeWidth="0.8"
            />

            {/* Grid Coordinates Overlay */}
            <line x1="200" y1="0" x2="200" y2="460" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="5,5" />
            <line x1="400" y1="0" x2="400" y2="460" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="5,5" />
            <line x1="600" y1="0" x2="600" y2="460" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="5,5" />
            <line x1="0" y1="230" x2="800" y2="230" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="5,5" />
            <text x="210" y="25" fill="#94a3b8" fontSize="8" fontFamily="monospace">77°14'E</text>
            <text x="410" y="25" fill="#94a3b8" fontSize="8" fontFamily="monospace">77°15'E</text>
            <text x="610" y="25" fill="#94a3b8" fontSize="8" fontFamily="monospace">77°16'E</text>
            <text x="10" y="224" fill="#94a3b8" fontSize="8" fontFamily="monospace">28°40'N</text>
          </svg>
        </div>

        {comparisonMode === 'side_by_side' ? (
          /* Side by Side Mode */
          <div className="absolute inset-0 grid grid-cols-2 h-full w-full gap-1 bg-slate-800 z-10">
            {/* Left: Baseline Date */}
            <div className="relative h-full overflow-hidden border-r border-slate-700 bg-slate-900">
              <div className="absolute top-2 left-2 z-20 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded border border-slate-700">
                Baseline: {datePair[0]} (Pre-monsoon Low Water)
              </div>
              <img
                src={baselineLowWaterImg}
                alt="Yamuna Baseline"
                className="w-full h-full object-cover"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              />
            </div>
            {/* Right: Comparison Date */}
            <div className="relative h-full overflow-hidden bg-slate-900">
              <div className="absolute top-2 left-2 z-20 bg-blue-900/85 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded border border-blue-700">
                Comparison: {datePair[1]} (Monsoon Flood Surge)
              </div>
              <img
                src={monsoonSurgeImg}
                alt="Yamuna Monsoon Surge"
                className="w-full h-full object-cover"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              />
            </div>
          </div>
        ) : (
          /* Single Overlay or Swipe Curtain Mode */
          <div className="absolute inset-0 w-full h-full">
            {/* Layer 1: Date 1 / Baseline Satellite Imagery (15 Aug 2026) */}
            {mapStyle === 'satellite' && (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img
                  src={baselineLowWaterImg}
                  alt="Yamuna Baseline Satellite"
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    opacity: layerOpacity['LAYER-S2-RGB'] || 1.0,
                  }}
                />
              </div>
            )}

            {/* Layer 2: Date 2 / Comparison Monsoon Surge Satellite (20 Sep 2026) clipped by Swipe Slider */}
            {mapStyle === 'satellite' && comparisonMode === 'swipe' && (
              <div
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                style={{
                  clipPath: `polygon(${swipePosition}% 0, 100% 0, 100% 100%, ${swipePosition}% 100%)`,
                }}
              >
                <img
                  src={monsoonSurgeImg}
                  alt="Yamuna Monsoon Surge Satellite"
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    opacity: layerOpacity['LAYER-S2-RGB'] || 1.0,
                  }}
                />
              </div>
            )}

            {/* Draggable Swipe Divider Line & Handle */}
            {comparisonMode === 'swipe' && (
              <div
                className="absolute top-0 bottom-0 z-20 cursor-ew-resize flex items-center justify-center pointer-events-auto"
                style={{ left: `${swipePosition}%`, width: '12px', transform: 'translateX(-50%)' }}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
              >
                <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                <div className="absolute w-8 h-8 rounded-full bg-white shadow-xl border-2 border-blue-600 flex items-center justify-center text-blue-700 hover:scale-110 transition active:scale-95">
                  <Split size={15} className="rotate-90" />
                </div>
              </div>
            )}

            {/* Interactive Vector GIS Overlay: Transects, InSAR points, Bridge alignment */}
            <svg
              viewBox="0 0 800 460"
              className="absolute inset-0 w-full h-full pointer-events-auto z-10"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <defs>
                <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.75" />
                </filter>
              </defs>

              {/* Bridge 249 Centerline Alignment */}
              <g filter="url(#shadowGlow)">
                <line x1="160" y1="230" x2="680" y2="230" stroke="#f8fafc" strokeWidth="4" />
                <line x1="160" y1="230" x2="680" y2="230" stroke="#0f172a" strokeWidth="2" strokeDasharray="4,4" />
                {/* Pier Markers */}
                {[260, 313, 366, 420, 473, 526].map((px) => (
                  <circle
                    key={px}
                    cx={px}
                    cy={230}
                    r="4"
                    fill={px === 420 ? '#ef4444' : '#ffffff'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                ))}
                <text x="420" y="218" fill="#ffffff" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                  Bridge 249 (Pier 11)
                </text>
              </g>

              {/* Surveyed Bank Transect Pins (TR-01, TR-02, TR-03, TR-04) */}
              {layerVisibility['LAYER-BANKLINE-CHANGE'] &&
                transects.map((tr) => {
                  let tx = 360;
                  let ty = 140;
                  if (tr.id === 'FIND-TR-01') { tx = 380; ty = 110; }
                  if (tr.id === 'FIND-TR-02') { tx = 445; ty = 175; }
                  if (tr.id === 'FIND-TR-03') { tx = 390; ty = 230; }
                  if (tr.id === 'FIND-TR-04') { tx = 470; ty = 345; }

                  const isSelected = selectedTransectId === tr.id;
                  const isErosion = tr.signedMovementM < -tr.detectionLimitM;
                  const isAccretion = tr.signedMovementM > tr.detectionLimitM;

                  return (
                    <g
                      key={tr.id}
                      className="cursor-pointer transition-transform hover:scale-110"
                      onClick={() => onSelectTransect(tr.id)}
                      filter="url(#shadowGlow)"
                    >
                      {/* Transect line vector */}
                      <line
                        x1={tx - 28}
                        y1={ty}
                        x2={tx + 28}
                        y2={ty}
                        stroke={isSelected ? '#3b82f6' : isErosion ? '#ef4444' : isAccretion ? '#10b981' : '#f8fafc'}
                        strokeWidth={isSelected ? '3.5' : '2'}
                      />
                      {/* Pin marker */}
                      <circle
                        cx={tx}
                        cy={ty}
                        r={isSelected ? '7' : '5'}
                        fill={isErosion ? '#ef4444' : isAccretion ? '#10b981' : '#e2e8f0'}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <rect
                        x={tx + 10}
                        y={ty - 16}
                        width="80"
                        height="18"
                        rx="3"
                        fill="#0f172a"
                        fillOpacity="0.85"
                        stroke={isSelected ? '#3b82f6' : '#475569'}
                        strokeWidth="1"
                      />
                      <text
                        x={tx + 14}
                        y={ty - 4}
                        fill="#ffffff"
                        fontSize="8.5"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {tr.transectId}: {tr.isResolvable ? `${tr.signedMovementM > 0 ? '+' : ''}${tr.signedMovementM.toFixed(1)}m` : 'Stable'}
                      </text>
                    </g>
                  );
                })}

              {/* InSAR Ground Deformation Points */}
              {layerVisibility['LAYER-NISAR-INSAR'] &&
                insarPoints.map((p) => {
                  let px = 200;
                  let py = 230;
                  if (p.id === 'INSAR-P-01') { px = 220; py = 225; }
                  if (p.id === 'INSAR-P-02') { px = 620; py = 225; }
                  if (p.id === 'INSAR-P-03') { px = 330; py = 90; }

                  const isSelected = selectedInSARPointId === p.id;
                  const isSubsiding = p.relativeLosDisplacementMm < -3.0;

                  return (
                    <g
                      key={p.id}
                      className="cursor-pointer transition-transform hover:scale-110"
                      onClick={() => onSelectInSARPoint(p.id)}
                      filter="url(#shadowGlow)"
                    >
                      <polygon
                        points={`${px},${py - 7} ${px + 6},${py + 5} ${px - 6},${py + 5}`}
                        fill={isSubsiding ? '#f59e0b' : '#3b82f6'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <text
                        x={px + 9}
                        y={py + 3}
                        fill="#ffffff"
                        fontSize="8"
                        fontWeight="bold"
                        filter="url(#shadowGlow)"
                      >
                        {p.relativeLosDisplacementMm.toFixed(1)} mm LOS
                      </text>
                    </g>
                  );
                })}
            </svg>

            {/* Date Legend Labels on Canvas */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 pointer-events-none">
              <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded shadow-md border border-slate-700 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Left: {datePair[0]} (Low Water Baseline)
              </span>
              {comparisonMode === 'swipe' && (
                <span className="bg-blue-900/85 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded shadow-md border border-blue-700 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Right: {datePair[1]} (Monsoon Flood Surge)
                </span>
              )}
            </div>

            {/* Bottom Scale & Orientation Overlay */}
            <div className="absolute bottom-3 left-3 z-20 bg-slate-900/85 backdrop-blur-xs text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-700 flex items-center gap-3">
              <div className="flex items-center gap-1 font-mono">
                <Compass size={12} className="text-blue-400" />
                <span>N ↑</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1 bg-white border border-slate-800" />
                <span className="font-mono">500 m</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <span className="text-slate-400">Sentinel-2 10m Ground Resolution</span>
            </div>

            {/* Swipe Instruction Cue */}
            {comparisonMode === 'swipe' && (
              <div className="absolute bottom-3 right-3 z-20 bg-white/95 backdrop-blur-xs text-slate-700 text-[11px] px-2.5 py-1 rounded shadow-md border border-slate-200 pointer-events-none flex items-center gap-1.5 font-medium">
                <Split size={13} className="text-blue-600 rotate-90" />
                Drag center divider to swipe between dates
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
