// ==============================================================================
// BioSync Android Health Connect Component (Section 11)
// Transparent prototype bridge explaining permissions, installed apps & sync states
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';

interface Props {
  status: 'connected' | 'disconnected' | 'connecting';
  onToggleConnect: () => void;
  lastSyncTime?: string;
}

export const HealthConnectCard: React.FC<Props> = ({
  status,
  onToggleConnect,
  lastSyncTime,
}) => {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, isConnected && styles.iconConnected]}>
          <Ionicons
            name="logo-android"
            size={20}
            color={isConnected ? Colors.success : Colors.primaryAccent}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Android Health Connect</Text>
            <View
              style={[
                styles.badge,
                isConnected ? styles.badgeConnected : styles.badgeSimulated,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isConnected ? styles.badgeTextConnected : styles.badgeTextSimulated,
                ]}
              >
                {isConnected ? 'ACTIVE PROTOTYPE SYNC' : 'SIMULATED BRIDGE'}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Connect supported health and fitness applications</Text>
        </View>
      </View>

      <Text style={styles.explanation}>
        Health Connect access depends on user permissions, compatible Android health apps (Samsung Health, Google Fit, Whoop, Oura), and localized permission grants.
      </Text>

      {/* Permissions Breakdown */}
      <View style={styles.permsList}>
        <View style={styles.permRow}>
          <Ionicons
            name={isConnected ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={isConnected ? Colors.success : Colors.mutedText}
          />
          <Text style={styles.permText}>Read Sleep Stages & Duration</Text>
        </View>
        <View style={styles.permRow}>
          <Ionicons
            name={isConnected ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={isConnected ? Colors.success : Colors.mutedText}
          />
          <Text style={styles.permText}>Read Daily Steps & Active Calories</Text>
        </View>
        <View style={styles.permRow}>
          <Ionicons
            name={isConnected ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={isConnected ? Colors.success : Colors.mutedText}
          />
          <Text style={styles.permText}>Read Resting Heart Rate Series</Text>
        </View>
      </View>

      {/* Connection Action */}
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.syncStatus}>
            {isConnected
              ? `Status: Connected (Simulated)`
              : 'Status: Disconnected'}
          </Text>
          {isConnected && (
            <Text style={styles.lastSync}>
              Last Check: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Just now'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btn, isConnected ? styles.btnDisconnect : styles.btnConnect]}
          onPress={onToggleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : (
            <Text
              style={[
                styles.btnText,
                isConnected ? styles.btnTextDisconnect : styles.btnTextConnect,
              ]}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </Text>
          )}
        </TouchableOpacity>
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
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconConnected: {
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSimulated: {
    backgroundColor: 'rgba(255, 184, 92, 0.15)',
  },
  badgeConnected: {
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  badgeTextSimulated: {
    color: Colors.warning,
  },
  badgeTextConnected: {
    color: Colors.success,
  },
  subtitle: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  explanation: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.mutedText,
    lineHeight: 18,
    marginVertical: 10,
  },
  permsList: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 10,
    marginBottom: 14,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  permText: {
    fontSize: 11,
    color: Colors.primaryText,
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  syncStatus: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  lastSync: {
    fontSize: 10,
    color: Colors.mutedText,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Spacing.borderRadius.md,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConnect: {
    backgroundColor: Colors.primaryAccent,
  },
  btnDisconnect: {
    backgroundColor: Colors.elevatedCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  btnTextConnect: {
    color: Colors.background,
  },
  btnTextDisconnect: {
    color: Colors.danger,
  },
});
