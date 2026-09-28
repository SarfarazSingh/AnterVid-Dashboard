import {
  DecisionDomain,
  DecisionLevel,
  Event,
  InSARFinding,
  LayerEvidence,
  Observation,
  OperatingPosture,
  RainfallData,
  ReleaseBulletin,
  RiverForecast,
  RiverStation,
  SatelliteScene,
  Sensor,
  SourceStatus,
  TransectFinding,
} from '../types/domain';
import { formatToIST } from './dateUtils';

export const RULE_SET_VERSION = 'DSS-BR249-v0.1-demo';

/**
 * Demonstration thresholds. Structural limits must be replaced by the values in
 * the approved Bridge 249 monitoring plan before operational use.
 */
export const THRESHOLDS = {
  scourWatchM: 0.3,
  scourWarningM: 0.5,
  singleChannelToleranceM: 0.1,
  vibrationWatch: 0.1,
  vibrationWarning: 0.2,
  tiltWatchDeg: 0.25,
  tiltWarningDeg: 0.5,
  stageApproachM: 0.3,
  // Delhi flood-control alerts are commonly raised once Hathnikund releases exceed 1 lakh cusecs.
  hathnikundWatchCusecs: 100000,
  hathnikundWarningCusecs: 200000,
  // IMD 24-hour rainfall categories: heavy 64.5–115.5 mm, very heavy 115.6–204.4 mm.
  heavyRainMm24h: 64.5,
  veryHeavyRainMm24h: 115.6,
  bankSearchRadiusM: 1000,
  bankRetreatWarningM: 10,
  stageMismatchM: 0.25,
  insarWatchMm: 5,
  insarWarningMm: 10,
};

export type AnalysisTab = 'bridge_sensors' | 'river_intelligence' | 'ground_and_banks';

export interface DecisionFactor {
  id: string;
  domain: DecisionDomain;
  label: string;
  level: DecisionLevel;
  value: string;
  threshold: string;
  rationale: string;
  source: string;
  observedAt: string | null;
  tab: AnalysisTab;
}

export type ActionOwner =
  | 'Control room operator'
  | 'Section Engineer (Bridges)'
  | 'Geospatial analyst'
  | 'System administrator';

export interface RecommendedAction {
  id: string;
  title: string;
  detail: string;
  owner: ActionOwner;
  priority: 'immediate' | 'this_shift' | 'routine';
  procedure: string | null;
  factorIds: string[];
  tab: AnalysisTab | null;
}

export interface OutlookItem {
  id: string;
  label: string;
  windowStart: string;
  windowEnd: string | null;
  detail: string;
  basis: 'official_observation' | 'official_forecast' | 'model_forecast' | 'nominal_revisit';
  level: DecisionLevel;
}

export interface DataGap {
  id: string;
  label: string;
  impact: string;
  candidateSourceIds: string[];
}

export interface Assessment {
  ruleSetVersion: string;
  evaluatedAt: string;
  posture: OperatingPosture;
  postureDrivers: string[];
  factors: DecisionFactor[];
  domainLevels: Record<DecisionDomain, DecisionLevel>;
  actions: RecommendedAction[];
  outlook: OutlookItem[];
  confidence: 'high' | 'medium' | 'low';
  gaps: DataGap[];
}

export interface AssessmentInput {
  clockIso: string;
  sensors: Sensor[];
  observations: Observation[];
  riverStations: RiverStation[];
  releaseBulletins: ReleaseBulletin[];
  riverForecasts: RiverForecast[];
  rainfall: RainfallData[];
  transects: TransectFinding[];
  insarPoints: InSARFinding[];
  layers: LayerEvidence[];
  scenes: SatelliteScene[];
  sourceStatuses: SourceStatus[];
  events: Event[];
}

export const POSTURE_COPY: Record<OperatingPosture, { label: string; summary: string }> = {
  normal: {
    label: 'Normal operations',
    summary: 'No monitored condition exceeds a watch threshold.',
  },
  heightened_watch: {
    label: 'Heightened watch',
    summary: 'Traffic continues. Increase monitoring and complete the listed checks this shift.',
  },
  restriction_review: {
    label: 'Speed restriction review',
    summary: 'Ask the Section Engineer (Bridges) to review a speed restriction and arrange inspection.',
  },
  suspension_review: {
    label: 'Traffic suspension review',
    summary: 'Ask the Section Engineer (Bridges) to review suspending traffic pending inspection.',
  },
};

const LEVEL_RANK: Record<DecisionLevel, number> = { normal: 0, unknown: 1, watch: 2, warning: 3 };

export function maxLevel(levels: DecisionLevel[]): DecisionLevel {
  return levels.reduce<DecisionLevel>((acc, l) => (LEVEL_RANK[l] > LEVEL_RANK[acc] ? l : acc), 'normal');
}

function byThreshold(value: number, watch: number, warning: number): DecisionLevel {
  if (value >= warning) return 'warning';
  if (value >= watch) return 'watch';
  return 'normal';
}

function eventLevel(events: Event[], category: Event['category']): DecisionLevel {
  const open = events.filter((e) => e.category === category && e.workflowStatus !== 'closed');
  if (open.some((e) => e.condition === 'warning' || e.condition === 'critical')) return 'warning';
  if (open.some((e) => e.condition === 'watch')) return 'watch';
  return 'normal';
}

function shortName(name: string): string {
  return name.split(' (')[0];
}

