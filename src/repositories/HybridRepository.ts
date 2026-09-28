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
  DecisionRecord,
  DecisionRecordInput,
} from '../types/domain';
import { Repository } from './Repository';
import { MockRepository } from './MockRepository';
import { FeedResult } from '../live/http';
import { fetchOpenMeteoRainfall, fetchGlofasDischarge } from '../live/openMeteo';
import { fetchUsgsEarthquakes } from '../live/usgsEarthquakes';
import { fetchCdseScenes } from '../live/cdseStac';
import { fetchCwcStage } from '../live/cwcStage';
import { DEFAULT_DEMO_CLOCK_UTC } from '../utils/dateUtils';

export interface LiveBundle {
  rainfall: FeedResult<RainfallData[]>;
  glofas: FeedResult<RiverForecast>;
  stac: FeedResult<SatelliteScene[]>;
  usgs: FeedResult<Event[]>;
  cwc: FeedResult<Observation>;
  fetchedAt: string;
}

function rebaseIso(iso: string, nowMs: number, anchorMs = Date.parse(DEFAULT_DEMO_CLOCK_UTC)): string {
  return new Date(nowMs + (Date.parse(iso) - anchorMs)).toISOString();
}

function statusFromFeed(
  feed: FeedResult<unknown>,
  defaults: {
    sourceId: string;
    name: string;
    category: SourceStatus['category'];
    expectedCadenceSeconds: number | null;
    staleAfterSeconds: number | null;
    fallback?: string;
    latestObservationAt?: string | null;
  }
): SourceStatus {
  const live = feed.state === 'live';
  return {
    ...defaults,
    accessState: live ? 'current' : 'temporarily_unavailable',
    lastAttemptAt: feed.fetchedAt,
    lastSuccessfulFetchAt: live ? feed.fetchedAt : null,
    latestObservationAt: defaults.latestObservationAt ?? (live ? feed.fetchedAt : null),
    errorCode: feed.errorCode,
    message: live
      ? `Live fetch ${feed.latencyMs} ms.`
      : `${feed.error ?? 'Unavailable'}. Showing fixture fallback.`,
    retryableByOperator: !live,
    fallback: live ? null : defaults.fallback ?? 'Fixture snapshot',
  };
}

export class HybridRepository implements Repository {
  private inner: MockRepository;
  private inflight: Promise<LiveBundle> | null = null;
  private cache: LiveBundle | null = null;

  constructor(inner = new MockRepository()) {
    this.inner = inner;
  }

  invalidateLive(): void {
    this.cache = null;
    this.inflight = null;
  }

  getLastLiveBundle(): LiveBundle | null {
    return this.cache;
  }

