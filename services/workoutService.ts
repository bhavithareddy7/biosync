// ==============================================================================
// BioSync Workout Storage & Execution Service
// Custom routine builder persistence, session history, and 1RM calculation
// ==============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Exercise,
  WorkoutRoutine,
  WorkoutSession,
  GranularWorkoutFilter,
  MuscleGroup,
} from '../types/workout';
import { EXERCISE_DATABASE, PREBUILT_ROUTINES } from '../constants/exerciseDatabase';

const STORAGE_KEY_CUSTOM_ROUTINES = '@biosync_custom_routines_v1';
const STORAGE_KEY_WORKOUT_SESSIONS = '@biosync_workout_sessions_v1';

// Seed some initial realistic workout history for instant demonstration
const SEED_SESSIONS: WorkoutSession[] = [
  {
    id: 'session-demo-1',
    routineName: 'Upper Back & Lat Hypertrophy',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationMinutes: 38,
    totalVolumeKg: 3420,
    totalSets: 12,
    totalReps: 124,
    primaryMuscles: ['upper_back', 'arms'],
    perceivedStrain: 3,
    exercises: [
      {
        id: 'log-1',
        exerciseId: 'ex-lat-pulldown',
        exerciseName: 'Lat Pulldown (Wide Grip)',
        targetMuscle: 'upper_back',
        equipment: 'cable',
        sets: [
          { id: 's1', setNumber: 1, reps: 12, weightKg: 40, completed: true, previousReference: '35 kg × 12' },
          { id: 's2', setNumber: 2, reps: 10, weightKg: 45, completed: true, previousReference: '40 kg × 10' },
          { id: 's3', setNumber: 3, reps: 10, weightKg: 45, completed: true, previousReference: '45 kg × 10' },
        ],
      },
      {
        id: 'log-2',
        exerciseId: 'ex-chest-supported-row',
        exerciseName: 'Chest-Supported Dumbbell Row',
        targetMuscle: 'upper_back',
        equipment: 'dumbbells',
        sets: [
          { id: 's4', setNumber: 1, reps: 10, weightKg: 18, completed: true, previousReference: '16 kg × 10' },
          { id: 's5', setNumber: 2, reps: 10, weightKg: 18, completed: true, previousReference: '18 kg × 10' },
          { id: 's6', setNumber: 3, reps: 8, weightKg: 20, completed: true, previousReference: '18 kg × 10' },
        ],
      },
    ],
  },
];

export class WorkoutService {
  /**
   * Filter exercises by granular multi-dimensional criteria:
   * Muscle Group, Difficulty Level, Impact / Apartment Friendly, Text Query
   */
  static filterExercises(filter: GranularWorkoutFilter): Exercise[] {
    return EXERCISE_DATABASE.filter((ex) => {
      // Muscle filter
      if (filter.muscle !== 'all') {
        const matchesPrimary = ex.targetMuscle === filter.muscle;
        const matchesSecondary = ex.secondaryMuscles.includes(filter.muscle as MuscleGroup);
        if (!matchesPrimary && !matchesSecondary) return false;
      }

      // Difficulty filter
      if (filter.difficulty !== 'all' && ex.difficulty !== filter.difficulty) {
        return false;
      }

      // Impact / Environment filter
      if (filter.impact !== 'all' && ex.impactLevel !== filter.impact) {
        return false;
      }

      // Text query search
      if (filter.searchQuery.trim().length > 0) {
        const q = filter.searchQuery.toLowerCase();
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesMuscle = ex.targetMuscle.toLowerCase().includes(q);
        const matchesDesc = ex.description.toLowerCase().includes(q);
        const matchesCue = ex.formCue.toLowerCase().includes(q);
        if (!matchesName && !matchesMuscle && !matchesDesc && !matchesCue) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get exercise by ID
   */
  static getExerciseById(id: string): Exercise | undefined {
    return EXERCISE_DATABASE.find((ex) => ex.id === id);
  }

  /**
   * Get all routines (built-in prebuilts + user custom routines)
   */
  static async getAllRoutines(): Promise<WorkoutRoutine[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_ROUTINES);
      const customRoutines: WorkoutRoutine[] = stored ? JSON.parse(stored) : [];
      return [...PREBUILT_ROUTINES, ...customRoutines];
    } catch {
      return PREBUILT_ROUTINES;
    }
  }

  /**
   * Save a newly created custom routine
   */
  static async saveCustomRoutine(
    routine: Omit<WorkoutRoutine, 'id' | 'isCustom' | 'createdAt'>
  ): Promise<WorkoutRoutine> {
    const newRoutine: WorkoutRoutine = {
      ...routine,
      id: `custom-routine-${Date.now()}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_ROUTINES);
      const customRoutines: WorkoutRoutine[] = stored ? JSON.parse(stored) : [];
      customRoutines.unshift(newRoutine);
      await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_ROUTINES, JSON.stringify(customRoutines));
    } catch (e) {
      console.warn('Failed to save custom routine to AsyncStorage:', e);
    }

    return newRoutine;
  }

  /**
   * Delete a custom routine
   */
  static async deleteCustomRoutine(id: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_ROUTINES);
      if (!stored) return;
      const customRoutines: WorkoutRoutine[] = JSON.parse(stored);
      const filtered = customRoutines.filter((r) => r.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_ROUTINES, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to delete custom routine:', e);
    }
  }

  /**
   * Get logged workout session history
   */
  static async getWorkoutSessions(): Promise<WorkoutSession[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_WORKOUT_SESSIONS);
      if (stored) {
        return JSON.parse(stored);
      }
      // Seed initial demo session
      await AsyncStorage.setItem(STORAGE_KEY_WORKOUT_SESSIONS, JSON.stringify(SEED_SESSIONS));
      return SEED_SESSIONS;
    } catch {
      return SEED_SESSIONS;
    }
  }

  /**
   * Save a completed workout session
   */
  static async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    try {
      const sessions = await this.getWorkoutSessions();
      sessions.unshift(session);
      await AsyncStorage.setItem(STORAGE_KEY_WORKOUT_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save workout session:', e);
    }
  }

  /**
   * Calculate 1-Rep Max using the validated Epley Equation:
   * 1RM = Weight * (1 + Reps / 30)
   */
  static calculate1RM(weightKg: number, reps: number): number {
    if (reps <= 0 || weightKg <= 0) return weightKg;
    if (reps === 1) return weightKg;
    return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
  }

  /**
   * Calculate total session volume load: sum(reps * weight)
   */
  static calculateVolumeLoad(exercises: { sets: { reps: number; weightKg: number; completed: boolean }[] }[]): number {
    return exercises.reduce((acc, ex) => {
      const exVolume = ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.reps * (s.weightKg || 1), 0);
      return acc + exVolume;
    }, 0);
  }
}
