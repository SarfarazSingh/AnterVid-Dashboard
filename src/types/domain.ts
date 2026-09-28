export type Origin =
  | 'manufacturer_sensor'
  | 'official_observation'
  | 'official_forecast'
  | 'satellite_observation'
  | 'model_forecast'
  | 'derived'
  | 'manual_import';

export type Quality = 'good' | 'degraded' | 'suspect' | 'invalid' | 'missing';

export type ConditionState =
  | 'within_range'
  | 'watch'
  | 'warning'
  | 'critical'
  | 'unknown'
  | 'not_assessed';

export type FreshnessState = 'current' | 'delayed' | 'stale' | 'not_applicable';

export type ReviewState = 'candidate' | 'reviewed' | 'rejected' | 'not_validated';

export type WorkflowState =
  | 'unacknowledged'
  | 'acknowledged'
  | 'assigned'
  | 'under_review'
  | 'closed';

export interface SourcePolicy {
  sourceId: string;
  expectedCadenceSeconds: number | null;
  expectedLatencySeconds: number | null;
  staleAfterSeconds: number | null;
  validUntilRequired: boolean;
}

export interface ReferenceMount {
  type: 'sensor_mount' | 'gauge_station' | 'radar_bracket' | 'satellite_track';
  id: string;
  verticalDatum: string | null;
  mountingElevationM?: number | null;
  sensorOrientationDeg?: number | null;
}

export interface ObservationQuality {
  state: Quality;
  reasons: string[];
  uncertainty: {
    plusMinus: number;
    unit: string;
    confidenceLevelPct?: number;
    method?: string;
  } | null;
}

export interface Provenance {
  sourceId: string;
  origin: Origin;
  sourceRecordId: string;
  methodVersion: string | null;
  baselineId: string | null;
  inputIds: string[];
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  limitation?: string;
}

export interface Observation {
  id: string;
  assetId: string;
  sensorId: string | null;
  metric: string;
  value: number | null;
  unit: string;
  observedAt: string; // ISO UTC
  receivedAt: string; // ISO UTC
  periodStart: string | null;
  periodEnd: string | null;
  reference: ReferenceMount;
  quality: ObservationQuality;
  provenance: Provenance;
  demo: boolean;
}

export interface SensorCapabilities {
  hasWaveform: boolean;
  hasModalFrequency: boolean;
  hasTemperatureCorrection: boolean;
  isCommissioned: boolean;
  isPlanned: boolean;
  requiresReferenceSensor: boolean;
  referenceSensorId?: string | null;
}

export interface Sensor {
  id: string;
  assetId: string;
  pierId: string;
  name: string;
  deviceType: 'sonar' | 'vibration_tilt' | 'cabinet_temp' | 'telltale_displacement';
  channels: string[];
  units: Record<string, string>;
  mountReference: ReferenceMount;
  capabilities: SensorCapabilities;
  calibrationStatus: 'valid' | 'due_soon' | 'overdue' | 'not_applicable';
  lastCalibrationDate: string | null;
  baselineVersion: string;
  baselineValues: Record<string, number>;
}

export interface Pier {
  id: string;
  assetId: string;
  number: number;
  label: string;
  type: 'pier' | 'abutment';
  scourVulnerabilityIndex: 'high' | 'moderate' | 'low';
  commissionedSensors: string[];
  hasScourMonitoring: boolean;
}

export interface Asset {
  id: string;
  name: string;
  subTitle: string;
  river: string;
  owner: string;
  commissioningState: 'commissioned' | 'staged_commissioning' | 'planned';
  timeZone: string; // 'Asia/Kolkata'
  verifiedGeometry: boolean;
  approxCoordinates: {
    lat: number;
    lon: number;
    note: string;
  };
  totalPiers: number;
}

export interface RiverStation {
  id: string;
  name: string;
  river: string;
  type: 'cwc_gauge' | 'barrage' | 'drain_inflow';
  distanceKmFromBridge: number;
  flowDirection: 'upstream' | 'at_bridge' | 'downstream';
  warningLevelM: number | null;
  dangerLevelM: number | null;
  highestFloodLevelM: number | null;
  highestFloodDate?: string | null;
  datumName: string;
  hasOfficialFeed: boolean;
  feedStatus: 'operational' | 'intermittent' | 'unavailable';
}

export interface RiverForecast {
  id: string;
  stationId: string;
  metric: string;
  issuer: 'CWC Official' | 'GloFAS-ECMWF Model' | 'Local Rating Curve';
  issueTime: string;
  validFrom: string;
  validTo: string;
  forecastPoints: {
    timestamp: string;
    stageM?: number;
    dischargeM3s?: number;
    lowerBoundM?: number;
    upperBoundM?: number;
  }[];
  ensembleStatistic: 'IQR (Interquartile Range)' | 'Single Deterministic' | '90% Spread' | null;
  revision: number;
  methodDescription: string;
}

export interface ReleaseBulletin {
  id: string;
  barrageId: string;
  barrageName: string;
  periodStart: string;
  periodEnd: string;
  issueTime: string;
  receiptTime: string;
  originalDischarge: number;
  originalUnit: 'cusecs' | 'm3/s';
  normalizedDischargeM3s: number;
  type: 'observed' | 'scheduled' | 'revised' | 'cancelled';
  issuer: string;
  bulletinRef: string;
  revision: number;
  isSuperseded: boolean;
  operatorNotes?: string;
  travelTimeEstimateHours?: string; // e.g. "36 - 72h (Variable planning window; arrival not modelled)"
}

