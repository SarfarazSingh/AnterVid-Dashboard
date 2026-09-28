import {
  Asset,
  Pier,
  Sensor,
  Observation,
  RiverStation,
  ReleaseBulletin,
  RiverForecast,
  RainfallData,
  SatelliteScene,
  LayerEvidence,
  TransectFinding,
  InSARFinding,
  Event,
  SourceStatus,
  ScenarioId,
} from '../types/domain';
import { Repository } from './Repository';
import {
  INITIAL_ASSET,
  INITIAL_PIERS,
  INITIAL_SENSORS,
  INITIAL_OBSERVATIONS,
  INITIAL_RIVER_STATIONS,
  INITIAL_RELEASE_BULLETINS,
  INITIAL_RIVER_FORECASTS,
  INITIAL_RAINFALL,
  INITIAL_SCENES,
  INITIAL_LAYER_EVIDENCES,
  INITIAL_TRANSECTS,
  INITIAL_INSAR_POINTS,
  INITIAL_EVENTS,
  INITIAL_SOURCE_STATUSES,
} from '../fixtures/baselineData';
import { cusecsToM3s } from '../utils/formatters';
import { DEFAULT_DEMO_CLOCK_UTC } from '../utils/dateUtils';

export class MockRepository implements Repository {
  private currentScenario: ScenarioId = 'normal';

  // In-memory working copies
  private asset: Asset = JSON.parse(JSON.stringify(INITIAL_ASSET));
  private piers: Pier[] = JSON.parse(JSON.stringify(INITIAL_PIERS));
  private sensors: Sensor[] = JSON.parse(JSON.stringify(INITIAL_SENSORS));
  private observations: Observation[] = JSON.parse(JSON.stringify(INITIAL_OBSERVATIONS));
  private riverStations: RiverStation[] = JSON.parse(JSON.stringify(INITIAL_RIVER_STATIONS));
  private releaseBulletins: ReleaseBulletin[] = JSON.parse(JSON.stringify(INITIAL_RELEASE_BULLETINS));
  private riverForecasts: RiverForecast[] = JSON.parse(JSON.stringify(INITIAL_RIVER_FORECASTS));
  private rainfall: RainfallData[] = JSON.parse(JSON.stringify(INITIAL_RAINFALL));
  private scenes: SatelliteScene[] = JSON.parse(JSON.stringify(INITIAL_SCENES));
  private layers: LayerEvidence[] = JSON.parse(JSON.stringify(INITIAL_LAYER_EVIDENCES));
  private transects: TransectFinding[] = JSON.parse(JSON.stringify(INITIAL_TRANSECTS));
  private insarPoints: InSARFinding[] = JSON.parse(JSON.stringify(INITIAL_INSAR_POINTS));
  private events: Event[] = JSON.parse(JSON.stringify(INITIAL_EVENTS));
  private sourceStatuses: SourceStatus[] = JSON.parse(JSON.stringify(INITIAL_SOURCE_STATUSES));

  constructor() {
    this.applyScenario('normal');
  }

  async getAsset(_id: string): Promise<Asset> {
    return JSON.parse(JSON.stringify(this.asset));
  }

  async getPiers(_assetId: string): Promise<Pier[]> {
    return JSON.parse(JSON.stringify(this.piers));
  }

  async getSensors(_assetId: string): Promise<Sensor[]> {
    return JSON.parse(JSON.stringify(this.sensors));
  }

  async getObservations(_assetId: string, sensorId?: string): Promise<Observation[]> {
    const list = sensorId
      ? this.observations.filter((o) => o.sensorId === sensorId)
      : this.observations;
    return JSON.parse(JSON.stringify(list));
  }

  async getRiverStations(): Promise<RiverStation[]> {
    return JSON.parse(JSON.stringify(this.riverStations));
  }

  async getReleaseBulletins(barrageId?: string): Promise<ReleaseBulletin[]> {
    const list = barrageId
      ? this.releaseBulletins.filter((b) => b.barrageId === barrageId)
      : this.releaseBulletins;
    return JSON.parse(JSON.stringify(list));
  }

  async getRiverForecasts(stationId?: string): Promise<RiverForecast[]> {
    const list = stationId
      ? this.riverForecasts.filter((f) => f.stationId === stationId)
      : this.riverForecasts;
    return JSON.parse(JSON.stringify(list));
  }

  async getRainfall(): Promise<RainfallData[]> {
    return JSON.parse(JSON.stringify(this.rainfall));
  }

  async getSatelliteScenes(): Promise<SatelliteScene[]> {
    return JSON.parse(JSON.stringify(this.scenes));
  }

  async getLayers(): Promise<LayerEvidence[]> {
    return JSON.parse(JSON.stringify(this.layers));
  }

  async getTransects(): Promise<TransectFinding[]> {
    return JSON.parse(JSON.stringify(this.transects));
  }

  async getInSARPoints(): Promise<InSARFinding[]> {
    return JSON.parse(JSON.stringify(this.insarPoints));
  }

