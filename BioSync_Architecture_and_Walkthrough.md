# BioSync: Personal Digital Health Twin
## Master Architecture & Visual Walkthrough

> **Tagline**: *Your Body. Your Patterns. Your Intelligence.*  
> **Product Category**: Personal Health Intelligence · Digital Health Twin · Lifestyle Analytics  
> **Target Persona**: Alex, 22-year-old college student navigating sleep debt, exam stress, and reduced activity.

---

## 1. Visual Verification & Screen Gallery

````carousel
![Screen 1: Onboarding](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/onboarding.png)
<!-- slide -->
![Screen 2: Home Dashboard](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/dashboard.png)
<!-- slide -->
![Screen 3: 3D Muscular Twin](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/avatar_3d_main.png)
<!-- slide -->
![Screen 3b: Split Recovery - Leg Day](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/avatar_3d_leg_day.png)
<!-- slide -->
![Screen 3c: Split Recovery - Chest & Arms](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/avatar_3d_chest_day.png)
<!-- slide -->
![Screen 3d: Split Recovery - Full Recovery](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/avatar_3d_full_recovery.png)
<!-- slide -->
![Hotspot A: Neural Recovery Card](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/avatar_zone_neural.png)
<!-- slide -->
![Hotspot B: Cardiovascular Core Card](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/avatar_zone_heart.png)
<!-- slide -->
![Hotspot C: Upper Body & Core Card](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/avatar_zone_upper_body.png)
<!-- slide -->
![Hotspot D: Lower Body & Mobility Card](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/avatar_zone_mobility.png)
<!-- slide -->
![Screen 4: Detected Patterns](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/insights.png)
<!-- slide -->
![Screen 4: AI Wellness Assistant](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/ai_assistant.png)
<!-- slide -->
![Screen 5: My Data & CSV Hub](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/data_sources.png)
<!-- slide -->
![Screen 6: Profile & Governance](/C:/Users/ADMIN/.gemini/antigravity/brain/9e4fc6f5-79d7-49c0-9f5f-30141be4e732/screenshots/profile.png)
````

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Ingestion [Data Ingestion Layer]
        M[Manual Form Entry]
        C[Bulk CSV Parser]
        H[Health Connect Bridge]
    end

    subgraph State [Reactive State & Storage]
        S[(AsyncStorage Local DB)]
        CTX[HealthContext Provider]
    end

    subgraph Engine [Baseline Intelligence Engine]
        VAL[ physiological Validator]
        WIN[Moving Window Filter (7D/14D/30D)]
        BASE[Historical Baseline Calculator]
        DEV[Acute Deviation Engine]
        PAT[Non-Causal Multi-Metric Correlator]
    end

    subgraph UI [Futuristic 5-Tab Interface]
        Tab1[Home Dashboard]
        Tab2[My Digital Twin]
        Tab3[Insights & Chat]
        Tab4[My Data Hub]
        Tab5[Profile & Privacy]
    end

    subgraph AI [Grounded AI Reasoning]
        EDGE[Supabase Edge Gateway]
        GEMINI[Gemini 1.5 Flash]
        DET[Deterministic Traceable Model]
    end

    M --> VAL
    C --> VAL
    H --> VAL
    VAL --> S
    S <--> CTX
    CTX --> WIN
    WIN --> BASE
    BASE --> DEV
    DEV --> PAT

    PAT --> Tab1
    PAT --> Tab2
    PAT --> Tab3

    Tab3 <--> EDGE
    EDGE <--> GEMINI
    EDGE -. Fallback .-> DET
