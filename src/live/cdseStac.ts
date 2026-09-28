import { SatelliteScene } from '../types/domain';
import { FeedResult, fetchJson, settleFeed } from './http';

interface StacItem {
  id: string;
  collection?: string;
  properties?: {
    datetime?: string;
    start_datetime?: string;
    end_datetime?: string;
    'eo:cloud_cover'?: number;
    'sat:orbit_state'?: string;
    'sat:relative_orbit'?: number;
  };
}

interface StacSearch {
  features?: StacItem[];
}

const BBOX = [77.2, 28.62, 77.32, 28.74];

function missionFor(collection: string | undefined): SatelliteScene['mission'] | null {
  const id = (collection ?? '').toLowerCase();
  if (id.includes('sentinel-2')) return 'Sentinel-2 L2A';
  if (id.includes('sentinel-1')) return 'Sentinel-1 GRD';
  return null;
}

export function mapStacScenes(payload: StacSearch): SatelliteScene[] {
  const items = payload.features ?? [];
  const mapped: SatelliteScene[] = [];
  for (const item of items) {
    const mission = missionFor(item.collection);
    if (!mission) continue;
    const start = item.properties?.start_datetime || item.properties?.datetime;
    if (!start) continue;
    const cloud = item.properties?.['eo:cloud_cover'] ?? 0;
    const localUsabilityState: SatelliteScene['localUsabilityState'] =
      mission === 'Sentinel-2 L2A' && cloud >= 70 ? 'cloud_obscured' : 'usable';
    mapped.push({
      id: item.id,
      mission,
      collection: item.collection ?? '',
      acquisitionTimes: item.properties?.end_datetime
        ? [start, item.properties.end_datetime]
        : [start],
      cloudCoverTotalPct: Math.round(cloud * 10) / 10,
      localCorridorCloudPct: Math.round(cloud * 10) / 10,
      localUsabilityState,
      rejectionReason: localUsabilityState === 'cloud_obscured' ? 'Local corridor cloud ≥ 70%' : null,
      maturity: 'operational',
      processorVersion: 'CDSE STAC v1',
      orbitDirection:
        item.properties?.['sat:orbit_state'] === 'ascending'
          ? 'ascending'
          : item.properties?.['sat:orbit_state'] === 'descending'
            ? 'descending'
            : undefined,
      trackNumber: item.properties?.['sat:relative_orbit'],
    });
  }
  if (mapped.length === 0) {
    throw new Error('No Sentinel scenes in the Bridge 249 STAC window');
  }
  return mapped;
}

export async function fetchCdseScenes(): Promise<FeedResult<SatelliteScene[]>> {
  return settleFeed('cdse-sentinel-2', async () => {
    const end = new Date();
    const start = new Date(end.getTime() - 21 * 24 * 3600 * 1000);
    const body = {
      collections: ['SENTINEL-2-L2A', 'SENTINEL-1-GRD'],
      bbox: BBOX,
      datetime: `${start.toISOString()}/${end.toISOString()}`,
      limit: 12,
      sortby: [{ field: 'properties.datetime', direction: 'desc' }],
    };
    try {
      const payload = await fetchJson<StacSearch>('https://stac.dataspace.copernicus.eu/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return mapStacScenes(payload);
    } catch {
      const alt = await fetchJson<StacSearch>('https://stac.dataspace.copernicus.eu/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, collections: ['sentinel-2-l2a', 'sentinel-1-grd'] }),
      });
      return mapStacScenes(alt);
    }
  });
}