  async getEvents(): Promise<Event[]> {
    return JSON.parse(JSON.stringify(this.events));
  }

  async getSourceStatuses(): Promise<SourceStatus[]> {
    return JSON.parse(JSON.stringify(this.sourceStatuses));
  }

  async acknowledgeEvent(eventId: string, user: string, note?: string): Promise<Event> {
    const ev = this.events.find((e) => e.id === eventId);
    if (!ev) {
      throw new Error(`Event with id ${eventId} not found.`);
    }

    // Idempotent acknowledgement: repeated clicks do not alter condition state or duplicate audit log
    if (ev.workflowStatus === 'unacknowledged') {
      ev.workflowStatus = 'acknowledged';
      ev.acknowledgedAt = DEFAULT_DEMO_CLOCK_UTC;
      ev.acknowledgedBy = user;
      ev.auditTrail.push({
        timestamp: DEFAULT_DEMO_CLOCK_UTC,
        user,
        action: 'Acknowledged',
        note: note || 'Operator acknowledged receipt of condition. Notice: Underlying condition remains active until rectified.',
      });
    }

    return JSON.parse(JSON.stringify(ev));
  }

  async addEventNote(eventId: string, user: string, note: string): Promise<Event> {
    const ev = this.events.find((e) => e.id === eventId);
    if (!ev) {
      throw new Error(`Event with id ${eventId} not found.`);
    }

    ev.auditTrail.push({
      timestamp: DEFAULT_DEMO_CLOCK_UTC,
      user,
      action: 'Operator Note Added',
      note,
    });

    return JSON.parse(JSON.stringify(ev));
  }

  async reviewTransect(
    transectId: string,
    status: 'reviewed' | 'rejected',
    user: string,
    note: string
  ): Promise<TransectFinding> {
    const tr = this.transects.find((t) => t.id === transectId || t.transectId === transectId);
    if (!tr) {
      throw new Error(`Transect finding ${transectId} not found.`);
    }

    tr.reviewState = status;
    tr.reviewedBy = user;
    tr.reviewedAt = DEFAULT_DEMO_CLOCK_UTC;
    tr.analystNote = note;

    return JSON.parse(JSON.stringify(tr));
  }

  async getScenario(): Promise<ScenarioId> {
    return this.currentScenario;
  }

  async setScenario(scenarioId: ScenarioId): Promise<void> {
    this.currentScenario = scenarioId;
    this.applyScenario(scenarioId);
  }

