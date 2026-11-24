# BioSync: Your Body. Your Patterns. Your Intelligence.
### AI-Powered Personal Digital Health Twin for Android (React Native & Expo)

BioSync is a futuristic, AI-driven Personal Digital Health Twin designed to decode the relationships between sleep, physical activity, and resting cardiac metrics. Rather than presenting generic medical scores or disconnected numbers, BioSync demonstrates **Personal Baseline Intelligence**—comparing live physiological data against individual moving historical baselines, isolating acute multi-metric deviations, and providing explainable, non-medical lifestyle guidance.

---

## 🌟 Hackathon Highlights & Core Innovations

1. **Personal Digital Health Twin (Not a Generic Tracker)**:
   - Centered around an interactive futuristic humanoid biometric visualizer with glowing holographic orbital rings, neural channels, cardiac nodes, and floating HUD badges.
   - Grounded in an individual moving baseline (7, 14, or 30 days) rather than arbitrary universal thresholds.

2. **Mathematical Baseline Intelligence Engine**:
   - Zero fabricated medical claims.
   - Deterministic rolling-window deviation algorithms:
     $$\text{Deviation}_{\text{metric}} = \text{Current}_{\text{metric}} - \overline{\text{Baseline}}_{\text{metric}}$$
   - Non-causal multi-metric pattern recognition (e.g. concurrent sleep reduction + step decline + resting HR surge representing physiological strain).

3. **Traceable AI Wellness Assistant**:
   - Chat interface with one-tap suggested questions (*"How has my sleep changed this week?"*, *"What changed compared with my normal routine?"*).
   - Evidence-grounded responses citing verified data points.
   - Serverless Edge Function gateway ensuring **zero API key leakage** to client bundles.

4. **Multi-Source Data Ingestion**:
   - **Manual Logging Form**: Verified daily entry with instant validation and baseline recalculation.
   - **CSV Bulk Importer**: Robust schema verification, duplicate row detection, error reporting, and sample data generator.
   - **Android Health Connect**: Simulated native sync bridge with realistic permission declarations (`READ_SLEEP`, `READ_STEPS`, `READ_HEART_RATE`).

5. **Complete Cyber-Futuristic Design System**:
   - Background: `#080D1B` & `#0D1425`
   - Cards: `#111A2E` & `#17233A`
   - Accents: Electric Cyan (`#35D6F2`), AI Violet (`#8B72FF`), Success Green (`#37D6A0`), Warning Amber (`#FFB85C`), Alert Crimson (`#FF647C`)
   - 5-tab persistent bottom navigation bar with active cyan indicators.

---

## 📱 Application Screens

| Screen | Description |
| :--- | :--- |
| **1. Onboarding** | *"Know Thyself"* intro, animated holographic silhouette, zero-login **Explore Demo Mode** & profile setup. |
| **2. Home Dashboard** | Executive wellness overview, Live Twin card, 4 metric cards (Sleep, Steps, HR, Exercise), 7-day activity bar chart, top AI insight card & quick actions. |
| **3. My Digital Twin** | Full-scale holographic avatar, personal wellness profile, 3 baseline deep-dive comparison cards, and 7D/14D/30D SVG trend charts. |
| **4. AI Insights** | Automated daily synthesis, detected pattern cards with evidence badges, grounded AI chat interface, and contextual non-medical nudges. |
| **5. My Data** | Data source cards, validated manual entry form, bulk CSV file importer, Health Connect status card, and searchable historical data table with deletion controls. |
| **6. Profile & Privacy** | User settings, baseline window selector (7D / 14D / 30D), CSV data export, hackathon demo reset, and privacy architecture disclosures. |

---

## 🛠️ Project Structure

