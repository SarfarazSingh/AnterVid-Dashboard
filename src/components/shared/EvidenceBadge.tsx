import React from 'react';
import { Origin } from '../../types/domain';
import { Database, Radio, Satellite, FileText, Cpu } from 'lucide-react';

interface EvidenceBadgeProps {
  origin: Origin;
  sourceId: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ origin, sourceId }) => {
  let label = sourceId;
  let Icon = Database;

  switch (origin) {
    case 'manufacturer_sensor':
      label = `Sensor: ${sourceId}`;
      Icon = Cpu;
      break;
    case 'official_observation':
      label = `Official: ${sourceId}`;
      Icon = Radio;
      break;
    case 'official_forecast':
    case 'model_forecast':
      label = `Forecast: ${sourceId}`;
      Icon = FileText;
      break;
    case 'satellite_observation':
      label = `Satellite: ${sourceId}`;
      Icon = Satellite;
      break;
    case 'manual_import':
      label = `Manual Entry: ${sourceId}`;
      Icon = FileText;
      break;
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
      title={`Origin: ${origin}, Source ID: ${sourceId}`}
    >
      <Icon size={11} className="text-slate-500" />
      <span>{label}</span>
    </span>
  );
};
