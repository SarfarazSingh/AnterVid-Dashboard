import { Observation, Event, TransectFinding, InSARFinding } from '../types/domain';
import { formatToIST, DEFAULT_DEMO_CLOCK_UTC } from './dateUtils';
import { formatMetricValue } from './formatters';

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
  const generatedAtIST = formatToIST(DEFAULT_DEMO_CLOCK_UTC);

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
  const generatedAtIST = formatToIST(DEFAULT_DEMO_CLOCK_UTC);

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
  const generatedAtIST = formatToIST(DEFAULT_DEMO_CLOCK_UTC);

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
