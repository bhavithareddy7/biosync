// ==============================================================================
// BioSync Workout AI Coaching & Biomechanical Guidance Service
// Server-side Gemini API integration - Real Live Responses with Strict Error Surfacing
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
      if (typeof window !== 'undefined' && window.location) {
        return `${window.location.origin}/api/coach`;
      }
      return '/api/coach';
    }
    return 'http://10.0.2.2:8085/api/coach';
  }

  /**
   * Check if backend has Gemini API key connected
   */
  static async checkApiStatus(): Promise<{ connected: boolean; hasKey: boolean; model?: string }> {
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
        return {
          connected: true,
          hasKey: Boolean(json.hasGeminiKey),
          model: json.model || 'gemini-3.8-flash',
        };
      }
      return { connected: false, hasKey: false };
    } catch {
      return { connected: false, hasKey: false };
    }
  }

  /**
   * Primary entry point: Request structured coaching advice via server-side Gemini API.
   * If the call fails, the exact API error is returned so the UI displays what went wrong.
   * NO fake or generic fallback coaching text is returned.
   */
  static async fetchCoachingAdvice(
    query: string,
    userContext: CoachUserContext
  ): Promise<{ response?: CoachResponseSchema; error?: string }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { error: 'Please enter a workout or biomechanics question.' };
    }

    try {
      const apiUrl = this.getApiUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for live LLM

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
          const exerciseId = this.findSuggestedExerciseId(trimmed);
          return {
            response: {
              ...json,
              suggestedExerciseId: exerciseId,
            },
          };
        }
      }

      // Extract exact server error message
      const errText = await response.text();
      let parsedError = `Server returned HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) {
          parsedError = parsed.error;
        }
      } catch {
        if (errText && errText.trim().length > 0) {
          parsedError = errText;
        }
      }

      console.error('[WorkoutAiService] Live Gemini API error:', parsedError);
      return { error: parsedError };
    } catch (networkErr: any) {
      console.error('[WorkoutAiService] Live Gemini request failed:', networkErr.message);
      return { error: networkErr.message || 'Network connection failed' };
    }
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
