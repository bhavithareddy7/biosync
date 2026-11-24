// ==============================================================================
// BioSync Trend Analysis Chart Component (Section 9)
// Multi-timeframe (7D / 14D / 30D) interactive trend visualization with SVG curves
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../constants/theme';
import { HealthMetricRecord } from '../types';

interface Props {
  metrics: HealthMetricRecord[];
  activeWindowDays: number;
  onWindowChange: (days: number) => void;
}

type MetricType = 'sleep' | 'steps' | 'heart_rate';

export const TrendChart: React.FC<Props> = ({ metrics, activeWindowDays, onWindowChange }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('sleep');

  const width = Dimensions.get('window').width - 32 - 32; // card padding
  const height = 150;

  // Filter slice according to window
  const sorted = [...metrics]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-activeWindowDays);

  const getMetricConfig = () => {
    switch (selectedMetric) {
      case 'sleep':
        return {
          title: 'Sleep Duration',
          unit: 'hrs',
          color: Colors.primaryAccent,
          getValue: (r: HealthMetricRecord) => r.sleep_hours,
          format: (v: number) => `${v.toFixed(1)}h`,
        };
      case 'steps':
        return {
          title: 'Daily Steps',
          unit: 'steps',
          color: Colors.success,
          getValue: (r: HealthMetricRecord) => r.steps,
          format: (v: number) => `${v.toLocaleString()}`,
        };
      case 'heart_rate':
        return {
          title: 'Resting Heart Rate',
          unit: 'BPM',
          color: Colors.danger,
          getValue: (r: HealthMetricRecord) => r.resting_heart_rate,
          format: (v: number) => `${v} bpm`,
        };
    }
  };

  const config = getMetricConfig();
  const values = sorted.map(config.getValue);
  const hasValues = values.length > 0;
  const minVal = hasValues ? Math.min(...values) : 0;
  const maxVal = hasValues ? Math.max(...values) : 10;
  const range = maxVal - minVal || 1;
  const avgVal = hasValues ? values.reduce((a, b) => a + b, 0) / values.length : 5;

  // SVG Points
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1 || 1)) * width;
    const y = height - 20 - ((val - minVal) / range) * (height - 40);
    return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? height / 2 : y, val };
  });

  const linePath = points.length > 0 ? `M ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : '';
  const areaPath = points.length > 0
    ? `${linePath} L ${width},${height} L 0,${height} Z`
    : '';

  const rawAvgY = height - 20 - ((avgVal - minVal) / range) * (height - 40);
  const avgY = isNaN(rawAvgY) ? height / 2 : rawAvgY;

  return (
    <View style={styles.card}>
      {/* Metric Selector Pills */}
      <View style={styles.metricTabs}>
        <TouchableOpacity
          style={[styles.metricTab, selectedMetric === 'sleep' && { borderColor: Colors.primaryAccent, backgroundColor: 'rgba(53, 214, 242, 0.12)' }]}
          onPress={() => setSelectedMetric('sleep')}
        >
          <Text style={[styles.metricTabText, selectedMetric === 'sleep' && { color: Colors.primaryAccent }]}>Sleep</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.metricTab, selectedMetric === 'steps' && { borderColor: Colors.success, backgroundColor: 'rgba(55, 214, 160, 0.12)' }]}
          onPress={() => setSelectedMetric('steps')}
        >
          <Text style={[styles.metricTabText, selectedMetric === 'steps' && { color: Colors.success }]}>Steps</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.metricTab, selectedMetric === 'heart_rate' && { borderColor: Colors.danger, backgroundColor: 'rgba(255, 100, 124, 0.12)' }]}
          onPress={() => setSelectedMetric('heart_rate')}
        >
          <Text style={[styles.metricTabText, selectedMetric === 'heart_rate' && { color: Colors.danger }]}>Resting HR</Text>
        </TouchableOpacity>
      </View>

      {/* Time Window Switcher (7D / 14D / 30D) */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.currentAvg}>
            Avg: <Text style={{ color: config.color, fontWeight: '800' }}>{config.format(avgVal)}</Text>
          </Text>
          <Text style={styles.rangeSub}>Min {config.format(minVal)} · Max {config.format(maxVal)}</Text>
        </View>

        <View style={styles.timeWindowGroup}>
          {[7, 14, 30].map(days => (
            <TouchableOpacity
              key={days}
              onPress={() => onWindowChange(days)}
              style={[
                styles.windowBtn,
                activeWindowDays === days && styles.windowBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.windowBtnText,
                  activeWindowDays === days && styles.windowBtnTextActive,
                ]}
              >
                {days}D
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SVG Canvas */}
      <View style={styles.chartWrapper}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="trendAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={config.color} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={config.color} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Average Baseline Reference Line */}
          <Line
            x1={0}
            y1={avgY}
            x2={width}
            y2={avgY}
            stroke={Colors.secondaryAccent}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity={0.6}
          />

          {/* Gradient Area */}
          <Path d={areaPath} fill="url(#trendAreaGrad)" />

          {/* Line Contour */}
          <Path
            d={linePath}
            fill="none"
            stroke={config.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* High and Low Dots */}
          {points.length > 0 && (
            <>
              <Circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="4"
                fill={config.color}
              />
              <Circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="8"
                stroke={config.color}
                strokeWidth="1.5"
                opacity={0.5}
              />
            </>
          )}
        </Svg>
      </View>

      <Text style={styles.disclaimerText}>
        Individual baseline computed using {activeWindowDays}-day personal historical moving window.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  metricTabs: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 3,
  },
  metricTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  metricTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentAvg: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  rangeSub: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  timeWindowGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.elevatedCard,
    borderRadius: Spacing.borderRadius.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  windowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  windowBtnActive: {
    backgroundColor: Colors.primaryAccent,
  },
  windowBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  windowBtnTextActive: {
    color: Colors.background,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.mutedText,
    marginTop: 10,
    textAlign: 'center',
  },
});
