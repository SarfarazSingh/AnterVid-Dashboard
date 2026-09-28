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

/**
 * Production HttpRepository adapter boundary.
 * Maps internal frontend repository calls to the specified REST endpoints in Section 14.4.
 * In prototype/demo mode, MockRepository is used instead.
 */
export class HttpRepository implements Repository {
  private baseUrl: string;

  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`API Error [${res.status}]: ${err.message || 'Unknown error'}`);
    }

    return res.json();
  }

  async getAsset(id: string): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`);
  }

  async getPiers(assetId: string): Promise<Pier[]> {
    return this.request<Pier[]>(`/assets/${assetId}/piers`);
  }

  async getSensors(assetId: string): Promise<Sensor[]> {
    return this.request<Sensor[]>(`/assets/${assetId}/capabilities`);
  }

  async getObservations(assetId: string, sensorId?: string): Promise<Observation[]> {
    const query = sensorId ? `?assetId=${assetId}&sensorId=${sensorId}` : `?assetId=${assetId}`;
    return this.request<Observation[]>(`/observations${query}`);
  }

  async getRiverStations(): Promise<RiverStation[]> {
    return this.request<RiverStation[]>(`/river/stations`);
  }

  async getReleaseBulletins(barrageId?: string): Promise<ReleaseBulletin[]> {
    const query = barrageId ? `?barrageId=${barrageId}` : '';
    return this.request<ReleaseBulletin[]>(`/river/releases${query}`);
  }

  async getRiverForecasts(stationId?: string): Promise<RiverForecast[]> {
    const query = stationId ? `?stationId=${stationId}` : '';
    return this.request<RiverForecast[]>(`/river/forecasts${query}`);
  }

  async getRainfall(): Promise<RainfallData[]> {
    return this.request<RainfallData[]>(`/river/rainfall`);
  }

  async getSatelliteScenes(): Promise<SatelliteScene[]> {
    return this.request<SatelliteScene[]>(`/geospatial/scenes`);
  }

  async getLayers(): Promise<LayerEvidence[]> {
    return this.request<LayerEvidence[]>(`/geospatial/layers`);
  }

  async getTransects(): Promise<TransectFinding[]> {
    return this.request<TransectFinding[]>(`/geospatial/findings`);
  }

  async getInSARPoints(): Promise<InSARFinding[]> {
    return this.request<InSARFinding[]>(`/geospatial/insar`);
  }

  async getEvents(): Promise<Event[]> {
    return this.request<Event[]>(`/events`);
  }

  async getSourceStatuses(): Promise<SourceStatus[]> {
    return this.request<SourceStatus[]>(`/sources/status`);
  }

  async acknowledgeEvent(eventId: string, user: string, note?: string): Promise<Event> {
    return this.request<Event>(`/events/${eventId}/acknowledgements`, {
      method: 'POST',
      body: JSON.stringify({ user, note }),
    });
  }

  async addEventNote(eventId: string, user: string, note: string): Promise<Event> {
    return this.request<Event>(`/events/${eventId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ user, note }),
    });
  }

  async reviewTransect(
    transectId: string,
    status: 'reviewed' | 'rejected',
    user: string,
    note: string
  ): Promise<TransectFinding> {
    return this.request<TransectFinding>(`/geospatial/findings/${transectId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, user, note }),
    });
  }

  async getScenario(): Promise<ScenarioId> {
    return 'normal';
  }

  async setScenario(_scenarioId: ScenarioId): Promise<void> {
    // In production, scenarios are server-side or disabled
  }
}
