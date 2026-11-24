// BioSync TypeScript Master Type Definitions

export type DataSource = 'manual' | 'csv' | 'health_connect' | 'demo';

export interface HealthMetricRecord {
  id: string;
  date: string; // YYYY-MM-DD
  sleep_hours: number;
  steps: number;
  resting_heart_rate: number;
  exercise_minutes: number;
  mood_score: number; // 1-5
  source: DataSource;
  created_at?: string;
}

export interface MetricBaseline {
  windowDays: number;
  recordCount: number;
  sufficientData: boolean;
  calculatedAt: string;
  avgSleep: number;
  avgSteps: number;
  avgHeartRate: number;
  avgExercise: number;
  minSleep?: number;
  maxSleep?: number;
  minHeartRate?: number;
  maxHeartRate?: number;
}

export interface MetricDeviation {
  metricKey: keyof Pick<HealthMetricRecord, 'sleep_hours' | 'steps' | 'resting_heart_rate' | 'exercise_minutes'>;
  label: string;
  unit: string;
  currentValue: number;
  baselineValue: number;
  diff: number;
  percentDiff: number;
  direction: 'higher' | 'lower' | 'neutral';
  isSignificant: boolean;
  explanation: string;
}

export type PatternSeverity = 'positive' | 'warning' | 'info';

export interface DetectedPattern {
  id: string;
  date: string;
  type: string;
  title: string;
  severity: PatternSeverity;
  explanation: string;
  supportingMetrics: {
    metric: string;
    current: string | number;
    baseline: string | number;
    deviation: string;
  }[];
  recommendation: string;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  age?: number;
  baselineWindowDays: number;
  healthConnectConnected: boolean;
  lastSyncTime?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  supportingMetrics?: {
    label: string;
    value: string;
  }[];
  suggestedPrompts?: string[];
}
