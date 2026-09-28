export type FeedState = 'live' | 'fixture' | 'fallback';

export interface FeedResult<T> {
  sourceId: string;
  state: FeedState;
  data: T | null;
  error: string | null;
  errorCode: string | null;
  fetchedAt: string;
  latencyMs: number;
}

export class FeedError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 8000
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new FeedError(`${res.status} ${res.statusText}`, `HTTP_${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof FeedError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new FeedError('Request timed out', 'TIMEOUT');
    }
    throw new FeedError(err instanceof Error ? err.message : 'Network error', 'NETWORK');
  } finally {
    clearTimeout(timer);
  }
}

export async function settleFeed<T>(
  sourceId: string,
  loader: () => Promise<T>
): Promise<FeedResult<T>> {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const fetchedAt = new Date().toISOString();
  try {
    const data = await loader();
    const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      sourceId,
      state: 'live',
      data,
      error: null,
      errorCode: null,
      fetchedAt,
      latencyMs: Math.round(ended - started),
    };
  } catch (err) {
    const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      sourceId,
      state: 'fallback',
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: err instanceof FeedError ? err.code : 'NETWORK',
      fetchedAt,
      latencyMs: Math.round(ended - started),
    };
  }
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const BRIDGE_249 = { lat: 28.6812, lon: 77.2541 };
