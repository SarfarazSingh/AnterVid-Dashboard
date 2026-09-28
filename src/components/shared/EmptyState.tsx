import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  reason?: string;
  icon?: React.ElementType;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  reason,
  icon: Icon = HelpCircle,
  actionText,
  onAction,
}) => {
  return (
    <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center my-4">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">{description}</p>
      {reason && (
        <div className="mt-2 text-xs font-mono text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
          Reason: {reason}
        </div>
      )}
      {actionText && onAction && (
        <button type="button" onClick={onAction} className="mt-4 btn btn-secondary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