function fmtCusecs(v: number): string {
  return `${Math.round(v).toLocaleString('en-IN')} cusecs`;
}

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600 * 1000).toISOString();
}

export function parseTravelWindowHours(text: string | undefined): [number, number] | null {
  if (!text) return null;
  const m = text.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*h/);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
}

function scourFactor(input: AssessmentInput): DecisionFactor {
  const sonars = input.sensors.filter((s) => s.deviceType === 'sonar' && s.capabilities.isCommissioned);
  const readings = sonars.map((s) => {
    const obs = input.observations.find((o) => o.sensorId === s.id && o.metric === 'sonar_range');
    const baseline = s.baselineValues.sonar_range;
    const usable =
      obs && obs.value !== null && baseline !== undefined && obs.quality.state !== 'missing' && obs.quality.state !== 'invalid';
    return {
      name: shortName(s.name),
      obs,
      drop: usable ? (obs!.value as number) - baseline : null,
      degraded: obs?.quality.state === 'degraded' || obs?.quality.state === 'suspect',
    };
  });

  const valid = readings.filter((r) => r.drop !== null);
  const threshold = `Watch ≥ ${THRESHOLDS.scourWatchM.toFixed(2)} m · Warning ≥ ${THRESHOLDS.scourWarningM.toFixed(2)} m below monsoon baseline`;

  if (valid.length === 0) {
    return {
      id: 'scour',
      domain: 'structure',
      label: 'Pier 11 bed scour',
      level: 'unknown',
      value: 'No valid sonar channel',
      threshold,
      rationale: 'All Pier 11 sonar channels are unavailable, so bed condition cannot be assessed. Missing readings are not treated as zero.',
      source: 'Samast gateway · Pier 11 sonars',
      observedAt: null,
      tab: 'bridge_sensors',
    };
  }

  const worst = valid.reduce((a, b) => ((b.drop as number) > (a.drop as number) ? b : a));
  const worstDrop = worst.drop as number;
  const thresholdLevel = byThreshold(worstDrop, THRESHOLDS.scourWatchM, THRESHOLDS.scourWarningM);
  const level = maxLevel([thresholdLevel, eventLevel(input.events, 'scour')]);

  const notes: string[] = [];
  const others = valid.filter((r) => r !== worst);
  if (
    thresholdLevel !== 'normal' &&
    others.length > 0 &&
    others.every((r) => Math.abs(r.drop as number) <= THRESHOLDS.singleChannelToleranceM)
  ) {
    notes.push(
      `Only ${worst.name} shows lowering; ${others.map((o) => o.name).join(' and ')} are within ${THRESHOLDS.singleChannelToleranceM.toFixed(2)} m of baseline. Confirm before field escalation.`
    );
  }
  const degraded = readings.filter((r) => r.degraded).map((r) => r.name);
  if (degraded.length > 0) notes.push(`${degraded.join(', ')} reporting degraded acoustic return.`);
  const missing = readings.filter((r) => r.drop === null).map((r) => r.name);
  if (missing.length > 0) notes.push(`${missing.join(', ')} unavailable.`);
  if (level === 'warning' && thresholdLevel !== 'warning') notes.push('Escalated by the scour rule engine event.');

  return {
    id: 'scour',
    domain: 'structure',
    label: 'Pier 11 bed scour',
    level,
    value: `${Math.abs(worstDrop).toFixed(2)} m bed ${worstDrop >= 0 ? 'lowering' : 'rise'} · ${worst.name}`,
    threshold,
    rationale: notes.length > 0 ? notes.join(' ') : 'All valid sonar channels agree within tolerance.',
    source: 'Samast gateway · Pier 11 sonars',
    observedAt: worst.obs?.observedAt ?? null,
    tab: 'bridge_sensors',
  };
}

function scalarSensorFactor(
  input: AssessmentInput,
  opts: {
    id: string;
    label: string;
    sensorId: string;
    metric: string;
    unit: string;
    watch: number;
    warning: number;
    digits: number;
    note: string;
  }
): DecisionFactor {
  const obs = input.observations.find((o) => o.sensorId === opts.sensorId && o.metric === opts.metric);
  const threshold = `Watch ≥ ${opts.watch} ${opts.unit} · Warning ≥ ${opts.warning} ${opts.unit}`;
  if (!obs || obs.value === null || obs.quality.state === 'missing' || obs.quality.state === 'invalid') {
    return {
      id: opts.id,
      domain: 'structure',
      label: opts.label,
      level: 'unknown',
      value: 'Not available',
      threshold,
      rationale: 'No valid reading from the Pier 11 vibration and tilt sensor.',
      source: 'Samast gateway · P11-VT-01',
      observedAt: obs?.observedAt ?? null,
      tab: 'bridge_sensors',
    };
  }
  const magnitude = Math.abs(obs.value);
  return {
    id: opts.id,
    domain: 'structure',
    label: opts.label,
    level: byThreshold(magnitude, opts.watch, opts.warning),
    value: `${obs.value.toFixed(opts.digits)} ${opts.unit}`,
    threshold,
    rationale: opts.note,
    source: 'Samast gateway · P11-VT-01',
    observedAt: obs.observedAt,
    tab: 'bridge_sensors',
  };
}

