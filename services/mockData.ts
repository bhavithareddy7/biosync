// BioSync Realistic Mock Dataset for Alex (College Student Persona)
// Provides 30 days of continuous data illustrating the baseline vs acute deviation scenario.

import { HealthMetricRecord, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr_alex_bio_001',
  name: 'Alex',
  email: 'alex.student@university.edu',
  age: 22,
  baselineWindowDays: 7,
  healthConnectConnected: false,
  lastSyncTime: new Date().toISOString(),
};

// Generates 30 days of data ending at today
export const generateRealisticHistoricalData = (): HealthMetricRecord[] => {
  const records: HealthMetricRecord[] = [];
  const today = new Date();

  // Helper to format date YYYY-MM-DD
  const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Past 30 days:
  // Days 29 down to 3: Normal historical baselines (Sleep ~7.5h, Steps ~7000, HR ~68bpm)
  // Days 2 down to 0 (Recent 3 days): Exam crunch / fatigue (Sleep ~5.5h, Steps ~4000, HR ~76bpm)
  for (let i = 29; i >= 0; i--) {
    const recordDate = new Date(today);
    recordDate.setDate(today.getDate() - i);
    const dateStr = formatDate(recordDate);

    let sleep_hours: number;
    let steps: number;
    let resting_heart_rate: number;
    let exercise_minutes: number;
    let mood_score: number;

    if (i === 0) {
      // TODAY: Acute deviation per specification
      sleep_hours = 5.5;
      steps = 4000;
      resting_heart_rate = 76;
      exercise_minutes = 25;
      mood_score = 2;
    } else if (i === 1) {
      // Yesterday: Low sleep, low activity
      sleep_hours = 5.8;
      steps = 4300;
      resting_heart_rate = 74;
      exercise_minutes = 20;
      mood_score = 3;
    } else if (i === 2) {
      // 2 days ago: Exam preparation starts
      sleep_hours = 6.2;
      steps = 5100;
      resting_heart_rate = 73;
      exercise_minutes = 30;
      mood_score = 3;
    } else if (i <= 6) {
      // Days 3 to 6 (Part of the 7-day window): Transitions
      sleep_hours = 6.8 + (Math.sin(i) * 0.4);
      steps = 6200 + Math.floor(Math.cos(i) * 600);
      resting_heart_rate = 70 + Math.floor(Math.sin(i) * 2);
      exercise_minutes = 30;
      mood_score = 3;
    } else {
      // Historical baseline days (7 to 29): Solid healthy student baseline (~7.5h, ~7000 steps, ~68 bpm)
      const pseudoRandom = Math.sin(i * 1.7);
      sleep_hours = Number((7.5 + (pseudoRandom * 0.6)).toFixed(1));
      steps = Math.round(7000 + (pseudoRandom * 850));
      resting_heart_rate = Math.round(68 + (pseudoRandom * 3));
      exercise_minutes = Math.round(35 + (pseudoRandom * 10));
      mood_score = pseudoRandom > 0 ? 4 : 3;
    }

    records.push({
      id: `metric_${dateStr}`,
      date: dateStr,
      sleep_hours: Number(sleep_hours.toFixed(1)),
      steps,
      resting_heart_rate,
      exercise_minutes,
      mood_score,
      source: i === 0 ? 'manual' : 'demo',
      created_at: recordDate.toISOString(),
    });
  }

  return records;
};

// Raw CSV string for downloadable sample CSV format
export const SAMPLE_CSV_CONTENT = `date,sleep_hours,steps,resting_heart_rate,exercise_minutes,mood_score
2026-11-15,7.6,7200,67,35,4
2026-11-16,7.4,6900,68,40,4
2026-11-17,7.8,7400,66,45,5
2026-11-18,7.2,6800,69,30,4
2026-11-19,6.5,5900,71,25,3
2026-11-20,6.0,5200,73,20,3
2026-11-21,5.8,4300,74,20,3
2026-11-22,5.5,4000,76,25,2`;
