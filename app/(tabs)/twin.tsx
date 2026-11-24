// ==============================================================================
// BioSync Screen 3: My Digital Twin (Section 9)
// The signature Digital Health Twin: Central futuristic silhouette, baseline comparisons,
// multi-timeframe trends (7D / 14D / 30D), and data completeness status
// ==============================================================================

import React from 'react';
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
import { DigitalTwinVisualizer } from '../../components/DigitalTwinVisualizer';
import { TrendChart } from '../../components/TrendChart';

export default function MyTwinScreen() {
  const {
    currentMetric,
    baseline,
    metrics,
    windowDays,
    setWindowDays,
    profile,
  } = useHealth();

  const sleepVal = currentMetric?.sleep_hours ?? 5.5;
  const stepsVal = currentMetric?.steps ?? 4000;
  const hrVal = currentMetric?.resting_heart_rate ?? 76;

  // Baseline deltas
  const sleepDelta = Number((sleepVal - (baseline.avgSleep || 7.5)).toFixed(1));
  const stepsDelta = stepsVal - (baseline.avgSteps || 7000);
  const hrDelta = hrVal - (baseline.avgHeartRate || 68);

  const lastUpdate = currentMetric?.date || new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>My Digital Twin</Text>
            <Text style={styles.screenSubtitle}>
              Continuous personal wellness model for {profile.name || 'Alex'}
            </Text>
          </View>
          <View style={styles.activePill}>
            <View style={styles.pulseDot} />
            <Text style={styles.activePillText}>SYNCED</Text>
          </View>
        </View>

        {/* MAIN VISUAL: Large Futuristic Hologram Silhouette */}
        <DigitalTwinVisualizer
          currentMetric={currentMetric}
          baseline={baseline}
          size="full"
        />

        {/* SECTION A: PERSONAL WELLNESS PROFILE */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="finger-print-outline" size={18} color={Colors.primaryAccent} />
            <Text style={styles.cardTitle}>Personal Wellness Profile</Text>
          </View>
          <Text style={styles.cardDesc}>
            Your digital twin maps personal baseline rhythms across physiological and behavioral dimensions, identifying subtle drifts before acute fatigue develops.
          </Text>

          <View style={styles.profileGrid}>
            <View style={styles.profileItem}>
              <Text style={styles.itemLabel}>SLEEP PATTERN</Text>
              <Text style={styles.itemVal}>{baseline.avgSleep} hrs avg</Text>
              <Text style={styles.itemSub}>{sleepVal < baseline.avgSleep ? 'Acute reduction noted' : 'Rhythm steady'}</Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.itemLabel}>ACTIVITY PATTERN</Text>
              <Text style={styles.itemVal}>{(baseline.avgSteps || 7000).toLocaleString()} steps</Text>
              <Text style={styles.itemSub}>{stepsVal < baseline.avgSteps ? 'Below baseline' : 'Active mobility'}</Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.itemLabel}>RESTING CARDIAC</Text>
              <Text style={styles.itemVal}>{baseline.avgHeartRate} BPM</Text>
              <Text style={styles.itemSub}>{hrVal > baseline.avgHeartRate ? 'Elevated +8 bpm' : 'Nominal'}</Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.itemLabel}>EXERCISE HISTORY</Text>
              <Text style={styles.itemVal}>{baseline.avgExercise || 30} min/day</Text>
              <Text style={styles.itemSub}>Moderate active volume</Text>
            </View>
          </View>
        </View>

        {/* SECTION B: PERSONAL BASELINES DEEP DIVE */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Personal Baseline Comparison</Text>
          <Text style={styles.windowNotice}>{windowDays}-Day Moving Baseline</Text>
        </View>

        {/* BASELINE CARD 1: Sleep */}
        <View style={styles.baselineCard}>
          <View style={styles.baseIconBox}>
            <Ionicons name="moon" size={18} color={Colors.primaryAccent} />
          </View>
          <View style={styles.baseContent}>
            <Text style={styles.baseTitle}>Sleep Duration</Text>
            <View style={styles.baseValuesRow}>
              <Text style={styles.baseCurrent}>
                Current: <Text style={{ color: Colors.primaryText, fontWeight: '800' }}>{sleepVal} hrs</Text>
              </Text>
              <Text style={styles.baseHistorical}>
                Personal average: {baseline.avgSleep} hrs
              </Text>
            </View>
            <View style={styles.deviationBarTrack}>
              <View
                style={[
                  styles.deviationBarFill,
                  { width: `${Math.min(100, (sleepVal / (baseline.avgSleep || 7.5)) * 100)}%` },
                  sleepDelta < 0 ? { backgroundColor: Colors.warning } : { backgroundColor: Colors.success },
                ]}
              />
            </View>
            <Text style={[styles.deltaNote, sleepDelta < 0 ? { color: Colors.warning } : { color: Colors.success }]}>
              Deviation: {sleepDelta >= 0 ? `+${sleepDelta}` : `${sleepDelta}`} hrs vs personal norm
            </Text>
          </View>
        </View>

        {/* BASELINE CARD 2: Daily Activity */}
        <View style={styles.baselineCard}>
          <View style={[styles.baseIconBox, { backgroundColor: 'rgba(55, 214, 160, 0.15)' }]}>
            <Ionicons name="footsteps" size={18} color={Colors.success} />
          </View>
          <View style={styles.baseContent}>
            <Text style={styles.baseTitle}>Daily Activity (Steps)</Text>
            <View style={styles.baseValuesRow}>
              <Text style={styles.baseCurrent}>
                Current: <Text style={{ color: Colors.primaryText, fontWeight: '800' }}>{stepsVal.toLocaleString()}</Text>
              </Text>
              <Text style={styles.baseHistorical}>
                Personal average: {(baseline.avgSteps || 7000).toLocaleString()}
              </Text>
            </View>
            <View style={styles.deviationBarTrack}>
              <View
                style={[
                  styles.deviationBarFill,
                  { width: `${Math.min(100, (stepsVal / (baseline.avgSteps || 7000)) * 100)}%` },
                  stepsDelta < 0 ? { backgroundColor: Colors.warning } : { backgroundColor: Colors.success },
                ]}
              />
            </View>
            <Text style={[styles.deltaNote, stepsDelta < 0 ? { color: Colors.warning } : { color: Colors.success }]}>
              Deviation: {stepsDelta >= 0 ? `+${stepsDelta.toLocaleString()}` : `${stepsDelta.toLocaleString()}`} steps vs personal norm
            </Text>
          </View>
        </View>

        {/* BASELINE CARD 3: Resting Heart Rate */}
        <View style={styles.baselineCard}>
          <View style={[styles.baseIconBox, { backgroundColor: 'rgba(255, 100, 124, 0.15)' }]}>
            <Ionicons name="heart" size={18} color={Colors.danger} />
          </View>
          <View style={styles.baseContent}>
            <Text style={styles.baseTitle}>Resting Heart Rate</Text>
            <View style={styles.baseValuesRow}>
              <Text style={styles.baseCurrent}>
                Current: <Text style={{ color: Colors.danger, fontWeight: '800' }}>{hrVal} BPM</Text>
              </Text>
              <Text style={styles.baseHistorical}>
                Personal average: {baseline.avgHeartRate} BPM
              </Text>
            </View>
            <View style={styles.deviationBarTrack}>
              <View
                style={[
                  styles.deviationBarFill,
                  { width: `${Math.min(100, (hrVal / 100) * 100)}%` },
                  hrDelta > 0 ? { backgroundColor: Colors.danger } : { backgroundColor: Colors.success },
                ]}
              />
            </View>
            <Text style={[styles.deltaNote, hrDelta > 0 ? { color: Colors.danger } : { color: Colors.success }]}>
              Deviation: {hrDelta >= 0 ? `+${hrDelta}` : `${hrDelta}`} BPM vs personal norm
            </Text>
          </View>
        </View>

        {/* SECTION C: TREND ANALYSIS (7 / 14 / 30 Days) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Historical Trend Analysis</Text>
          <Text style={styles.windowNotice}>Select Window</Text>
        </View>

        <TrendChart
          metrics={metrics}
          activeWindowDays={windowDays}
          onWindowChange={setWindowDays}
        />

        {/* SECTION D: TWIN STATUS & VERIFICATION */}
        <View style={styles.twinStatusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.primaryAccent} />
            <Text style={styles.statusTitle}>Twin Status & Data Completeness</Text>
          </View>

          <Text style={styles.statusDescription}>
            "Your wellness profile is updated using your latest available data."
          </Text>

          <View style={styles.statusGrid}>
            <View style={styles.statusStat}>
              <Text style={styles.statLabel}>LAST RECALIBRATION</Text>
              <Text style={styles.statVal}>{lastUpdate}</Text>
            </View>
            <View style={styles.statusStat}>
              <Text style={styles.statLabel}>VALID RECORDS</Text>
              <Text style={styles.statVal}>{metrics.length} Days Logged</Text>
            </View>
            <View style={styles.statusStat}>
              <Text style={styles.statLabel}>DATA COMPLETENESS</Text>
              <Text style={[styles.statVal, { color: Colors.success }]}>96.4% High</Text>
            </View>
          </View>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              IMPORTANT: BioSync Digital Twin is an individualized behavioral & physiological reflection. It is never presented as a medically validated digital simulation or diagnostic model.
            </Text>
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
    marginBottom: 8,
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
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(55, 214, 160, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 5,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
  },
  sectionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '700',
    color: Colors.primaryText,
    marginLeft: 6,
  },
  cardDesc: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    lineHeight: 20,
    marginBottom: 14,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  profileItem: {
    width: '48%',
    backgroundColor: Colors.secondaryBackground,
    padding: 10,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.5,
  },
  itemVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryText,
    marginVertical: 3,
  },
  itemSub: {
    fontSize: 10,
    color: Colors.primaryAccent,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  windowNotice: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedText,
  },
  baselineCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  baseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  baseContent: {
    flex: 1,
  },
  baseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  baseValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  baseCurrent: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  baseHistorical: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  deviationBarTrack: {
    height: 6,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  deviationBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  deltaNote: {
    fontSize: 10,
    fontWeight: '700',
  },
  twinStatusCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTitle: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '700',
    color: Colors.primaryText,
    marginLeft: 6,
  },
  statusDescription: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryAccent,
    fontWeight: '600',
    marginBottom: 14,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 10,
    marginBottom: 12,
  },
  statusStat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryText,
    marginTop: 4,
  },
  disclaimerBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.mutedText,
    lineHeight: 14,
  },
});
