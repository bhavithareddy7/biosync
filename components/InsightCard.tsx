// ==============================================================================
// BioSync Intelligence Insight Card Component (Section 8 & 10)
// Highlighting explainable pattern detection, supporting metrics & practical action
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { DetectedPattern } from '../types';

interface Props {
  pattern: DetectedPattern;
  onPressDetails?: () => void;
  showExpandable?: boolean;
}

export const InsightCard: React.FC<Props> = ({
  pattern,
  onPressDetails,
  showExpandable = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getSeverityStyle = () => {
    switch (pattern.severity) {
      case 'warning':
        return {
          borderColor: 'rgba(255, 184, 92, 0.4)',
          badgeBg: 'rgba(255, 184, 92, 0.15)',
          badgeColor: Colors.warning,
          icon: 'alert-circle-outline' as const,
        };
      case 'positive':
        return {
          borderColor: 'rgba(55, 214, 160, 0.4)',
          badgeBg: 'rgba(55, 214, 160, 0.15)',
          badgeColor: Colors.success,
          icon: 'shield-checkmark-outline' as const,
        };
      default:
        return {
          borderColor: Colors.borderGlow,
          badgeBg: 'rgba(53, 214, 242, 0.15)',
          badgeColor: Colors.primaryAccent,
          icon: 'sparkles-outline' as const,
        };
    }
  };

  const sev = getSeverityStyle();

  return (
    <View style={[styles.card, { borderColor: sev.borderColor }]}>
      {/* Header Tag */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.aiBadge, { backgroundColor: sev.badgeBg }]}>
            <Ionicons name={sev.icon} size={14} color={sev.badgeColor} />
            <Text style={[styles.aiBadgeText, { color: sev.badgeColor }]}>
              {pattern.type.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.dateTag}>{pattern.date}</Text>
        </View>

        <View style={styles.verifiedTag}>
          <Text style={styles.verifiedText}>BASELINE TRACEABLE</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{pattern.title}</Text>

      {/* Main Explainable Insight */}
      <Text style={styles.explanation}>{pattern.explanation}</Text>

      {/* Supporting Metrics Badges */}
      {pattern.supportingMetrics && pattern.supportingMetrics.length > 0 && (
        <View style={styles.metricsWrapper}>
          <Text style={styles.metricsLabel}>SUPPORTING OBSERVATIONS:</Text>
          <View style={styles.metricsGrid}>
            {pattern.supportingMetrics.map((item, index) => (
              <View key={index} style={styles.metricItem}>
                <Text style={styles.metricName}>{item.metric}</Text>
                <Text style={styles.metricValues}>
                  {item.current} <Text style={styles.metricBase}>(vs {item.baseline})</Text>
                </Text>
                <Text style={styles.metricDev}>{item.deviation}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Suggested Action Box */}
      <View style={styles.actionBox}>
        <View style={styles.actionHeader}>
          <Ionicons name="bulb-outline" size={15} color={Colors.secondaryAccent} />
          <Text style={styles.actionTitle}>PRACTICAL ACTION TO CONSIDER</Text>
        </View>
        <Text style={styles.actionBody}>{pattern.recommendation}</Text>
      </View>

      {/* Card Footer: Non-medical disclaimer and Expand/Details button */}
      <View style={styles.footerRow}>
        <Text style={styles.disclaimer}>
          Non-diagnostic wellness pattern. Not a medical claim.
        </Text>
        {onPressDetails ? (
          <TouchableOpacity style={styles.detailsBtn} onPress={onPressDetails}>
            <Text style={styles.detailsBtnText}>Deep Dive</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primaryAccent} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  dateTag: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  verifiedTag: {
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.primaryAccent,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 6,
  },
  explanation: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    lineHeight: 20,
    marginBottom: 12,
  },
  metricsWrapper: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  metricsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '31%',
    backgroundColor: Colors.elevatedCard,
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  metricValues: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryText,
    marginTop: 2,
  },
  metricBase: {
    fontSize: 9,
    fontWeight: '400',
    color: Colors.mutedText,
  },
  metricDev: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryAccent,
    marginTop: 2,
  },
  actionBox: {
    backgroundColor: 'rgba(139, 114, 255, 0.08)',
    borderRadius: Spacing.borderRadius.md,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondaryAccent,
    marginBottom: 10,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryAccent,
    letterSpacing: 0.5,
    marginLeft: 5,
  },
  actionBody: {
    fontSize: 12,
    color: Colors.primaryText,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.mutedText,
    fontStyle: 'italic',
    flex: 1,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryAccent,
    marginRight: 2,
  },
});