function stageFactor(input: AssessmentInput, orb: RiverStation | undefined): DecisionFactor {
  const warning = orb?.warningLevelM ?? 204.5;
  const danger = orb?.dangerLevelM ?? 205.33;
  const obs = input.observations.find(
    (o) => o.metric === 'stage_m' && o.sensorId === null && o.provenance.sourceId === 'cwc-official'
  );
  const threshold = `Watch ≥ ${(warning - THRESHOLDS.stageApproachM).toFixed(2)} m · Warning ≥ ${warning.toFixed(2)} m · Danger ${danger.toFixed(2)} m`;
  if (!obs || obs.value === null) {
    return {
      id: 'stage',
      domain: 'hydrology',
      label: 'ORB river stage',
      level: 'unknown',
      value: 'Not available',
      threshold,
      rationale: 'No current CWC stage reading for Old Railway Bridge.',
      source: 'CWC · Old Railway Bridge gauge',
      observedAt: null,
      tab: 'river_intelligence',
    };
  }
  const v = obs.value;
  let level: DecisionLevel = 'normal';
  let rationale = `${(warning - v).toFixed(2)} m below the ${warning.toFixed(2)} m warning level.`;
  if (v >= danger) {
    level = 'warning';
    rationale = `Above the ${danger.toFixed(2)} m danger level by ${(v - danger).toFixed(2)} m.`;
  } else if (v >= warning) {
    level = 'warning';
    rationale = `Above the ${warning.toFixed(2)} m warning level by ${(v - warning).toFixed(2)} m; ${(danger - v).toFixed(2)} m below danger.`;
  } else if (v >= warning - THRESHOLDS.stageApproachM) {
    level = 'watch';
  }
  return {
    id: 'stage',
    domain: 'hydrology',
    label: 'ORB river stage',
    level,
    value: `${v.toFixed(2)} m MSL`,
    threshold,
    rationale,
    source: 'CWC · Old Railway Bridge gauge',
    observedAt: obs.observedAt,
    tab: 'river_intelligence',
  };
}

function forecastFactor(input: AssessmentInput, orb: RiverStation | undefined): DecisionFactor {
  const warning = orb?.warningLevelM ?? 204.5;
  const danger = orb?.dangerLevelM ?? 205.33;
  const threshold = `Watch if forecast ≥ ${warning.toFixed(2)} m · Warning if forecast ≥ ${danger.toFixed(2)} m`;
  const fc = input.riverForecasts.find((f) => f.issuer === 'CWC Official');
  const points = (fc?.forecastPoints ?? []).filter(
    (p) => p.stageM !== undefined && new Date(p.timestamp).getTime() >= new Date(input.clockIso).getTime()
  );
  if (!fc || points.length === 0) {
    return {
      id: 'forecast',
      domain: 'hydrology',
      label: 'CWC stage forecast',
      level: 'unknown',
      value: 'Forecast unavailable',
      threshold,
      rationale: 'The official forecast feed is offline. Use the last valid bulletin and model context until it returns.',
      source: 'CWC flood forecast',
      observedAt: null,
      tab: 'river_intelligence',
    };
  }
  const peak = points.reduce((a, b) => ((b.stageM as number) > (a.stageM as number) ? b : a));
  const peakStage = peak.stageM as number;
  const crossing = points.find((p) => (p.stageM as number) >= warning);
  return {
    id: 'forecast',
    domain: 'hydrology',
    label: 'CWC stage forecast',
    level: byThreshold(peakStage, warning, danger),
    value: `Peak ${peakStage.toFixed(2)} m · ${formatToIST(peak.timestamp)}`,
    threshold,
    rationale: crossing
      ? `Forecast to cross the warning level at ${formatToIST(crossing.timestamp)}.`
      : 'Forecast stays below the warning level.',
    source: `CWC forecast issued ${formatToIST(fc.issueTime)}`,
    observedAt: fc.issueTime,
    tab: 'river_intelligence',
  };
}

function releaseFactor(input: AssessmentInput): DecisionFactor {
  const threshold = `Watch ≥ ${fmtCusecs(THRESHOLDS.hathnikundWatchCusecs)} · Warning ≥ ${fmtCusecs(THRESHOLDS.hathnikundWarningCusecs)}`;
  const current = input.releaseBulletins.find((b) => b.barrageId === 'STA-HATHNIKUND' && !b.isSuperseded);
  if (!current) {
    return {
      id: 'release',
      domain: 'hydrology',
      label: 'Hathnikund release',
      level: 'unknown',
      value: 'No current bulletin',
      threshold,
      rationale: 'No valid Hathnikund release bulletin has been registered.',
      source: 'Haryana I&WRD bulletin',
      observedAt: null,
      tab: 'river_intelligence',
    };
  }
  const cusecs = current.originalUnit === 'cusecs' ? current.originalDischarge : current.normalizedDischargeM3s / 0.028316846592;
  const notes = [`Travel to Delhi ${current.travelTimeEstimateHours ?? 'not modelled'}.`];
  if (current.revision > 1) notes.push(`Revision ${current.revision} supersedes the earlier bulletin.`);
  return {
    id: 'release',
    domain: 'hydrology',
    label: 'Hathnikund release',
    level: byThreshold(cusecs, THRESHOLDS.hathnikundWatchCusecs, THRESHOLDS.hathnikundWarningCusecs),
    value: fmtCusecs(cusecs),
    threshold,
    rationale: notes.join(' '),
    source: `${current.issuer} · ${current.bulletinRef}`,
    observedAt: current.issueTime,
    tab: 'river_intelligence',
  };
}

