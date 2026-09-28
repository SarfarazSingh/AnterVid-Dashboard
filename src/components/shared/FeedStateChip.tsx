import React from 'react';
import { FeedState } from '../../live/http';

export type { FeedState } from '../../live/http';

export const FeedStateChip: React.FC<{ state: FeedState; title?: string }> = ({ state, title }) => {
  const label = state === 'live' ? 'LIVE' : state === 'fallback' ? 'FALLBACK' : 'FIXTURE';
  const cls =
    state === 'live' ? 'badge-live' : state === 'fallback' ? 'badge-watch' : 'badge-fixture';
  return (
    <span className={`badge ${cls}`} title={title ?? label}>
      {label}
    </span>
  );
};

export function feedStateForSource(
  sourceId: string | undefined,
  accessState: string | undefined,
  liveIds: string[]
): FeedState {
  if (!sourceId) return 'fixture';
  if (liveIds.includes(sourceId) && accessState === 'current') return 'live';
  if (liveIds.includes(sourceId)) return 'fallback';
  return 'fixture';
}

export const LIVE_FEED_IDS = ['open-meteo', 'glofas', 'usgs-seismic', 'cdse-sentinel-2', 'cdse-sentinel-1', 'cwc-official'];
