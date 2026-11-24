// ==============================================================================
// BioSync Workout & Gym Intelligence Type Definitions
// Granular Filtering, Gym Tracking, Sets/Reps/Weight Logging, Routines & AI
// ==============================================================================

export type MuscleGroup =
  | 'upper_back'
  | 'core'
  | 'chest'
  | 'shoulders'
  | 'arms'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'glutes'
  | 'full_body';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type ImpactLevel =
  | 'low_impact'
  | 'apartment_friendly'
  | 'gym_equipment'
  | 'bodyweight';

export type EquipmentType =
  | 'dumbbells'
  | 'barbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'resistance_bands'
  | 'mat';

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  difficulty: DifficultyLevel;
  impactLevel: ImpactLevel;
  equipment: EquipmentType;
  defaultSets: number;
  defaultReps: number;
  defaultWeightKg: number;
  formCue: string;
  apartmentTip?: string;
  caloriesPerMin: number;
  description: string;
  iconName?: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
  previousReference?: string;
  rpe?: number; // 1-10 Rate of Perceived Exertion
}

export interface WorkoutExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetMuscle: MuscleGroup;
  equipment: EquipmentType;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description: string;
  targetMuscle: MuscleGroup | 'multi';
  difficulty: DifficultyLevel;
  impactLevel: ImpactLevel;
  estimatedDurationMin: number;
  exerciseIds: string[];
  isCustom: boolean;
  createdAt?: string;
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  routineName: string;
  date: string; // ISO string
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  exercises: WorkoutExerciseLog[];
  primaryMuscles: MuscleGroup[];
  perceivedStrain?: number; // 1-5
  notes?: string;
}

export interface GranularWorkoutFilter {
  muscle: MuscleGroup | 'all';
  difficulty: DifficultyLevel | 'all';
  impact: ImpactLevel | 'all';
  searchQuery: string;
}

export interface AiWorkoutPrompt {
  id: string;
  question: string;
  category: 'form' | 'apartment' | 'baseline' | 'progression';
  icon: string;
}
