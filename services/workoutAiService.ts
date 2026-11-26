// ==============================================================================
// BioSync Workout AI Coaching & Biomechanical Guidance Service
// Server-side Gemini API (@google/genai) integration with deterministic fallback
// ==============================================================================

import { Platform } from 'react-native';

export interface CoachResponseSchema {
  cardTitle: string; // e.g., "FORM GUIDANCE", "RECOVERY & READINESS", "EXERCISE ALTERNATIVES", "PROGRESSION PLAN"
  summary: string;   // 2-3 crisp, tailored sentences directly answering the question
  cuesTitle: string; // e.g., "KEY BIOMECHANICAL CUES", "RECOMMENDED SWAPS", "READINESS ACTION PLAN"
  bulletCues: string[]; // 3 actionable, specific bullet points
  suggestedExerciseId?: string;
}

export interface CoachUserContext {
  myTwin: {
    restingHeartRate: number;
    restingHeartRateBaseline: number;
    sleepHours: number;
    sleepHoursBaseline: number;
    fitnessLevel: string;
    injuryHistory: string;
  };
  myData: {
    activeSplit: string;
    recoveryPercentage: number;
    recentLogs: {
      routine: string;
      date: string;
      totalVolumeKg: number;
      exercises: string[];
    }[];
  };
}

export class WorkoutAiService {
  /**
   * Determine the API endpoint URL depending on platform & runtime environment
   */
  private static getApiUrl(): string {
    if (Platform.OS === 'web') {
      // In web browser, use relative path if on same host, or fallback to current origin
      if (typeof window !== 'undefined' && window.location) {
        return `${window.location.origin}/api/coach`;
      }
      return '/api/coach';
    }
    // Android emulator localhost alias or default server
    return 'http://10.0.2.2:8085/api/coach';
  }

