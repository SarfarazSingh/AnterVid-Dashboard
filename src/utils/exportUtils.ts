import { Observation, Event, TransectFinding, InSARFinding, DecisionRecord } from '../types/domain';
import { formatToIST } from './dateUtils';
import { Assessment, POSTURE_COPY } from './decisionEngine';

/**
 * Downloads a text content as a file in the browser
 */
function downloadBlob(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an operator sensor summary CSV with full metadata and DEMO watermark
 */
export function exportSensorsCSV(observations: Observation[], assetName = 'Bridge 249') {
  const generatedAtIST = formatToIST(new Date().toISOString());

  let csv = `# -----------------------------------------------------------------------------\n`;
  csv += `# ANTERVID SAMAST OPERATOR REPORT - SYNTHETIC DEMO EXPORT\n`;
  csv += `# Asset: ${assetName} (Yamuna, Delhi, ID: BR-249)\n`;
  csv += `# Generated At: ${generatedAtIST}\n`;
  csv += `# Time Zone: Asia/Kolkata (IST)\n`;
  csv += `# Provenance: Local deterministic test fixtures - NOT surveyed observations\n`;
  csv += `# -----------------------------------------------------------------------------\n\n`;

  csv += `Observation_ID,Sensor_ID,Metric,Value,Unit,Observed_At_IST,Observed_At_UTC,Received_At_IST,Quality_State,Quality_Reasons,Uncertainty,Vertical_Datum,Source_ID,Method_Version\n`;

  observations.forEach((obs) => {
    const valStr = obs.value !== null ? obs.value : '';
    const obsIST = formatToIST(obs.observedAt);
    const recIST = formatToIST(obs.receivedAt);
    const reasons = obs.quality.reasons.join('; ') || 'None';
    const uncStr = obs.quality.uncertainty
      ? `±${obs.quality.uncertainty.plusMinus} ${obs.quality.uncertainty.unit}`
      : 'Not supplied';
    const datum = obs.reference.verticalDatum || 'Unspecified';

    csv += `"${obs.id}","${obs.sensorId || ''}","${obs.metric}","${valStr}","${obs.unit}","${obsIST}","${obs.observedAt}","${recIST}","${obs.quality.state}","${reasons}","${uncStr}","${datum}","${obs.provenance.sourceId}","${obs.provenance.methodVersion || 'N/A'}"\n`;
  });

  downloadBlob(csv, `Samast_Sensor_Export_BR249_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Generates an Events audit log CSV
 */
export function exportEventsCSV(events: Event[]) {
  const generatedAtIST = formatToIST(new Date().toISOString());

  let csv = `# -----------------------------------------------------------------------------\n`;
  csv += `# ANTERVID SAMAST OPERATOR EVENT AUDIT LOG - SYNTHETIC DEMO EXPORT\n`;
  csv += `# Generated At: ${generatedAtIST} (IST)\n`;
  csv += `# Notice: Synthetic demonstration events. Acknowledging does not clear underlying condition.\n`;
  csv += `# -----------------------------------------------------------------------------\n\n`;

  csv += `Event_ID,Condition,Workflow_Status,Category,Title,Detected_At_IST,Assignee,Acknowledged_At_IST,Acknowledged_By,Rule_Version,Audit_Entries_Count\n`;

  events.forEach((ev) => {
    const detIST = formatToIST(ev.detectedAt);
    const ackIST = ev.acknowledgedAt ? formatToIST(ev.acknowledgedAt) : 'Unacknowledged';
    csv += `"${ev.id}","${ev.condition}","${ev.workflowStatus}","${ev.category}","${ev.title.replace(/"/g, '""')}","${detIST}","${ev.assignee || 'Unassigned'}","${ackIST}","${ev.acknowledgedBy || 'None'}","${ev.ruleVersion}","${ev.auditTrail.length}"\n`;
  });

  downloadBlob(csv, `Samast_Events_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Generates Ground and Riverbank transect findings CSV
 */
export function exportTransectsCSV(transects: TransectFinding[], insarPoints: InSARFinding[]) {
  const generatedAtIST = formatToIST(new Date().toISOString());

  let csv = `# -----------------------------------------------------------------------------\n`;
  csv += `# ANTERVID SAMAST GEOSPATIAL & RIVERBANK TRANSECT FINDINGS - DEMO EXPORT\n`;
  csv += `# Generated At: ${generatedAtIST} (IST)\n`;
  csv += `# Detection Rule: Change < Detection Limit is labelled 'No resolvable change'\n`;
  csv += `# -----------------------------------------------------------------------------\n\n`;

  csv += `Transect_ID,Bank,Chainage_m,Baseline_Date,Comparison_Date,Boundary_Type,Signed_Movement_m,Uncertainty_m,Detection_Limit_m,Resolvable,Review_State,Analyst_Note\n`;

  transects.forEach((t) => {
    csv += `"${t.transectId}","${t.bank}","${t.chainageMetres}","${t.baselineDate}","${t.comparisonDate}","${t.boundaryType}","${t.signedMovementM}","${t.uncertaintyM}","${t.detectionLimitM}","${t.isResolvable}","${t.reviewState}","${(t.analystNote || '').replace(/"/g, '""')}"\n`;
  });

  csv += `\n# InSAR Line-of-Sight Relative Displacement Points\n`;
  csv += `Point_ID,Location,Coordinates,Relative_LOS_Displacement_mm,Uncertainty_mm,Period,Track,Orbit,Coherence,Sufficient_Coherence,Method\n`;

  insarPoints.forEach((p) => {
    csv += `"${p.pointId}","${p.locationName}","${p.coordinates.join(', ')}","${p.relativeLosDisplacementMm}","${p.uncertaintyMm}","${p.periodStart} to ${p.periodEnd}","${p.track}","${p.orbitDirection}","${p.coherence}","${p.isSufficientCoherence}","${p.methodVersion}"\n`;
  });

  downloadBlob(csv, `Samast_Geospatial_Findings_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function buildHandoverBrief(
  assessment: Assessment,
  decisions: DecisionRecord[],
  completedActionIds: string[],
  assetName = 'Bridge 249'
): string {
  const lines: string[] = [];
  const rule = '-'.repeat(72);
  lines.push(`SAMAST SHIFT HANDOVER BRIEF - ${assetName} (BR-249, Yamuna, Delhi)`);
  lines.push('Synthetic demonstration data. Not for operational use.');
  lines.push(`Evaluated: ${formatToIST(assessment.evaluatedAt)} | Rule set: ${assessment.ruleSetVersion}`);
  lines.push(rule);
  lines.push(`RECOMMENDED POSTURE: ${POSTURE_COPY[assessment.posture].label.toUpperCase()} (${assessment.confidence} confidence)`);
  lines.push(POSTURE_COPY[assessment.posture].summary);
  assessment.postureDrivers.forEach((d) => lines.push(`  - ${d}`));

  const latest = decisions[0];
  lines.push('');
  lines.push('LATEST RECORDED DECISION');
  if (latest) {
    lines.push(`  ${latest.id}: ${POSTURE_COPY[latest.selectedPosture].label} by ${latest.recordedBy} at ${formatToIST(latest.recordedAt)}`);
    if (latest.rationale) lines.push(`  Rationale: ${latest.rationale}`);
  } else {
    lines.push('  None recorded this shift.');
  }

  lines.push('');
  lines.push('EVIDENCE');
  assessment.factors.forEach((f) => {
    lines.push(`  [${f.level.toUpperCase().padEnd(7)}] ${f.label}: ${f.value}`);
    lines.push(`            ${f.rationale}`);
  });

  lines.push('');
  lines.push('ACTIONS');
  if (assessment.actions.length === 0) lines.push('  None.');
  assessment.actions.forEach((a) => {
    const mark = completedActionIds.includes(a.id) ? 'x' : ' ';
    lines.push(`  [${mark}] ${a.title} (${a.owner}${a.procedure ? `, ${a.procedure}` : ''})`);
  });

  lines.push('');
  lines.push('COMING UP');
  assessment.outlook.forEach((o) => {
    const window = o.windowEnd ? `${formatToIST(o.windowStart)} to ${formatToIST(o.windowEnd)}` : formatToIST(o.windowStart);
    lines.push(`  ${window}: ${o.label}`);
  });

  lines.push('');
  lines.push('EVIDENCE GAPS');
  assessment.gaps.forEach((g) => lines.push(`  - ${g.label}: ${g.impact}`));
  lines.push(rule);
  lines.push('Operating restrictions are issued by the Section Engineer (Bridges), not by Samast.');
  return lines.join('\n');
}

export function exportHandoverBrief(
  assessment: Assessment,
  decisions: DecisionRecord[],
  completedActionIds: string[]
) {
  const content = buildHandoverBrief(assessment, decisions, completedActionIds);
  downloadBlob(content, `Samast_Handover_BR249_${assessment.evaluatedAt.slice(0, 10)}.txt`, 'text/plain;charset=utf-8;');
}
