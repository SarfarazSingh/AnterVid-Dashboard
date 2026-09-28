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

The system has **four primary tabs**, with Events, Reports, Data sources and Scenario simulation kept in drawers and modals:

1. **Bridge sensors**: Physical instrument telemetry (3 multi-angle scour sonars, scalar triaxial vibration and dual-axis tilt, KLEON gateway power, and interactive bridge elevation schematics).
2. **River intelligence**: Official Central Water Commission (CWC) gauge stage and discharge for Old Railway Bridge (ORB), upstream and downstream barrage release bulletins (Hathnikund, Wazirabad, ITO, Okhla), and NASA IMERG gridded rainfall.
3. **Ground and banks**: Multi-temporal satellite change analysis (Sentinel-2 L2A optical, Sentinel-1 radar backscatter, NISAR provisional L-band interferometry), interactive vector swipe map, surveyed transects with analyst review workflows, and line-of-sight (LOS) deformation monitoring.
4. **Analysis and decisions**: Combines the other three tabs into one recommended operating posture, with the evidence behind it, a checklist of actions, a timeline of what is coming, an append-only operator decision log, a shift handover brief, and the evidence gaps that new data sources would close.

---

## 2. Analysis and decisions

The rule engine in `src/utils/decisionEngine.ts` evaluates eleven factors against the controlled demo clock:

| Domain | Factors |
|---|---|
| Structure | Pier 11 bed scour (all sonar channels), vibration peak, transverse tilt |
| River loading | ORB stage, CWC forecast peak, Hathnikund release, upper-catchment rainfall |
| Ground and banks | Resolvable bank retreat within 1 km, approach embankment InSAR movement |
| Data confidence | Bridge telemetry freshness, river and weather feed health |

Each factor is **Normal**, **Watch**, **Warning** or **Unknown**. Unknown means the evidence is missing; it is never read as normal. The factors roll up into one of four postures:

| Posture | When |
|---|---|
| Normal operations | No structural, river or ground factor above normal |
| Heightened watch | Any factor at watch or unknown |
| Speed restriction review | Any structural or river warning, or unknown scour while the river is at watch |
| Traffic suspension review | ORB stage above the 205.33 m danger level, or structural and river warnings together |

Data-feed health lowers the confidence rating but never changes the posture by itself. Samast only recommends; restrictions are issued by the Section Engineer (Bridges). Operators record the posture they adopt, and an override needs a written rationale.

Thresholds in `THRESHOLDS` are demonstration values. Two are anchored to public practice: Delhi flood-control alerts are commonly raised when Hathnikund releases exceed 1 lakh cusecs, and IMD classes 64.5 mm or more in 24 hours as heavy rain. Structural limits must come from the approved Bridge 249 monitoring plan before operational use.

### Candidate data sources

`src/fixtures/candidateSources.ts` lists public feeds that are not connected yet. Each is shown under **Data sources → Candidate integrations** and against the evidence gap it would close:

