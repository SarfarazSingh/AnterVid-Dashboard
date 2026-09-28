import { describe, it, expect, beforeEach } from 'vitest';
import { formatToIST, calculateAgeSeconds, evaluateFreshness, DEFAULT_DEMO_CLOCK_UTC } from '../utils/dateUtils';
import { formatMetricValue, cusecsToM3s, m3sToCusecs, checkDatumCompatibility } from '../utils/formatters';
import { MockRepository } from '../repositories/MockRepository';
import { SourcePolicy } from '../types/domain';

describe('Samast Domain Contracts and Edge Case Testing', () => {
  let repo: MockRepository;

  beforeEach(() => {
    repo = new MockRepository();
  });

  it('1. Null Handling: Null metric returns "Not available", never zero', () => {
    expect(formatMetricValue(null, 'sonar_range')).toBe('Not available');
    expect(formatMetricValue(undefined, 'sonar_range')).toBe('Not available');
    expect(formatMetricValue(NaN, 'sonar_range')).toBe('Not available');
    // Ensure 0 is formatted as a valid reading, distinct from null
    expect(formatMetricValue(0, 'tilt_transverse')).toBe('+0.00');
  });

  it('2. Time Zone: Timestamps correctly convert UTC to Asia/Kolkata (IST)', () => {
    // 09:05:00 UTC = 14:35:00 IST (+5h 30m)
    const formatted = formatToIST('2026-09-12T09:05:00Z', true);
    expect(formatted).toContain('14:35:00 IST');
    expect(formatted).toContain('12 Sep 2026');
  });

  it('3. Stale-Age Calculation: Evaluated strictly against observation time, not fetch time', () => {
    const obsTime = '2026-09-12T08:50:00Z'; // 15 mins prior to 09:05:00Z
    const age = calculateAgeSeconds(obsTime, DEFAULT_DEMO_CLOCK_UTC);
    expect(age).toBe(15 * 60); // 900 seconds
  });

  it('4. Source-Specific Freshness: Sensors, satellites, and static layers have separate policies', () => {
    const sensorPolicy: SourcePolicy = {
      sourceId: 'sensor-test',
      expectedCadenceSeconds: 300,
      expectedLatencySeconds: 15,
      staleAfterSeconds: 900, // 15m
      validUntilRequired: false,
    };

    const staticPolicy: SourcePolicy = {
      sourceId: 'static-geology',
      expectedCadenceSeconds: null,
      expectedLatencySeconds: null,
      staleAfterSeconds: null,
      validUntilRequired: false,
    };

    // Recent sensor (5m old) -> current
    const recentObs = '2026-09-12T09:00:00Z';
    const recentRes = evaluateFreshness(recentObs, sensorPolicy, DEFAULT_DEMO_CLOCK_UTC);
    expect(recentRes.state).toBe('current');
    expect(recentRes.isStale).toBe(false);

    // Stale sensor (20m old) -> stale
    const staleObs = '2026-09-12T08:40:00Z';
    const staleRes = evaluateFreshness(staleObs, sensorPolicy, DEFAULT_DEMO_CLOCK_UTC);
    expect(staleRes.state).toBe('stale');
    expect(staleRes.isStale).toBe(true);

    // Static layer (3 years old) -> not_applicable (never triggers live stale alert)
    const oldStaticObs = '2023-01-01T00:00:00Z';
    const staticRes = evaluateFreshness(oldStaticObs, staticPolicy, DEFAULT_DEMO_CLOCK_UTC);
    expect(staticRes.state).toBe('not_applicable');
    expect(staticRes.isStale).toBe(false);
  });

  it('5. Datum Mismatch: Prevents mathematical subtraction across incompatible or null datums', () => {
    const nullCheck = checkDatumCompatibility(null, 'MSL');
    expect(nullCheck.isCompatible).toBe(false);
    expect(nullCheck.message).toContain('suppressed');

    const mismatchCheck = checkDatumCompatibility('Local Mount RL', 'Mean Sea Level (MSL)');
    expect(mismatchCheck.isCompatible).toBe(false);
    expect(mismatchCheck.message).toContain('Datum mismatch');

    const matchCheck = checkDatumCompatibility('MSL', 'msl');
    expect(matchCheck.isCompatible).toBe(true);
  });

  it('6. Unit Conversion: Exact cfs to m3/s factor (1 cfs = 0.028316846592 m3/s)', () => {
    const cfs = 125000;
    const m3s = cusecsToM3s(cfs);
    expect(Math.round(m3s)).toBe(3540); // 125000 * 0.0283168...
    expect(Math.round(m3sToCusecs(m3s))).toBe(125000);
  });

  it('7. Capability Gating: Scalar vibration sensor disallows waveform and modal analysis', async () => {
    const sensors = await repo.getSensors('BR-249');
    const vibSensor = sensors.find((s) => s.id === 'P11-VT-01');
    expect(vibSensor).toBeDefined();
    expect(vibSensor?.capabilities.hasWaveform).toBe(false);
    expect(vibSensor?.capabilities.hasModalFrequency).toBe(false);
  });

  it('8. Idempotent Event Acknowledgement: Repeated clicks do not duplicate audit trail or change condition', async () => {
    const initialEvents = await repo.getEvents();
    const event = initialEvents[0];
    expect(event.workflowStatus).toBe('unacknowledged');
    const initialAuditCount = event.auditTrail.length;

    // First acknowledgement
    const ack1 = await repo.acknowledgeEvent(event.id, 'Operator 1', 'First ack note');
    expect(ack1.workflowStatus).toBe('acknowledged');
    expect(ack1.auditTrail.length).toBe(initialAuditCount + 1);

    // Second acknowledgement click (Idempotent)
    const ack2 = await repo.acknowledgeEvent(event.id, 'Operator 1', 'Repeated click');
    expect(ack2.workflowStatus).toBe('acknowledged');
    expect(ack2.auditTrail.length).toBe(initialAuditCount + 1); // Not duplicated!
    expect(ack2.condition).toBe(event.condition); // Condition preserved!
  });

  it('9. Scenario Switcher: Progressive Scour updates Sonar 02 value and triggers Warning', async () => {
    await repo.setScenario('progressive_scour');
    const obs = await repo.getObservations('BR-249');
    const s2 = obs.find((o) => o.sensorId === 'P11-SON-02');
    expect(s2?.value).toBe(8.780);

    const events = await repo.getEvents();
    const scourEvent = events.find((e) => e.category === 'scour');
    expect(scourEvent?.condition).toBe('warning');
  });

  it('10. Scenario Switcher: All Sonar Unavailable sets values to null with missing quality', async () => {
    await repo.setScenario('all_sonar_unavailable');
    const obs = await repo.getObservations('BR-249');
    const sonars = obs.filter((o) => o.sensorId?.startsWith('P11-SON'));
    sonars.forEach((s) => {
      expect(s.value).toBeNull();
      expect(s.quality.state).toBe('missing');
    });
  });
});
