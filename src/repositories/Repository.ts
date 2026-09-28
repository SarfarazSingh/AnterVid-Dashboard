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

export interface Repository {
  getAsset(id: string): Promise<Asset>;
  getPiers(assetId: string): Promise<Pier[]>;
  getSensors(assetId: string): Promise<Sensor[]>;
  getObservations(assetId: string, sensorId?: string): Promise<Observation[]>;
  getRiverStations(): Promise<RiverStation[]>;
  getReleaseBulletins(barrageId?: string): Promise<ReleaseBulletin[]>;
  getRiverForecasts(stationId?: string): Promise<RiverForecast[]>;
  getRainfall(): Promise<RainfallData[]>;
  getSatelliteScenes(): Promise<SatelliteScene[]>;
  getLayers(): Promise<LayerEvidence[]>;
  getTransects(): Promise<TransectFinding[]>;
  getInSARPoints(): Promise<InSARFinding[]>;
  getEvents(): Promise<Event[]>;
  getSourceStatuses(): Promise<SourceStatus[]>;

  // Operator and Analyst actions (Idempotent)
  acknowledgeEvent(eventId: string, user: string, note?: string): Promise<Event>;
  addEventNote(eventId: string, user: string, note: string): Promise<Event>;
  reviewTransect(transectId: string, status: 'reviewed' | 'rejected', user: string, note: string): Promise<TransectFinding>;

  // Scenario management
  getScenario(): Promise<ScenarioId>;
  setScenario(scenarioId: ScenarioId): Promise<void>;
}
