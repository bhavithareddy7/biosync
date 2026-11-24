// ==============================================================================
// BioSync Screen 4: AI Insights & Wellness Assistant (Section 10)
// Today's summary, detected baseline patterns, grounded AI chat & contextual nudges
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useHealth } from '../../context/HealthContext';
import { InsightCard } from '../../components/InsightCard';
import { ChatInterface } from '../../components/ChatInterface';

export default function InsightsScreen() {
  const { currentMetric, baseline, patterns, deviations } = useHealth();
  const [activeTab, setActiveTab] = useState<'patterns' | 'chat'>('patterns');

  const sleepVal = currentMetric?.sleep_hours ?? 5.5;
  const hrVal = currentMetric?.resting_heart_rate ?? 76;
  const stepsVal = currentMetric?.steps ?? 4000;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>BioSync Intelligence</Text>
            <Text style={styles.screenSubtitle}>Understand the patterns behind your data.</Text>
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color={Colors.primaryAccent} />
            <Text style={styles.aiBadgeText}>AI PATTERNS</Text>
          </View>
        </View>

        {/* SECTION A: TODAY'S AUTOMATED SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Ionicons name="bulb-outline" size={18} color={Colors.secondaryAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Today's Behavioral & Physiological Synthesis</Text>
              <Text style={styles.summaryDate}>Date: {currentMetric?.date || 'Today'}</Text>
            </View>
          </View>

          <Text style={styles.summaryBody}>
            {sleepVal < baseline.avgSleep && hrVal > baseline.avgHeartRate
              ? `Your sleep duration of ${sleepVal} hrs is below your personal ${baseline.avgSleep} hr average. Concurrently, your resting heart rate is elevated by +${hrVal - baseline.avgHeartRate} BPM and daily activity decreased to ${stepsVal.toLocaleString()} steps. This multi-metric shift reflects heightened physical fatigue.`
              : `Your daily biometric indicators align closely with your personal baseline moving averages. Sleep and resting cardiac metrics show balanced recovery.`}
          </Text>

          <View style={styles.summaryTagsRow}>
            <View style={styles.summaryTag}>
              <Text style={styles.tagLabel}>Sleep: </Text>
              <Text style={styles.tagVal}>{sleepVal}h (vs {baseline.avgSleep}h)</Text>
            </View>
            <View style={styles.summaryTag}>
              <Text style={styles.tagLabel}>Resting HR: </Text>
              <Text style={styles.tagVal}>{hrVal} bpm (vs {baseline.avgHeartRate})</Text>
            </View>
            <View style={styles.summaryTag}>
              <Text style={styles.tagLabel}>Steps: </Text>
              <Text style={styles.tagVal}>{stepsVal.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* View Switcher: Detected Patterns vs AI Assistant Chat */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.switcherTab, activeTab === 'patterns' && styles.switcherTabActive]}
            onPress={() => setActiveTab('patterns')}
          >
            <Ionicons
              name="analytics-outline"
              size={15}
              color={activeTab === 'patterns' ? Colors.primaryAccent : Colors.secondaryText}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.switcherTabText, activeTab === 'patterns' && styles.switcherTabTextActive]}>
              Detected Patterns ({patterns.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switcherTab, activeTab === 'chat' && styles.switcherTabActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={15}
              color={activeTab === 'chat' ? Colors.primaryAccent : Colors.secondaryText}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.switcherTabText, activeTab === 'chat' && styles.switcherTabTextActive]}>
              AI Wellness Assistant
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: DETECTED PATTERNS & NUDGES */}
        {activeTab === 'patterns' ? (
          <View>
            {/* SECTION B: DETECTED PATTERNS LIST */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Identified Baseline Shifts</Text>
              <Text style={styles.evidenceTag}>NON-CAUSAL OBSERVATIONS</Text>
            </View>

            {patterns.map(pattern => (
              <InsightCard key={pattern.id} pattern={pattern} />
            ))}

            {/* SECTION D: PERSONALIZED NON-MEDICAL NUDGES */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Contextual Lifestyle Nudges</Text>
              <Text style={styles.optionalTag}>OPTIONAL HABITS</Text>
            </View>

            {/* Nudge 1 */}
            <View style={styles.nudgeCard}>
              <View style={[styles.nudgeIcon, { backgroundColor: 'rgba(53, 214, 242, 0.12)' }]}>
                <Ionicons name="moon-outline" size={18} color={Colors.primaryAccent} />
              </View>
              <View style={styles.nudgeContent}>
                <Text style={styles.nudgeTitle}>Prioritize Pre-Sleep Wind Down</Text>
                <Text style={styles.nudgeBody}>
                  With sleep duration trending below baseline, consider beginning a low-light relaxation routine 30-45 minutes earlier this evening.
                </Text>
              </View>
            </View>

            {/* Nudge 2 */}
            <View style={styles.nudgeCard}>
              <View style={[styles.nudgeIcon, { backgroundColor: 'rgba(55, 214, 160, 0.12)' }]}>
                <Ionicons name="walk-outline" size={18} color={Colors.success} />
              </View>
              <View style={styles.nudgeContent}>
                <Text style={styles.nudgeTitle}>Light Movement Break</Text>
                <Text style={styles.nudgeBody}>
                  Take a short 10-minute standing stretch or campus walk if prolonged study or desk sessions have kept steps suppressed.
                </Text>
              </View>
            </View>

            {/* Nudge 3 */}
            <View style={styles.nudgeCard}>
              <View style={[styles.nudgeIcon, { backgroundColor: 'rgba(139, 114, 255, 0.12)' }]}>
                <Ionicons name="water-outline" size={18} color={Colors.secondaryAccent} />
              </View>
              <View style={styles.nudgeContent}>
                <Text style={styles.nudgeTitle}>Hydration & Autonomic Recovery</Text>
                <Text style={styles.nudgeBody}>
                  Resting heart rate elevation often responds favorably to regular water intake and pacing caffeine consumption in the afternoon.
                </Text>
              </View>
            </View>

            {/* Medical Boundary Clarification */}
            <View style={styles.boundaryNotice}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.mutedText} style={{ marginRight: 6 }} />
              <Text style={styles.boundaryNoticeText}>
                BioSync pattern detection does not diagnose, predict or treat conditions. For chronic shifts in heart rate or ongoing exhaustion, consult a qualified healthcare physician.
              </Text>
            </View>
          </View>
        ) : (
          /* TAB 2: AI WELLNESS ASSISTANT CHAT */
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Ask BioSync About Your Twin</Text>
            </View>
            <ChatInterface
              currentMetric={currentMetric}
              baseline={baseline}
              patterns={patterns}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: Typography.fontSize.mainHeading,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  screenSubtitle: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139, 114, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  summaryDate: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  summaryBody: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    lineHeight: 22,
    marginBottom: 12,
  },
  summaryTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  summaryTag: {
    flexDirection: 'row',
    backgroundColor: Colors.secondaryBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagLabel: {
    fontSize: 10,
    color: Colors.mutedText,
  },
  tagVal: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 3,
    marginBottom: 16,
  },
  switcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Spacing.borderRadius.sm,
  },
  switcherTabActive: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switcherTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  switcherTabTextActive: {
    color: Colors.primaryAccent,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  evidenceTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.5,
  },
  optionalTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
    letterSpacing: 0.5,
  },
  nudgeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nudgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nudgeContent: {
    flex: 1,
  },
  nudgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  nudgeBody: {
    fontSize: 11,
    color: Colors.secondaryText,
    lineHeight: 16,
  },
  boundaryNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: Spacing.borderRadius.md,
    marginTop: 8,
    marginBottom: 16,
  },
  boundaryNoticeText: {
    flex: 1,
    fontSize: 10,
    color: Colors.mutedText,
    lineHeight: 14,
  },
});