function rainfallFactor(input: AssessmentInput): DecisionFactor {
  const threshold = `IMD heavy ≥ ${THRESHOLDS.heavyRainMm24h} mm/24h · very heavy ≥ ${THRESHOLDS.veryHeavyRainMm24h} mm/24h`;
  const sub = input.rainfall.find((r) => r.locationType === 'subbasin_yamunanagar');
  const basin = input.rainfall.find((r) => r.locationType === 'upstream_basin');
  if (!sub) {
    return {
      id: 'rainfall',
      domain: 'hydrology',
      label: 'Upper catchment rainfall',
      level: 'unknown',
      value: 'Not available',
      threshold,
      rationale: 'No sub-basin rainfall estimate is available.',
      source: 'NASA IMERG Early',
      observedAt: null,
      tab: 'river_intelligence',
    };
  }
  const level = byThreshold(sub.accumulationMm, THRESHOLDS.heavyRainMm24h, THRESHOLDS.veryHeavyRainMm24h);
  const category =
    level === 'warning' ? 'very heavy' : level === 'watch' ? 'heavy' : 'below heavy';
  return {
    id: 'rainfall',
    domain: 'hydrology',
    label: 'Upper catchment rainfall',
    level,
    value: `${sub.accumulationMm.toFixed(1)} mm / 24h`,
    threshold,
    rationale: `${sub.locationName}: ${category} rainfall. ${
      basin ? `Whole catchment ${basin.accumulationMm.toFixed(1)} mm over 48 h.` : ''
    } Satellite estimate with ${sub.observationLatencyHours} h latency.`.trim(),
    source: sub.source,
    observedAt: sub.periodEnd,
    tab: 'river_intelligence',
  };
}

function bankFactor(input: AssessmentInput): DecisionFactor {
  const threshold = `Resolvable retreat within ${THRESHOLDS.bankSearchRadiusM} m · Warning ≥ ${THRESHOLDS.bankRetreatWarningM} m`;
  const retreats = input.transects
    .filter(
      (t) =>
        t.isResolvable &&
        t.signedMovementM < -t.detectionLimitM &&
        Math.abs(t.chainageMetres) <= THRESHOLDS.bankSearchRadiusM &&
        t.reviewState !== 'rejected'
    )
    .sort((a, b) => a.signedMovementM - b.signedMovementM);

  if (retreats.length === 0) {
    return {
      id: 'banks',
      domain: 'ground',
      label: 'Riverbank retreat near bridge',
      level: 'normal',
      value: 'No resolvable retreat',
      threshold,
      rationale: `No transect within ${THRESHOLDS.bankSearchRadiusM} m shows retreat beyond its detection limit.`,
      source: 'Sentinel-2 transect analysis',
      observedAt: null,
      tab: 'ground_and_banks',
    };
  }
  const t = retreats[0];
  const where =
    t.chainageMetres === 0
      ? 'at the bridge'
      : `${Math.abs(t.chainageMetres)} m ${t.chainageMetres < 0 ? 'upstream' : 'downstream'}`;
  const notes = [`${t.bank === 'left' ? 'Left' : 'Right'} bank ${where}; review state ${t.reviewState}.`];
  if (Math.abs(t.stageDifferenceM) > THRESHOLDS.stageMismatchM) {
    notes.push(`River stage differed by ${t.stageDifferenceM.toFixed(2)} m between dates, so part of the shift may be water level.`);
  }
  return {
    id: 'banks',
    domain: 'ground',
    label: 'Riverbank retreat near bridge',
    level: Math.abs(t.signedMovementM) >= THRESHOLDS.bankRetreatWarningM ? 'warning' : 'watch',
    value: `${t.signedMovementM.toFixed(1)} m · ${t.transectId}`,
    threshold,
    rationale: notes.join(' '),
    source: `Transects ${t.baselineDate} to ${t.comparisonDate}`,
    observedAt: t.comparisonDate,
    tab: 'ground_and_banks',
  };
}

function insarFactor(input: AssessmentInput): DecisionFactor {
  const threshold = `Watch ≥ ${THRESHOLDS.insarWatchMm} mm · Warning ≥ ${THRESHOLDS.insarWarningMm} mm relative line-of-sight`;
  const approach = input.insarPoints.filter((p) => p.pointId.startsWith('P-APP'));
  const coherent = approach.filter((p) => p.isSufficientCoherence);
  if (coherent.length === 0) {
    return {
      id: 'insar',
      domain: 'ground',
      label: 'Approach embankment movement',
      level: 'unknown',
      value: 'Insufficient coherence',
      threshold,
      rationale: 'No approach embankment point has enough interferometric coherence to report movement.',
      source: 'InSAR time series',
      observedAt: null,
      tab: 'ground_and_banks',
    };
  }
  const worst = coherent.reduce((a, b) =>
    Math.abs(b.relativeLosDisplacementMm) > Math.abs(a.relativeLosDisplacementMm) ? b : a
  );
  const magnitude = Math.abs(worst.relativeLosDisplacementMm);
  return {
    id: 'insar',
    domain: 'ground',
    label: 'Approach embankment movement',
    level: byThreshold(magnitude, THRESHOLDS.insarWatchMm, THRESHOLDS.insarWarningMm),
    value: `${worst.relativeLosDisplacementMm > 0 ? '+' : ''}${worst.relativeLosDisplacementMm.toFixed(1)} mm · ${worst.pointId}`,
    threshold,
    rationale: `${worst.locationName}, ±${worst.uncertaintyMm} mm. Relative line-of-sight motion, not vertical settlement.`,
    source: `${worst.track} · ${worst.methodVersion}`,
    observedAt: worst.periodEnd,
    tab: 'ground_and_banks',
  };
}

