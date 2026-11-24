// ==============================================================================
// BioSync Key Metric Card Component (Section 8)
// Displays metric value, personal baseline comparison, trend indicator & sparkline
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';

interface Props {
  title: string;
  value: string | number;
  unit: string;
  baseline: string | number;
  change: string;
  isPositiveDirection?: boolean; // e.g. for HR higher is warning, for steps higher is good
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  sparklineData?: number[];
  isDemo?: boolean;
}

export const MetricCard: React.FC<Props> = ({
  title,
  value,
  unit,
  baseline,
  change,
  isPositiveDirection = true,
  iconName,
  accentColor,
  sparklineData = [40, 45, 42, 50, 48, 35, 30],
  isDemo = false,
}) => {
  // Generate a mini sparkline path
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const chartWidth = 72;
  const chartHeight = 26;

  const points = sparklineData.map((val, idx) => {
    const x = (idx / (sparklineData.length - 1)) * chartWidth;
    const y = chartHeight - ((val - minVal) / range) * chartHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathD = `M ${points.join(' L ')}`;

  const isDecrease = change.startsWith('-');
  const isIncrease = change.startsWith('+');

  let deltaColor = Colors.secondaryText;
  let arrowIcon: keyof typeof Ionicons.glyphMap = 'remove';

  if (isDecrease) {
    arrowIcon = 'arrow-down';
    deltaColor = isPositiveDirection ? Colors.warning : Colors.success;
  } else if (isIncrease) {
    arrowIcon = 'arrow-up';
    deltaColor = isPositiveDirection ? Colors.success : Colors.danger;
  }

  return (
    <View style={styles.card}>
      {/* Header: Icon, Title & Demo Pill */}
      <View style={styles.header}>
        <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}18` }]}>
          <Ionicons name={iconName} size={18} color={accentColor} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {isDemo && (
          <View style={styles.demoBadge}>
            <Text style={styles.demoText}>DEMO</Text>
          </View>
        )}
      </View>

      {/* Main Metric Value */}
      <View style={styles.valueRow}>
        <Text style={styles.mainValue}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>

      {/* Baseline & Trend Section */}
      <View style={styles.baselineRow}>
        <View style={styles.baselineInfo}>
          <Text style={styles.baselineLabel}>Baseline: {baseline} {unit}</Text>
          <View style={styles.trendRow}>
            <Ionicons name={arrowIcon} size={12} color={deltaColor} />
            <Text style={[styles.changeText, { color: deltaColor }]}>{change}</Text>
          </View>
        </View>

        {/* Sparkline */}
        <View style={styles.sparklineContainer}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id={`grad_${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={accentColor} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Path
              d={pathD}
              fill="none"
              stroke={`url(#grad_${title})`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.secondary,
    fontWeight: '600',
    color: Colors.secondaryText,
    letterSpacing: 0.3,
  },
  demoBadge: {
    backgroundColor: 'rgba(255, 184, 92, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  demoText: {
    fontSize: 9,
    color: Colors.warning,
    fontWeight: '700',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  mainValue: {
    fontSize: Typography.fontSize.metricLarge,
    fontWeight: '800',
    color: Colors.primaryText,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: Typography.fontSize.body,
    fontWeight: '500',
    color: Colors.secondaryText,
    marginLeft: 5,
  },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  baselineInfo: {
    flex: 1,
  },
  baselineLabel: {
    fontSize: 10,
    color: Colors.mutedText,
    marginBottom: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  sparklineContainer: {
    width: 72,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
