// BioSync Personal Baseline Intelligence Engine - Configurable Thresholds (Section 13)

export const BaselineThresholds = {
  defaultWindowDays: 7,
  minRecordsForBaseline: 3,

  // Thresholds for detecting deviations from personal baseline
  deviations: {
    sleepSignificantHours: 1.5,      // e.g., ±1.5h change from personal baseline
    sleepModerateHours: 0.8,
    stepsSignificantPercent: 25,     // e.g., ±25% change from personal baseline
    stepsModeratePercent: 15,
    heartRateSignificantBpm: 6,      // e.g., ±6 bpm change from personal baseline
    heartRateModerateBpm: 4,
    exerciseSignificantMinutes: 15,  // e.g., ±15 min change from personal baseline
  },

  // Multi-metric correlation rules (non-causal, observational)
  multiMetric: {
    stressOrFatiguePattern: {
      sleepDropHours: -1.0,
      activityDropSteps: -1500,
      heartRateIncreaseBpm: 5,
    },
    recoveryPattern: {
      sleepIncreaseHours: 1.0,
      heartRateDecreaseBpm: -4,
    },
    highExertionPattern: {
      exerciseIncreaseMinutes: 25,
      stepsIncrease: 3000,
    },
  },
};