function telemetryFactor(input: AssessmentInput): DecisionFactor {
  const gw = input.sourceStatuses.find((s) => s.sourceId === 'samasth-gateway');
  const threshold = 'Stale after 15 min without a packet';
  if (!gw) {
    return {
      id: 'telemetry',
      domain: 'data',
      label: 'Bridge sensor telemetry',
      level: 'unknown',
      value: 'No gateway status',
      threshold,
      rationale: 'Gateway health has not been reported.',
      source: 'Samast gateway',
      observedAt: null,
      tab: 'bridge_sensors',
    };
  }
  const level: DecisionLevel = gw.accessState === 'current' ? 'normal' : 'watch';
  return {
    id: 'telemetry',
    domain: 'data',
    label: 'Bridge sensor telemetry',
    level,
    value: gw.accessState === 'current' ? 'Current' : gw.accessState.replace(/_/g, ' '),
    threshold,
    rationale: gw.message,
    source: gw.name,
    observedAt: gw.latestObservationAt,
    tab: 'bridge_sensors',
  };
}

function externalFeedsFactor(input: AssessmentInput): DecisionFactor {
  const watched = ['cwc-official', 'barrage-bulletin', 'imd-aws', 'nasa-imerg-early'];
  const statuses = input.sourceStatuses.filter((s) => watched.includes(s.sourceId));
  const degraded = statuses.filter((s) => s.accessState !== 'current');
  return {
    id: 'feeds',
    domain: 'data',
    label: 'River and weather feeds',
    level: degraded.length === 0 ? 'normal' : 'watch',
    value: `${statuses.length - degraded.length} of ${statuses.length} current`,
    threshold: 'All official river and weather feeds current',
    rationale:
      degraded.length === 0
        ? 'CWC, barrage bulletins, IMD and IMERG are all current.'
        : degraded.map((s) => `${s.name}: ${s.accessState.replace(/_/g, ' ')}.`).join(' '),
    source: 'Data source registry',
    observedAt: null,
    tab: 'river_intelligence',
  };
}

