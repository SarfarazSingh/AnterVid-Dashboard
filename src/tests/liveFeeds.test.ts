import { describe, it, expect } from 'vitest';
import { mapOpenMeteoRainfall, mapGlofasForecast } from '../live/openMeteo';
import { mapUsgsEarthquakes } from '../live/usgsEarthquakes';
import { mapStacScenes } from '../live/cdseStac';
import { haversineKm } from '../live/http';

const now = new Date('2026-09-28T08:00:00Z');

function hourlyPrecip(hours: number, mmPerHour: number) {
  const time: string[] = [];
  const precipitation: number[] = [];
  for (let i = hours; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    time.push(t.toISOString());
    precipitation.push(mmPerHour);
  }
  return { time, precipitation };
}

describe('Live feed adapters', () => {
  it('maps Open-Meteo hourly precipitation into three catchment rows', () => {
    const hourly = hourlyPrecip(48, 1);
    const rows = mapOpenMeteoRainfall(
      [
        { hourly },
        { hourly },
        { hourly },
      ],
      now
    );
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.locationType).sort()).toEqual([
      'local_delhi',
      'subbasin_yamunanagar',
      'upstream_basin',
    ].sort());
    const delhi = rows.find((r) => r.locationType === 'local_delhi')!;
    expect(delhi.source).toBe('Open-Meteo');
    expect(delhi.accumulationMm).toBe(24);
    const basin = rows.find((r) => r.locationType === 'upstream_basin')!;
    expect(basin.accumulationMm).toBe(48);
  });

  it('maps GloFAS daily discharge into a RiverForecast', () => {
    const fc = mapGlofasForecast(
      {
        daily: {
          time: ['2026-09-28', '2026-09-29'],
          river_discharge: [2100, 2500],
          river_discharge_p25: [1800, 2000],
          river_discharge_p75: [2400, 3000],
        },
      },
      now
    );
    expect(fc.issuer).toBe('GloFAS-ECMWF Model');
    expect(fc.forecastPoints[1].dischargeM3s).toBe(2500);
    expect(fc.forecastPoints[1].lowerBoundM).toBe(2000);
  });

  it('keeps USGS events only within 300 km of Bridge 249', () => {
    const events = mapUsgsEarthquakes(
      {
        features: [
          {
            id: 'near',
            properties: { mag: 4.2, place: 'Delhi', time: now.getTime() },
            geometry: { coordinates: [77.25, 28.68] },
          },
          {
            id: 'far',
            properties: { mag: 6.1, place: 'Japan', time: now.getTime() },
            geometry: { coordinates: [139.7, 35.6] },
          },
        ],
      },
      now
    );
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('EVT-USGS-near');
    expect(events[0].title).toContain('M4.2');
  });

  it('maps CDSE STAC items into Sentinel scenes', () => {
    const scenes = mapStacScenes({
      features: [
        {
          id: 'S2-LIVE-1',
          collection: 'SENTINEL-2-L2A',
          properties: {
            datetime: '2026-09-20T05:30:00Z',
            'eo:cloud_cover': 12.4,
          },
        },
        {
          id: 'S1-LIVE-1',
          collection: 'SENTINEL-1-GRD',
          properties: {
            datetime: '2026-09-21T12:00:00Z',
            'eo:cloud_cover': 0,
          },
        },
      ],
    });
    expect(scenes.map((s) => s.mission)).toEqual(['Sentinel-2 L2A', 'Sentinel-1 GRD']);
    expect(scenes[0].localUsabilityState).toBe('usable');
  });

  it('haversine distance Delhi to itself is ~0', () => {
    expect(haversineKm(28.6812, 77.2541, 28.6812, 77.2541)).toBeLessThan(0.05);
  });
});
