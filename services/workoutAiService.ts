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
      const timeoutId = setTimeout(() => controller.abort(), 6000);

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
   * If the call fails, the exact HTTP status code and API error are returned so the UI displays what went wrong.
   * NO fake or generic fallback coaching text is returned.
   */
  static async fetchCoachingAdvice(
    query: string,
    userContext: CoachUserContext,
    externalSignal?: AbortSignal
  ): Promise<{ response?: CoachResponseSchema; error?: string; isTimeout?: boolean }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { error: 'Please enter a workout or biomechanics question.' };
    }

    const apiUrl = this.getApiUrl();
    const internalController = new AbortController();

    // Link externalSignal to internalController if provided
    let externalAbortHandler: (() => void) | undefined;
    if (externalSignal) {
      if (externalSignal.aborted) {
        return { error: 'Request was cancelled before dispatch.' };
      }
      externalAbortHandler = () => {
        try {
          internalController.abort('USER_CANCELLED');
        } catch {
          internalController.abort();
        }
      };
      externalSignal.addEventListener('abort', externalAbortHandler, { once: true });
    }

    let isTimedOut = false;
    const REQUEST_TIMEOUT_MS = 90000; // 90 seconds timeout for LLM reasoning, exponential backoff retries and fallback
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      try {
        internalController.abort('REQUEST_TIMEOUT');
      } catch {
        internalController.abort();
      }
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: trimmed,
          userContext,
        }),
        signal: internalController.signal,
      });

      clearTimeout(timeoutId);
      if (externalSignal && externalAbortHandler) {
        externalSignal.removeEventListener('abort', externalAbortHandler);
      }

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

      // Non-200 HTTP response: extract exact server error and status code
      const status = response.status;
      const statusText = response.statusText || '';
      let serverErrorMsg = `[HTTP ${status}${statusText ? ' ' + statusText : ''}]`;

      try {
        const errJson = await response.json();
        if (errJson && errJson.error) {
          serverErrorMsg = `[HTTP ${status}] ${errJson.error}`;
        }
      } catch {
        const rawText = await response.text().catch(() => '');
        if (rawText && rawText.trim()) {
          serverErrorMsg = `[HTTP ${status}] ${rawText.trim()}`;
        }
      }

      console.error('[WorkoutAiService] Gemini API server returned error:', serverErrorMsg);
      return { error: serverErrorMsg };
    } catch (networkErr: any) {
      clearTimeout(timeoutId);
      if (externalSignal && externalAbortHandler) {
        externalSignal.removeEventListener('abort', externalAbortHandler);
      }

      // 1. Timeout detection
      if (isTimedOut) {
        const msg = `[Request Timeout] Gemini API did not complete within ${REQUEST_TIMEOUT_MS / 1000}s. The model may be experiencing high demand. Please click "Retry API Call".`;
        console.warn('[WorkoutAiService]', msg);
        return { error: msg, isTimeout: true };
      }

      // 2. External abort / user started a newer query
      if (externalSignal?.aborted) {
        return { error: 'Request was cancelled by a newer query.' };
      }

      // 3. Catch generic AbortError / "signal is aborted without reason"
      const rawMsg = networkErr?.message || String(networkErr || '');
      const isAbort = networkErr?.name === 'AbortError' || rawMsg.toLowerCase().includes('aborted');

      if (isAbort) {
        const msg = '[Request Cancelled] The request was interrupted or aborted prematurely. Tap "Retry API Call" to try again.';
        console.warn('[WorkoutAiService]', msg, rawMsg);
        return { error: msg };
      }

      // 4. Network or connection failure
      const msg = `[Network Error] Failed to reach ${apiUrl}: ${rawMsg || 'Connection failed. Ensure the server is running on port 8085.'}`;
      console.error('[WorkoutAiService] Live Gemini request failed:', msg);
      return { error: msg };
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
