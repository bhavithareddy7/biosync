// ==============================================================================
// BioSync Screen 2: Home Dashboard (Section 8)
// Executive Wellness Overview, Digital Twin Snapshot, 4 Metric Cards, 7D Activity, AI Insight & Quick Actions
// ==============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useHealth } from '../../context/HealthContext';
import { DigitalTwinVisualizer } from '../../components/DigitalTwinVisualizer';
import { MetricCard } from '../../components/MetricCard';
import { ActivityBarChart } from '../../components/ActivityBarChart';
import { InsightCard } from '../../components/InsightCard';
import { ScheduleCalendarHarmonizer } from '../../components/ScheduleCalendarHarmonizer';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const {
    currentMetric,
    baseline,
    metrics,
    patterns,
    profile,
    isLoading,
    refreshCalculations,
  } = useHealth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Latest high-priority pattern
  const topInsight = patterns[0] || {
    id: 'default_pattern',
    date: currentMetric?.date || 'Today',
    type: 'lifestyle_pattern',
    title: 'Baseline Monitoring Active',
    severity: 'info',
    explanation: 'Your personal baseline is calculated continuously from your recorded health metrics.',
    supportingMetrics: [
      { metric: 'Sleep Baseline', current: `${currentMetric?.sleep_hours ?? 5.5}h`, baseline: `${baseline.avgSleep}h`, deviation: '-2.0h' },
      { metric: 'Steps Baseline', current: '4,000', baseline: '7,000', deviation: '-3,000' },
      { metric: 'Resting HR', current: '76 BPM', baseline: '68 BPM', deviation: '+8 BPM' },
    ],
    recommendation: 'Observe changes in resting heart rate and sleep over consecutive days.',
  };

  const sleepVal = currentMetric?.sleep_hours ?? 5.5;
  const sleepDiff = Number((sleepVal - (baseline.avgSleep || 7.5)).toFixed(1));

  const stepsVal = currentMetric?.steps ?? 4000;
  const stepsDiff = stepsVal - (baseline.avgSteps || 7000);

  const hrVal = currentMetric?.resting_heart_rate ?? 76;
  const hrDiff = hrVal - (baseline.avgHeartRate || 68);

  const exVal = currentMetric?.exercise_minutes ?? 25;
  const exDiff = exVal - (baseline.avgExercise || 30);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshCalculations}
            tintColor={Colors.primaryAccent}
          />
        }
      >
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}>
              <Ionicons name="finger-print" size={18} color={Colors.primaryAccent} />
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()}, {profile.name || 'Alex'}</Text>
              <Text style={styles.dateText}>{todayFormatted}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/(tabs)/insights')}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.primaryText} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.avatarText}>
                {(profile.name || 'A').charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION A: DIGITAL TWIN SUMMARY CARD */}
        <View style={styles.twinSummaryCard}>
          <View style={styles.twinHeaderRow}>
            <View>
              <Text style={styles.twinTitle}>Your Digital Twin</Text>
              <Text style={styles.twinSubtitle}>Your wellness, intelligently connected.</Text>
            </View>
            <View style={styles.twinStatusPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.twinStatusText}>LIVE TWIN</Text>
            </View>
          </View>

          {/* Visual Hologram Silhouette */}
          <DigitalTwinVisualizer
            currentMetric={currentMetric}
            baseline={baseline}
            size="compact"
          />

          <View style={styles.twinFooterRow}>
            <Text style={styles.twinReadyText}>
              Your personal wellness profile is ready.
            </Text>
            <Text style={styles.metricsCountText}>
              Tracking 4 Core Dimensions
            </Text>
          </View>
        </View>

        {/* WORKOUT & GYM INTELLIGENCE LAUNCH CARD */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/workout' as any)}
          style={styles.workoutBannerCard}
        >
          <View style={styles.workoutBannerLeft}>
            <View style={styles.workoutIconCircle}>
              <Ionicons name="barbell" size={20} color={Colors.primaryAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.workoutBannerTitleRow}>
                <Text style={styles.workoutBannerTitle}>Workout & Gym Intelligence</Text>
                <View style={styles.workoutNewBadge}>
                  <Text style={styles.workoutNewBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={styles.workoutBannerSub}>
                Granular Filtering · Upper Back & Core Focus · Built-in Reps & Weight Logging
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.primaryAccent} />
        </TouchableOpacity>

        {/* SECTION: CIRCADIAN CALENDAR & AI SCHEDULE HARMONIZER */}
        <ScheduleCalendarHarmonizer />

        {/* SECTION B: KEY HEALTH METRICS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Key Biometric Dimensions</Text>
          <View style={styles.baselineTag}>
            <Text style={styles.baselineTagText}>{baseline.windowDays}D BASELINE REF</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {/* CARD 1: Sleep Duration */}
          <MetricCard
            title="Sleep Duration"
            value={sleepVal}
            unit="hrs"
            baseline={baseline.avgSleep || 7.5}
            change={sleepDiff >= 0 ? `+${sleepDiff} hrs` : `${sleepDiff} hrs`}
            isPositiveDirection={true}
            iconName="moon-outline"
            accentColor={Colors.primaryAccent}
            sparklineData={[7.8, 7.5, 7.2, 6.8, 6.2, 5.8, 5.5]}
            isDemo={currentMetric?.source === 'demo'}
          />

          {/* CARD 2: Daily Steps */}
          <MetricCard
            title="Daily Steps"
            value={stepsVal.toLocaleString()}
            unit="steps"
            baseline={(baseline.avgSteps || 7000).toLocaleString()}
            change={stepsDiff >= 0 ? `+${stepsDiff.toLocaleString()}` : `${stepsDiff.toLocaleString()}`}
            isPositiveDirection={true}
            iconName="footsteps-outline"
            accentColor={Colors.success}
            sparklineData={[7200, 7400, 6800, 5900, 5200, 4300, 4000]}
            isDemo={currentMetric?.source === 'demo'}
          />

          {/* CARD 3: Resting Heart Rate */}
          <MetricCard
            title="Resting Heart Rate"
            value={hrVal}
            unit="BPM"
            baseline={baseline.avgHeartRate || 68}
            change={hrDiff >= 0 ? `+${hrDiff} BPM` : `${hrDiff} BPM`}
            isPositiveDirection={false} // Lower HR is generally better rest
            iconName="heart-outline"
            accentColor={Colors.danger}
            sparklineData={[66, 68, 69, 71, 73, 74, 76]}
            isDemo={currentMetric?.source === 'demo'}
          />

          {/* CARD 4: Exercise Duration */}
          <MetricCard
            title="Exercise Duration"
            value={exVal}
            unit="min"
            baseline={baseline.avgExercise || 30}
            change={exDiff >= 0 ? `+${exDiff} min` : `${exDiff} min`}
            isPositiveDirection={true}
            iconName="barbell-outline"
            accentColor={Colors.secondaryAccent}
            sparklineData={[45, 40, 30, 25, 20, 20, 25]}
            isDemo={currentMetric?.source === 'demo'}
          />
        </View>

        {/* SECTION C: WEEKLY ACTIVITY CHART */}
        <ActivityBarChart
          metrics={metrics}
          baselineSteps={baseline.avgSteps || 7000}
        />

        {/* SECTION D: LATEST AI INSIGHT */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>BioSync Intelligence</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/insights')}>
            <Text style={styles.viewAllText}>View All Insights</Text>
          </TouchableOpacity>
        </View>

        <InsightCard
          pattern={topInsight}
          onPressDetails={() => router.push('/(tabs)/insights')}
        />

        {/* SECTION E: QUICK ACTIONS */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {/* Action 1: Add Health Data */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/data')}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(53, 214, 242, 0.15)' }]}>
                <Ionicons name="add" size={20} color={Colors.primaryAccent} />
              </View>
              <Text style={styles.actionLabel}>Add Health Data</Text>
            </TouchableOpacity>

            {/* Action 2: View My Twin */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/twin')}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(139, 114, 255, 0.15)' }]}>
                <Ionicons name="body" size={18} color={Colors.secondaryAccent} />
              </View>
              <Text style={styles.actionLabel}>View My Twin</Text>
            </TouchableOpacity>

            {/* Action 3: Ask BioSync AI */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/insights')}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(55, 214, 160, 0.15)' }]}>
                <Ionicons name="chatbubbles" size={18} color={Colors.success} />
              </View>
              <Text style={styles.actionLabel}>Ask BioSync AI</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
  },
  greeting: {
    fontSize: Typography.fontSize.sectionHeading,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  dateText: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.secondaryBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryAccent,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.elevatedCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  twinSummaryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  twinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  twinTitle: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  twinSubtitle: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  twinStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryAccent,
    marginRight: 5,
  },
  twinStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
    letterSpacing: 0.5,
  },
  twinFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
    marginTop: 6,
  },
  twinReadyText: {
    fontSize: 12,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  metricsCountText: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  baselineTag: {
    backgroundColor: Colors.secondaryBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  baselineTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryAccent,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionsContainer: {
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 4,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryText,
    textAlign: 'center',
  },
  workoutBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.35)',
    padding: 14,
    marginBottom: 20,
  },
  workoutBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  workoutIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  workoutBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  workoutNewBadge: {
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  workoutNewBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.background,
  },
  workoutBannerSub: {
    fontSize: 11,
    color: Colors.secondaryText,
    lineHeight: 15,
  },
});
