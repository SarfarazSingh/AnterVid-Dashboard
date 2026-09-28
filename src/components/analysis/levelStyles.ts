import { AlertTriangle, CheckCircle2, CircleHelp, OctagonAlert } from 'lucide-react';
import { DecisionDomain, DecisionLevel, OperatingPosture } from '../../types/domain';

export const LEVEL_STYLE: Record<
  DecisionLevel,
  { label: string; badge: string; text: string; dot: string; icon: typeof CheckCircle2 }
> = {
  normal: { label: 'Normal', badge: 'badge-good', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  watch: { label: 'Watch', badge: 'badge-watch', text: 'text-amber-700', dot: 'bg-amber-500', icon: AlertTriangle },
  warning: { label: 'Warning', badge: 'badge-warning', text: 'text-rose-700', dot: 'bg-rose-500', icon: OctagonAlert },
  unknown: { label: 'Unknown', badge: 'badge-stale', text: 'text-slate-600', dot: 'bg-slate-400', icon: CircleHelp },
};

export const POSTURE_STYLE: Record<OperatingPosture, { panel: string; accent: string; chip: string }> = {
  normal: {
    panel: 'bg-emerald-50 border-emerald-200',
    accent: 'text-emerald-800',
    chip: 'bg-emerald-600 text-white',
  },
  heightened_watch: {
    panel: 'bg-amber-50 border-amber-200',
    accent: 'text-amber-900',
    chip: 'bg-amber-500 text-white',
  },
  restriction_review: {
    panel: 'bg-rose-50 border-rose-200',
    accent: 'text-rose-900',
    chip: 'bg-rose-600 text-white',
  },
  suspension_review: {
    panel: 'bg-rose-100 border-rose-300',
    accent: 'text-rose-950',
    chip: 'bg-rose-800 text-white',
  },
};

export const DOMAIN_LABEL: Record<DecisionDomain, { label: string; description: string }> = {
  structure: { label: 'Structure', description: 'Scour, vibration and tilt at Pier 11' },
  hydrology: { label: 'River loading', description: 'Stage, forecast, releases and rainfall' },
  ground: { label: 'Ground and banks', description: 'Bank retreat and approach movement' },
  data: { label: 'Data confidence', description: 'Telemetry and external feed health' },
};

export function formatRelativeToClock(targetIso: string, clockIso: string, endIso?: string | null): string {
  const target = new Date(targetIso).getTime();
  const clock = new Date(clockIso).getTime();
  if (endIso) {
    const end = new Date(endIso).getTime();
    if (target <= clock && clock <= end) return 'In progress';
  }
  const hours = (target - clock) / 3600000;
  if (Math.abs(hours) < 0.5) return 'Now';
  if (hours < 0) return `${Math.abs(hours) < 24 ? `${Math.round(-hours)} h` : `${Math.round(-hours / 24)} d`} ago`;
  if (hours < 48) return `In ${hours < 10 ? hours.toFixed(1) : Math.round(hours)} h`;
  return `In ${Math.round(hours / 24)} d`;
}
