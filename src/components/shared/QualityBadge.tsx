import React from 'react';
import { Quality } from '../../types/domain';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, XCircle } from 'lucide-react';

interface QualityBadgeProps {
  quality: Quality;
  reasons?: string[];
  showIcon?: boolean;
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({
  quality,
  reasons = [],
  showIcon = true,
}) => {
  let badgeClass = 'badge-good';
  let label = 'Good';
  let Icon = CheckCircle2;

  switch (quality) {
    case 'good':
      badgeClass = 'badge-good';
      label = 'Good';
      Icon = CheckCircle2;
      break;
    case 'degraded':
      badgeClass = 'badge-watch';
      label = 'Degraded';
      Icon = AlertTriangle;
      break;
    case 'suspect':
      badgeClass = 'badge-watch';
      label = 'Suspect';
      Icon = AlertTriangle;
      break;
    case 'invalid':
      badgeClass = 'badge-warning';
      label = 'Invalid';
      Icon = AlertOctagon;
      break;
    case 'missing':
      badgeClass = 'badge-missing';
      label = 'Missing';
      Icon = XCircle;
      break;
    default:
      badgeClass = 'badge-stale';
      label = quality;
      Icon = HelpCircle;
  }

  const titleText = reasons.length > 0 ? `Quality: ${label} (${reasons.join(', ')})` : `Quality: ${label}`;

  return (
    <span className={`badge ${badgeClass}`} title={titleText}>
      {showIcon && <Icon size={12} />}
      <span>{label}</span>
    </span>
  );
};