  private async ensureLive(): Promise<LiveBundle> {
    if (this.cache) return this.cache;
    if (this.inflight) return this.inflight;
    this.inflight = (async () => {
      const [rainfall, glofas, stac, usgs, cwc] = await Promise.all([
        fetchOpenMeteoRainfall(),
        fetchGlofasDischarge(),
        fetchCdseScenes(),
        fetchUsgsEarthquakes(),
        fetchCwcStage(),
      ]);
      const bundle: LiveBundle = {
        rainfall,
        glofas,
        stac,
        usgs,
        cwc,
        fetchedAt: new Date().toISOString(),
      };
      this.cache = bundle;
      return bundle;
    })().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  async getAsset(id: string): Promise<Asset> {
    return this.inner.getAsset(id);
  }
  async getPiers(assetId: string): Promise<Pier[]> {
    return this.inner.getPiers(assetId);
  }
  async getSensors(assetId: string): Promise<Sensor[]> {
    return this.inner.getSensors(assetId);
  }
  async getRiverStations(): Promise<RiverStation[]> {
    return this.inner.getRiverStations();
  }
  async getReleaseBulletins(barrageId?: string): Promise<ReleaseBulletin[]> {
    return this.inner.getReleaseBulletins(barrageId);
  }
  async getLayers(): Promise<LayerEvidence[]> {
    return this.inner.getLayers();
  }
  async getTransects(): Promise<TransectFinding[]> {
    return this.inner.getTransects();
  }
  async getInSARPoints(): Promise<InSARFinding[]> {
    return this.inner.getInSARPoints();
  }
  async getDecisions(assetId: string): Promise<DecisionRecord[]> {
    return this.inner.getDecisions(assetId);
  }
  async recordDecision(input: DecisionRecordInput): Promise<DecisionRecord> {
    return this.inner.recordDecision(input);
  }
  async getScenario(): Promise<ScenarioId> {
    return this.inner.getScenario();
  }
  async acknowledgeEvent(eventId: string, user: string, note?: string): Promise<Event> {
    return this.inner.acknowledgeEvent(eventId, user, note);
  }
  async addEventNote(eventId: string, user: string, note: string): Promise<Event> {
    return this.inner.addEventNote(eventId, user, note);
  }
  async reviewTransect(
    transectId: string,
    status: 'reviewed' | 'rejected',
    user: string,
    note: string
  ): Promise<TransectFinding> {
    return this.inner.reviewTransect(transectId, status, user, note);
  }

  async setScenario(scenarioId: ScenarioId): Promise<void> {
    await this.inner.setScenario(scenarioId);
    // Live weather / satellite / GloFAS stay cached; only fixture slices change.
  }

  async getObservations(assetId: string, sensorId?: string): Promise<Observation[]> {
    const [mock, live] = await Promise.all([this.inner.getObservations(assetId, sensorId), this.ensureLive()]);
    const nowMs = Date.now();
    const scenario = await this.inner.getScenario();
    const rebaseHardware = scenario !== 'stale_telemetry';
    return mock.map((o) => {
      if (live.cwc.data && o.id === 'OBS-CWC-ORB') {
        return live.cwc.data;
      }
      if (rebaseHardware && o.provenance.sourceId === 'samasth-gateway') {
        return {
          ...o,
          observedAt: rebaseIso(o.observedAt, nowMs),
          receivedAt: rebaseIso(o.receivedAt, nowMs),
        };
      }
      return o;
    });
  }

  async getRainfall(): Promise<RainfallData[]> {
    const [mock, live] = await Promise.all([this.inner.getRainfall(), this.ensureLive()]);
    return live.rainfall.data ?? mock;
  }

  async getRiverForecasts(stationId?: string): Promise<RiverForecast[]> {
    const [mock, live] = await Promise.all([this.inner.getRiverForecasts(stationId), this.ensureLive()]);
    const scenario = await this.inner.getScenario();
    const withoutStaleGlofas = mock.filter((f) => f.issuer !== 'GloFAS-ECMWF Model');
    const glofas = live.glofas.data;
    const merged = glofas ? [...withoutStaleGlofas, glofas] : mock;
    // Drop CWC stage forecasts whose horizon is entirely in the past versus wall clock,
    // unless a river/forecast scenario is deliberately injecting them.
    if (scenario !== 'forecast_outage' && scenario !== 'river_warning') {
      const now = Date.now();
      return merged.filter((f) => {
        if (f.issuer !== 'CWC Official') return true;
        return f.forecastPoints.some((p) => Date.parse(p.timestamp) >= now);
      });
    }
    return merged;
  }

  async getSatelliteScenes(): Promise<SatelliteScene[]> {
    const [mock, live] = await Promise.all([this.inner.getSatelliteScenes(), this.ensureLive()]);
    if (!live.stac.data) return mock;
    const nisar = mock.filter((s) => s.mission === 'NISAR GUNW' || s.mission === 'Landsat-8 C2');
    return [...live.stac.data, ...nisar];
  }

  async getEvents(): Promise<Event[]> {
    const [mock, live] = await Promise.all([this.inner.getEvents(), this.ensureLive()]);
    const seismic = live.usgs.data ?? [];
    const ids = new Set(mock.map((e) => e.id));
    return [...mock, ...seismic.filter((e) => !ids.has(e.id))];
  }

  async getSourceStatuses(): Promise<SourceStatus[]> {
    const [mock, live] = await Promise.all([this.inner.getSourceStatuses(), this.ensureLive()]);
    const now = live.fetchedAt;
    const byId = new Map(mock.map((s) => [s.sourceId, { ...s }]));

    const openMeteo = statusFromFeed(live.rainfall, {
      sourceId: 'open-meteo',
      name: 'Open-Meteo catchment precipitation',
      category: 'weather',
      expectedCadenceSeconds: 3600,
      staleAfterSeconds: 7200,
      fallback: 'Fixture rainfall',
    });
    const glofas = statusFromFeed(live.glofas, {
      sourceId: 'glofas',
      name: 'GloFAS river discharge (via Open-Meteo)',
      category: 'hydrology',
      expectedCadenceSeconds: 86400,
      staleAfterSeconds: 172800,
      fallback: 'Fixture GloFAS series',
    });
    const usgs = statusFromFeed(live.usgs, {
      sourceId: 'usgs-seismic',
      name: 'USGS earthquake GeoJSON (2.5+, 7 day)',
      category: 'hazard',
      expectedCadenceSeconds: 300,
      staleAfterSeconds: 3600,
      fallback: 'No seismic overlay',
    });
    const stac = statusFromFeed(live.stac, {
      sourceId: 'cdse-sentinel-2',
      name: 'Copernicus Data Space Sentinel catalogue',
      category: 'satellite',
      expectedCadenceSeconds: 432000,
      staleAfterSeconds: 864000,
      fallback: 'Fixture Sentinel scenes',
    });

    byId.set('open-meteo', openMeteo);
    byId.set('glofas', glofas);
    byId.set('usgs-seismic', usgs);
    byId.set('cdse-sentinel-2', stac);

    const s1 = byId.get('cdse-sentinel-1');
    if (s1) {
      byId.set('cdse-sentinel-1', {
        ...s1,
        accessState: live.stac.state === 'live' ? 'current' : s1.accessState,
        lastAttemptAt: live.stac.fetchedAt,
        lastSuccessfulFetchAt: live.stac.state === 'live' ? live.stac.fetchedAt : s1.lastSuccessfulFetchAt,
        message:
          live.stac.state === 'live'
            ? 'Sentinel-1 granules included in the same CDSE STAC search as Sentinel-2.'
            : s1.message,
      });
    }

    const imerg = byId.get('nasa-imerg-early');
    if (imerg) {
      byId.set('nasa-imerg-early', {
        ...imerg,
        accessState: 'not_configured',
        message: 'Not queried. Catchment rainfall is taken from Open-Meteo while IMD onboarding is pending.',
        fallback: 'Open-Meteo',
        lastAttemptAt: now,
      });
    }

    const cwc = byId.get('cwc-official');
    if (cwc) {
      if (live.cwc.state === 'live' && live.cwc.data) {
        byId.set('cwc-official', {
          ...cwc,
          accessState: 'current',
          lastAttemptAt: live.cwc.fetchedAt,
          lastSuccessfulFetchAt: live.cwc.fetchedAt,
          latestObservationAt: live.cwc.data.observedAt,
          errorCode: null,
          message: `Live CWC/India-WRIS stage ${live.cwc.data.value?.toFixed(2)} m (${live.cwc.latencyMs} ms).`,
          retryableByOperator: false,
          fallback: null,
        });
      } else {
        byId.set('cwc-official', {
          ...cwc,
          accessState: 'temporarily_unavailable',
          lastAttemptAt: live.cwc.fetchedAt,
          errorCode: live.cwc.errorCode,
          message: `No public CORS JSON for ORB stage (${live.cwc.error ?? 'blocked'}). Gauge card uses the fixture value and is labelled fallback.`,
          retryableByOperator: true,
          fallback: 'Fixture ORB stage',
        });
      }
    }

    const barrage = byId.get('barrage-bulletin');
    if (barrage) {
      byId.set('barrage-bulletin', {
        ...barrage,
        accessState: 'not_configured',
        message: 'No public barrage-release JSON API. Hathnikund, Wazirabad, ITO and Okhla remain reviewed fixtures.',
        fallback: 'Fixture bulletins',
        lastAttemptAt: now,
      });
    }

    const samasth = byId.get('samasth-gateway');
    if (samasth) {
      byId.set('samasth-gateway', {
        ...samasth,
        lastAttemptAt: now,
        lastSuccessfulFetchAt: now,
        latestObservationAt: now,
        message: 'Manufacturer telemetry is a fixture, timestamps rebased to now so scour/vibration remain inspectable. Not a live Samasth broker.',
        fallback: 'Fixture sensors',
      });
    }

    return [
      byId.get('samasth-gateway'),
      byId.get('cwc-official'),
      byId.get('open-meteo'),
      byId.get('glofas'),
      byId.get('usgs-seismic'),
      byId.get('cdse-sentinel-2'),
      byId.get('cdse-sentinel-1'),
      byId.get('barrage-bulletin'),
      byId.get('imd-aws'),
      byId.get('nasa-imerg-early'),
      byId.get('asf-nisar'),
      byId.get('bhuvan-wms'),
    ].filter((s): s is SourceStatus => Boolean(s));
  }
}
