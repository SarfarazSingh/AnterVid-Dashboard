import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Repository } from '../repositories/Repository';
import { MockRepository } from '../repositories/MockRepository';
import { DEFAULT_DEMO_CLOCK_UTC } from '../utils/dateUtils';
import { Assessment, assessBridge } from '../utils/decisionEngine';

export type PrimaryTab = 'bridge_sensors' | 'river_intelligence' | 'ground_and_banks' | 'analysis_decisions';
export type TimeRangeOption = '24h' | '7d' | '30d' | 'monsoon_season';

interface AppContextType {
  repository: Repository;
  currentScenario: ScenarioId;
  activeTab: PrimaryTab;
  selectedPierId: string | null;
  selectedSensorId: string | null;
  selectedTimeRange: TimeRangeOption;
  demoClockIso: string;
  isClockPaused: boolean;

  // Data
  asset: Asset | null;
  piers: Pier[];
  sensors: Sensor[];
  observations: Observation[];
  riverStations: RiverStation[];
  releaseBulletins: ReleaseBulletin[];
  riverForecasts: RiverForecast[];
  rainfall: RainfallData[];
  scenes: SatelliteScene[];
  layers: LayerEvidence[];
  transects: TransectFinding[];
  insarPoints: InSARFinding[];
  events: Event[];
  sourceStatuses: SourceStatus[];
  decisions: DecisionRecord[];
  assessment: Assessment | null;
  completedActionIds: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Modal & Drawer State
  provenanceTarget: { title: string; metadata: Record<string, any> } | null;
  isEventsDrawerOpen: boolean;
  isDataSourcesModalOpen: boolean;
  isReportsModalOpen: boolean;
  isScenarioSwitcherOpen: boolean;
  isSensorInspectorOpen: boolean;
  selectedTransectId: string | null;
  selectedInSARPointId: string | null;

  // Navigation & Actions
  setActiveTab: (tab: PrimaryTab) => void;
  selectPier: (pierId: string | null) => void;
  selectSensor: (sensorId: string | null) => void;
  setTimeRange: (range: TimeRangeOption) => void;
  setScenario: (scenarioId: ScenarioId) => Promise<void>;
  acknowledgeEvent: (eventId: string, note?: string) => Promise<void>;
  addEventNote: (eventId: string, note: string) => Promise<void>;
  reviewTransect: (transectId: string, status: 'reviewed' | 'rejected', note: string) => Promise<void>;
  recordDecision: (input: Omit<DecisionRecordInput, 'assetId' | 'scenarioId'>) => Promise<DecisionRecord>;
  toggleActionComplete: (actionId: string) => void;
  openProvenance: (title: string, metadata: Record<string, any>) => void;
  closeProvenance: () => void;
  setIsEventsDrawerOpen: (open: boolean) => void;
  setIsDataSourcesModalOpen: (open: boolean) => void;
  setIsReportsModalOpen: (open: boolean) => void;
  setIsScenarioSwitcherOpen: (open: boolean) => void;
  setIsSensorInspectorOpen: (open: boolean) => void;
  setSelectedTransectId: (id: string | null) => void;
  setSelectedInSARPointId: (id: string | null) => void;
  toggleClockPause: () => void;
  refreshData: () => Promise<void>;
}

