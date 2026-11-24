// ==============================================================================
// BioSync Personal Baseline Intelligence Engine (Section 13)
// Deterministic, Mathematical, Non-Causal Pattern Detection
// ==============================================================================

import { HealthMetricRecord, MetricBaseline, MetricDeviation, DetectedPattern } from '../types';
import { BaselineThresholds } from '../constants/thresholds';

/**
 * Validates an individual metric record to ensure sane physiological numbers
 */
export const isValidRecord = (record: Partial<HealthMetricRecord>): boolean => {
  if (!record.date) return false;
  if (record.sleep_hours !== undefined && (record.sleep_hours < 0 || record.sleep_hours > 24)) return false;
  if (record.steps !== undefined && record.steps < 0) return false;
  if (record.resting_heart_rate !== undefined && (record.resting_heart_rate < 30 || record.resting_heart_rate > 220)) return false;
  if (record.exercise_minutes !== undefined && (record.exercise_minutes < 0 || record.exercise_minutes > 1440)) return false;
  return true;
};

/**
 * Calculates personal historical baseline from a set of historical records
 * excluding the target/current record (or taking the specified window of preceding records).
 */
export const calculatePersonalBaseline = (
  records: HealthMetricRecord[],
  windowDays: number = BaselineThresholds.defaultWindowDays,
  excludeDate?: string
): MetricBaseline => {
  // Sort descending by date
  const sorted = [...records]
    .filter(r => isValidRecord(r))
    .filter(r => !excludeDate || r.date !== excludeDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Take the historical window
  const windowRecords = sorted.slice(0, windowDays);
  const count = windowRecords.length;

  if (count < BaselineThresholds.minRecordsForBaseline) {
    return {
      windowDays,
      recordCount: count,
      sufficientData: false,
      calculatedAt: new Date().toISOString(),
      avgSleep: 0,
      avgSteps: 0,
      avgHeartRate: 0,
      avgExercise: 0,
    };
  }

  // Calculate averages
  const totalSleep = windowRecords.reduce((acc, r) => acc + (r.sleep_hours || 0), 0);
  const totalSteps = windowRecords.reduce((acc, r) => acc + (r.steps || 0), 0);
  const totalHR = windowRecords.reduce((acc, r) => acc + (r.resting_heart_rate || 0), 0);
  const totalExercise = windowRecords.reduce((acc, r) => acc + (r.exercise_minutes || 0), 0);

  const sleepValues = windowRecords.map(r => r.sleep_hours);
  const hrValues = windowRecords.map(r => r.resting_heart_rate);

  return {
    windowDays,
    recordCount: count,
    sufficientData: true,
    calculatedAt: new Date().toISOString(),
    avgSleep: Number((totalSleep / count).toFixed(1)),
    avgSteps: Math.round(totalSteps / count),
    avgHeartRate: Math.round(totalHR / count),
    avgExercise: Math.round(totalExercise / count),
    minSleep: Math.min(...sleepValues),
    maxSleep: Math.max(...sleepValues),
    minHeartRate: Math.min(...hrValues),
    maxHeartRate: Math.max(...hrValues),
  };
};

/**
 * Computes deviations between a current metric record and the historical baseline
 */
export const computeMetricDeviations = (
  current: HealthMetricRecord,
  baseline: MetricBaseline
): MetricDeviation[] => {
  if (!baseline.sufficientData) return [];

  const deviations: MetricDeviation[] = [];

  // 1. Sleep
  const sleepDiff = Number((current.sleep_hours - baseline.avgSleep).toFixed(1));
  const sleepPct = baseline.avgSleep > 0 ? Number(((sleepDiff / baseline.avgSleep) * 100).toFixed(1)) : 0;
  const isSleepSig = Math.abs(sleepDiff) >= BaselineThresholds.deviations.sleepSignificantHours;
  deviations.push({
    metricKey: 'sleep_hours',
    label: 'Sleep Duration',
    unit: 'hrs',
    currentValue: current.sleep_hours,
    baselineValue: baseline.avgSleep,
    diff: sleepDiff,
    percentDiff: sleepPct,
    direction: sleepDiff > 0.2 ? 'higher' : sleepDiff < -0.2 ? 'lower' : 'neutral',
    isSignificant: isSleepSig,
    explanation: `${Math.abs(sleepDiff)} hrs ${sleepDiff >= 0 ? 'more than' : 'below'} personal ${baseline.windowDays}-day baseline`,
  });

  // 2. Steps
  const stepsDiff = current.steps - baseline.avgSteps;
  const stepsPct = baseline.avgSteps > 0 ? Number(((stepsDiff / baseline.avgSteps) * 100).toFixed(1)) : 0;
  const isStepsSig = Math.abs(stepsPct) >= BaselineThresholds.deviations.stepsSignificantPercent;
  deviations.push({
    metricKey: 'steps',
    label: 'Daily Steps',
    unit: 'steps',
    currentValue: current.steps,
    baselineValue: baseline.avgSteps,
    diff: stepsDiff,
    percentDiff: stepsPct,
    direction: stepsDiff > 250 ? 'higher' : stepsDiff < -250 ? 'lower' : 'neutral',
    isSignificant: isStepsSig,
    explanation: `${Math.abs(stepsDiff).toLocaleString()} steps (${Math.abs(stepsPct)}%) ${stepsDiff >= 0 ? 'above' : 'below'} personal baseline`,
  });

  // 3. Resting Heart Rate
  const hrDiff = current.resting_heart_rate - baseline.avgHeartRate;
  const hrPct = baseline.avgHeartRate > 0 ? Number(((hrDiff / baseline.avgHeartRate) * 100).toFixed(1)) : 0;
  const isHrSig = Math.abs(hrDiff) >= BaselineThresholds.deviations.heartRateSignificantBpm;
  deviations.push({
    metricKey: 'resting_heart_rate',
    label: 'Resting Heart Rate',
    unit: 'BPM',
    currentValue: current.resting_heart_rate,
    baselineValue: baseline.avgHeartRate,
    diff: hrDiff,
    percentDiff: hrPct,
    direction: hrDiff > 1 ? 'higher' : hrDiff < -1 ? 'lower' : 'neutral',
    isSignificant: isHrSig,
    explanation: `${Math.abs(hrDiff)} BPM ${hrDiff >= 0 ? 'higher than' : 'lower than'} personal baseline`,
  });

  // 4. Exercise
  const exDiff = current.exercise_minutes - baseline.avgExercise;
  const exPct = baseline.avgExercise > 0 ? Number(((exDiff / baseline.avgExercise) * 100).toFixed(1)) : 0;
  const isExSig = Math.abs(exDiff) >= BaselineThresholds.deviations.exerciseSignificantMinutes;
  deviations.push({
    metricKey: 'exercise_minutes',
    label: 'Exercise Duration',
    unit: 'min',
    currentValue: current.exercise_minutes,
    baselineValue: baseline.avgExercise,
    diff: exDiff,
    percentDiff: exPct,
    direction: exDiff > 2 ? 'higher' : exDiff < -2 ? 'lower' : 'neutral',
    isSignificant: isExSig,
    explanation: `${Math.abs(exDiff)} min ${exDiff >= 0 ? 'longer than' : 'shorter than'} personal baseline`,
  });

  return deviations;
};

/**
 * Detects patterns and multi-metric simultaneous shifts based on validated baseline deviations.
 * Strictly non-causal, objective, explainable.
 */
export const detectBaselinePatterns = (
  current: HealthMetricRecord,
  baseline: MetricBaseline,
  deviations: MetricDeviation[]
): DetectedPattern[] => {
  const patterns: DetectedPattern[] = [];
  const todayStr = current.date;

  if (!baseline.sufficientData) {
    patterns.push({
      id: `pat_insufficient_${todayStr}`,
      date: todayStr,
      type: 'insufficient_data',
      title: 'Baseline Building In Progress',
      severity: 'info',
      explanation: 'Collect more data to establish your personal baseline. BioSync needs at least 3 valid daily records.',
      supportingMetrics: [],
      recommendation: 'Log daily sleep, steps, and resting heart rate consistently to unlock individualized trend intelligence.',
    });
    return patterns;
  }

  const sleepDev = deviations.find(d => d.metricKey === 'sleep_hours');
  const stepsDev = deviations.find(d => d.metricKey === 'steps');
  const hrDev = deviations.find(d => d.metricKey === 'resting_heart_rate');
  const exDev = deviations.find(d => d.metricKey === 'exercise_minutes');

  // 1. MULTI-METRIC PATTERN: Concurrent sleep decrease + step drop + resting HR elevation
  // This matches the exact core Alex persona specification!
  if (
    sleepDev && sleepDev.diff <= -1.0 &&
    stepsDev && stepsDev.diff <= -1500 &&
    hrDev && hrDev.diff >= 4
  ) {
    patterns.push({
      id: `pat_multi_fatigue_${todayStr}`,
      date: todayStr,
      type: 'multi_metric_strain',
      title: 'Simultaneous Lifestyle & Biometric Shift',
      severity: 'warning',
      explanation:
        'Your sleep duration has decreased compared with your recent personal average. Your daily activity has also decreased, while your resting heart rate has increased. This multi-metric shift reflects heightened physiological load or reduced recovery time.',
      supportingMetrics: [
        { metric: 'Sleep', current: `${current.sleep_hours} hrs`, baseline: `${baseline.avgSleep} hrs`, deviation: `${sleepDev.diff} hrs` },
        { metric: 'Activity', current: `${current.steps.toLocaleString()} steps`, baseline: `${baseline.avgSteps.toLocaleString()} steps`, deviation: `${stepsDev.diff.toLocaleString()}` },
        { metric: 'Resting HR', current: `${current.resting_heart_rate} BPM`, baseline: `${baseline.avgHeartRate} BPM`, deviation: `+${hrDev.diff} BPM` },
      ],
      recommendation:
        'Consider reviewing your evening wind-down routine and prioritizing restorative sleep. Maintain adequate hydration and avoid high-intensity exertion if feeling fatigued.',
    });
  }

  // 2. ISOLATED SLEEP PATTERN
  if (sleepDev && sleepDev.isSignificant) {
    if (sleepDev.diff < 0) {
      patterns.push({
        id: `pat_sleep_drop_${todayStr}`,
        date: todayStr,
        type: 'sleep_pattern_change',
        title: 'Sleep Duration Below Personal Baseline',
        severity: 'warning',
        explanation: `Your recorded sleep of ${current.sleep_hours} hrs is ${Math.abs(sleepDev.diff)} hrs below your personal average (${baseline.avgSleep} hrs).`,
        supportingMetrics: [
          { metric: 'Sleep', current: `${current.sleep_hours} hrs`, baseline: `${baseline.avgSleep} hrs`, deviation: `${sleepDev.diff} hrs (${sleepDev.percentDiff}%)` },
        ],
        recommendation: 'Target an earlier bedtime tonight or reduce blue-light screen exposure before sleep.',
      });
    } else {
      patterns.push({
        id: `pat_sleep_gain_${todayStr}`,
        date: todayStr,
        type: 'sleep_recovery',
        title: 'Extended Sleep Duration Recorded',
        severity: 'positive',
        explanation: `Your recorded sleep of ${current.sleep_hours} hrs is ${sleepDev.diff} hrs higher than your normal average (${baseline.avgSleep} hrs).`,
        supportingMetrics: [
          { metric: 'Sleep', current: `${current.sleep_hours} hrs`, baseline: `${baseline.avgSleep} hrs`, deviation: `+${sleepDev.diff} hrs` },
        ],
        recommendation: 'Extra restorative sleep can support cellular recovery and immune resilience.',
      });
    }
  }

  // 3. ISOLATED RESTING HEART RATE ELEVATION
  if (hrDev && hrDev.isSignificant && hrDev.diff > 0) {
    patterns.push({
      id: `pat_hr_elevation_${todayStr}`,
      date: todayStr,
      type: 'resting_hr_deviation',
      title: 'Resting Heart Rate Deviation',
      severity: 'warning',
      explanation: `Your resting heart rate is currently ${current.resting_heart_rate} BPM, which is ${hrDev.diff} BPM above your personal baseline (${baseline.avgHeartRate} BPM).`,
      supportingMetrics: [
        { metric: 'Resting HR', current: `${current.resting_heart_rate} BPM`, baseline: `${baseline.avgHeartRate} BPM`, deviation: `+${hrDev.diff} BPM` },
      ],
      recommendation:
        'Elevated resting heart rate can correlate with acute stress, dehydration, caffeine intake, or incomplete recovery. Continue monitoring over consecutive days.',
    });
  }

  // 4. ACTIVITY PATTERN
  if (stepsDev && stepsDev.isSignificant) {
    if (stepsDev.diff < 0) {
      patterns.push({
        id: `pat_activity_drop_${todayStr}`,
        date: todayStr,
        type: 'activity_pattern_change',
        title: 'Activity Below Typical Range',
        severity: 'info',
        explanation: `Daily step count (${current.steps.toLocaleString()}) is ${Math.abs(stepsDev.percentDiff)}% lower than your 7-day average (${baseline.avgSteps.toLocaleString()} steps).`,
        supportingMetrics: [
          { metric: 'Steps', current: current.steps.toLocaleString(), baseline: baseline.avgSteps.toLocaleString(), deviation: `${stepsDev.diff.toLocaleString()}` },
        ],
        recommendation: 'A gentle 10-15 minute walk or standing stretch break can stimulate circulation and mental alertness.',
      });
    } else {
      patterns.push({
        id: `pat_activity_boost_${todayStr}`,
        date: todayStr,
        type: 'activity_surge',
        title: 'Elevated Daily Activity Level',
        severity: 'positive',
        explanation: `You reached ${current.steps.toLocaleString()} steps, surpassing your personal baseline by ${stepsDev.diff.toLocaleString()} steps.`,
        supportingMetrics: [
          { metric: 'Steps', current: current.steps.toLocaleString(), baseline: baseline.avgSteps.toLocaleString(), deviation: `+${stepsDev.diff.toLocaleString()}` },
        ],
        recommendation: 'Great engagement. Ensure post-movement hydration and gentle stretching.',
      });
    }
  }

  // 5. STABLE BASELINE (if no significant deviations)
  if (patterns.length === 0) {
    patterns.push({
      id: `pat_stable_${todayStr}`,
      date: todayStr,
      type: 'baseline_equilibrium',
      title: 'Metrics in Personal Equilibrium',
      severity: 'positive',
      explanation: 'All tracked metrics align closely with your established personal baseline ranges.',
      supportingMetrics: [
        { metric: 'Sleep', current: `${current.sleep_hours} hrs`, baseline: `${baseline.avgSleep} hrs`, deviation: 'Nominal' },
        { metric: 'Steps', current: current.steps.toLocaleString(), baseline: baseline.avgSteps.toLocaleString(), deviation: 'Nominal' },
        { metric: 'Resting HR', current: `${current.resting_heart_rate} BPM`, baseline: `${baseline.avgHeartRate} BPM`, deviation: 'Nominal' },
      ],
      recommendation: 'Continue your current balance of rest, nutrition, and daily movement.',
    });
  }

  return patterns;
};
