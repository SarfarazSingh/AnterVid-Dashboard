import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayerEvidence } from '../../types/domain';
import { Layers, Eye, EyeOff, Info, Sliders } from 'lucide-react';

interface LayerControlPanelProps {
  layerVisibility: Record<string, boolean>;
  layerOpacity: Record<string, number>;
  onToggleLayer: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layerVisibility,
  layerOpacity,
  onToggleLayer,
  onChangeOpacity,
}) => {
  const { layers, openProvenance } = useApp();

  return (
    <div className="samast-card h-full flex flex-col justify-between">
      <div>
        <div className="samast-card-header">
          <div className="flex items-center gap-1.5">
            <Layers size={15} className="text-blue-600" />
            <span className="samast-card-title">Geospatial Layer Registry</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {layers.length} Layers
          </span>
        </div>

        {/* Layer List with Opacity Controls */}
        <div className="space-y-3 py-1">
          {layers.map((layer) => {
            const isVisible = layerVisibility[layer.id] ?? false;
            const opacity = layerOpacity[layer.id] ?? 1.0;

            return (
              <div
                key={layer.id}
                className={`p-2.5 rounded-md border text-xs transition-all ${
                  isVisible ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 opacity-70'
                }`}
              >
                {/* Header row with checkbox toggle */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 flex-1">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => onToggleLayer(layer.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{layer.name}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => openProvenance(`Geospatial Layer: ${layer.name}`, layer)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition flex-shrink-0"
                    title="Inspect Layer Provenance & Uncertainty Metadata"
                  >
                    <Info size={13} />
                  </button>
                </div>

                {/* Resolution & Maturity Metadata */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  <span>
                    {layer.resolutionMetres ? `${layer.resolutionMetres}m Res` : '1:50k Scale'}
                  </span>
                  {layer.maturity === 'provisional' ? (
                    <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Provisional V1
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[10px]">{layer.methodVersion}</span>
                  )}
                </div>

                {/* Opacity Slider (visible when layer is on) */}
                {isVisible && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Layer Opacity:</span>
                      <span className="font-mono">{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full accent-blue-600 h-1 bg-slate-200 rounded cursor-pointer"
                    />

                    {/* Compact Legend Chips */}
                    <div className="flex flex-wrap gap-1 mt-1 pt-1">
                      {layer.legend.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-[10px] text-slate-600">
                          <span
                            className="w-2.5 h-2.5 rounded-xs border border-slate-300 inline-block"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate max-w-[120px]">{item.label.split('(')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 italic">
        OpenLayers / SVG multi-temporal canvas — tiles cached for offline operational review.
      </div>
    </div>
  );
};