```
BioSync/
├── app/                        # Expo Router file-based routes
│   ├── _layout.tsx             # Root layout with ThemeProvider, SafeAreas & Stack
│   ├── index.tsx               # Entry router (checks onboarding state)
│   ├── onboarding.tsx          # Screen 1: Futuristic Onboarding
│   └── (tabs)/                 # 5-Tab Persistent Navigation
│       ├── _layout.tsx         # Bottom tab bar styling with active cyan glow
│       ├── index.tsx           # Screen 2: Home Dashboard
│       ├── twin.tsx            # Screen 3: My Digital Twin
│       ├── insights.tsx        # Screen 4: AI Insights & Assistant
│       ├── data.tsx            # Screen 5: My Data & CSV Importer
│       └── profile.tsx         # Screen 6: Profile & Privacy Controls
├── components/                 # Reusable, modular UI components
│   ├── DigitalTwinVisualizer.tsx # Holographic human silhouette with biometric nodes
│   ├── MetricCard.tsx          # Metric cards with baseline, delta, and sparkline
│   ├── ActivityBarChart.tsx    # 7-day interactive step volume bar chart
│   ├── TrendChart.tsx          # 7D / 14D / 30D smooth SVG trend curves
│   ├── InsightCard.tsx         # Explainable AI pattern card with evidence grounding
│   ├── ChatInterface.tsx       # AI Wellness chat with suggested prompt chips
│   ├── ManualEntryForm.tsx     # Validated daily metric input form
│   ├── CsvImporter.tsx         # CSV file picker, parser, validator & preview table
│   └── HealthConnectCard.tsx   # Android Health Connect connection bridge
├── context/
│   └── HealthContext.tsx       # Reactive central store for metrics & baselines
├── services/
│   ├── baselineEngine.ts       # Mathematical baseline & pattern detection engine
│   ├── aiService.ts            # Grounded AI service with deterministic fallback
│   ├── storageService.ts       # AsyncStorage persistence & demo seed loader
│   ├── csvService.ts           # CSV parse, validate, and export utilities
│   └── mockData.ts             # 30-day realistic baseline dataset for Alex
├── constants/
│   ├── theme.ts                # Design tokens (Colors, Typography, Spacing)
│   └── thresholds.ts           # Configurable physiological deviation thresholds
├── supabase/
│   ├── schema.sql              # Supabase PostgreSQL schema with Row Level Security (RLS)
│   └── edge-function.ts        # Secure Edge Function gateway for LLM inference
├── assets/                     # Icons, splash screen, and sample CSV file
├── app.json                    # Expo Android permissions & package config
└── package.json
```

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### 1. Start the Expo Development Server
```bash
cd BioSync
npm start
```

### 2. Run on Android Device / Emulator
```bash
# Open in Android Emulator or connected physical device via USB
npm run android

# Or scan the QR code using the Expo Go app on your Android phone!
```

### 3. Run Web / Laptop Preview
```bash
npm run web
```

---

## 🧪 Testing the Alex Persona (Hackathon Scenario)

1. Open the app and tap **Explore Demo Mode** on the Onboarding screen.
2. Observe Alex's acute baseline deviation on the Home Dashboard:
   - **Sleep**: 5.5 hrs *(Baseline: 7.5 hrs, Change: -2.0 hrs)*
   - **Steps**: 4,000 *(Baseline: 7,000, Change: -3,000)*
   - **Resting HR**: 76 BPM *(Baseline: 68 BPM, Change: +8 BPM)*
3. Notice the **BioSync Intelligence** card: It identifies the *Simultaneous Lifestyle & Biometric Shift* without assuming causal illness.
4. Navigate to **Insights** > **AI Wellness Assistant** and tap *"How has my sleep changed this week?"* to inspect grounded evidence.
5. In **My Data**, upload or paste `assets/sample_health_data.csv` to verify bulk ingestion, duplicate detection, and immediate baseline recalibration.
6. In **Profile & Privacy**, switch moving window between 7, 14, and 30 days to observe dynamic trend responsiveness.

---

## 🔒 Security & Privacy Architecture

- **No API Keys in Client**: Mobile application bundles never contain Gemini or OpenAI API keys. In production, calls pass through the provided Supabase Edge Function (`supabase/edge-function.ts`).
- **PostgreSQL Row Level Security (RLS)**: Enforces strict data tenancy (`auth.uid() = user_id`) on all metric and baseline tables.
- **Offline-First & Local Persistence**: Data persists in encrypted AsyncStorage; zero registration required for local demo exploration.
- **Non-Diagnostic Medical Disclaimer**: BioSync displays clear disclaimers that it is a lifestyle pattern tracker and never a diagnostic device.
