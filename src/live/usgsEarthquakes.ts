import { Event } from '../types/domain';
import { BRIDGE_249, FeedResult, fetchJson, haversineKm, settleFeed } from './http';

interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number | null;
    url?: string;
  };
  geometry: { coordinates: [number, number, number?] };
}

interface UsgsFeed {
  features?: UsgsFeature[];
}

const RADIUS_KM = 300;

export function mapUsgsEarthquakes(payload: UsgsFeed, now = new Date()): Event[] {
  const features = payload.features ?? [];
  return features
    .map((f) => {
      const [lon, lat] = f.geometry?.coordinates ?? [NaN, NaN];
      const km = haversineKm(BRIDGE_249.lat, BRIDGE_249.lon, lat, lon);
      return { f, km };
    })
    .filter(({ km }) => Number.isFinite(km) && km <= RADIUS_KM)
    .sort((a, b) => (b.f.properties.mag ?? 0) - (a.f.properties.mag ?? 0))
    .slice(0, 3)
    .map(({ f, km }) => {
      const mag = f.properties.mag ?? 0;
      const detectedAt = f.properties.time
        ? new Date(f.properties.time).toISOString()
        : now.toISOString();
      return {
        id: `EVT-USGS-${f.id}`,
        condition: mag >= 5 ? 'warning' : mag >= 4 ? 'watch' : 'within_range',
        workflowStatus: 'unacknowledged' as const,
        title: `M${mag.toFixed(1)} earthquake ${km.toFixed(0)} km from Bridge 249`,
        category: 'ground' as const,
        detectedAt,
        evidenceIds: [f.id, f.properties.url ?? 'usgs-geojson'],
        ruleVersion: 'usgs-2.5-week-v1',
        baselineId: null,
        assignee: null,
        acknowledgedAt: null,
        acknowledgedBy: null,
        suggestedProcedure:
          'SOP-NR-SEISMIC-01: If magnitude ≥ 4.0 within 300 km, walk the pier cap and confirm sonar returns before the next traffic peak.',
        auditTrail: [
          {
            timestamp: now.toISOString(),
            user: 'USGS live feed',
            action: 'Event Triggered',
            note: f.properties.place ?? 'Location from USGS GeoJSON',
          },
        ],
      };
    });
}

export async function fetchUsgsEarthquakes(): Promise<FeedResult<Event[]>> {
  return settleFeed('usgs-seismic', async () => {
    const payload = await fetchJson<UsgsFeed>(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson'
    );
    return mapUsgsEarthquakes(payload);
  });
}
