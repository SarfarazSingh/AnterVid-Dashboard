import { Observation } from '../types/domain';
import { FeedError, FeedResult, fetchJson, settleFeed } from './http';

/**
 * Best-effort CWC / India-WRIS stage. There is no documented CORS JSON contract
 * for Delhi Old Railway Bridge, so this tries a handful of public URLs and the
 * Vite-dev proxy, then returns fallback if none parse.
 */
interface LooseRecord {
  [key: string]: unknown;
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function findStage(record: LooseRecord): { value: number; at: string | null } | null {
  const keys = Object.keys(record);
  const stageKey = keys.find((k) => /water.?level|currentlevel|level_m|stage/i.test(k));
  if (!stageKey) return null;
  const value = asNumber(record[stageKey]);
  if (value === null || value < 150 || value > 230) return null;
  const timeKey = keys.find((k) => /date|time|observed/i.test(k));
  const rawTime = timeKey ? record[timeKey] : null;
  const at = typeof rawTime === 'string' ? rawTime : null;
  return { value, at };
}

function toObservation(value: number, at: string | null, now: Date): Observation {
  const observedAt = at && !Number.isNaN(Date.parse(at)) ? new Date(at).toISOString() : now.toISOString();
  return {
    id: 'OBS-CWC-ORB',
    assetId: 'BR-249',
    sensorId: null,
    metric: 'stage_m',
    value,
    unit: 'm',
    observedAt,
    receivedAt: now.toISOString(),
    periodStart: null,
    periodEnd: null,
    reference: {
      type: 'gauge_station',
      id: 'STA-ORB-CWC',
      verticalDatum: 'Mean Sea Level (MSL - Survey of India)',
    },
    quality: { state: 'good', reasons: [], uncertainty: { plusMinus: 0.01, unit: 'm', confidenceLevelPct: 95 } },
    provenance: {
      sourceId: 'cwc-official',
      origin: 'official_observation',
      sourceRecordId: `CWC-LIVE-${observedAt}`,
      methodVersion: 'india-water-best-effort',
      baselineId: null,
      inputIds: [],
      limitation: 'Parsed from a public CWC/India-WRIS JSON response. Confirm against the FFS bulletin before operational use.',
    },
    demo: false,
  };
}

async function tryUrl(url: string): Promise<Observation> {
  const payload = await fetchJson<unknown>(url, undefined, 6000);
  const records = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? ((payload as LooseRecord).data as unknown[]) ||
        ((payload as LooseRecord).result as unknown[]) || [payload]
      : [];
  for (const row of records) {
    if (!row || typeof row !== 'object') continue;
    const found = findStage(row as LooseRecord);
    if (found) return toObservation(found.value, found.at, new Date());
  }
  throw new FeedError('No ORB stage field in response', 'PARSE');
}

export async function fetchCwcStage(): Promise<FeedResult<Observation>> {
  return settleFeed('cwc-official', async () => {
    const urls = [
      '/api/cwc/webapi/getForecastAndWaterLevelData',
      'https://india-water.gov.in/webapi/getForecastAndWaterLevelData',
    ];
    let last: Error | null = null;
    for (const url of urls) {
      try {
        return await tryUrl(url);
      } catch (err) {
        last = err instanceof Error ? err : new Error(String(err));
      }
    }
    throw last ?? new FeedError('CWC stage unavailable', 'UNAVAILABLE');
  });
}
