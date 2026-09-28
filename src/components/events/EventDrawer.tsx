import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Event } from '../../types/domain';
import { formatToIST } from '../../utils/dateUtils';
import {
  X,
  Bell,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Clock,
  User,
  FileText,
  Send,
  ShieldAlert,
} from 'lucide-react';

export const EventDrawer: React.FC = () => {
  const {
    events,
    isEventsDrawerOpen,
    setIsEventsDrawerOpen,
    acknowledgeEvent,
    addEventNote,
    openProvenance,
  } = useApp();

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [operatorNote, setOperatorNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isEventsDrawerOpen) return null;

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleAcknowledge = async () => {
    if (!activeEvent) return;
    setIsProcessing(true);
    try {
      await acknowledgeEvent(activeEvent.id, operatorNote || undefined);
      setOperatorNote('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNote = async () => {
    if (!activeEvent || !operatorNote.trim()) return;
    setIsProcessing(true);
    try {
      await addEventNote(activeEvent.id, operatorNote);
      setOperatorNote('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={() => setIsEventsDrawerOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="drawer-panel max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Operator Event Register</h2>
              <span className="text-xs text-slate-500 font-medium">
                {events.filter((e) => e.workflowStatus === 'unacknowledged').length} Unacknowledged Conditions
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
            onClick={() => setIsEventsDrawerOpen(false)}
            aria-label="Close Event Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content: Master List + Detail View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Event Selection List */}
          <div className="w-full md:w-56 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-2 space-y-1.5 text-xs">
            {events.map((ev) => {
              const isSelected = activeEvent?.id === ev.id;
              const isUnack = ev.workflowStatus === 'unacknowledged';

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`p-2.5 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`badge ${
                        ev.condition === 'warning' || ev.condition === 'critical'
                          ? 'badge-warning'
                          : 'badge-watch'
                      }`}
                    >
                      {ev.condition}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {ev.id.slice(-4)}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 leading-snug line-clamp-2">
                    {ev.title}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{formatToIST(ev.detectedAt, false, true)}</span>
                    <span
                      className={`font-semibold ${
                        isUnack ? 'text-amber-700' : 'text-slate-400'
                      }`}
                    >
                      {ev.workflowStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Active Event Details */}
          {activeEvent ? (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
              {/* Event Title & Condition Status */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`badge ${
                      activeEvent.condition === 'warning' ? 'badge-warning' : 'badge-watch'
                    }`}
                  >
                    Condition: {activeEvent.condition}
                  </span>
                  <span className="badge badge-stale">Workflow: {activeEvent.workflowStatus}</span>
                  <span className="text-slate-400 font-mono text-[11px]">Rule: {activeEvent.ruleVersion}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{activeEvent.title}</h3>
                <div className="text-slate-500 mt-1 flex items-center gap-2">
                  <Clock size={12} />
                  <span>Detected At: {formatToIST(activeEvent.detectedAt)}</span>
                </div>
              </div>

              {/* Procedural Instruction Notice (Critical Rule) */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-md text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-950 text-xs">
                  <ShieldAlert size={14} className="text-blue-700" />
                  <span>Approved Operational Procedure:</span>
                </div>
                <p className="text-xs leading-relaxed text-blue-900 font-medium">
                  {activeEvent.suggestedProcedure}
                </p>
                <div className="text-[10px] text-blue-700 italic pt-1 border-t border-blue-200/60">
                  Notice: Acknowledging records that someone has seen the event; it does NOT clear the underlying physical condition or certify the bridge for traffic.
                </div>
              </div>

              {/* Audit History Timeline */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                  Immutable Audit Trail ({activeEvent.auditTrail.length} Entries)
                </div>
                <div className="space-y-2">
                  {activeEvent.auditTrail.map((entry, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-700">{entry.action}</span>
                        <span className="font-mono text-[11px]">{formatToIST(entry.timestamp)}</span>
                      </div>
                      <div className="text-slate-600 flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        <span>By: {entry.user}</span>
                      </div>
                      {entry.note && (
                        <div className="text-slate-800 italic bg-white p-2 rounded border border-slate-200 text-[11px] mt-1">
                          "{entry.note}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Operator Acknowledgement & Note Actions */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <label className="block font-semibold text-slate-800">
                  Add Operator Note / Log Entry:
                </label>
                <textarea
                  rows={2}
                  value={operatorNote}
                  onChange={(e) => setOperatorNote(e.target.value)}
                  placeholder="Record handover notes, field communication or inspection results..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                />

                <div className="flex gap-2">
                  {activeEvent.workflowStatus === 'unacknowledged' ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleAcknowledge}
                      className="btn btn-primary btn-sm flex-1 text-xs"
                    >
                      <CheckCircle size={14} />
                      <span>Acknowledge Condition</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleAddNote}
                      className="btn btn-secondary btn-sm flex-1 text-xs"
                    >
                      <Send size={13} />
                      <span>Append Operator Note</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-8 text-center text-slate-400">No events active.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Idempotent Audited State Machine</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEventsDrawerOpen(false)}
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
