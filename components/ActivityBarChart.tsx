// ==============================================================================
// BioSync 7-Day Weekly Activity Chart Component (Section 8)
// Interactive 7-day bar visualization with touch inspection & baseline reference
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { HealthMetricRecord } from '../types';

interface Props {
  metrics: HealthMetricRecord[];
  baselineSteps: number;
}

export const ActivityBarChart: React.FC<Props> = ({ metrics, baselineSteps = 7000 }) => {
  // Take last 7 records in chronological order
  const last7 = [...metrics]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);

  const [selectedIndex, setSelectedIndex] = useState<number>(last7.length - 1);
  const selectedDay = last7[selectedIndex] || last7[last7.length - 1];

  const maxSteps = Math.max(...last7.map(m => m.steps), baselineSteps, 10000);

  const getDayName = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } catch {
      return 'Day';
    }
  };

  const selectedDiff = selectedDay ? selectedDay.steps - baselineSteps : 0;

  return (
    <View style={styles.container}>
      {/* Chart Header & Selected Day Status */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.chartTitle}>7-Day Movement Pattern</Text>
          <Text style={styles.chartSubtitle}>
            Daily step volume vs {baselineSteps.toLocaleString()} baseline
          </Text>
        </View>

        {selectedDay && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedSteps}>
              {selectedDay.steps.toLocaleString()} <Text style={styles.unit}>steps</Text>
            </Text>
            <Text
              style={[
                styles.selectedDelta,
                selectedDiff < 0 ? styles.deltaUnder : styles.deltaOver,
              ]}
            >
              {selectedDiff >= 0 ? `+${selectedDiff.toLocaleString()}` : selectedDiff.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Bar Columns Container */}
      <View style={styles.barsContainer}>
        {/* Baseline Target Reference Line */}
        <View
          style={[
            styles.baselineLine,
            { bottom: `${Math.min(95, (baselineSteps / maxSteps) * 100)}%` },
          ]}
        >
          <Text style={styles.baselineLineLabel}>Baseline {baselineSteps / 1000}k</Text>
        </View>

        {last7.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const heightPct = Math.max(12, Math.min(100, (item.steps / maxSteps) * 100));
          const dayLabel = getDayName(item.date);
          const isBelow = item.steps < baselineSteps;

          return (
            <TouchableOpacity
              key={item.id || item.date}
              activeOpacity={0.8}
              onPress={() => setSelectedIndex(idx)}
              style={styles.barColumn}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPct}%` },
                    isSelected && styles.barSelected,
                    !isSelected && (isBelow ? styles.barUnder : styles.barOver),
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                ]}
              >
                {dayLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Footer Note */}
      <View style={styles.footerRow}>
        <Text style={styles.footerNote}>
          {selectedDay
            ? `${selectedDay.date}: ${selectedDay.steps >= baselineSteps ? 'Surpassed personal baseline' : 'Below 7-day average volume'}`
            : 'Tap any bar to inspect daily metrics'}
        </Text>
        <Text style={styles.sourceTag}>
          {selectedDay?.source ? `Source: ${selectedDay.source}` : 'Demo Data'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  chartSubtitle: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  selectedBadge: {
    alignItems: 'flex-end',
    backgroundColor: Colors.elevatedCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedSteps: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  unit: {
    fontSize: 10,
    color: Colors.secondaryText,
    fontWeight: '400',
  },
  selectedDelta: {
    fontSize: 10,
    fontWeight: '700',
  },
  deltaUnder: {
    color: Colors.warning,
  },
  deltaOver: {
    color: Colors.success,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    position: 'relative',
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  baselineLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(53, 214, 242, 0.4)',
    borderStyle: 'dashed',
    zIndex: 1,
  },
  baselineLineLabel: {
    position: 'absolute',
    right: 0,
    top: -14,
    fontSize: 9,
    color: Colors.primaryAccent,
    fontWeight: '700',
    opacity: 0.8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 3,
  },
  barTrack: {
    width: 22,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 6,
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barSelected: {
    backgroundColor: Colors.primaryAccent,
    shadowColor: Colors.primaryAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  barUnder: {
    backgroundColor: 'rgba(255, 184, 92, 0.45)',
  },
  barOver: {
    backgroundColor: 'rgba(55, 214, 160, 0.55)',
  },
  dayLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: 11,
    color: Colors.mutedText,
    fontWeight: '600',
  },
  dayLabelSelected: {
    color: Colors.primaryAccent,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  footerNote: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.secondaryText,
    flex: 1,
  },
  sourceTag: {
    fontSize: 10,
    color: Colors.mutedText,
    textTransform: 'uppercase',
  },
});