| Source | What it would add |
|---|---|
| [CWC hourly water level (NWDP)](https://nwdp.nwic.gov.in/dataset/river-water-level-telemetry-hourly-central-water-commission-cwc) | Automated hourly ORB and upstream stage |
| [Delhi I&FC Flood Control Room](https://ifc.delhi.gov.in/) | Official Delhi reports and alert/evacuation thresholds |
| [GloFAS](https://global-flood.emergency.copernicus.eu/) | Ensemble discharge forecast when CWC is offline |
| [Copernicus GFM](https://portal.gfm.eodc.eu/) | Sentinel-1 flood extent through cloud |
| [Open-Meteo](https://open-meteo.com/en/docs) | Catchment rainfall forecast while IMD onboarding is pending |
| [DPCC water quality](https://www.dpcc.delhigovt.nic.in/) | Turbidity context for degraded sonar returns |
| [ISRO NDEM](https://ndem.nrsc.gov.in/) | Official flood inundation maps |
| [USGS / NCS earthquakes](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) | Post-earthquake inspection trigger |
| [Northern Railway](https://nr.indianrailways.gov.in/) train events | Separates train loading from structural vibration change |

---

## 3. Key Architecture & Engineering Principles

- **Four Primary Tabs**: `Bridge sensors`, `River intelligence`, `Ground and banks`, and `Analysis and decisions`. Utilities live in global drawers.
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

## 4. Running in the Cloud (GitHub Codespaces)

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

## 5. Running Locally

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

## 6. 15 Deterministic Operator Scenarios

The dashboard includes a dedicated **Scenario Switcher** (`Scenarios` button in header) to demonstrate edge cases and degraded states:

| Scenario ID | What changes | Recommended posture |
|---|---|---|
| `normal` | Sonar 02 at 0.34 m bed lowering (watch); ORB stage 204.28 m, forecast to cross 204.50 m tonight. | Heightened watch |
| `progressive_scour` | Sonar 02 range 8.78 m (0.37 m lowering); scour event escalated to warning. | Speed restriction review |
| `degraded_sonar` | Sonar 03 reports a weak acoustic return without asserting turbidity. | Heightened watch |
| `all_sonar_unavailable` | All sonar values null with missing quality; bed condition unknown. | Speed restriction review (low confidence) |
| `scalar_only_vibration` | Waveform and modal views gated for the scalar vibration device. | Heightened watch |
| `stale_telemetry` | Gateway packets 45 minutes old; bridge readings shown as stale. | Heightened watch (low confidence) |
| `comms_loss_backfill` | Gateway reconnects and backfills buffered packets with true timestamps. | Heightened watch |
| `river_warning` | ORB stage 204.68 m, above the 204.50 m warning level. | Speed restriction review |
| `forecast_outage` | CWC forecast returns HTTP 503; forecast factor unknown. | Heightened watch |
| `imd_auth_missing` | IMD API returns 401; rainfall falls back to NASA IMERG. | Heightened watch |
| `revised_barrage_release` | Hathnikund bulletin revised from 125,000 to 185,000 cusecs. | Heightened watch |
| `cloudy_satellite_scene` | 11 Sep Sentinel-2 scene is 79.4% cloud; 6 Sep is used as latest usable. | Heightened watch |
| `mismatched_stage_comparison` | Transect comparison dates differ by 1.85 m of river stage. | Heightened watch |
| `insar_low_coherence` | All InSAR points below coherence threshold; movement unknown. | Heightened watch |
| `provisional_nisar` | NISAR layer flagged provisional and not validated. | Heightened watch |

---

## 7. Project Structure

```text
AnterVid-Dashboard/
├── src/
│   ├── types/
│   │   └── domain.ts              # Canonical domain contracts (Asset, Sensor, Observation, Event, etc.)
│   ├── utils/
│   │   ├── dateUtils.ts           # IST timezone formatting, controlled clock, source freshness
│   │   ├── formatters.ts          # Metric units, datum checks, precision, discharge conversion
│   │   ├── decisionEngine.ts      # Factor rules, posture roll-up, actions, outlook, evidence gaps
│   │   └── exportUtils.ts         # CSV exports and the shift handover brief
│   ├── fixtures/
│   │   ├── baselineData.ts        # BR-249 assets, sensors, stations, bulletins, scenes, layers
│   │   ├── candidateSources.ts    # Public feeds that are not connected yet
│   │   └── scenariosData.ts       # Definitions for 15 deterministic operator scenarios
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
│   │   ├── analysis/              # AnalysisDecisionsTab, PostureBanner, FactorMatrix, ActionChecklist, OutlookTimeline, DecisionPanel, EvidenceGaps
│   │   ├── events/, sources/, reports/, scenarios/  # Drawers and modals
│   ├── tests/
│   │   ├── contract.test.ts       # Contract tests (nulls, IST, freshness, datum, gating, audit)
│   │   └── decisionEngine.test.ts # Posture rules, unknown handling, outlook windows, decision log
│   ├── App.tsx                    # Root application component
│   └── index.css                  # Console styling, layered so Tailwind utilities still apply
├── index.html                     # HTML5 shell
├── package.json                   # Dependencies and scripts
└── vite.config.ts                 # Bundler configuration
```

---

## 8. Remaining Inputs for Full Hardware/Data Integration

As documented in the research specification, transition from this prototype to live production requires:
1. **Manufacturer Telemetry Feed**: Signed MQTT broker endpoint or REST export contract with live schema mappings for Samasth.
2. **Surveyed Asset Register**: High-precision UTM 43N coordinates and mounting benchmarks for Bridge 249 piers and abutments.
3. **Vertical Datum Benchmarks**: Official reference datum (e.g. GTS MSL) tying CWC ORB gauge elevation directly to local bed elevation.
4. **Authorized CWC & Barrage Feeds**: Production access credentials for automated flood forecasting telemetry.
5. **IMD API Credentials**: Authorized API key for `/api/v1/basinqpf` and automated weather stations.
6. **Copernicus & NASA Pipelines**: Server-side processing pipelines (MintPy InSAR, DSAS transect extraction) for Sentinel and NISAR imagery.

---

## License

Confidential and Proprietary. Prepared for **AnterVid**.