const defaultRepo = new MockRepository();
const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode; repo?: Repository }> = ({
  children,
  repo = defaultRepo,
}) => {
  const [repository] = useState<Repository>(repo);
  const [currentScenario, setCurrentScenarioState] = useState<ScenarioId>('normal');
  const [activeTab, setActiveTab] = useState<PrimaryTab>('bridge_sensors');
  const [selectedPierId, setSelectedPierId] = useState<string | null>('P11');
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>('P11-SON-01');
  const [selectedTimeRange, setTimeRange] = useState<TimeRangeOption>('24h');
  const [demoClockIso] = useState<string>(DEFAULT_DEMO_CLOCK_UTC);
  const [isClockPaused, setIsClockPaused] = useState<boolean>(false);

  // Data states
  const [asset, setAsset] = useState<Asset | null>(null);
  const [piers, setPiers] = useState<Pier[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [riverStations, setRiverStations] = useState<RiverStation[]>([]);
  const [releaseBulletins, setReleaseBulletins] = useState<ReleaseBulletin[]>([]);
  const [riverForecasts, setRiverForecasts] = useState<RiverForecast[]>([]);
  const [rainfall, setRainfall] = useState<RainfallData[]>([]);
  const [scenes, setScenes] = useState<SatelliteScene[]>([]);
  const [layers, setLayers] = useState<LayerEvidence[]>([]);
  const [transects, setTransects] = useState<TransectFinding[]>([]);
  const [insarPoints, setInSARPoints] = useState<InSARFinding[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [completedActionIds, setCompletedActionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  // Modal / Drawer states
  const [provenanceTarget, setProvenanceTarget] = useState<{
    title: string;
    metadata: Record<string, any>;
  } | null>(null);
  const [isEventsDrawerOpen, setIsEventsDrawerOpen] = useState<boolean>(false);
  const [isDataSourcesModalOpen, setIsDataSourcesModalOpen] = useState<boolean>(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);
  const [isScenarioSwitcherOpen, setIsScenarioSwitcherOpen] = useState<boolean>(false);
  const [isSensorInspectorOpen, setIsSensorInspectorOpen] = useState<boolean>(false);
  const [selectedTransectId, setSelectedTransectId] = useState<string | null>('FIND-TR-01');
  const [selectedInSARPointId, setSelectedInSARPointId] = useState<string | null>('INSAR-PT-01');

  const loadAllData = useCallback(async () => {
    // Only the first load blanks the workspace; later refreshes keep the current view on screen.
    const isInitial = !hasLoadedOnce.current;
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const [
        loadedAsset,
        loadedPiers,
        loadedSensors,
        loadedObs,
        loadedStations,
        loadedReleases,
        loadedForecasts,
        loadedRainfall,
        loadedScenes,
        loadedLayers,
        loadedTransects,
        loadedInSAR,
        loadedEvents,
        loadedSources,
        scenario,
        loadedDecisions,
      ] = await Promise.all([
        repository.getAsset('BR-249'),
        repository.getPiers('BR-249'),
        repository.getSensors('BR-249'),
        repository.getObservations('BR-249'),
        repository.getRiverStations(),
        repository.getReleaseBulletins(),
        repository.getRiverForecasts(),
        repository.getRainfall(),
        repository.getSatelliteScenes(),
        repository.getLayers(),
        repository.getTransects(),
        repository.getInSARPoints(),
        repository.getEvents(),
        repository.getSourceStatuses(),
        repository.getScenario(),
        repository.getDecisions('BR-249'),
      ]);

      setAsset(loadedAsset);
      setPiers(loadedPiers);
      setSensors(loadedSensors);
      setObservations(loadedObs);
      setRiverStations(loadedStations);
      setReleaseBulletins(loadedReleases);
      setRiverForecasts(loadedForecasts);
      setRainfall(loadedRainfall);
      setScenes(loadedScenes);
      setLayers(loadedLayers);
      setTransects(loadedTransects);
      setInSARPoints(loadedInSAR);
      setEvents(loadedEvents);
      setSourceStatuses(loadedSources);
      setCurrentScenarioState(scenario);
      setDecisions(loadedDecisions);
      hasLoadedOnce.current = true;
    } catch (err: any) {
      setError(err?.message || 'Failed to load Samast data repository');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [repository]);

  const assessment = useMemo<Assessment | null>(() => {
    if (!asset) return null;
    return assessBridge({
      clockIso: demoClockIso,
      sensors,
      observations,
      riverStations,
      releaseBulletins,
      riverForecasts,
      rainfall,
      transects,
      insarPoints,
      layers,
      scenes,
      sourceStatuses,
      events,
    });
  }, [
    asset,
    demoClockIso,
    sensors,
    observations,
    riverStations,
    releaseBulletins,
    riverForecasts,
    rainfall,
    transects,
    insarPoints,
    layers,
    scenes,
    sourceStatuses,
    events,
  ]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const selectPier = useCallback(
    (pierId: string | null) => {
      setSelectedPierId(pierId);
      if (pierId) {
        // Automatically select the first sensor on this pier if one exists
        const pierSensors = sensors.filter((s) => s.pierId === pierId && s.capabilities.isCommissioned);
        if (pierSensors.length > 0) {
          setSelectedSensorId(pierSensors[0].id);
        }
      }
    },
    [sensors]
  );

  const selectSensor = useCallback((sensorId: string | null) => {
    setSelectedSensorId(sensorId);
    if (sensorId) {
      setIsSensorInspectorOpen(true);
    }
  }, []);

  const setScenario = useCallback(
    async (scenarioId: ScenarioId) => {
      await repository.setScenario(scenarioId);
      setCompletedActionIds([]);
      await loadAllData();
    },
    [repository, loadAllData]
  );

  const acknowledgeEvent = useCallback(
    async (eventId: string, note?: string) => {
      await repository.acknowledgeEvent(eventId, 'Operator (Control Room Delhi)', note);
      const updatedEvents = await repository.getEvents();
      setEvents(updatedEvents);
    },
    [repository]
  );

  const addEventNote = useCallback(
    async (eventId: string, note: string) => {
      await repository.addEventNote(eventId, 'Operator (Control Room Delhi)', note);
      const updatedEvents = await repository.getEvents();
      setEvents(updatedEvents);
    },
    [repository]
  );

  const reviewTransect = useCallback(
    async (transectId: string, status: 'reviewed' | 'rejected', note: string) => {
      await repository.reviewTransect(transectId, status, 'P. Sharma (Geospatial Lead)', note);
      const updatedTransects = await repository.getTransects();
      setTransects(updatedTransects);
    },
    [repository]
  );

  const recordDecision = useCallback(
    async (input: Omit<DecisionRecordInput, 'assetId' | 'scenarioId'>) => {
      const record = await repository.recordDecision({
        ...input,
        assetId: 'BR-249',
        scenarioId: currentScenario,
      });
      setDecisions(await repository.getDecisions('BR-249'));
      return record;
    },
    [repository, currentScenario]
  );

  const toggleActionComplete = useCallback((actionId: string) => {
    setCompletedActionIds((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  }, []);

  const openProvenance = useCallback((title: string, metadata: Record<string, any>) => {
    setProvenanceTarget({ title, metadata });
  }, []);

  const closeProvenance = useCallback(() => {
    setProvenanceTarget(null);
  }, []);

  const toggleClockPause = useCallback(() => {
    setIsClockPaused((prev) => !prev);
  }, []);

  return (
    <AppContext.Provider
      value={{
        repository,
        currentScenario,
        activeTab,
        selectedPierId,
        selectedSensorId,
        selectedTimeRange,
        demoClockIso,
        isClockPaused,

        asset,
        piers,
        sensors,
        observations,
        riverStations,
        releaseBulletins,
        riverForecasts,
        rainfall,
        scenes,
        layers,
        transects,
        insarPoints,
        events,
        sourceStatuses,
        decisions,
        assessment,
        completedActionIds,
        isLoading,
        isRefreshing,
        error,

        provenanceTarget,
        isEventsDrawerOpen,
        isDataSourcesModalOpen,
        isReportsModalOpen,
        isScenarioSwitcherOpen,
        isSensorInspectorOpen,
        selectedTransectId,
        selectedInSARPointId,

        setActiveTab,
        selectPier,
        selectSensor,
        setTimeRange,
        setScenario,
        acknowledgeEvent,
        addEventNote,
        reviewTransect,
        recordDecision,
        toggleActionComplete,
        openProvenance,
        closeProvenance,
        setIsEventsDrawerOpen,
        setIsDataSourcesModalOpen,
        setIsReportsModalOpen,
        setIsScenarioSwitcherOpen,
        setIsSensorInspectorOpen,
        setSelectedTransectId,
        setSelectedInSARPointId,
        toggleClockPause,
        refreshData: loadAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
