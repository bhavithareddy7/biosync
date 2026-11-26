// ==============================================================================
// BioSync Built-in AI Gym Coach Component
// Powered by Google Gemini 2.5 Flash / 2.0 Flash (@google/genai) with Structured Outputs,
// Live Biometric Context ("My Twin"), Loading Skeleton & Real API Error Surfacing
// ==============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/theme';
import { AI_WORKOUT_PROMPTS } from '../constants/exerciseDatabase';
import {
  WorkoutAiService,
  CoachResponseSchema,
  CoachUserContext,
} from '../services/workoutAiService';
import { useHealth } from '../context/HealthContext';
import { Exercise } from '../types/workout';
import { WorkoutService } from '../services/workoutService';

interface WorkoutAiAssistantProps {
  onSelectExercise?: (exercise: Exercise) => void;
}

export const WorkoutAiAssistant: React.FC<WorkoutAiAssistantProps> = ({ onSelectExercise }) => {
  const { currentMetric, baseline } = useHealth();
  const [recentLogs, setRecentLogs] = useState<CoachUserContext['myData']['recentLogs']>([]);

  useEffect(() => {
    WorkoutService.getWorkoutSessions()
      .then((sessions) => {
        const formatted = sessions.slice(0, 3).map((s) => ({
          routine: s.routineName,
          date: s.date,
          totalVolumeKg: s.totalVolumeKg,
          exercises: s.exercises.map((e) => e.exerciseName),
        }));
        setRecentLogs(formatted);
      })
      .catch(() => {});
  }, []);

  // Biometric Context Injection ("My Twin" & "My Data")
  const userContext = useMemo<CoachUserContext>(() => {
    const rhr = currentMetric?.resting_heart_rate ?? 76;
    const rhrBase = baseline?.avgHeartRate ?? 70;
    const sleep = currentMetric?.sleep_hours ?? 5.5;
    const sleepBase = baseline?.avgSleep ?? 7.5;

    const hrPenalty = Math.max(0, (rhr - rhrBase) * 3.5);
    const sleepPenalty = Math.max(0, (sleepBase - sleep) * 12);
    const recoveryScore = Math.max(25, Math.min(100, Math.round(100 - hrPenalty - sleepPenalty)));

    return {
      myTwin: {
        restingHeartRate: rhr,
        restingHeartRateBaseline: Math.round(rhrBase),
        sleepHours: sleep,
        sleepHoursBaseline: Number(sleepBase.toFixed(1)),
        fitnessLevel: 'Intermediate (Strength & Hypertrophy)',
        injuryHistory: 'Mild lower lumbar strain history; avoid unbraced axial spinal compression',
      },
      myData: {
        activeSplit: 'Upper Body & Core Focus',
        recoveryPercentage: recoveryScore,
        recentLogs,
      },
    };
  }, [currentMetric, baseline, recentLogs]);

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeResponse, setActiveResponse] = useState<CoachResponseSchema | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);

  // Active request tracking to prevent stale or aborted responses from overwriting fresh queries
  const activeControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // Skeleton pulse animation
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    WorkoutAiService.checkApiStatus().then((status) => {
      setHasServerKey(status.hasKey);
    });
  }, []);

  // Unmount cleanup: cancel any in-flight request
  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        try {
          activeControllerRef.current.abort();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (isLoading) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.85,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(0.3);
    }
    return () => animation?.stop();
  }, [isLoading, pulseAnim]);

  const executeCoachingQuery = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // 1. Abort previous in-flight request if any
    if (activeControllerRef.current) {
      try {
        activeControllerRef.current.abort();
      } catch {}
    }

    // 2. Create a BRAND NEW AbortController and bump request sequence ID
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const currentRequestId = ++activeRequestIdRef.current;

    setIsLoading(true);
    setErrorNotice(null);
    setActiveResponse(null);

    try {
      const result = await WorkoutAiService.fetchCoachingAdvice(
        trimmed,
        userContext,
        controller.signal
      );

      // Guard: Discard if a newer query or retry was initiated while waiting
      if (activeRequestIdRef.current !== currentRequestId) {
        return;
      }

      if (result.response) {
        setActiveResponse(result.response);
        setErrorNotice(null);
      } else {
        setActiveResponse(null);
        setErrorNotice(result.error || 'Failed to retrieve response from Gemini API');
      }
    } catch (err: any) {
      if (activeRequestIdRef.current !== currentRequestId) {
        return;
      }
      setActiveResponse(null);
      setErrorNotice(err?.message || 'Unexpected communication failure with AI coach');
    } finally {
      if (activeRequestIdRef.current === currentRequestId) {
        setIsLoading(false);
      }
    }
  };

  const handlePromptPress = (question: string) => {
    setQuery(question);
    executeCoachingQuery(question);
  };

  const handleAsk = () => {
    if (!query.trim() || isLoading) return;
    executeCoachingQuery(query);
  };

  const handleRetry = () => {
    const q = query.trim() || 'How do I protect my lower back while doing dumbbell rows?';
    executeCoachingQuery(q);
  };

  const suggestedEx = activeResponse?.suggestedExerciseId
    ? WorkoutService.getExerciseById(activeResponse.suggestedExerciseId)
    : undefined;

  const getBadgeStyle = (title: string) => {
    const t = (title || '').toUpperCase();
    if (t.includes('FORM')) {
      return { bg: 'rgba(53, 214, 242, 0.15)', text: Colors.primaryAccent };
    }
    if (t.includes('RECOVERY') || t.includes('READINESS')) {
      return { bg: 'rgba(255, 184, 92, 0.15)', text: Colors.warning };
    }
    if (t.includes('SUBSTITUTION') || t.includes('ALTERNATIVE')) {
      return { bg: 'rgba(55, 214, 160, 0.15)', text: Colors.success };
    }
    return { bg: 'rgba(139, 114, 255, 0.15)', text: Colors.secondaryAccent };
  };

  const badgeTheme = getBadgeStyle(activeResponse?.cardTitle || '');

  return (
    <View style={styles.card}>
      {/* Header with AI Badge & Telemetry Grounding */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIconBubble}>
            <Ionicons name="sparkles" size={16} color={Colors.primaryAccent} />
          </View>
          <View>
            <Text style={styles.title}>BioSync AI Gym Coach</Text>
            <Text style={styles.subtitle}>
              Powered by Google Gemini (gemini-3.8-flash / gemini-3.5-flash-lite)
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            hasServerKey ? styles.statusBadgeLive : styles.statusBadgeEngine,
          ]}
        >
          <View
            style={[
              styles.activeDot,
              hasServerKey ? styles.activeDotLive : styles.activeDotEngine,
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              hasServerKey ? styles.statusBadgeTextLive : styles.statusBadgeTextEngine,
            ]}
          >
            {hasServerKey ? 'GEMINI LIVE' : 'API READY'}
          </Text>
        </View>
      </View>

      {/* Biometric Context Strip */}
      <View style={styles.biometricPill}>
        <Ionicons name="pulse" size={13} color={Colors.warning} />
        <Text style={styles.biometricPillText}>
          Injected Biometrics:{' '}
          <Text style={styles.biometricPillBold}>
            {userContext.myTwin.restingHeartRate} BPM RHR (
            {userContext.myTwin.restingHeartRate - userContext.myTwin.restingHeartRateBaseline >= 0 ? '+' : ''}
            {userContext.myTwin.restingHeartRate - userContext.myTwin.restingHeartRateBaseline}) ·{' '}
            {userContext.myTwin.sleepHours}h Sleep (
            {(userContext.myTwin.sleepHours - userContext.myTwin.sleepHoursBaseline).toFixed(1)}h) ·{' '}
            Recovery: {userContext.myData.recoveryPercentage}%
          </Text>
        </Text>
      </View>

      {/* Suggested Quick Question Chips */}
      <View style={styles.chipsSection}>
        <Text style={styles.chipsTitle}>FREQUENT COACH INQUIRIES:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {AI_WORKOUT_PROMPTS.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => handlePromptPress(p.question)}
              style={styles.chip}
              disabled={isLoading}
            >
              <Ionicons name={p.icon as any} size={12} color={Colors.primaryAccent} style={{ marginRight: 5 }} />
              <Text style={styles.chipText}>{p.question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Freeform Query Input Bar */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask form angles, spinal cues, apartment swaps..."
          placeholderTextColor={Colors.secondaryText}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleAsk}
          editable={!isLoading}
        />
        <TouchableOpacity
          onPress={handleAsk}
          style={[styles.sendBtn, isLoading && styles.sendBtnDisabled]}
          disabled={isLoading}
        >
          <Ionicons
            name={isLoading ? 'hourglass' : 'arrow-forward'}
            size={16}
            color={Colors.background}
          />
        </TouchableOpacity>
      </View>

      {/* Loading Skeleton */}
      {isLoading && (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonHeaderRow}>
            <Animated.View style={[styles.skeletonBadge, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonPill, { opacity: pulseAnim }]} />
          </View>
          <Animated.View style={[styles.skeletonLineLarge, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonLineMedium, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonLineShort, { opacity: pulseAnim }]} />

          <View style={styles.skeletonCuesBox}>
            <Animated.View style={[styles.skeletonCueHeader, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonCueRow, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonCueRow, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonCueRow, { opacity: pulseAnim }]} />
          </View>

          <View style={styles.skeletonFooter}>
            <Ionicons name="sparkles" size={12} color={Colors.primaryAccent} />
            <Text style={styles.skeletonFooterText}>
              Contacting Google Gemini API with biometrics & biomechanics context...
            </Text>
          </View>
        </View>
      )}

      {/* Surface Real Gemini API Error in the UI (No fake text) */}
      {errorNotice && !isLoading && !activeResponse && (
        <View style={styles.errorCardContainer}>
          <View style={styles.errorCardHeader}>
            <Ionicons
              name={
                errorNotice.includes('[Request Timeout]')
                  ? 'time-outline'
                  : errorNotice.includes('[Network Error]')
                  ? 'cloud-offline-outline'
                  : 'alert-circle'
              }
              size={18}
              color={Colors.danger}
            />
            <Text style={styles.errorCardTitle}>
              {errorNotice.includes('[Request Timeout]')
                ? 'COACH REQUEST TIMEOUT'
                : errorNotice.includes('[Network Error]')
                ? 'CONNECTION ERROR'
                : 'GEMINI API ERROR'}
            </Text>
          </View>
          <Text style={styles.errorCardText}>{errorNotice}</Text>
          <View style={styles.errorCardFooter}>
            <Text style={styles.errorCardHint}>
              {errorNotice.includes('[Request Timeout]')
                ? 'Gemini reasoning took longer than expected due to high demand. Tapping retry will immediately start a clean, fresh request.'
                : 'Exact response from server. Check your Gemini API key in .env.local or Google AI Studio model availability.'}
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              style={styles.errorRetryBtn}
            >
              <Ionicons name="refresh" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.errorRetryBtnText}>Retry API Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Initial Guidance Card (Before first query) */}
      {!activeResponse && !errorNotice && !isLoading && (
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <Ionicons name="chatbubbles" size={18} color={Colors.primaryAccent} />
            <Text style={styles.welcomeTitle}>READY FOR YOUR QUESTIONS</Text>
          </View>
          <Text style={styles.welcomeText}>
            Ask any exercise form question or tap one of the frequent coach prompts above. Your biometric telemetry (Resting HR: {userContext.myTwin.restingHeartRate} BPM, Sleep: {userContext.myTwin.sleepHours}h) is automatically passed to Gemini for personalized advice.
          </Text>
        </View>
      )}

      {/* Live Gemini Response Card Rendering */}
      {activeResponse && !isLoading && (
        <View style={styles.responseContainer}>
          {/* Dynamic Card Title Badge */}
          <View style={styles.responseCategoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: badgeTheme.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: badgeTheme.text }]}>
                {activeResponse.cardTitle.toUpperCase()}
              </Text>
            </View>

            <View style={styles.sourceTag}>
              <Ionicons name="sparkles" size={10} color={Colors.primaryAccent} />
              <Text style={[styles.sourceTagText, { color: Colors.primaryAccent }]}>
                gemini-live
              </Text>
            </View>
          </View>

          {/* Structured Summary (2-3 crisp sentences) */}
          <Text style={styles.responseText}>{activeResponse.summary}</Text>

          {/* Dynamic Bullet Cues Section */}
          {activeResponse.bulletCues && activeResponse.bulletCues.length > 0 && (
            <View style={styles.cuesList}>
              <Text style={styles.cuesTitle}>{activeResponse.cuesTitle.toUpperCase()}</Text>
              {activeResponse.bulletCues.map((cue, idx) => (
                <View key={idx} style={styles.cueItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={badgeTheme.text}
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <Text style={styles.cueText}>{cue}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Suggested Exercise Launcher Pill */}
          {suggestedEx && (
            <TouchableOpacity
              onPress={() => onSelectExercise?.(suggestedEx)}
              style={styles.suggestedExPill}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestedExLabel}>RECOMMENDED EXERCISE SWAP</Text>
                <Text style={styles.suggestedExName}>{suggestedEx.name}</Text>
                <Text style={styles.suggestedExSub}>
                  {suggestedEx.targetMuscle.replace('_', ' ').toUpperCase()} · {suggestedEx.impactLevel}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primaryAccent} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.25)',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  statusBadgeLive: {
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.4)',
  },
  statusBadgeEngine: {
    backgroundColor: 'rgba(255, 184, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 92, 0.3)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDotLive: {
    backgroundColor: Colors.primaryAccent,
  },
  activeDotEngine: {
    backgroundColor: Colors.warning,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadgeTextLive: {
    color: Colors.primaryAccent,
  },
  statusBadgeTextEngine: {
    color: Colors.warning,
  },
  biometricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 92, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 92, 0.2)',
  },
  biometricPillText: {
    fontSize: 11,
    color: Colors.secondaryText,
    flex: 1,
  },
  biometricPillBold: {
    color: Colors.warning,
    fontWeight: '700',
  },
  chipsSection: {
    marginBottom: 12,
  },
  chipsTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 260,
  },
  chipText: {
    fontSize: 11,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: Colors.primaryText,
    fontSize: 12,
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: Colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  // Real API Error Card (Prominently surfaces error)
  errorCardContainer: {
    backgroundColor: 'rgba(255, 100, 124, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 124, 0.4)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  errorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  errorCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.danger,
    letterSpacing: 0.6,
  },
  errorCardText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.primaryText,
    marginBottom: 10,
  },
  errorCardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 100, 124, 0.2)',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorCardHint: {
    fontSize: 10,
    color: Colors.secondaryText,
    flex: 1,
    minWidth: 180,
  },
  errorRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  errorRetryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Welcome Initial Card
  welcomeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryAccent,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryAccent,
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.secondaryText,
  },
  // Skeleton Loader Styles
  skeletonContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryAccent,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonBadge: {
    width: 90,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  skeletonPill: {
    width: 80,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skeletonLineLarge: {
    width: '100%',
    height: 13,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 8,
  },
  skeletonLineMedium: {
    width: '92%',
    height: 13,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 8,
  },
  skeletonLineShort: {
    width: '65%',
    height: 13,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
  },
  skeletonCuesBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  skeletonCueHeader: {
    width: 130,
    height: 10,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  skeletonCueRow: {
    width: '95%',
    height: 11,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 7,
  },
  skeletonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  skeletonFooterText: {
    fontSize: 10,
    color: Colors.primaryAccent,
    fontStyle: 'italic',
  },
  // Real Card Content Styles
  responseContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryAccent,
  },
  responseCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceTagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  responseText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.primaryText,
    marginBottom: 12,
  },
  cuesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cuesTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cueText: {
    fontSize: 11,
    color: Colors.primaryText,
    fontWeight: '500',
    lineHeight: 16,
    flex: 1,
  },
  suggestedExPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(53, 214, 242, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.25)',
  },
  suggestedExLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  suggestedExName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryText,
    marginTop: 1,
  },
  suggestedExSub: {
    fontSize: 10,
    color: Colors.secondaryText,
    marginTop: 1,
  },
});
