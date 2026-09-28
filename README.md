# Samast — Bridge, River and Ground Intelligence

> **Operator Dashboard for Bridge 249 on the Yamuna in Delhi**  
> Developed for **AnterVid** | Controlled Prototype Release

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-729B1B?logo=vitest&logoColor=white)](https://vitest.dev/)

---

## 1. Overview

**Samast** is an operator monitoring and diagnostic console engineered for railway bridge health, river hydrology, and surrounding ground movement. This frontend prototype is tailored for **Bridge 249** across the Yamuna River in Delhi.

The system is architected around **three primary analytical tabs**, keeping auxiliary functions (Events, Reports, Data sources, and Scenario simulation) in dedicated operator drawers and modals:

1. **Bridge sensors**: Physical instrument telemetry (3 multi-angle scour sonars, scalar triaxial vibration and dual-axis tilt, KLEON gateway power, and interactive bridge elevation schematics).
2. **River intelligence**: Official Central Water Commission (CWC) gauge stages and forecasts for Old Railway Bridge (ORB), independent local river radar, upstream barrage release bulletins (Hathnikund, Wazirabad, Okhla), and NASA IMERG gridded rainfall.
3. **Ground and banks**: Multi-temporal satellite change analysis (Sentinel-2 L2A optical, Sentinel-1 radar backscatter, NISAR provisional L-band interferometry), interactive vector swipe map, surveyed transects with analyst review workflows, and line-of-sight (LOS) deformation monitoring.

---

## 2. Key Architecture & Engineering Principles

- **Three Primary Tabs Only**: Navigation is strictly organized into `Bridge sensors`, `River intelligence`, and `Ground and banks`. Utilities exist in global drawers.
- **Controlled Demo Clock**: Fixed at **12 September 2026, 14:35:00 IST (09:05:00 UTC)**. All relative ages, stale thresholds, and observation timestamps are deterministically evaluated against this reference.
- **Repository Pattern Boundary**: UI components interact exclusively with `Repository.ts` via `MockRepository.ts` (with realistic simulated latencies and state mutation). An `HttpRepository.ts` mapping the internal Section 14.4 REST endpoints is provided for production backend integration.
- **Data Semantics & Integrity**:
  - `null` represents *unavailable* data and is displayed as `"Not available"` — never falsely masked as `0`.
  - Chart gaps are explicitly preserved with discontinuous rendering — missing intervals are never interpolated.
  - Scalar vibration (peak/RMS) cannot produce modal spectra; raw waveform and FFT views are strictly capability-gated.
  - River stage differences > 0.25 m trigger a prominent *"Waterline comparison may reflect stage change"* warning on bank transects to prevent confounding water levels with physical erosion.
  - Elevation comparisons strictly require matching, verified vertical datums.
  - Idempotent event acknowledgement: acknowledging an alert records an immutable operator audit record without altering the underlying physical condition.

---

## 3. Running in the Cloud (GitHub Codespaces)

You can launch this entire dashboard in the cloud with zero local software dependencies:

1. Navigate to the repository: [https://github.com/SarfarazSingh/AnterVid-Dashboard](https://github.com/SarfarazSingh/AnterVid-Dashboard)
2. Click **Code** > **Codespaces** > **Create codespace on main**.
3. Once the cloud terminal opens, run:
   ```bash
   npm install
   npm run dev
   ```
4. Click the forwarded port notification or open `http://localhost:5173` to interact with the dashboard.

---

## 4. Running Locally

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)

### Setup & Launch
```bash
# Clone the repository
git clone https://github.com/SarfarazSingh/AnterVid-Dashboard.git
cd AnterVid-Dashboard

# Install dependencies
npm install

# Start Vite dev server with Hot Module Replacement
npm run dev

# Run contract test suite
npm run test

# Build production bundle
npm run build
```

---

## 5. 16 Deterministic Operator Scenarios

The dashboard includes a dedicated **Scenario Switcher** (`Scenarios` button in header) to demonstrate edge cases and degraded states:

| Scenario ID | Name | Description |
|---|---|---|
| `normal` | Normal Baseline Operation | All instruments nominal, river stage 203.45 m, good quality across feeds. |
| `progressive_scour` | Progressive Sonar Scour (Pier 11) | Sonar 02 drops to 8.42 m (+0.72 m bed change), triggering a Warning event. |
| `degraded_sonar` | Degraded Acoustic Return | Sonar 01 reports weak acoustic return without claiming turbidity cause. |
| `all_sonar_unavailable` | All Sonar Unavailable | Power brownout on acoustic array; values null with retained last valid history. |
| `scalar_vibration_only` | Scalar-Only Vibration Device | Gated waveform/modal views with explanatory capability badges. |
| `optional_uncommissioned` | River Radar Uncommissioned | Local river radar pending field commissioning. |
| `stale_telemetry` | Stale Sensor Telemetry | Telemetry gateway delay > 45 minutes; displays stale age badge. |
| `comms_loss_backfill` | Communications Loss & Backfill | Network disconnect followed by timestamped packet backfilling. |
| `river_warning` | Official River Warning Context | CWC ORB stage rises to 204.62 m exceeding Warning Level (204.50 m). |
| `forecast_outage` | CWC Forecast Feed Outage | Forecast series suppressed; last valid bulletin remains visible. |
| `imd_not_configured` | IMD Access Not Configured | Returns HTTP 401 simulator with administrator onboarding fallback notice. |
| `revised_barrage_release` | Revised Barrage Release | Hathnikund bulletin revised from 120,000 cfs to 185,000 cfs with superseded log. |
| `cloudy_latest_scene` | Cloudy Latest Satellite Scene | Scene selector automatically defaults to "Latest Usable" (27% cloud) over 83% cloud. |
| `mismatched_stages` | Mismatched Stage Waterline Warning | Flags +0.85 m stage difference across comparison dates. |
| `insar_low_coherence` | Insufficient InSAR Coherence | Masked urban/water pixels flagged as "Insufficient coherent observations". |
| `nisar_provisional` | NISAR Provisional L-Band Release | Displays provisional data maturity tags with review gates. |

---

## 6. Project Structure

```text
AnterVid-Dashboard/
├── src/
│   ├── types/
│   │   └── domain.ts              # Canonical domain contracts (Asset, Sensor, Observation, Event, etc.)
│   ├── utils/
│   │   ├── dateUtils.ts           # IST timezone formatting, controlled clock, source freshness
│   │   ├── formatters.ts          # Metric units, datum checks, precision, discharge conversion
│   │   └── exportUtils.ts         # Real CSV generator with mandatory synthetic demo watermark
│   ├── fixtures/
│   │   ├── baselineData.ts        # BR-249 assets, sensors, stations, bulletins, scenes, layers
│   │   └── scenariosData.ts       # Definitions for 16 deterministic operator scenarios
│   ├── repositories/
│   │   ├── Repository.ts          # Core async repository interface
│   │   ├── MockRepository.ts      # Deterministic in-memory repository with idempotent actions
│   │   └── HttpRepository.ts      # Future Section 14.4 REST backend adapter
│   ├── context/
│   │   └── AppContext.tsx         # Global reactive store for tabs, scenarios, drawers, and selections
│   ├── components/
│   │   ├── shell/                 # Header, ContextStrip, NavigationTabs
│   │   ├── shared/                # MetricCard, QualityBadge, FreshnessLabel, ProvenanceDrawer
│   │   ├── bridge/                # BridgeSensorsTab, BridgeSchematic, SensorTable, SensorTrendChart, SensorInspector
│   │   ├── river/                 # RiverIntelligenceTab, RiverNetworkSchematic, RiverStageChart, BarrageReleaseTable
│   │   ├── ground/                # GroundAndBanksTab, GroundComparisonMap, LayerControl, TransectInspector, InSARInspector
│   │   └── drawers/               # EventDrawer, DataSourcesModal, ReportsModal, ScenarioSwitcherModal
│   ├── tests/
│   │   └── contract.test.ts       # 10 rigorous contract tests (nulls, IST, freshness, datum, gating, audit)
│   ├── App.tsx                    # Root application component
│   └── index.css                  # Restrained operations console styling with WCAG 2.2 AA compliance
├── index.html                     # HTML5 shell
├── package.json                   # Dependencies and scripts
└── vite.config.ts                 # Bundler configuration
```

---

## 7. Remaining Inputs for Full Hardware/Data Integration

As documented in the research specification, transition from this prototype to live production requires:
1. **Manufacturer Telemetry Feed**: Signed MQTT broker endpoint or REST export contract with live schema mappings for Samasth.
2. **Surveyed Asset Register**: High-precision UTM 43N coordinates and mounting benchmarks for Bridge 249 piers, abutments, and local river radar.
3. **Vertical Datum Benchmarks**: Official reference datum (e.g. GTS MSL) tying CWC ORB gauge elevation directly to local bed elevation.
4. **Authorized CWC & Barrage Feeds**: Production access credentials for automated flood forecasting telemetry.
5. **IMD API Credentials**: Authorized API key for `/api/v1/basinqpf` and automated weather stations.
6. **Copernicus & NASA Pipelines**: Server-side processing pipelines (MintPy InSAR, DSAS transect extraction) for Sentinel and NISAR imagery.

---

## License

Confidential and Proprietary. Prepared for **AnterVid**.