```

---

## 3. Mathematical Baseline Intelligence Engine

BioSync does not use universal, arbitrary health thresholds. It benchmarks every metric strictly against the individual's own historical moving baseline.

$$\overline{\text{Baseline}}_{\text{metric}} = \frac{1}{N}\sum_{i=1}^{N} \text{Record}_{i}$$

$$\Delta_{\text{abs}} = \text{Current} - \overline{\text{Baseline}}$$

$$\Delta_{\%} = \left(\frac{\Delta_{\text{abs}}}{\overline{\text{Baseline}}}\right) \times 100$$

### Verified Persona Scenario (Alex, 22 - College Student)
- **Sleep Duration**: `5.5 hrs` vs Personal Average `6.5-7.5 hrs` $\rightarrow$ **Deviation: $-1.0\text{ to } -2.0\text{ hrs}$**
- **Daily Steps**: `4,000` vs Personal Average `5,776-7,000 steps` $\rightarrow$ **Deviation: $-1,776\text{ to } -3,000\text{ steps}$**
- **Resting Heart Rate**: `76 BPM` vs Personal Average `68-70 BPM` $\rightarrow$ **Deviation: $+6\text{ to } +8\text{ BPM}$**

### Multi-Metric Pattern Detection (`multi_metric_strain`)
When reduced sleep coincides with suppressed physical movement and elevated resting heart rate, BioSync surfaces the **"Simultaneous Lifestyle & Biometric Shift"** card with evidence grounding tags, warning severity, and non-medical restorative recommendations.

---

## 4. Interactive 3D Sculpted Muscular Avatar

BioSync transforms raw numerical health data into an intuitive, touch-interactive 3D-style anatomical avatar (`components/DigitalHumanVisual.tsx`).

### Anatomical Rendering Engine
- **Volumetric 3D Shading**: Layered `react-native-svg` paths rendered with multi-stop radial and linear lighting gradients (`#35D6F2` primary, `#8B72FF` secondary, `#17233A` shadow depth) to give muscular volume to the head/cranium, deltoids, pectorals, rectus abdominis, quadriceps, and calves.
- **Constellation Wireframe Filaments**: Dynamic connecting geometric nodes and vectors echoing clinical holographic monitors.
- **Cardiac Pulse Synchronization**: Rhythmic scaling heart node over the left chest synchronized to the current resting heart rate (76 BPM).
- **Subtle Respiration Cycle**: Smooth idle breathing expansion driven by `Animated.loop` / `react-native-reanimated`.

### Dynamic Day-Split Recovery Telemetry
The horizontal day selector allows the user to inspect localized muscle load across their weekly schedule:
- **Mon: Leg Day**: Quadriceps and calves highlight in high-strain red (`#FF647C`), upper body recovered (`#37D6A0`), `42% RECOVERED`.
- **Tue: Chest & Arms**: Pectorals, deltoids, and arms highlight in high-strain red (`#FF647C`), `48% RECOVERED`.
- **Wed: Shoulder Day**: Anterior and lateral deltoids show moderate load in amber (`#FFB85C`), `65% RECOVERED`.
- **Thu: Full Recovery**: Entire muscular system transitions to calm green/cyan (`#37D6A0`), `94% RECOVERED`.
- **Fri: Back & Core**: Latissimus and core highlight in strain colors, `52% RECOVERED`.

### 4 Interactive Clickable Hotspots & Animated Telemetry Cards
1. **Head Zone (`NEURAL` Badge)**:
   - **Visual Reaction**: Cyan-to-violet cranial pulse animation ring.
   - **Telemetry Card**: Sleep Duration vs Baseline (`5.5 hrs` vs `6.5 hrs`, `-1.0 hr`), Deep Sleep volume (`1.1 hrs`, 20% restorative ratio), Cognitive Stress & Focus Load ("Peak Alertness Window: 10:00 AM – 1:00 PM"), and context-aware sleep hygiene nudge.
2. **Chest / Heart Core (`76 BPM` Badge)**:
   - **Visual Reaction**: Cardiac throb + expanding glow halo.
   - **Telemetry Card**: Resting Heart Rate vs Baseline (`76 BPM` vs `70 BPM`, `+6 BPM`), Cardio Efficiency Index, Autonomic Sympathetic Tone evaluation ("Heightened stress response"), and diaphragmatic breathing nudge.
3. **Upper Body Core (`CORE LOAD` Badge)**:
   - **Visual Reaction**: Torso muscle group illumination highlight.
   - **Telemetry Card**: Active Split name & strain index, Exercise Duration (`25 min/day` vs `28 min` baseline), DOMS & Muscle Recovery estimate (68% localized fatigue), and post-exercise recovery nudge.
4. **Lower Body Zone (`4,000 steps` Badge)**:
   - **Visual Reaction**: Quadriceps and calf vector highlight ring.
   - **Telemetry Card**: Step Count vs Baseline (`4,000` vs `5,776`, `-1,776 steps`), Sedentary Duration (`4.2 hrs`), Lower Body Mobility Index ("Quadriceps and hip flexors show tightening"), and active movement nudge.

---

## 5. Complete Codebase References

- **Project Root**: [C:/Users/ADMIN/.gemini/antigravity/scratch/BioSync](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/BioSync)
- **Documentation**: [README.md](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/BioSync/README.md)
- **Design Tokens**: [constants/theme.ts](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/BioSync/constants/theme.ts)
- **Baseline Engine**: [services/baselineEngine.ts](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/BioSync/services/baselineEngine.ts)
- **AI Service**: [services/aiService.ts](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/BioSync/services/aiService.ts)
- **Digital Twin Visualizer**: [components/DigitalTwinVisualizer.tsx](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/BioSync/components/DigitalTwinVisualizer.tsx)
- **Database Schema**: [supabase/schema.sql](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/BioSync/supabase/schema.sql)
- **Edge Function**: [supabase/edge-function.ts](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/BioSync/supabase/edge-function.ts)
