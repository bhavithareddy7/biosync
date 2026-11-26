// ==============================================================================
// BioSync Circadian & Schedule Harmonizer Service
// Automated Conflict / Clash Detection & AI-Driven Chronobiological Optimization
// ==============================================================================

import { Platform } from 'react-native';

export type EventCategory = 'work' | 'workout' | 'social' | 'sleep' | 'study' | 'other';

export interface ScheduleEvent {
  id: string;
  title: string;
  category: EventCategory;
  startTime: string; // "HH:MM" 24-hr format e.g. "09:00"
  endTime: string;   // "HH:MM" 24-hr format e.g. "17:00"
  reason?: string;
  isClashing?: boolean;
  clashDescriptions?: string[];
}

export interface ScheduleHarmonizationResult {
  title: string;
  conflictSummary: string;
  recoveryImpactScore: string;
  optimizedEvents: ScheduleEvent[];
  circadianRecommendations: string[];
  provider?: string;
  model?: string;
}

export interface ScheduleUserContext {
  restingHeartRate?: number;
  restingHeartRateBaseline?: number;
  sleepHours?: number;
  sleepHoursBaseline?: number;
  recoveryPercentage?: number;
  fitnessLevel?: string;
  injuryHistory?: string;
}

export const CATEGORY_COLORS: Record<EventCategory, { bg: string; border: string; text: string; icon: string }> = {
  work: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3B82F6', text: '#60A5FA', icon: 'briefcase' },
  workout: { bg: 'rgba(6, 182, 212, 0.15)', border: '#06B6D4', text: '#22D3EE', icon: 'barbell' },
  social: { bg: 'rgba(168, 85, 247, 0.15)', border: '#A855F7', text: '#C084FC', icon: 'wine' },
  sleep: { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366F1', text: '#818CF8', icon: 'moon' },
  study: { bg: 'rgba(245, 158, 11, 0.15)', border: '#F59E0B', text: '#FBBF24', icon: 'book' },
  other: { bg: 'rgba(107, 114, 128, 0.15)', border: '#6B7280', text: '#9CA3AF', icon: 'calendar' },
};

/**
 * Pre-populated default clashing scenario specified by user:
 * 1. 9-to-5 Job: 09:00 - 17:00
 * 2. Gym Workout: 15:00 - 18:00 (overlaps Job 15:00 - 17:00!)
 * 3. Birthday Party: 17:00 - 23:00 (overlaps Gym 17:00 - 18:00 & Sleep 22:00 - 23:00!)
 * 4. Sleep Schedule: 22:00 - 05:00 (crushed by party ending at 23:00!)
 */
export const DEFAULT_CLASHING_SCHEDULE: ScheduleEvent[] = [
  {
    id: 'evt_work',
    title: '9-to-5 Job',
    category: 'work',
    startTime: '09:00',
    endTime: '17:00',
  },
  {
    id: 'evt_gym',
    title: 'Gym Workout',
    category: 'workout',
    startTime: '15:00',
    endTime: '18:00',
  },
  {
    id: 'evt_party',
    title: 'Birthday Party',
    category: 'social',
    startTime: '17:00',
    endTime: '23:00',
  },
  {
    id: 'evt_sleep',
    title: 'Sleep Window',
    category: 'sleep',
    startTime: '22:00',
    endTime: '05:00',
  },
];

/**
 * Helper to convert "HH:MM" to minutes from 00:00
 */
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Helper to convert minutes to "HH:MM"
 */
export function minutesToTime(totalMins: number): string {
  const normalized = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Detect all direct time overlaps and clashes between events
 */
export function detectScheduleClashes(events: ScheduleEvent[]): {
  clashCount: number;
  flaggedEvents: ScheduleEvent[];
  clashSummaries: string[];
} {
  const result: ScheduleEvent[] = events.map((e) => ({
    ...e,
    isClashing: false,
    clashDescriptions: [],
  }));

  const clashSummaries: string[] = [];

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const eA = result[i];
      const eB = result[j];

      let startA = timeToMinutes(eA.startTime);
      let endA = timeToMinutes(eA.endTime);
      let startB = timeToMinutes(eB.startTime);
      let endB = timeToMinutes(eB.endTime);

      // Handle overnight wrap (e.g. 22:00 to 05:00)
      if (endA <= startA) endA += 1440;
      if (endB <= startB) endB += 1440;

      // Check standard overlap
      const overlap1 = Math.max(startA, startB) < Math.min(endA, endB);
      // Check wrap overlap for next day
      const overlap2 = Math.max(startA + 1440, startB) < Math.min(endA + 1440, endB);
      const overlap3 = Math.max(startA, startB + 1440) < Math.min(endA, endB + 1440);

      if (overlap1 || overlap2 || overlap3) {
        eA.isClashing = true;
        eB.isClashing = true;

        const clashText = `"${eA.title}" (${eA.startTime}–${eA.endTime}) overlaps with "${eB.title}" (${eB.startTime}–${eB.endTime})`;
        eA.clashDescriptions?.push(`Clashes with ${eB.title}`);
        eB.clashDescriptions?.push(`Clashes with ${eA.title}`);

        if (!clashSummaries.includes(clashText)) {
          clashSummaries.push(clashText);
        }
      }
    }
  }

  const clashCount = clashSummaries.length;
  return { clashCount, flaggedEvents: result, clashSummaries };
}

export class ScheduleAiService {
  private static getApiUrl(): string {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location) {
        return `${window.location.origin}/api/schedule/harmonize`;
      }
      return '/api/schedule/harmonize';
    }
    return 'http://10.0.2.2:8085/api/schedule/harmonize';
  }

  /**
   * Send the clashing events and biometric context to the AI Schedule Harmonizer
   */
  static async harmonizeSchedule(
    events: ScheduleEvent[],
    userContext: ScheduleUserContext
  ): Promise<{ response?: ScheduleHarmonizationResult; error?: string }> {
    try {
      const apiUrl = this.getApiUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          events,
          userContext,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json: ScheduleHarmonizationResult = await res.json();
        return { response: json };
      }

      const errText = await res.text();
      let msg = `Server returned HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) msg = `[HTTP ${res.status}] ${parsed.error}`;
      } catch {
        if (errText.trim()) msg = `[HTTP ${res.status}] ${errText.trim()}`;
      }
      return { error: msg };
    } catch (networkErr: any) {
      if (networkErr?.name === 'AbortError' || networkErr?.message?.includes('aborted')) {
        return { error: '[Request Timeout] Schedule harmonization took longer than 60s. Tap retry to run again.' };
      }
      return { error: `[Network Error] Could not connect to schedule harmonizer: ${networkErr?.message || 'Server error'}` };
    }
  }
}
