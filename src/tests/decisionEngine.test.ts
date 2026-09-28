import { describe, it, expect, beforeEach } from 'vitest';
import { MockRepository } from '../repositories/MockRepository';
import { assessBridge, AssessmentInput, parseTravelWindowHours, RULE_SET_VERSION } from '../utils/decisionEngine';
import { buildHandoverBrief } from '../utils/exportUtils';
import { DEFAULT_DEMO_CLOCK_UTC } from '../utils/dateUtils';
import { ScenarioId } from '../types/domain';

async function inputFor(repo: MockRepository): Promise<AssessmentInput> {
  const [sensors, observations, riverStations, releaseBulletins, riverForecasts, rainfall, transects, insarPoints, layers, scenes, sourceStatuses, events] =
    await Promise.all([
      repo.getSensors('BR-249'),
      repo.getObservations('BR-249'),
      repo.getRiverStations(),
      repo.getReleaseBulletins(),
      repo.getRiverForecasts(),
      repo.getRainfall(),
      repo.getTransects(),
      repo.getInSARPoints(),
      repo.getLayers(),
      repo.getSatelliteScenes(),
      repo.getSourceStatuses(),
      repo.getEvents(),
    ]);
  return {
    clockIso: DEFAULT_DEMO_CLOCK_UTC,
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
  };
}

async function assessScenario(repo: MockRepository, scenario: ScenarioId) {
  await repo.setScenario(scenario);
  return assessBridge(await inputFor(repo));
}

describe('Analysis and decision rules', () => {
  let repo: MockRepository;

  beforeEach(() => {
    repo = new MockRepository();
  });

  it('Baseline evidence recommends heightened watch with medium confidence', async () => {
    const a = await assessScenario(repo, 'normal');
    const byId = Object.fromEntries(a.factors.map((f) => [f.id, f]));
    expect(a.ruleSetVersion).toBe(RULE_SET_VERSION);
    expect(a.posture).toBe('heightened_watch');
    expect(byId.scour.level).toBe('watch');
    expect(byId.scour.value).toContain('0.34 m bed lowering');
    expect(byId.stage.level).toBe('watch');
    expect(byId.forecast.level).toBe('watch');
    expect(byId.release.level).toBe('watch');
    expect(a.confidence).toBe('high');
  });

  it('Scour escalation from the rule engine event raises a speed restriction review', async () => {
    const a = await assessScenario(repo, 'progressive_scour');
    expect(a.factors.find((f) => f.id === 'scour')?.level).toBe('warning');
    expect(a.posture).toBe('restriction_review');
    expect(a.actions.some((x) => x.id === 'act-scour-notify' && x.priority === 'immediate')).toBe(true);
  });

  it('ORB stage above the warning level raises a speed restriction review', async () => {
    const a = await assessScenario(repo, 'river_warning');
    expect(a.factors.find((f) => f.id === 'stage')?.level).toBe('warning');
    expect(a.posture).toBe('restriction_review');
  });

  it('Missing sonar is treated as unknown bed condition, never as zero scour', async () => {
    const a = await assessScenario(repo, 'all_sonar_unavailable');
    const scour = a.factors.find((f) => f.id === 'scour');
    expect(scour?.level).toBe('unknown');
    expect(scour?.value).toBe('No valid sonar channel');
    expect(a.posture).toBe('restriction_review');
    expect(a.confidence).toBe('low');
    expect(a.actions.map((x) => x.id)).toContain('act-manual-sounding');
  });

  it('Forecast outage marks the forecast unknown and lists replacement sources', async () => {
    const a = await assessScenario(repo, 'forecast_outage');
    expect(a.factors.find((f) => f.id === 'forecast')?.level).toBe('unknown');
    const gap = a.gaps.find((g) => g.id === 'gap-forecast');
    expect(gap?.candidateSourceIds).toEqual(['cwc-nwdp']);
  });

  it('Stage above the danger level recommends a traffic suspension review', async () => {
    const input = await inputFor(repo);
    const stage = input.observations.find((o) => o.metric === 'stage_m' && o.sensorId === null);
    stage!.value = 205.5;
    expect(assessBridge(input).posture).toBe('suspension_review');
  });

  it('Stale telemetry lowers confidence without changing posture on its own', async () => {
    const baseline = await assessScenario(repo, 'normal');
    const stale = await assessScenario(repo, 'stale_telemetry');
    expect(stale.posture).toBe(baseline.posture);
    expect(stale.confidence).toBe('low');
  });

  it('Hathnikund arrival window is derived from the bulletin travel estimate', async () => {
    const a = await assessScenario(repo, 'normal');
    const item = a.outlook.find((o) => o.id === 'outlook-release-STA-HATHNIKUND');
    expect(item?.windowStart).toBe('2026-09-13T14:30:00.000Z');
    expect(item?.windowEnd).toBe('2026-09-15T03:30:00.000Z');
    expect(parseTravelWindowHours('Downstream of Bridge 249; release does not travel to the bridge')).toBeNull();
  });

  it('Handover brief includes posture, evidence and actions', async () => {
    const a = await assessScenario(repo, 'normal');
    const brief = buildHandoverBrief(a, [], [a.actions[0].id]);
    expect(brief).toContain('RECOMMENDED POSTURE: HEIGHTENED WATCH');
    expect(brief).toContain('Pier 11 bed scour');
    expect(brief).toContain('[x]');
  });
});

describe('Operator decision log', () => {
  let repo: MockRepository;

  beforeEach(() => {
    repo = new MockRepository();
  });

  const base = {
    assetId: 'BR-249',
    recordedBy: 'Operator 1',
    recommendedPosture: 'heightened_watch' as const,
    ruleSetVersion: RULE_SET_VERSION,
    scenarioId: 'normal' as const,
    factorSnapshot: [],
    completedActionIds: [],
  };

  it('Rejects an override without a rationale', async () => {
    await expect(
      repo.recordDecision({ ...base, selectedPosture: 'normal', rationale: '' })
    ).rejects.toThrow(/rationale/i);
  });

  it('Records decisions append-only and keeps them across scenario changes', async () => {
    await repo.recordDecision({ ...base, selectedPosture: 'heightened_watch', rationale: '' });
    await repo.recordDecision({
      ...base,
      selectedPosture: 'restriction_review',
      rationale: 'Field team reports debris build-up at Pier 11.',
    });
    await repo.setScenario('river_warning');
    const log = await repo.getDecisions('BR-249');
    expect(log.map((d) => d.id)).toEqual(['DEC-0002', 'DEC-0001']);
    expect(log[0].selectedPosture).toBe('restriction_review');
  });
});