function buildActions(f: Record<string, DecisionFactor>, input: AssessmentInput, outlook: OutlookItem[]): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const add = (a: RecommendedAction) => actions.push(a);

  if (f.scour.level === 'unknown') {
    add({
      id: 'act-sonar-restore',
      title: 'Restore Pier 11 sonar telemetry',
      detail: 'Check sonar power and the gateway link. Until channels return, bed condition is unknown.',
      owner: 'Control room operator',
      priority: 'immediate',
      procedure: null,
      factorIds: ['scour'],
      tab: 'bridge_sensors',
    });
    add({
      id: 'act-manual-sounding',
      title: 'Arrange a manual sounding at Pier 11',
      detail: 'Replace the missing sonar evidence with a field sounding while the river is high.',
      owner: 'Section Engineer (Bridges)',
      priority: 'immediate',
      procedure: null,
      factorIds: ['scour'],
      tab: null,
    });
  } else if (f.scour.level !== 'normal') {
    add({
      id: 'act-scour-verify',
      title: 'Verify the scour reading against the other sonar channels',
      detail: 'Compare Sonars 01, 02 and 03 and their acoustic return quality before declaring bed scour.',
      owner: 'Control room operator',
      priority: f.scour.level === 'warning' ? 'immediate' : 'this_shift',
      procedure: 'SOP-NR-BHM-04',
      factorIds: ['scour'],
      tab: 'bridge_sensors',
    });
  }
  if (f.scour.level === 'warning') {
    add({
      id: 'act-scour-notify',
      title: 'Notify the Section Engineer (Bridges) of bed lowering at Pier 11',
      detail: 'Share the sonar trend and ask for a speed restriction review.',
      owner: 'Control room operator',
      priority: 'immediate',
      procedure: 'SOP-NR-BHM-04',
      factorIds: ['scour'],
      tab: null,
    });
    add({
      id: 'act-scour-inspect',
      title: 'Plan an underwater inspection of Pier 11',
      detail: 'Schedule a diver or sounding survey as soon as flow allows.',
      owner: 'Section Engineer (Bridges)',
      priority: 'this_shift',
      procedure: null,
      factorIds: ['scour'],
      tab: null,
    });
  }

  if (f.stage.level === 'warning') {
    add({
      id: 'act-stage-notify',
      title: 'Report ORB stage above the warning level',
      detail: 'Notify the Section Engineer (Bridges) and start monsoon patrolling of the bridge and approaches.',
      owner: 'Control room operator',
      priority: 'immediate',
      procedure: 'SOP-NR-RIVER-01',
      factorIds: ['stage'],
      tab: 'river_intelligence',
    });
  } else if (f.stage.level === 'watch') {
    add({
      id: 'act-stage-hourly',
      title: 'Review ORB stage every hour',
      detail: 'Continue until the stage falls back below the watch level; notify the Section Engineer if it rises more than 0.15 m/h.',
      owner: 'Control room operator',
      priority: 'this_shift',
      procedure: 'SOP-NR-RIVER-01',
      factorIds: ['stage'],
      tab: 'river_intelligence',
    });
  }

  if (f.forecast.level === 'unknown') {
    add({
      id: 'act-forecast-fallback',
      title: 'Work from the last valid CWC bulletin',
      detail: 'Use model context only as a secondary check until the official forecast returns.',
      owner: 'Control room operator',
      priority: 'this_shift',
      procedure: null,
      factorIds: ['forecast'],
      tab: 'river_intelligence',
    });
  } else if (f.forecast.level !== 'normal') {
    const crossing = outlook.find((o) => o.id === 'outlook-warning-crossing');
    add({
      id: 'act-forecast-prepare',
      title: crossing ? `Prepare for the forecast warning-level crossing (${formatToIST(crossing.windowStart)})` : 'Prepare for the forecast peak',
      detail: 'Confirm patrol staff availability and check the next CWC bulletin for revisions.',
      owner: 'Control room operator',
      priority: 'this_shift',
      procedure: 'SOP-NR-RIVER-01',
      factorIds: ['forecast'],
      tab: 'river_intelligence',
    });
  }

  if (f.release.level !== 'normal' && f.release.level !== 'unknown') {
    const arrival = outlook.find((o) => o.id.startsWith('outlook-release-STA-HATHNIKUND'));
    add({
      id: 'act-release-track',
      title: 'Track the Hathnikund release arrival',
      detail: arrival
        ? `Expected in the Delhi reach between ${formatToIST(arrival.windowStart)} and ${formatToIST(arrival.windowEnd)}. Re-check the stage forecast when it arrives.`
        : 'Re-check the stage forecast against the release bulletin.',
      owner: 'Control room operator',
      priority: f.release.level === 'warning' ? 'immediate' : 'this_shift',
      procedure: null,
      factorIds: ['release'],
      tab: 'river_intelligence',
    });
  }

  if (f.rainfall.level !== 'normal' && f.rainfall.level !== 'unknown') {
    add({
      id: 'act-rain-bulletins',
      title: 'Watch for revised barrage bulletins',
      detail: 'Heavy rain in the upper catchment often leads to revised Hathnikund releases.',
      owner: 'Control room operator',
      priority: 'routine',
      procedure: null,
      factorIds: ['rainfall'],
      tab: 'river_intelligence',
    });
  }

  if (f.banks.level !== 'normal') {
    const candidate = input.transects.find(
      (t) => f.banks.value.includes(t.transectId) && t.reviewState === 'candidate'
    );
    add({
      id: 'act-bank-review',
      title: candidate ? `Review the candidate bank retreat at ${candidate.transectId}` : 'Plan a field check of the retreating bank',
      detail: candidate
        ? 'Accept or reject the finding, noting the stage difference between image dates.'
        : 'Confirm the retreat on site and check nearby protection works.',
      owner: candidate ? 'Geospatial analyst' : 'Section Engineer (Bridges)',
      priority: f.banks.level === 'warning' ? 'this_shift' : 'routine',
      procedure: null,
      factorIds: ['banks'],
      tab: 'ground_and_banks',
    });
  }

  if (f.insar.level === 'watch' || f.insar.level === 'warning') {
    add({
      id: 'act-insar-check',
      title: 'Check the approach embankment with a level survey',
      detail: 'InSAR shows relative line-of-sight motion; a ground survey is needed to confirm settlement.',
      owner: 'Section Engineer (Bridges)',
      priority: 'routine',
      procedure: null,
      factorIds: ['insar'],
      tab: 'ground_and_banks',
    });
  }

  if (f.telemetry.level !== 'normal') {
    add({
      id: 'act-telemetry',
      title: 'Check the KLEON gateway link',
      detail: 'Treat all bridge sensor values as last-known until fresh packets arrive.',
      owner: 'Control room operator',
      priority: 'immediate',
      procedure: null,
      factorIds: ['telemetry'],
      tab: 'bridge_sensors',
    });
  }

  if (input.sourceStatuses.some((s) => s.sourceId === 'imd-aws' && s.accessState === 'authentication_required')) {
    add({
      id: 'act-imd-onboarding',
      title: 'Complete IMD API onboarding',
      detail: 'Station rainfall and nowcasts are unavailable until the server-side key is provisioned.',
      owner: 'System administrator',
      priority: 'routine',
      procedure: null,
      factorIds: ['feeds'],
      tab: null,
    });
  }

  const order = { immediate: 0, this_shift: 1, routine: 2 };
  return actions.sort((a, b) => order[a.priority] - order[b.priority]);
}

