// ==============================================================================
// BioSync AI Service Module (Section 10 & 14)
// Grounded In Personal Baseline Intelligence.
// Enforces Non-Medical, Non-Diagnostic Explanations With Zero Key Exposure.
// ==============================================================================

import { HealthMetricRecord, MetricBaseline, DetectedPattern } from '../types';

export interface AIInsightRequest {
  current: HealthMetricRecord;
  baseline: MetricBaseline;
  patterns: DetectedPattern[];
  userQuery?: string;
}

export interface AIInsightResponse {
  summary: string;
  observedPatterns: string[];
  supportingMetrics: { label: string; value: string }[];
  interpretation: string;
  suggestedAction: string;
  source: 'edge_function' | 'deterministic_model';
  timestamp: string;
}

/**
 * Builds grounded deterministic response when API is unconfigured or in offline/demo mode.
 * Strictly adheres to non-diagnostic rules and uses real recorded data.
 */
export const generateDeterministicInsight = (request: AIInsightRequest): AIInsightResponse => {
  const { current, baseline, patterns, userQuery } = request;

  // If user asked a specific question in chat
  if (userQuery) {
    const q = userQuery.toLowerCase();
    if (q.includes('sleep')) {
      const diff = Number((current.sleep_hours - baseline.avgSleep).toFixed(1));
      return {
        summary: `Your sleep of ${current.sleep_hours} hrs is ${Math.abs(diff)} hrs ${diff < 0 ? 'lower' : 'higher'} than your ${baseline.windowDays}-day personal baseline (${baseline.avgSleep} hrs).`,
        observedPatterns: [`Sleep deviation of ${diff} hrs compared to historical norm.`],
        supportingMetrics: [
          { label: 'Current Sleep', value: `${current.sleep_hours} hrs` },
          { label: 'Personal Baseline', value: `${baseline.avgSleep} hrs` },
        ],
        interpretation:
          diff < -1
            ? 'Reduced sleep may lead to temporary next-day lethargy or altered focus. No definitive causal factors can be asserted without broader context.'
            : 'Your sleep duration reflects your usual physiological rhythm.',
        suggestedAction:
          diff < -1
            ? 'Consider aiming for a calmer pre-sleep routine and dimming bright displays 45 minutes before sleep.'
            : 'Maintain your current sleep schedule.',
        source: 'deterministic_model',
        timestamp: new Date().toISOString(),
      };
    }

    if (q.includes('step') || q.includes('activity')) {
      const diff = current.steps - baseline.avgSteps;
      return {
        summary: `Your daily steps (${current.steps.toLocaleString()}) are currently ${Math.abs(diff).toLocaleString()} steps ${diff < 0 ? 'below' : 'above'} your personal average of ${baseline.avgSteps.toLocaleString()}.`,
        observedPatterns: ['Activity volume shift against 7-day baseline.'],
        supportingMetrics: [
          { label: 'Current Steps', value: current.steps.toLocaleString() },
          { label: 'Personal Baseline', value: baseline.avgSteps.toLocaleString() },
        ],
        interpretation:
          diff < 0
            ? 'Sedentary study or desk work frequently causes localized step drops.'
            : 'Increased movement supports cardiovascular circulation.',
        suggestedAction: 'A brief 10-minute stretch or brisk outdoor walk can help balance physical energy.',
        source: 'deterministic_model',
        timestamp: new Date().toISOString(),
      };
    }

    if (q.includes('heart') || q.includes('bpm')) {
      const diff = current.resting_heart_rate - baseline.avgHeartRate;
      return {
        summary: `Your resting heart rate is ${current.resting_heart_rate} BPM (${diff >= 0 ? `+${diff}` : diff} BPM relative to your personal baseline of ${baseline.avgHeartRate} BPM).`,
        observedPatterns: ['Resting cardiac rate variation from personal norm.'],
        supportingMetrics: [
          { label: 'Current Resting HR', value: `${current.resting_heart_rate} BPM` },
          { label: 'Personal Baseline', value: `${baseline.avgHeartRate} BPM` },
        ],
        interpretation:
          diff > 5
            ? 'Elevations in resting heart rate often correlate with reduced sleep, acute stress, hydration status, or post-caffeine states. This is an informational observation, not a diagnostic finding.'
            : 'Resting heart rate remains within your typical expected range.',
        suggestedAction: 'Stay hydrated with water and take a few minutes of deep diaphragmatic breathing.',
        source: 'deterministic_model',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Multi-metric strain check (Alex scenario)
  const isMultiStrain = patterns.some(p => p.type === 'multi_metric_strain');
  if (isMultiStrain) {
    const sleepDiff = Number((current.sleep_hours - baseline.avgSleep).toFixed(1));
    const stepDiff = current.steps - baseline.avgSteps;
    const hrDiff = current.resting_heart_rate - baseline.avgHeartRate;

    return {
      summary:
        'Your sleep duration has decreased compared with your recent personal average. Your daily activity has also decreased, while your resting heart rate has increased.',
      observedPatterns: [
        'Concurrent reduction in sleep duration and ambulatory activity',
        'Moderate elevation in resting heart rate above personal norm',
      ],
      supportingMetrics: [
        { label: 'Sleep Deviation', value: `${sleepDiff} hrs (${current.sleep_hours} vs ${baseline.avgSleep} hrs)` },
        { label: 'Activity Deviation', value: `${stepDiff.toLocaleString()} steps (${current.steps.toLocaleString()} vs ${baseline.avgSteps.toLocaleString()})` },
        { label: 'Resting HR Deviation', value: `+${hrDiff} BPM (${current.resting_heart_rate} vs ${baseline.avgHeartRate} BPM)` },
      ],
      interpretation:
        'When reduced sleep co-occurs with elevated resting heart rate and lower movement, it frequently reflects elevated academic/workload fatigue or lifestyle stress. BioSync observes this correlation without attributing single causation.',
      suggestedAction:
        'Review your recent routine and prioritize restorative recovery. If elevated heart rate or fatigue persists over extended weeks, consider checking in with a qualified healthcare professional.',
      source: 'deterministic_model',
      timestamp: new Date().toISOString(),
    };
  }

  // Default balanced summary
  return {
    summary:
      'Your recent biometric measurements show general alignment with your historical baseline, with normal daily variance.',
    observedPatterns: ['Metrics within standard standard-deviation boundaries.'],
    supportingMetrics: [
      { label: 'Current Sleep', value: `${current.sleep_hours} hrs` },
      { label: 'Current Steps', value: current.steps.toLocaleString() },
      { label: 'Current HR', value: `${current.resting_heart_rate} BPM` },
    ],
    interpretation: 'Your physiological markers indicate standard daily equilibrium.',
    suggestedAction: 'Keep up consistent hydration and regular sleep schedules.',
    source: 'deterministic_model',
    timestamp: new Date().toISOString(),
  };
};

/**
 * Main query function: Calls the Supabase Edge Function if backend endpoint is configured;
 * otherwise gracefully falls back to the deterministic explainable baseline model.
 */
export const queryBioSyncAI = async (
  request: AIInsightRequest,
  edgeFunctionUrl?: string
): Promise<AIInsightResponse> => {
  if (!edgeFunctionUrl) {
    // Return grounded deterministic insight without fake network latency
    return generateDeterministicInsight(request);
  }

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Edge function returned ${response.status}`);
    }

    const data = await response.json();
    if (data.useFallback || !data.result) {
      return generateDeterministicInsight(request);
    }

    return {
      summary: data.result,
      observedPatterns: ['AI synthesized analysis from personal baseline.'],
      supportingMetrics: [
        { label: 'Sleep', value: `${request.current.sleep_hours} hrs` },
        { label: 'Steps', value: request.current.steps.toLocaleString() },
        { label: 'Resting HR', value: `${request.current.resting_heart_rate} BPM` },
      ],
      interpretation: 'Generated via secure edge proxy using structured baseline context.',
      suggestedAction: 'Observe how these patterns evolve across your upcoming days.',
      source: 'edge_function',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Falling back to deterministic intelligence engine:', error);
    return generateDeterministicInsight(request);
  }
};