  private applyScenario(scenarioId: ScenarioId) {
    // Reset to base
    this.observations = JSON.parse(JSON.stringify(INITIAL_OBSERVATIONS));
    this.sensors = JSON.parse(JSON.stringify(INITIAL_SENSORS));
    this.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    this.sourceStatuses = JSON.parse(JSON.stringify(INITIAL_SOURCE_STATUSES));
    this.releaseBulletins = JSON.parse(JSON.stringify(INITIAL_RELEASE_BULLETINS));
    this.riverForecasts = JSON.parse(JSON.stringify(INITIAL_RIVER_FORECASTS));
    this.transects = JSON.parse(JSON.stringify(INITIAL_TRANSECTS));
    this.insarPoints = JSON.parse(JSON.stringify(INITIAL_INSAR_POINTS));
    this.scenes = JSON.parse(JSON.stringify(INITIAL_SCENES));

    switch (scenarioId) {
      case 'progressive_scour': {
        const s2 = this.observations.find((o) => o.sensorId === 'P11-SON-02');
        if (s2) {
          s2.value = 8.780; // +0.37m bed drop
          s2.quality.state = 'good';
        }
        this.events[0].condition = 'warning';
        this.events[0].title = 'CRITICAL: Severe Progressive Bed Scour at Pier 11';
        this.events[0].auditTrail.push({
          timestamp: DEFAULT_DEMO_CLOCK_UTC,
          user: 'System Scour Watcher',
          action: 'Escalated to Warning',
          note: 'Bed drop reached 0.37m below baseline. Rate of change: -0.015 m/h.',
        });
        break;
      }

      case 'degraded_sonar': {
        const s3 = this.observations.find((o) => o.sensorId === 'P11-SON-03');
        if (s3) {
          s3.quality.state = 'degraded';
          s3.quality.reasons = ['weak_acoustic_return_turbidity_unverified'];
        }
        break;
      }

      case 'all_sonar_unavailable': {
        this.observations.forEach((o) => {
          if (o.sensorId?.startsWith('P11-SON')) {
            o.value = null; // null represents unavailable, never zero
            o.quality.state = 'missing';
            o.quality.reasons = ['acoustic_telemetry_packet_loss'];
          }
        });
        break;
      }

      case 'scalar_only_vibration': {
        const vt = this.sensors.find((s) => s.id === 'P11-VT-01');
        if (vt) {
          vt.capabilities.hasWaveform = false;
          vt.capabilities.hasModalFrequency = false;
        }
        break;
      }

      case 'optional_sensors_uncommissioned': {
        const refVib = this.sensors.find((s) => s.id === 'P10-VT-REF');
        if (refVib) {
          refVib.capabilities.isCommissioned = false;
          refVib.capabilities.isPlanned = true;
        }
        const radar = this.sensors.find((s) => s.id === 'RADAR-BR249-01');
        if (radar) {
          radar.capabilities.isCommissioned = false;
          radar.capabilities.isPlanned = true;
        }
        break;
      }

      case 'stale_telemetry': {
        // Telemetry timestamp pushed back 45 minutes
        const oldTimestamp = new Date(new Date(DEFAULT_DEMO_CLOCK_UTC).getTime() - 45 * 60 * 1000).toISOString();
        this.observations.forEach((o) => {
          if (o.provenance.sourceId === 'samasth-gateway') {
            o.observedAt = oldTimestamp;
            o.receivedAt = oldTimestamp;
          }
        });
        const gwSource = this.sourceStatuses.find((s) => s.sourceId === 'samasth-gateway');
        if (gwSource) {
          gwSource.accessState = 'stale';
          gwSource.latestObservationAt = oldTimestamp;
          gwSource.message = 'Packet received 45 minutes ago. Cellular gateway heartbeat lost.';
        }
        break;
      }

      case 'comms_loss_backfill': {
        const gwSource = this.sourceStatuses.find((s) => s.sourceId === 'samasth-gateway');
        if (gwSource) {
          gwSource.accessState = 'current';
          gwSource.message = 'Gateway reconnected. 24 buffered historical packets ingested with true observation timestamps.';
        }
        break;
      }

      case 'river_warning': {
        const cwcObs = this.observations.find((o) => o.metric === 'stage_m' && o.sensorId === null);
        if (cwcObs) {
          cwcObs.value = 204.68; // Exceeds 204.50m Warning Level
        }
        this.events[1].condition = 'warning';
        this.events[1].title = 'ORB River Stage Crosses 204.50m Warning Level (Current: 204.68m)';
        break;
      }

      case 'forecast_outage': {
        this.riverForecasts = []; // Suppressed forecast series
        const cwcSource = this.sourceStatuses.find((s) => s.sourceId === 'cwc-official');
        if (cwcSource) {
          cwcSource.accessState = 'temporarily_unavailable';
          cwcSource.errorCode = 'HTTP_503_SERVICE_UNAVAILABLE';
          cwcSource.message = 'CWC Flood Forecast API endpoint returning HTTP 503. Forecast curve suppressed; historical gauges intact.';
        }
        break;
      }

      case 'imd_auth_missing': {
        const imd = this.sourceStatuses.find((s) => s.sourceId === 'imd-aws');
        if (imd) {
          imd.accessState = 'authentication_required';
          imd.errorCode = 'PROVIDER_AUTH_REQUIRED';
          imd.message = 'IMD API Key missing (HTTP 401). Onboarding pending with IMD portal.';
        }
        break;
      }

      case 'revised_barrage_release': {
        this.releaseBulletins[0].isSuperseded = true;
        this.releaseBulletins.unshift({
          id: 'REL-HK-20260912-0800-R2',
          barrageId: 'STA-HATHNIKUND',
          barrageName: 'Hathnikund Barrage',
          periodStart: '2026-09-12T02:30:00Z',
          periodEnd: '2026-09-12T03:30:00Z',
          issueTime: '2026-09-12T04:15:00Z',
          receiptTime: '2026-09-12T04:30:00Z',
          originalDischarge: 185000, // Surge to 185,000 cusecs
          originalUnit: 'cusecs',
          normalizedDischargeM3s: cusecsToM3s(185000),
          type: 'revised',
          issuer: 'Haryana Irrigation & Water Resources Dept',
          bulletinRef: 'HKB/DIS/2026/09/12-01-REV2',
          revision: 2,
          isSuperseded: false,
          travelTimeEstimateHours: '36 - 72h (Variable planning window; arrival not modelled)',
          operatorNotes: 'Upstream gate opening increased due to cloudburst in Paonta Sahib catchment.',
        });
        break;
      }

      case 'cloudy_satellite_scene': {
        const s2 = this.scenes.find((s) => s.id === 'S2B_MSIL2A_20260925T054639');
        if (s2) {
          s2.localUsabilityState = 'cloud_obscured';
        }
        break;
      }

      case 'mismatched_stage_comparison': {
        const tr1 = this.transects.find((t) => t.id === 'FIND-TR-01');
        if (tr1) {
          tr1.stageDifferenceM = 1.85; // 1.85m water stage delta
        }
        break;
      }

      case 'insar_low_coherence': {
        this.insarPoints.forEach((p) => {
          p.coherence = 0.22;
          p.isSufficientCoherence = false;
        });
        break;
      }

      case 'provisional_nisar': {
        const nisarLayer = this.layers.find((l) => l.id === 'LAYER-NISAR-INSAR');
        if (nisarLayer) {
          nisarLayer.maturity = 'provisional';
          nisarLayer.reviewState = 'not_validated';
        }
        break;
      }
    }
  }
}