function buildOutlook(input: AssessmentInput, orb: RiverStation | undefined): OutlookItem[] {
  const now = new Date(input.clockIso).getTime();
  const items: OutlookItem[] = [];
  const warning = orb?.warningLevelM ?? 204.5;
  const danger = orb?.dangerLevelM ?? 205.33;

  const fc = input.riverForecasts.find((f) => f.issuer === 'CWC Official');
  const future = (fc?.forecastPoints ?? []).filter(
    (p) => p.stageM !== undefined && new Date(p.timestamp).getTime() >= now
  );
  if (future.length > 0) {
    const crossing = future.find((p) => (p.stageM as number) >= warning);
    if (crossing) {
      items.push({
        id: 'outlook-warning-crossing',
        label: `ORB forecast crosses ${warning.toFixed(2)} m warning level`,
        windowStart: crossing.timestamp,
        windowEnd: null,
        detail: `Forecast stage ${(crossing.stageM as number).toFixed(2)} m.`,
        basis: 'official_forecast',
        level: 'watch',
      });
    }
    const peak = future.reduce((a, b) => ((b.stageM as number) > (a.stageM as number) ? b : a));
    items.push({
      id: 'outlook-forecast-peak',
      label: `ORB forecast peak ${(peak.stageM as number).toFixed(2)} m`,
      windowStart: peak.timestamp,
      windowEnd: null,
      detail: `${((peak.stageM as number) - warning >= 0 ? '+' : '')}${((peak.stageM as number) - warning).toFixed(2)} m against the warning level.`,
      basis: 'official_forecast',
      level: byThreshold(peak.stageM as number, warning, danger),
    });
  }

  input.releaseBulletins
    .filter((b) => !b.isSuperseded)
    .forEach((b) => {
      const window = parseTravelWindowHours(b.travelTimeEstimateHours);
      if (!window) return;
      const start = addHours(b.periodStart, window[0]);
      const end = addHours(b.periodEnd, window[1]);
      if (new Date(end).getTime() < now) return;
      const cusecs = b.originalUnit === 'cusecs' ? b.originalDischarge : b.normalizedDischargeM3s / 0.028316846592;
      const isHathnikund = b.barrageId === 'STA-HATHNIKUND';
      items.push({
        id: `outlook-release-${b.barrageId}`,
        label: `${b.barrageName} release (${fmtCusecs(cusecs)}) reaches Bridge 249`,
        windowStart: start,
        windowEnd: end,
        detail: `${b.issuer}, ${b.bulletinRef}. Arrival window from the bulletin travel estimate; not routed.`,
        basis: 'official_observation',
        level: isHathnikund
          ? byThreshold(cusecs, THRESHOLDS.hathnikundWatchCusecs, THRESHOLDS.hathnikundWarningCusecs)
          : 'normal',
      });
    });

  const glofas = input.riverForecasts.find((f) => f.issuer === 'GloFAS-ECMWF Model');
  const glofasFuture = (glofas?.forecastPoints ?? []).filter(
    (p) => p.dischargeM3s !== undefined && new Date(p.timestamp).getTime() >= now
  );
  if (glofasFuture.length > 0) {
    const peak = glofasFuture.reduce((a, b) => ((b.dischargeM3s as number) > (a.dischargeM3s as number) ? b : a));
    items.push({
      id: 'outlook-glofas-peak',
      label: `GloFAS model discharge peak ~${Math.round(peak.dischargeM3s as number).toLocaleString('en-IN')} m³/s`,
      windowStart: peak.timestamp,
      windowEnd: null,
      detail: 'Model context only. Barrage regulation is not fully represented.',
      basis: 'model_forecast',
      level: 'normal',
    });
  }

  const revisit = [
    { mission: 'Sentinel-1 GRD', days: 12, label: 'Next Sentinel-1 radar pass (flood extent)' },
    { mission: 'Sentinel-2 L2A', days: 5, label: 'Next Sentinel-2 optical pass (banks)' },
    { mission: 'NISAR GUNW', days: 12, label: 'Next NISAR interferometric pair' },
  ];
  revisit.forEach((r) => {
    const latest = input.scenes
      .filter((s) => s.mission === r.mission)
      .map((s) => s.acquisitionTimes[s.acquisitionTimes.length - 1])
      .sort()
      .pop();
    if (!latest) return;
    let next = new Date(latest).getTime();
    while (next <= now) next += r.days * 86400 * 1000;
    items.push({
      id: `outlook-revisit-${r.mission}`,
      label: r.label,
      windowStart: new Date(next).toISOString(),
      windowEnd: null,
      detail: `Nominal ${r.days}-day revisit from the last acquisition; tasking not confirmed.`,
      basis: 'nominal_revisit',
      level: 'normal',
    });
  });

  return items.sort((a, b) => new Date(a.windowStart).getTime() - new Date(b.windowStart).getTime());
}

