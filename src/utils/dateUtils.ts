import { FreshnessState, SourcePolicy } from '../types/domain';

// Default Controlled Demo Clock: 12 September 2026 at 14:35:00 IST (09:05:00 UTC)
export const DEFAULT_DEMO_CLOCK_UTC = '2026-09-12T09:05:00Z';

/**
 * Formats an ISO UTC timestamp into standard IST string representation:
 * e.g. "12 Sep 2026, 14:35 IST" or "14:35:12 IST"
 */
export function formatToIST(
  utcIsoString: string | null | undefined,
  includeSeconds = false,
  timeOnly = false
): string {
  if (!utcIsoString) return 'Not available';

  try {
    const date = new Date(utcIsoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
      ...(!timeOnly
        ? {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }
        : {}),
    };

    const formatted = new Intl.DateTimeFormat('en-IN', options).format(date).replace(/Sept/g, 'Sep');
    return `${formatted} IST`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Calculates human-readable age relative to the controlled demo clock
 */
export function calculateAgeSeconds(
  observedAtIso: string,
  referenceClockIso: string = DEFAULT_DEMO_CLOCK_UTC
): number {
  const obs = new Date(observedAtIso).getTime();
  const ref = new Date(referenceClockIso).getTime();
  return Math.max(0, Math.floor((ref - obs) / 1000));
}

/**
 * Formats duration in seconds into operator-friendly string (e.g. "45s ago", "12m ago", "3.2h ago")
 */
export function formatAgeString(ageSeconds: number): string {
  if (ageSeconds < 60) {
    return `${ageSeconds}s ago`;
  }
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = (ageSeconds / 3600).toFixed(1);
  if (ageSeconds < 86400) {
    return `${hours}h ago`;
  }
  const days = Math.floor(ageSeconds / 86400);
  return `${days}d ago`;
}

/**
 * Source-specific freshness assessment based on the provider's specific policy.
 * NEVER uses one generic 30-min rule for both telemetry and satellites.
 */
export function evaluateFreshness(
  observedAtIso: string | null | undefined,
  policy: SourcePolicy,
  referenceClockIso: string = DEFAULT_DEMO_CLOCK_UTC
): {
  state: FreshnessState;
  ageSeconds: number | null;
  ageFormatted: string;
  isStale: boolean;
  cadenceDescription: string;
} {
  if (!observedAtIso) {
    return {
      state: 'not_applicable',
      ageSeconds: null,
      ageFormatted: 'No observation',
      isStale: false,
      cadenceDescription: policy.expectedCadenceSeconds
        ? `Expected every ${policy.expectedCadenceSeconds}s`
        : 'Intermittent / Manual',
    };
  }

  const ageSeconds = calculateAgeSeconds(observedAtIso, referenceClockIso);
  const ageFormatted = formatAgeString(ageSeconds);

  // If no staleAfterSeconds is configured, it's not applicable to treat as live stale
  if (!policy.staleAfterSeconds) {
    return {
      state: 'not_applicable',
      ageSeconds,
      ageFormatted,
      isStale: false,
      cadenceDescription: 'Catalog / Research product',
    };
  }

  const expectedLatency = policy.expectedLatencySeconds || 0;
  const staleThreshold = policy.staleAfterSeconds;

  let state: FreshnessState = 'current';
  if (ageSeconds > staleThreshold) {
    state = 'stale';
  } else if (ageSeconds > expectedLatency + (policy.expectedCadenceSeconds || 0)) {
    state = 'delayed';
  }

  return {
    state,
    ageSeconds,
    ageFormatted,
    isStale: state === 'stale',
    cadenceDescription: `Expected ~${policy.expectedCadenceSeconds}s, stale after ${Math.round(staleThreshold / 60)}m`,
  };
}
