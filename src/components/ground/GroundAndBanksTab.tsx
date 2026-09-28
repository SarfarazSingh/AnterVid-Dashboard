import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LayerControlPanel } from './LayerControlPanel';
import { GroundComparisonMap } from './GroundComparisonMap';
import { TransectInspector } from './TransectInspector';
import { InSARInspector } from './InSARInspector';
import { AcquisitionTimeline } from './AcquisitionTimeline';
import { Split, Sliders, Layers, Calendar, Mountain, CheckCircle2, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { exportTransectsCSV } from '../../utils/exportUtils';

export const GroundAndBanksTab: React.FC = () => {
  const {
    transects,
    insarPoints,
    selectedTransectId,
    setSelectedTransectId,
    selectedInSARPointId,
    setSelectedInSARPointId,
  } = useApp();

  // Secondary analytical view
  const [subView, setSubView] = useState<'banks' | 'ground_movement' | 'land_cover' | 'geology'>('banks');

  // Comparison Tool Mode
  const [comparisonMode, setComparisonMode] = useState<'single' | 'swipe' | 'side_by_side'>('swipe');

  // Date Pair
  const [datePair, setDatePair] = useState<[string, string]>(['15 Aug 2026', '06 Sep 2026']);

  // Study Area
  const [studyArea, setStudyArea] = useState<'local_bridge' | 'reach_corridor' | 'hydrological'>(
    'reach_corridor'
  );

  // Layer Visibility & Opacity
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    'LAYER-S2-RGB': true,
    'LAYER-BANKLINE-CHANGE': true,
    'LAYER-S1-SAR-FLOOD': false,
    'LAYER-NISAR-INSAR': true,
    'LAYER-JRC-WATER': false,
    'LAYER-GSI-GEOLOGY': false,
  });

  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    'LAYER-S2-RGB': 1.0,
    'LAYER-BANKLINE-CHANGE': 1.0,
    'LAYER-S1-SAR-FLOOD': 0.8,
    'LAYER-NISAR-INSAR': 0.85,
    'LAYER-JRC-WATER': 0.7,
    'LAYER-GSI-GEOLOGY': 0.6,
  });

  const [selectedSceneId, setSelectedSceneId] = useState<string>('S2A_MSIL2A_20260906T053641');

  const toggleLayer = (id: string) => {
    setLayerVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const changeOpacity = (id: string, opacity: number) => {
    setLayerOpacity((prev) => ({ ...prev, [id]: opacity }));
  };

  const currentTransect = transects.find((t) => t.id === selectedTransectId) || transects[0];
  const currentInSAR = insarPoints.find((p) => p.id === selectedInSARPointId) || insarPoints[0];

  return (
    <div className="space-y-6">
      {/* Top Controls: Secondary views, Date Pair, Study Area, Comparison Mode */}
      <div className="samast-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Secondary Views */}
        <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setSubView('banks');
              setLayerVisibility((prev) => ({ ...prev, 'LAYER-BANKLINE-CHANGE': true }));
            }}
            className={`px-3 py-1 rounded font-semibold transition ${
              subView === 'banks' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bank & Channel Change
          </button>
          <button
            type="button"
            onClick={() => {
              setSubView('ground_movement');
              setLayerVisibility((prev) => ({ ...prev, 'LAYER-NISAR-INSAR': true }));
            }}
            className={`px-3 py-1 rounded font-semibold transition ${
              subView === 'ground_movement' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ground Movement (InSAR)
          </button>
          <button
            type="button"
            onClick={() => {
              setSubView('geology');
              setLayerVisibility((prev) => ({ ...prev, 'LAYER-GSI-GEOLOGY': true }));
            }}
            className={`px-3 py-1 rounded font-semibold transition ${
              subView === 'geology' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Background Geology
          </button>
        </div>

        {/* Comparison Tool Modes */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Comparison:</span>
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setComparisonMode('swipe')}
              className={`px-2.5 py-1 rounded font-medium ${
                comparisonMode === 'swipe' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600'
              }`}
            >
              Swipe Tool
            </button>
            <button
              type="button"
              onClick={() => setComparisonMode('single')}
              className={`px-2.5 py-1 rounded font-medium ${
                comparisonMode === 'single' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600'
              }`}
            >
              Single Overlay
            </button>
          </div>
        </div>

        {/* Date Pair Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Dates:</span>
          <select
            value={`${datePair[0]} - ${datePair[1]}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val.includes('15 Aug')) setDatePair(['15 Aug 2026', '06 Sep 2026']);
              else setDatePair(['01 Jun 2026', '06 Sep 2026']);
            }}
            className="px-2.5 py-1 border border-slate-200 rounded bg-white text-slate-800 font-medium"
          >
            <option>15 Aug 2026 - 06 Sep 2026 (Monsoon Surge)</option>
            <option>01 Jun 2026 - 06 Sep 2026 (Seasonal Pre/Post)</option>
          </select>
        </div>

        {/* Study Area Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Area:</span>
          <select
            value={studyArea}
            onChange={(e) => setStudyArea(e.target.value as any)}
            className="px-2.5 py-1 border border-slate-200 rounded bg-white text-slate-800 font-medium"
          >
            <option value="reach_corridor">Reach Corridor (5-10 km)</option>
            <option value="local_bridge">Local Bridge Vicinity (1-2 km)</option>
            <option value="hydrological">Catchment Context</option>
          </select>
        </div>
      </div>

      {/* Main 3-Column Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Layer Registry (3 cols) */}
        <div className="lg:col-span-3">
          <LayerControlPanel
            layerVisibility={layerVisibility}
            layerOpacity={layerOpacity}
            onToggleLayer={toggleLayer}
            onChangeOpacity={changeOpacity}
          />
        </div>

        {/* Centre Column: Comparison Vector Map (6 cols) */}
        <div className="lg:col-span-6">
          <GroundComparisonMap
            layerVisibility={layerVisibility}
            layerOpacity={layerOpacity}
            comparisonMode={comparisonMode}
            datePair={datePair}
            onSelectTransect={(id) => {
              setSelectedTransectId(id);
              setSubView('banks');
            }}
            onSelectInSARPoint={(id) => {
              setSelectedInSARPointId(id);
              setSubView('ground_movement');
            }}
          />
        </div>

        {/* Right Column: Evidence Inspector (3 cols) */}
        <div className="lg:col-span-3">
          {subView === 'ground_movement' ? (
            <InSARInspector point={currentInSAR} />
          ) : (
            <TransectInspector transect={currentTransect} />
          )}
        </div>
      </div>

      {/* Acquisition Timeline Strip */}
      <AcquisitionTimeline
        selectedSceneId={selectedSceneId}
        onSelectScene={setSelectedSceneId}
      />

      {/* Findings Table */}
      <div className="samast-card">
        <div className="samast-card-header flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="samast-card-title">Riverbank Transect & Ground Findings Register</span>
            <span className="text-xs text-slate-500 font-medium">
              (Sorted by review need; changes &lt; detection limit marked No Resolvable Change)
            </span>
          </div>

          <button
            type="button"
            onClick={() => exportTransectsCSV(transects, insarPoints)}
            className="btn btn-secondary btn-sm"
          >
            <FileSpreadsheet size={13} />
            <span>Export Findings (CSV)</span>
          </button>
        </div>

        <div className="samast-table-container">
          <table className="samast-table text-xs">
            <thead>
              <tr>
                <th>Transect / Point ID</th>
                <th>Location / Bank</th>
                <th>Chainage</th>
                <th>Observation Period</th>
                <th>Movement Value</th>
                <th>Uncertainty</th>
                <th>Detection Limit</th>
                <th>Status</th>
                <th>Review State</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {transects.map((tr) => {
                const isSelected = selectedTransectId === tr.id;
                const isErosion = tr.signedMovementM < -tr.detectionLimitM;
                const isAccretion = tr.signedMovementM > tr.detectionLimitM;

                return (
                  <tr
                    key={tr.id}
                    onClick={() => {
                      setSelectedTransectId(tr.id);
                      setSubView('banks');
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'selected' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="font-mono font-bold text-slate-900">{tr.transectId}</td>
                    <td className="text-slate-700 capitalize">{tr.bank} Bank ({tr.name.split('-')[1]?.trim() || tr.name})</td>
                    <td className="font-mono text-slate-600">
                      {tr.chainageMetres === 0
                        ? 'At Bridge'
                        : tr.chainageMetres < 0
                        ? `${Math.abs(tr.chainageMetres)}m Upstream`
                        : `${tr.chainageMetres}m Downstream`}
                    </td>
                    <td className="font-mono text-slate-500">
                      {tr.baselineDate} to {tr.comparisonDate}
                    </td>
                    <td className="font-mono font-bold">
                      {tr.isResolvable ? (
                        <span className={isErosion ? 'text-rose-700' : 'text-emerald-700'}>
                          {tr.signedMovementM > 0 ? '+' : ''}
                          {tr.signedMovementM.toFixed(1)}m
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">No resolvable change</span>
                      )}
                    </td>
                    <td className="font-mono text-slate-500">±{tr.uncertaintyM.toFixed(1)}m</td>
                    <td className="font-mono text-slate-500">{tr.detectionLimitM.toFixed(1)}m</td>
                    <td>
                      <span
                        className={`badge ${
                          isErosion ? 'badge-warning' : isAccretion ? 'badge-good' : 'badge-stale'
                        }`}
                      >
                        {isErosion ? 'Retreat' : isAccretion ? 'Accretion' : 'Stable'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          tr.reviewState === 'reviewed'
                            ? 'badge-good'
                            : tr.reviewState === 'rejected'
                            ? 'badge-warning'
                            : 'badge-watch'
                        }`}
                      >
                        {tr.reviewState}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransectId(tr.id);
                          setSubView('banks');
                        }}
                      >
                        Inspect
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
    </div>
  );
};