function buildGaps(input: AssessmentInput, f: Record<string, DecisionFactor>): DataGap[] {
  const gaps: DataGap[] = [];
  const status = (id: string) => input.sourceStatuses.find((s) => s.sourceId === id);

  if (status('imd-aws')?.accessState === 'authentication_required') {
    gaps.push({
      id: 'gap-imd',
      label: 'No station rainfall or nowcast',
      impact: 'Catchment rainfall relies on a satellite estimate with about 4 hours of latency.',
      candidateSourceIds: ['open-meteo'],
    });
  }
  if (f.forecast.level === 'unknown') {
    gaps.push({
      id: 'gap-forecast',
      label: 'Official stage forecast offline',
      impact: 'The outlook has no official peak or warning-level crossing time.',
      candidateSourceIds: ['cwc-nwdp', 'glofas'],
    });
  }
  if (f.scour.level === 'unknown') {
    gaps.push({
      id: 'gap-sonar',
      label: 'Bed condition at Pier 11 unknown',
      impact: 'No sonar channel is valid, so scour cannot be ruled in or out.',
      candidateSourceIds: [],
    });
  } else if (f.scour.rationale.includes('degraded')) {
    gaps.push({
      id: 'gap-acoustic',
      label: 'Degraded acoustic return',
      impact: 'High turbidity can weaken sonar returns; there is no water-quality feed to confirm it.',
      candidateSourceIds: ['dpcc-olms'],
    });
  }
  if (f.telemetry.level !== 'normal') {
    gaps.push({
      id: 'gap-telemetry',
      label: 'Bridge telemetry is stale',
      impact: 'Structural readings are last-known values, not current conditions.',
      candidateSourceIds: [],
    });
  }
  const latestS2 = input.scenes
    .filter((s) => s.mission === 'Sentinel-2 L2A')
    .sort((a, b) => a.acquisitionTimes[0].localeCompare(b.acquisitionTimes[0]))
    .pop();
  if (latestS2 && latestS2.localUsabilityState === 'cloud_obscured') {
    gaps.push({
      id: 'gap-cloud',
      label: 'Latest optical scene is cloud-obscured',
      impact: 'Bank analysis uses an older usable scene.',
      candidateSourceIds: ['copernicus-gfm'],
    });
  }
  if (f.insar.level === 'unknown') {
    gaps.push({
      id: 'gap-insar',
      label: 'InSAR coherence too low',
      impact: 'Approach embankment movement cannot be reported for this period.',
      candidateSourceIds: ['bhuvan-ndem'],
    });
  }
  gaps.push({
    id: 'gap-train-context',
    label: 'No train passage context for vibration',
    impact: 'Vibration peaks cannot be separated from ordinary train loading.',
    candidateSourceIds: ['nr-train-events'],
  });
  gaps.push({
    id: 'gap-seismic',
    label: 'No earthquake trigger',
    impact: 'A nearby earthquake would not prompt a post-event inspection check.',
    candidateSourceIds: ['seismic'],
  });
  return gaps;
}

export function assessBridge(input: AssessmentInput): Assessment {
  const orb = input.riverStations.find((s) => s.id === 'STA-ORB-CWC');

  const factorList: DecisionFactor[] = [
    scourFactor(input),
    scalarSensorFactor(input, {
      id: 'vibration',
      label: 'Pier 11 vibration (peak)',
      sensorId: 'P11-VT-01',
      metric: 'vibration_peak',
      unit: 'm/s²',
      watch: THRESHOLDS.vibrationWatch,
      warning: THRESHOLDS.vibrationWarning,
      digits: 3,
      note: 'Scalar peak only; no spectrum, so modal change cannot be assessed.',
    }),
    scalarSensorFactor(input, {
      id: 'tilt',
      label: 'Pier 11 transverse tilt',
      sensorId: 'P11-VT-01',
      metric: 'tilt_transverse',
      unit: 'deg',
      watch: THRESHOLDS.tiltWatchDeg,
      warning: THRESHOLDS.tiltWarningDeg,
      digits: 2,
      note: 'Measured at the pier cap against the commissioning reference.',
    }),
    stageFactor(input, orb),
    forecastFactor(input, orb),
    releaseFactor(input),
    rainfallFactor(input),
    bankFactor(input),
    insarFactor(input),
    telemetryFactor(input),
    externalFeedsFactor(input),
  ];
  const f = Object.fromEntries(factorList.map((x) => [x.id, x])) as Record<string, DecisionFactor>;

  const domains: DecisionDomain[] = ['structure', 'hydrology', 'ground', 'data'];
  const domainLevels = Object.fromEntries(
    domains.map((d) => [d, maxLevel(factorList.filter((x) => x.domain === d).map((x) => x.level))])
  ) as Record<DecisionDomain, DecisionLevel>;

  const danger = orb?.dangerLevelM ?? 205.33;
  const stageValue = input.observations.find(
    (o) => o.metric === 'stage_m' && o.sensorId === null && o.provenance.sourceId === 'cwc-official'
  )?.value;
  const aboveDanger = typeof stageValue === 'number' && stageValue >= danger;

  // Data-feed health lowers confidence but never changes the operating posture on its own.
  const operational = factorList.filter((x) => x.domain !== 'data');
  let posture: OperatingPosture = 'normal';
  if (aboveDanger || (domainLevels.structure === 'warning' && domainLevels.hydrology === 'warning')) {
    posture = 'suspension_review';
  } else if (
    domainLevels.structure === 'warning' ||
    domainLevels.hydrology === 'warning' ||
    (f.scour.level === 'unknown' && LEVEL_RANK[domainLevels.hydrology] >= LEVEL_RANK.watch)
  ) {
    posture = 'restriction_review';
  } else if (operational.some((x) => x.level !== 'normal')) {
    posture = 'heightened_watch';
  }

  const drivers =
    posture === 'normal'
      ? []
      : posture === 'heightened_watch'
      ? operational.filter((x) => x.level !== 'normal')
      : operational.filter((x) => x.level === 'warning' || (x.id === 'scour' && x.level === 'unknown'));
  const postureDrivers = drivers.map((x) => `${x.label}: ${x.value}`);

  const outlook = buildOutlook(input, orb);
  const actions = buildActions(f, input, outlook);
  const gaps = buildGaps(input, f);

  let confidence: Assessment['confidence'] = 'high';
  if (f.scour.level === 'unknown' || f.telemetry.level !== 'normal') {
    confidence = 'low';
  } else if (factorList.some((x) => x.level === 'unknown') || f.feeds.level !== 'normal') {
    confidence = 'medium';
  }

  return {
    ruleSetVersion: RULE_SET_VERSION,
    evaluatedAt: input.clockIso,
    posture,
    postureDrivers,
    factors: factorList,
    domainLevels,
    actions,
    outlook,
    confidence,
    gaps,
  };
}
