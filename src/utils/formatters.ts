/**
 * Engineering unit conversions and precision formatters
 */

// 1 cfs = 0.028316846592 m3/s
export const CUSEC_TO_M3S_FACTOR = 0.028316846592;

export function cusecsToM3s(cusecs: number): number {
  return cusecs * CUSEC_TO_M3S_FACTOR;
}

export function m3sToCusecs(m3s: number): number {
  return m3s / CUSEC_TO_M3S_FACTOR;
}

/**
 * Formats a metric value with its justified engineering precision.
 * Returns "Not available" if value is null or undefined.
 */
export function formatMetricValue(
  value: number | null | undefined,
  metric: string,
  unit?: string
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Not available';
  }

  let formatted: string;

  switch (metric) {
    case 'sonar_range':
    case 'bed_elevation':
    case 'distance_to_water':
      formatted = value.toFixed(3); // Millimetre precision justified for acoustics/radars
      break;
    case 'stage_m':
    case 'water_level':
    case 'elevation':
      formatted = value.toFixed(2); // Centimetre precision for river stage
      break;
    case 'vibration_peak':
    case 'vibration_rms':
      formatted = value.toFixed(3); // 3 decimals for m/s²
      break;
    case 'tilt_transverse':
    case 'tilt_longitudinal':
    case 'tilt':
      formatted = (value >= 0 ? '+' : '') + value.toFixed(2); // Signed degrees
      break;
    case 'discharge_m3s':
    case 'discharge_cusecs':
    case 'river_discharge':
      formatted = Math.round(value).toLocaleString('en-IN');
      break;
    case 'rainfall_mm':
    case 'accumulation_mm':
      formatted = value.toFixed(1);
      break;
    case 'displacement_mm':
      formatted = (value >= 0 ? '+' : '') + value.toFixed(1);
      break;
    case 'battery_voltage':
      formatted = value.toFixed(1);
      break;
    case 'solar_current':
      formatted = value.toFixed(2);
      break;
    default:
      formatted = value.toString();
  }

  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Checks datum compatibility between two elevations.
 * Prohibits mathematical operations across mismatched or null datums.
 */
export function checkDatumCompatibility(
  datum1: string | null | undefined,
  datum2: string | null | undefined
): {
  isCompatible: boolean;
  message: string;
} {
  if (!datum1 || !datum2) {
    return {
      isCompatible: false,
      message: 'Elevation comparison suppressed: One or both vertical datums are unknown.',
    };
  }
  if (datum1.trim().toLowerCase() !== datum2.trim().toLowerCase()) {
    return {
      isCompatible: false,
      message: `Datum mismatch: Cannot directly compare '${datum1}' with '${datum2}'. Conversion requires surveyed offset.`,
    };
  }
  return {
    isCompatible: true,
    message: `Compatible vertical datum (${datum1}).`,
  };
}

/**
 * Coordinate formatter showing demo viewport disclaimer
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr} (Demo Viewport)`;
}
