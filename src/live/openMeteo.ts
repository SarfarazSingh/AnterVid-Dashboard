import { RainfallData, RiverForecast } from '../types/domain';
import { BRIDGE_249, fetchJson, settleFeed, FeedResult } from './http';

interface HourlyBlock {
  time: string[];
  precipitation: number[];
}

interface ForecastResponse {
  latitude?: number;
  longitude?: number;
  hourly?: HourlyBlock;
}

interface FloodResponse {
  daily?: {
    time: string[];
    river_discharge?: (number | null)[];
    river_discharge_p25?: (number | null)[];
    river_discharge_p75?: (number | null)[];
    river_discharge_min?: (number | null)[];
    river_discharge_max?: (number | null)[];
  };
}

const SITES: { lat: number; lon: number; locationType: RainfallData['locationType']; locationName: string }[] = [
  {
    lat: 28.6139,
    lon: 77.209,
    locationType: 'local_delhi',
    locationName: 'Delhi (Safdarjung area)',
  },
  {
    lat: 30.129,
    lon: 77.2674,
    locationType: 'subbasin_yamunanagar',
    locationName: 'Yamunanagar / Paonta Sahib subbasin',
  },
  {
    lat: 30.438,
    lon: 77.625,
    locationType: 'upstream_basin',
    locationName: 'Upper Yamuna catchment (Paonta Sahib)',
  },
];

function warningCategory(mm: number): RainfallData['warningCategory'] {
  if (mm >= 115.6) return 'Red (Warning)';
  if (mm >= 64.5) return 'Orange (Alert)';
  if (mm >= 15) return 'Yellow (Watch)';
  return 'Green (No Warning)';
}

function sumHours(block: HourlyBlock, fromMs: number, toMs: number): number {
  let total = 0;
  for (let i = 0; i < block.time.length; i++) {
    const t = Date.parse(block.time[i]);
    if (t >= fromMs && t < toMs) {
      const v = block.precipitation[i];
      if (typeof v === 'number' && !Number.isNaN(v)) total += v;
    }
  }
  return total;
}

function asList(payload: ForecastResponse | ForecastResponse[]): ForecastResponse[] {
  return Array.isArray(payload) ? payload : [payload];
}

export function mapOpenMeteoRainfall(
  payload: ForecastResponse | ForecastResponse[],
  now = new Date()
): RainfallData[] {
  const list = asList(payload);
  const nowMs = now.getTime();
  const from24 = nowMs - 24 * 3600 * 1000;
  const from48 = nowMs - 48 * 3600 * 1000;

  return SITES.map((site, idx) => {
    const row = list[idx] ?? list[0];
    const hourly = row?.hourly;
    if (!hourly?.time?.length || !hourly.precipitation) {
      throw new Error('Open-Meteo rainfall payload missing hourly precipitation');
    }
    const hours = site.locationType === 'upstream_basin' ? 48 : 24;
    const from = hours === 48 ? from48 : from24;
    const mm = sumHours(hourly, from, nowMs);
    const periodStart = new Date(from).toISOString();
    const periodEnd = now.toISOString();
    return {
      id: `RAIN-LIVE-${site.locationType}`,
      locationType: site.locationType,
      locationName: site.locationName,
      source: 'Open-Meteo',
      periodStart,
      periodEnd,
      accumulationMm: Math.round(mm * 10) / 10,
      isPartialCoverage: false,
      validCoveragePct: 100,
      observationLatencyHours: 0.5,
      isForecast: false,
      warningCategory: warningCategory(sumHours(hourly, from24, nowMs)),
    };
  });
}

export function mapGlofasForecast(payload: FloodResponse, now = new Date()): RiverForecast {
  const daily = payload.daily;
  if (!daily?.time?.length || !daily.river_discharge) {
    throw new Error('GloFAS payload missing daily river_discharge');
  }
  const points = daily.time.map((day, i) => ({
    timestamp: `${day}T00:00:00Z`,
    dischargeM3s: daily.river_discharge?.[i] ?? undefined,
    lowerBoundM: daily.river_discharge_p25?.[i] ?? daily.river_discharge_min?.[i] ?? undefined,
    upperBoundM: daily.river_discharge_p75?.[i] ?? daily.river_discharge_max?.[i] ?? undefined,
  }));
  const last = points[points.length - 1];
  return {
    id: `FC-GLOFAS-${dayStamp(now)}`,
    stationId: 'STA-ORB-CWC',
    metric: 'discharge_m3s',
    issuer: 'GloFAS-ECMWF Model',
    issueTime: now.toISOString(),
    validFrom: points[0]?.timestamp ?? now.toISOString(),
    validTo: last?.timestamp ?? now.toISOString(),
    forecastPoints: points,
    ensembleStatistic: 'IQR (Interquartile Range)',
    revision: 1,
    methodDescription:
      'Open-Meteo Flood API (GloFAS). Daily modelled discharge at 5 km. Barrage regulation is not represented. This is not CWC gauge stage.',
  };
}

function dayStamp(now: Date): string {
  return now.toISOString().slice(0, 10).replace(/-/g, '');
}

export async function fetchOpenMeteoRainfall(): Promise<FeedResult<RainfallData[]>> {
  return settleFeed('open-meteo', async () => {
    const lats = SITES.map((s) => s.lat).join(',');
    const lons = SITES.map((s) => s.lon).join(',');
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
      `&hourly=precipitation&past_days=2&forecast_days=1&timezone=UTC`;
    const payload = await fetchJson<ForecastResponse | ForecastResponse[]>(url);
    return mapOpenMeteoRainfall(payload);
  });
}

export async function fetchGlofasDischarge(): Promise<FeedResult<RiverForecast>> {
  return settleFeed('glofas', async () => {
    const url =
      `https://flood-api.open-meteo.com/v1/flood?latitude=${BRIDGE_249.lat}&longitude=${BRIDGE_249.lon}` +
      `&daily=river_discharge,river_discharge_min,river_discharge_max,river_discharge_p25,river_discharge_p75` +
      `&forecast_days=7&past_days=3&timezone=GMT`;
    const payload = await fetchJson<FloodResponse>(url);
    return mapGlofasForecast(payload);
  });
}
