// ==============================================================================
// BioSync Circadian Calendar & AI Schedule Harmonizer Component
// Conflict Detection, Visual 24h Timeline, Manual Event Management & Groq LPU AI Optimization
// ==============================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/theme';
import { useHealth } from '../context/HealthContext';
import {
  ScheduleEvent,
  EventCategory,
  DEFAULT_NORMAL_SCHEDULE,
  DEFAULT_CLASHING_SCHEDULE,
  CATEGORY_COLORS,
  detectScheduleClashes,
  timeToMinutes,
  ScheduleAiService,
  ScheduleHarmonizationResult,
} from '../services/scheduleAiService';

export const ScheduleCalendarHarmonizer: React.FC = () => {
  const { currentMetric, baseline } = useHealth();

  // Schedule Events State (starts on clean normal schedule)
  const [events, setEvents] = useState<ScheduleEvent[]>(DEFAULT_NORMAL_SCHEDULE);

  // Form State for manual entry
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('workout');
  const [newStart, setNewStart] = useState('18:00');
  const [newEnd, setNewEnd] = useState('19:30');

  // AI Harmonizer State
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<ScheduleHarmonizationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute conflicts in real-time
  const { clashCount, flaggedEvents, clashSummaries } = useMemo(() => {
    return detectScheduleClashes(events);
  }, [events]);

  // Biometric Context
  const userContext = useMemo(() => {
    return {
      restingHeartRate: currentMetric?.resting_heart_rate ?? 76,
      restingHeartRateBaseline: Math.round(baseline.avgHeartRate || 70),
      sleepHours: currentMetric?.sleep_hours ?? 5.5,
      sleepHoursBaseline: Number((baseline.avgSleep || 7.5).toFixed(1)),
      recoveryPercentage: 65,
      fitnessLevel: 'Intermediate',
      injuryHistory: 'Mild lumbar tension',
    };
  }, [currentMetric, baseline]);

  // Handle Add Manual Event
  const handleAddEvent = () => {
    if (!newTitle.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newEvt: ScheduleEvent = {
      id: `evt_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      startTime: newStart.trim() || '12:00',
      endTime: newEnd.trim() || '13:00',
    };

    setEvents((prev) => [...prev, newEvt]);
    setNewTitle('');
    setIsFormOpen(false);
    setAiResult(null);
  };

  // Handle Delete Event
  const handleDeleteEvent = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setAiResult(null);
  };

  // Handle Return to Clean Normal Schedule
  const handleResetNormal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEvents(DEFAULT_NORMAL_SCHEDULE);
    setAiResult(null);
    setErrorMessage(null);
    setIsFormOpen(false);
  };

  // Handle Reset to Default Clashing Schedule
  const handleResetDefault = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEvents(DEFAULT_CLASHING_SCHEDULE);
    setAiResult(null);
    setErrorMessage(null);
  };

  // Handle AI Schedule Harmonization Call
  const handleHarmonizeSchedule = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await ScheduleAiService.harmonizeSchedule(events, userContext);
    setIsLoading(false);

    if (result.response) {
      setAiResult(result.response);
      setErrorMessage(null);
    } else {
      setErrorMessage(result.error || 'Failed to harmonize schedule');
    }
  };

  // Apply AI's Optimized Schedule
  const handleApplyAiSchedule = () => {
    if (!aiResult || !aiResult.optimizedEvents) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setEvents(aiResult.optimizedEvents);
    setAiResult(null);
  };

  // Calculate duration label
  const getDurationLabel = (start: string, end: string) => {
    const s = timeToMinutes(start);
    let e = timeToMinutes(end);
    if (e <= s) e += 1440;
    const diff = e - s;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.calendarIconBubble}>
            <Ionicons name="calendar" size={18} color={Colors.primaryAccent} />
          </View>
          <View>
            <Text style={styles.title}>Circadian Schedule Harmonizer</Text>
            <Text style={styles.subtitle}>Conflict Detection & AI Chronobiology</Text>
          </View>
        </View>

        {/* Dynamic Status Badge */}
        <View
          style={[
            styles.statusBadge,
            clashCount > 0 ? styles.statusBadgeDanger : styles.statusBadgeSuccess,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              clashCount > 0 ? styles.statusDotDanger : styles.statusDotSuccess,
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              clashCount > 0 ? styles.statusBadgeTextDanger : styles.statusBadgeTextSuccess,
            ]}
          >
            {clashCount > 0 ? `${clashCount} CLASHES DETECTED` : 'NORMAL / BALANCED'}
          </Text>
        </View>
      </View>

      {/* 24-HOUR CIRCADIAN TIMELINE BAR */}
      <View style={styles.timelineCard}>
        <View style={styles.timelineLabelRow}>
          <Text style={styles.timelineTitle}>24-HOUR CIRCADIAN TIMELINE</Text>
          <Text style={styles.timelineHoursMark}>00:00 — 24:00</Text>
        </View>

        <View style={styles.timelineBar}>
          {flaggedEvents.map((evt) => {
            const startMins = timeToMinutes(evt.startTime);
            let endMins = timeToMinutes(evt.endTime);
            if (endMins <= startMins) endMins = 1440; // cap for visualization
            const duration = Math.min(1440, endMins - startMins);

            const leftPercent = (startMins / 1440) * 100;
            const widthPercent = Math.max(3, (duration / 1440) * 100);
            const color = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.other;

            return (
              <View
                key={evt.id}
                style={[
                  styles.timelineSegment,
                  {
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: color.border,
                    borderColor: evt.isClashing ? Colors.danger : 'transparent',
                    borderWidth: evt.isClashing ? 2 : 0,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Timeline Time Labels */}
        <View style={styles.timelineMarksRow}>
          <Text style={styles.timeMarkText}>00:00</Text>
          <Text style={styles.timeMarkText}>06:00</Text>
          <Text style={styles.timeMarkText}>12:00</Text>
          <Text style={styles.timeMarkText}>18:00</Text>
          <Text style={styles.timeMarkText}>24:00</Text>
        </View>
      </View>

      {/* CLASH WARNING BANNER (When Conflicts Exist) */}
      {clashCount > 0 && (
        <View style={styles.clashAlertBox}>
          <View style={styles.clashAlertHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="warning" size={18} color={Colors.warning} />
              <Text style={styles.clashAlertTitle}>PHYSIOLOGICAL CLASHES DETECTED</Text>
            </View>
            <TouchableOpacity onPress={handleResetNormal} style={styles.clashBannerNormalBtn}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.success} style={{ marginRight: 4 }} />
              <Text style={styles.clashBannerNormalBtnText}>Normal</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.clashAlertText}>
            Your schedule contains {clashCount} critical overlap{clashCount > 1 ? 's' : ''} that directly violate your recovery window and work commitments.
          </Text>
          {clashSummaries.map((summary, idx) => (
            <View key={idx} style={styles.clashSummaryRow}>
              <Ionicons name="close-circle" size={14} color={Colors.danger} style={{ marginTop: 2, marginRight: 6 }} />
              <Text style={styles.clashSummaryText}>{summary}</Text>
            </View>
          ))}
        </View>
      )}

      {/* EVENTS LIST */}
      <View style={styles.eventsHeaderRow}>
        <Text style={styles.eventsTitle}>TODAY'S SCHEDULED EVENTS ({events.length})</Text>
        <View style={styles.eventsActionButtons}>
          <TouchableOpacity onPress={handleResetNormal} style={styles.normalButton}>
            <Ionicons name="shield-checkmark" size={13} color={Colors.success} style={{ marginRight: 4 }} />
            <Text style={styles.normalButtonText}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleResetDefault} style={styles.resetButton}>
            <Ionicons name="flame" size={13} color={Colors.warning} style={{ marginRight: 4 }} />
            <Text style={styles.resetButtonText}>Demo Clashes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsFormOpen(!isFormOpen)}
            style={styles.addEventHeaderBtn}
          >
            <Ionicons name={isFormOpen ? 'chevron-up' : 'add'} size={15} color={Colors.primaryAccent} />
            <Text style={styles.addEventHeaderBtnText}>{isFormOpen ? 'Cancel' : 'Add Event'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ADD EVENT INLINE FORM */}
      {isFormOpen && (
        <View style={styles.formContainer}>
          <Text style={styles.formHeader}>ADD CUSTOM SCHEDULE EVENT</Text>
          <TextInput
            style={styles.input}
            placeholder="Event title (e.g. Client Sync, Evening Run)..."
            placeholderTextColor={Colors.secondaryText}
            value={newTitle}
            onChangeText={setNewTitle}
          />

          {/* Category Chips */}
          <Text style={styles.formFieldLabel}>CATEGORY:</Text>
          <View style={styles.categoryChipsRow}>
            {(['work', 'workout', 'social', 'sleep', 'study'] as EventCategory[]).map((cat) => {
              const col = CATEGORY_COLORS[cat];
              const isSelected = newCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setNewCategory(cat)}
                  style={[
                    styles.catChip,
                    {
                      borderColor: col.border,
                      backgroundColor: isSelected ? col.border : col.bg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      { color: isSelected ? '#FFFFFF' : col.text },
                    ]}
                  >
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Range Pickers */}
          <View style={styles.timeInputRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.formFieldLabel}>START (HH:MM):</Text>
              <TextInput
                style={styles.timeInput}
                value={newStart}
                onChangeText={setNewStart}
                placeholder="09:00"
                placeholderTextColor={Colors.secondaryText}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.formFieldLabel}>END (HH:MM):</Text>
              <TextInput
                style={styles.timeInput}
                value={newEnd}
                onChangeText={setNewEnd}
                placeholder="17:00"
                placeholderTextColor={Colors.secondaryText}
              />
            </View>
          </View>

          <TouchableOpacity onPress={handleAddEvent} style={styles.submitBtn}>
            <Ionicons name="checkmark-sharp" size={16} color={Colors.background} style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Add Event to Schedule</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RENDER EVENT CARDS */}
      <View style={styles.eventsList}>
        {flaggedEvents.map((evt) => {
          const catConfig = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.other;
          return (
            <View
              key={evt.id}
              style={[
                styles.eventCard,
                evt.isClashing && styles.eventCardClashing,
              ]}
            >
              <View style={[styles.eventCatBadge, { backgroundColor: catConfig.bg, borderColor: catConfig.border }]}>
                <Ionicons name={catConfig.icon as any} size={15} color={catConfig.text} />
              </View>

              <View style={styles.eventInfo}>
                <View style={styles.eventTitleRow}>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  {evt.isClashing && (
                    <View style={styles.clashBadge}>
                      <Ionicons name="alert" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                      <Text style={styles.clashBadgeText}>CLASH</Text>
                    </View>
                  )}
                </View>

                <View style={styles.eventTimeRow}>
                  <Ionicons name="time-outline" size={12} color={Colors.secondaryText} style={{ marginRight: 4 }} />
                  <Text style={styles.eventTimeText}>
                    {evt.startTime} — {evt.endTime} ({getDurationLabel(evt.startTime, evt.endTime)})
                  </Text>
                  <Text style={[styles.eventCategoryTag, { color: catConfig.text }]}>
                    · {evt.category.toUpperCase()}
                  </Text>
                </View>

                {evt.reason && (
                  <Text style={styles.eventReasonText}>💡 {evt.reason}</Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteEvent(evt.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.secondaryText} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* AI CLASH RESOLUTION ACTION CTA */}
      <TouchableOpacity
        onPress={handleHarmonizeSchedule}
        disabled={isLoading}
        style={[
          styles.harmonizeCtaBtn,
          isLoading && styles.harmonizeCtaBtnDisabled,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.background} style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="sparkles" size={18} color={Colors.background} style={{ marginRight: 8 }} />
        )}
        <Text style={styles.harmonizeCtaBtnText}>
          {isLoading ? 'Groq LPU Analyzing Chronobiology & Clashes...' : 'Harmonize Clashes with BioSync AI'}
        </Text>
      </TouchableOpacity>

      {/* ERROR NOTICE */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={Colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* AI HARMONIZATION RESULT CARD */}
      {aiResult && !isLoading && (
        <View style={styles.aiResultCard}>
          <View style={styles.aiResultHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.aiResultBadgeRow}>
                <View style={styles.aiResultPill}>
                  <Ionicons name="sparkles" size={12} color={Colors.primaryAccent} style={{ marginRight: 4 }} />
                  <Text style={styles.aiResultPillText}>GROQ LPU HARMONIZER</Text>
                </View>
                <Text style={styles.aiResultSub}>SUB-SECOND INFERENCE</Text>
              </View>
              <Text style={styles.aiResultTitle}>{aiResult.title}</Text>
            </View>
          </View>

          {/* Conflict Summary Diagnostic */}
          <Text style={styles.aiConflictSummary}>{aiResult.conflictSummary}</Text>

          {/* Recovery Impact Pill */}
          <View style={styles.recoveryImpactPill}>
            <Ionicons name="pulse" size={14} color={Colors.success} style={{ marginRight: 6 }} />
            <Text style={styles.recoveryImpactText}>
              {aiResult.recoveryImpactScore}
            </Text>
          </View>

          {/* Circadian & Biomechanical Recommendations */}
          {aiResult.circadianRecommendations && aiResult.circadianRecommendations.length > 0 && (
            <View style={styles.recommendationsBox}>
              <Text style={styles.recHeader}>AI CHRONOBIOLOGY RECOMMENDATIONS:</Text>
              {aiResult.circadianRecommendations.map((rec, i) => (
                <View key={i} style={styles.recRow}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primaryAccent} style={{ marginRight: 6, marginTop: 2 }} />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Row: Apply AI Schedule or Back to Normal */}
          <View style={styles.aiActionRow}>
            <TouchableOpacity
              onPress={handleApplyAiSchedule}
              style={styles.applyBtn}
            >
              <Ionicons name="flash" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>Apply AI Harmonized Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResetNormal}
              style={styles.backToNormalBtn}
            >
              <Ionicons name="shield-checkmark" size={14} color={Colors.success} style={{ marginRight: 5 }} />
              <Text style={styles.backToNormalBtnText}>Back to Normal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.2)',
    padding: 16,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
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
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeDanger: {
    backgroundColor: 'rgba(255, 100, 124, 0.15)',
    borderColor: 'rgba(255, 100, 124, 0.4)',
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
    borderColor: 'rgba(55, 214, 160, 0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusDotDanger: {
    backgroundColor: Colors.danger,
  },
  statusDotSuccess: {
    backgroundColor: Colors.success,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadgeTextDanger: {
    color: Colors.danger,
  },
  statusBadgeTextSuccess: {
    color: Colors.success,
  },
  timelineCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryAccent,
    letterSpacing: 0.8,
  },
  timelineHoursMark: {
    fontSize: 10,
    color: Colors.secondaryText,
  },
  timelineBar: {
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  timelineSegment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 4,
    opacity: 0.85,
  },
  timelineMarksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeMarkText: {
    fontSize: 9,
    color: Colors.secondaryText,
  },
  clashAlertBox: {
    backgroundColor: 'rgba(255, 100, 124, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 124, 0.35)',
    padding: 12,
    marginBottom: 14,
  },
  clashAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clashAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.danger,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  clashAlertText: {
    fontSize: 12,
    color: Colors.primaryText,
    marginBottom: 8,
    lineHeight: 16,
  },
  clashSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  clashSummaryText: {
    fontSize: 11,
    color: Colors.secondaryText,
    flex: 1,
  },
  eventsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.8,
  },
  eventsActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  normalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(55, 214, 160, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(55, 214, 160, 0.35)',
    marginRight: 6,
  },
  normalButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  clashBannerNormalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(55, 214, 160, 0.4)',
  },
  clashBannerNormalBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 6,
  },
  resetButtonText: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  addEventHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
  },
  addEventHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryAccent,
  },
  formContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
  },
  formHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryAccent,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.primaryText,
    fontSize: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryText,
    marginBottom: 6,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.primaryText,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primaryAccent,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  eventsList: {
    gap: 8,
    marginBottom: 14,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventCardClashing: {
    borderColor: 'rgba(255, 100, 124, 0.5)',
    backgroundColor: 'rgba(255, 100, 124, 0.05)',
  },
  eventCatBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
    marginRight: 6,
  },
  clashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  clashBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTimeText: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  eventCategoryTag: {
    fontSize: 10,
    fontWeight: '700',
  },
  eventReasonText: {
    fontSize: 11,
    color: Colors.primaryAccent,
    marginTop: 4,
    lineHeight: 15,
  },
  deleteButton: {
    padding: 6,
  },
  harmonizeCtaBtn: {
    backgroundColor: Colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  harmonizeCtaBtnDisabled: {
    opacity: 0.6,
  },
  harmonizeCtaBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 100, 124, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    flex: 1,
  },
  aiResultCard: {
    backgroundColor: '#0D1527',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.4)',
    padding: 14,
    marginTop: 14,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiResultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiResultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  aiResultPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  aiResultSub: {
    fontSize: 9,
    color: Colors.secondaryText,
    fontWeight: '700',
  },
  aiResultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  aiConflictSummary: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
    marginBottom: 10,
  },
  recoveryImpactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 214, 160, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 214, 160, 0.3)',
  },
  recoveryImpactText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
    flex: 1,
  },
  recommendationsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  recHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryAccent,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  recText: {
    fontSize: 11,
    color: Colors.primaryText,
    flex: 1,
    lineHeight: 15,
  },
  aiActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: Colors.secondaryAccent,
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  backToNormalBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(55, 214, 160, 0.4)',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToNormalBtnText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
});