  /**
   * Check if backend has Gemini API key connected
   */
  static async checkApiStatus(): Promise<{ connected: boolean; hasKey: boolean }> {
    try {
      const baseUrl = Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/api/status`
        : 'http://10.0.2.2:8085/api/status';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(baseUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        return { connected: true, hasKey: Boolean(json.hasGeminiKey) };
      }
      return { connected: false, hasKey: false };
    } catch {
      return { connected: false, hasKey: false };
    }
  }

  /**
   * Primary entry point: Request structured coaching advice via server-side Gemini API
   * with guaranteed deterministic fallback adhering to strict prompt guidelines.
   */
  static async fetchCoachingAdvice(
    query: string,
    userContext: CoachUserContext
  ): Promise<{ response: CoachResponseSchema; source: 'gemini-live' | 'biomechanics-engine'; error?: string }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        response: this.getDeterministicFallback(
          'My resting HR is 76 BPM and sleep was 5.5h. Should I lift heavy today?',
          userContext
        ),
        source: 'biomechanics-engine',
      };
    }

    try {
      const apiUrl = this.getApiUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for LLM

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmed,
          userContext,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json: CoachResponseSchema = await response.json();
        if (json.cardTitle && json.summary && json.cuesTitle && Array.isArray(json.bulletCues)) {
          // Check for exercise suggestions based on query
          const exerciseId = this.findSuggestedExerciseId(trimmed);
          return {
            response: {
              ...json,
              suggestedExerciseId: exerciseId,
            },
            source: 'gemini-live',
          };
        }
      }

      // If server returned error response (e.g. key missing)
      const errText = await response.text();
      let parsedError = 'API returned status ' + response.status;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) parsedError = parsed.error;
      } catch {
        // use fallback string
      }

      console.warn('[WorkoutAiService] API returned error, falling back:', parsedError);
      return {
        response: this.getDeterministicFallback(trimmed, userContext),
        source: 'biomechanics-engine',
        error: parsedError,
      };
    } catch (networkErr: any) {
      console.warn('[WorkoutAiService] Live call failed, using deterministic engine:', networkErr.message);
      return {
        response: this.getDeterministicFallback(trimmed, userContext),
        source: 'biomechanics-engine',
        error: networkErr.message,
      };
    }
  }

  /**
   * Deterministic Biomechanics & Strength Engine
   * Strictly adheres to user prompt guidelines:
   * 1. No generic filler phrases ("for optimal hypertrophy and recovery", "throughout all lifts")
   * 2. Directly reference specific exercise, joint, constraint, or biometric metric in 1st sentence
   * 3. Four card types: FORM_GUIDANCE, EXERCISE_SUBSTITUTION, RECOVERY_READINESS, PROGRESSION_PLAN
   * 4. Exact joint angles, hand/foot placement, scapular/spinal alignment for FORM_GUIDANCE
   * 5. Compare stated metrics against baseline for RECOVERY_READINESS
   */
  static getDeterministicFallback(
    query: string,
    userContext: CoachUserContext
  ): CoachResponseSchema {
    const q = query.toLowerCase();
    const rhr = userContext?.myTwin?.restingHeartRate ?? 76;
    const rhrBase = userContext?.myTwin?.restingHeartRateBaseline ?? 70;
    const sleep = userContext?.myTwin?.sleepHours ?? 5.5;
    const sleepBase = userContext?.myTwin?.sleepHoursBaseline ?? 7.5;
    const hrDelta = rhr - rhrBase;
    const sleepDelta = +(sleep - sleepBase).toFixed(1);

    // 1. Lower back / Bent Over Row / Scapula
    if (q.includes('lower back') || q.includes('row') || q.includes('lumbar') || q.includes('spine')) {
      return {
        cardTitle: 'FORM GUIDANCE',
        summary:
          'During bent-over barbell rows, your lumbar spine experiences peak shear force when the trunk angle drops below 45 degrees without transverse abdominal bracing. Switch to a 30-degree chest-supported dumbbell row to eliminate lumbar spinal loading while isolating the latissimus dorsi and rhomboids.',
        cuesTitle: 'KEY BIOMECHANICAL CUES',
        bulletCues: [
          'Incline bench to 30 degrees and press sternum firmly into the pad to remove all compressive L4-L5 forces.',
          'Position feet shoulder-width with knees bent 20 degrees, driving pull from elbows toward hip crest at a 70-degree arc.',
          'Retract and depress scapulae at peak contraction with a 1-second pause without cervical neck hyperextension.',
        ],
        suggestedExerciseId: 'ex-chest-supported-row',
      };
    }

    // 2. Apartment / Noise / Quiet Substitutions
    if (
      q.includes('apartment') ||
      q.includes('quiet') ||
      q.includes('substitute') ||
      q.includes('home') ||
      q.includes('noise') ||
      q.includes('floor')
    ) {
      return {
        cardTitle: 'EXERCISE SUBSTITUTION',
        summary:
          'In an apartment environment, high-velocity jumping and heavy barbell drops create unwanted acoustic resonance and floor vibrations. Substitute with high-tension isometric doorway rows, 3-1-1 tempo push-ups, and contralateral deadbugs for zero floor impact with high mechanical tension.',
        cuesTitle: 'RECOMMENDED SWAPS',
        bulletCues: [
          'Grip doorframe edges with heels placed 18 inches forward at a 45-degree body lean for silent horizontal lat pulling.',
          'Execute push-ups using a 3-second eccentric lower and 1-second chest pause, placing hands at a 45-degree angle to ribcage.',
          'Perform contralateral deadbugs on a mat, pressing your lumbar spine flat against the floor while alternating limbs.',
        ],
        suggestedExerciseId: 'ex-doorway-row',
      };
    }

    // 3. Recovery / Resting Heart Rate / Sleep Debt / Fatigue
    if (
      q.includes('resting hr') ||
      q.includes('sleep') ||
      q.includes('heavy') ||
      q.includes('tired') ||
      q.includes('fatigue') ||
      q.includes('recovery') ||
      q.includes('ready')
    ) {
      const hrSign = hrDelta >= 0 ? `+${hrDelta}` : `${hrDelta}`;
      const sleepSign = sleepDelta >= 0 ? `+${sleepDelta}` : `${sleepDelta}`;

      return {
        cardTitle: 'RECOVERY_READINESS',
        summary:
          `Your resting heart rate is currently ${rhr} BPM (${hrSign} BPM versus your ${rhrBase} BPM baseline) and your sleep duration was ${sleep} hrs (${sleepSign} hrs versus your ${sleepBase} hrs baseline). This elevated cardiovascular baseline indicates elevated sympathetic nervous system strain and incomplete musculoskeletal recovery today.`,
        cuesTitle: 'READINESS ACTION PLAN',
        bulletCues: [
          `Cap workout intensity strictly at RPE 6-7, keeping a minimum of 3 to 4 repetitions in reserve on all compound exercises.`,
          `Avoid heavy axial spinal compression (barbell back squats or overhead barbell presses) until resting heart rate returns within 3 BPM of baseline.`,
          `Extend inter-set rest intervals to 120-150 seconds to prevent anaerobic lactate accumulation and autonomic tachycardia.`,
        ],
        suggestedExerciseId: 'ex-bird-dog',
      };
    }

    // 4. Progression / Progressive Overload / Sets / Reps
    if (
      q.includes('progress') ||
      q.includes('overload') ||
      q.includes('weight') ||
      q.includes('sets') ||
      q.includes('reps')
    ) {
      return {
        cardTitle: 'PROGRESSION_PLAN',
        summary:
          'To increase mechanical overload safely on your active split, implement the double progression model within an 8-to-12 repetition target window. Fix your resistance load constant until you achieve 12 clean repetitions across all programmed working sets before incrementing external load.',
        cuesTitle: 'PROGRESSION ACTION PLAN',
        bulletCues: [
          'Maintain working weight across all sets until the top rep target of 12 clean repetitions is verified on every set.',
          'Increase external resistance by no more than 2.0 kg to 2.5 kg total once all target repetitions are unlocked.',
          'If technical breakdown or form compensation occurs before rep 8, cease the set immediately and record the completed volume.',
        ],
      };
    }

    // 5. Plank / Core / Abs
    if (q.includes('plank') || q.includes('core') || q.includes('ab')) {
      return {
        cardTitle: 'FORM_GUIDANCE',
        summary:
          'During standard forearm planks, lumbar sagging occurs when the anterior pelvic tilt transfers body weight from the rectus abdominis to the lumbar facet joints. Initiate a deliberate posterior pelvic tilt with locked gluteal contraction to position the pelvis at neutral 0-degree inclination.',
        cuesTitle: 'KEY BIOMECHANICAL CUES',
        bulletCues: [
          'Position elbows directly under glenohumeral shoulder joints at a 90-degree flexion angle with forearms parallel.',
          'Tuck pelvis posteriorly (draw pubic bone toward navel) to fully flatten the lumbar arch and engage the internal obliques.',
          'Isometrically pull elbows toward toes and clench gluteus maximus at 100% force for 20-second maximal-tension intervals.',
        ],
        suggestedExerciseId: 'ex-plank-shoulder-tap',
      };
    }

    // Default Fallback
    return {
      cardTitle: 'FORM_GUIDANCE',
      summary:
        `Regarding your inquiry on "${query.slice(0, 50)}", ensure joint alignment and controlled eccentrics across your current split. Maintain strict scapulohumeral rhythm and avoid compensations around your ${userContext.myTwin.injuryHistory || 'lumbar joints'}.`,
      cuesTitle: 'KEY BIOMECHANICAL CUES',
      bulletCues: [
        'Enforce a deliberate 3-second eccentric descent on the loaded phase to maximize tension on target motor units.',
        'Brace the transverse abdominis with diaphragmatic intra-abdominal pressure before initiating concentric displacement.',
        'Keep joints aligned within their natural plane of movement without hyperextending cervical or lumbar vertebrae.',
      ],
    };
  }

  private static findSuggestedExerciseId(query: string): string | undefined {
    const q = query.toLowerCase();
    if (q.includes('row') || q.includes('back')) return 'ex-chest-supported-row';
    if (q.includes('door') || q.includes('apartment')) return 'ex-doorway-row';
    if (q.includes('plank') || q.includes('core')) return 'ex-plank-shoulder-tap';
    if (q.includes('recovery') || q.includes('tired') || q.includes('heart')) return 'ex-bird-dog';
    return undefined;
  }
}