export interface RainfallData {
  id: string;
  locationType: 'local_delhi' | 'upstream_basin' | 'subbasin_yamunanagar';
  locationName: string;
  source: 'IMD AWS' | 'NASA IMERG Early' | 'IMD District Warning';
  periodStart: string;
  periodEnd: string;
  accumulationMm: number;
  isPartialCoverage: boolean;
  validCoveragePct: number;
  observationLatencyHours: number;
  isForecast: boolean;
  warningCategory?: 'Green (No Warning)' | 'Yellow (Watch)' | 'Orange (Alert)' | 'Red (Warning)';
}

export interface SatelliteScene {
  id: string;
  mission: 'Sentinel-2 L2A' | 'Sentinel-1 GRD' | 'Sentinel-1 SLC' | 'NISAR GUNW' | 'Landsat-8 C2';
  collection: string;
  acquisitionTimes: [string, string] | [string]; // [start, end] or single date
  cloudCoverTotalPct: number;
  localCorridorCloudPct: number;
  localUsabilityState: 'usable' | 'cloud_obscured' | 'low_coherence' | 'provisional_unvalidated';
  rejectionReason: string | null;
  maturity: 'operational' | 'provisional' | 'beta';
  processorVersion: string;
  orbitDirection?: 'ascending' | 'descending';
  trackNumber?: number;
}

export interface LayerLegendItem {
  label: string;
  color: string;
  pattern?: 'solid' | 'hatched' | 'dashed' | 'dotted';
}

export interface LayerEvidence {
  id: string;
  name: string;
  productClass: 'water_boundary' | 'sar_flood' | 'bankline_change' | 'insar_displacement' | 'geology' | 'soil_grids' | 'historical_water';
  sourceIds: string[];
  acquisitionTimes: string[];
  publishedAt: string;
  reviewedAt: string | null;
  reviewState: ReviewState;
  resolutionMetres: number | null;
  pixelSpacingMetres: number | null;
  mapScaleDenominator: number | null;
  maturity: string | null;
  methodVersion: string;
  referenceId: string | null;
  uncertaintyDescription: string | null;
  validAreaFraction: number | null;
  limitations: string[];
  legend: LayerLegendItem[];
  demo: boolean;
  description: string;
}

export interface TransectFinding {
  id: string;
  transectId: string;
  name: string;
  bank: 'left' | 'right';
  chainageMetres: number; // Chainage along Yamuna from Bridge 249
  baselineDate: string;
  comparisonDate: string;
  baselineStageM: number;
  comparisonStageM: number;
  stageDifferenceM: number;
  boundaryType: 'waterline' | 'reviewed_bankline';
  signedMovementM: number; // positive = accretion, negative = retreat/erosion
  uncertaintyM: number;
  detectionLimitM: number;
  isResolvable: boolean;
  reviewState: ReviewState;
  analystNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface InSARFinding {
  id: string;
  pointId: string;
  locationName: string;
  coordinates: [number, number];
  relativeLosDisplacementMm: number; // positive = toward satellite, negative = away
  uncertaintyMm: number;
  periodStart: string;
  periodEnd: string;
  track: string;
  orbitDirection: 'ascending' | 'descending';
  referencePoint: string;
  coherence: number;
  isSufficientCoherence: boolean;
  methodVersion: string;
  notes: string;
}

export interface AuditEntry {
  timestamp: string;
  user: string;
  action: string;
  note?: string;
}

export interface Event {
  id: string;
  condition: ConditionState;
  workflowStatus: WorkflowState;
  title: string;
  category: 'scour' | 'river' | 'sensor_health' | 'ground' | 'communications';
  detectedAt: string;
  evidenceIds: string[];
  ruleVersion: string;
  baselineId: string | null;
  assignee: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  suggestedProcedure: string;
  auditTrail: AuditEntry[];
}

export interface SourceStatus {
  sourceId: string;
  name: string;
  category: 'manufacturer' | 'hydrology' | 'weather' | 'satellite' | 'thematic';
  accessState: 'current' | 'stale' | 'authentication_required' | 'rate_limited' | 'temporarily_unavailable' | 'not_configured';
  lastAttemptAt: string;
  lastSuccessfulFetchAt: string | null;
  latestObservationAt: string | null;
  expectedCadenceSeconds: number | null;
  staleAfterSeconds: number | null;
  errorCode: string | null;
  message: string;
  retryableByOperator: boolean;
  fallback: string | null;
}

export type ScenarioId =
  | 'normal'
  | 'progressive_scour'
  | 'degraded_sonar'
  | 'all_sonar_unavailable'
  | 'scalar_only_vibration'
  | 'stale_telemetry'
  | 'comms_loss_backfill'
  | 'river_warning'
  | 'forecast_outage'
  | 'imd_auth_missing'
  | 'revised_barrage_release'
  | 'cloudy_satellite_scene'
  | 'mismatched_stage_comparison'
  | 'insar_low_coherence'
  | 'provisional_nisar';

export interface DemoScenario {
  id: ScenarioId;
  name: string;
  category: 'Bridge Sensors' | 'River Intelligence' | 'Ground and Banks' | 'Sources & Comms';
  shortDescription: string;
  expectedVisibleBehavior: string;
}
