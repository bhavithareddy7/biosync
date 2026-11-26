// ==============================================================================
// BioSync Smartwatch Connection Badge Component
// Compact top-right status indicator displaying Apple Watch Series 8 connection & battery
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useSmartwatch } from '../context/SmartwatchContext';

interface SmartwatchConnectionBadgeProps {
  compact?: boolean;
}

export const SmartwatchConnectionBadge: React.FC<SmartwatchConnectionBadgeProps> = ({ compact = false }) => {
  const { isConnected, batteryLevel, openModal } = useSmartwatch();

  // Battery color logic: Green (>20%), Orange (10-20%), Red (<10%)
  const getBatteryColor = (level: number) => {
    if (level > 20) return Colors.success; // #37D6A0
    if (level >= 10) return Colors.warning; // #FFB85C
    return Colors.danger; // #FF647C
  };

  const getBatteryIcon = (level: number) => {
    if (level > 80) return 'battery-full';
    if (level > 40) return 'battery-half';
    if (level > 15) return 'battery-dead';
    return 'battery-dead';
  };

  const batteryColor = getBatteryColor(batteryLevel);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={openModal}
      style={[
        styles.badgeContainer,
        isConnected ? styles.badgeConnected : styles.badgeDisconnected,
        compact && styles.badgeCompact,
      ]}
      accessibilityLabel={`Smartwatch: Apple Watch Series 8, ${isConnected ? `Connected, Battery ${batteryLevel}%` : 'Disconnected'}`}
      accessibilityRole="button"
    >
      {/* Smartwatch Watch Icon Bubble */}
      <View style={[styles.watchIconBox, isConnected ? styles.watchIconConnected : styles.watchIconDisconnected]}>
        <Ionicons
          name="watch-outline"
          size={14}
          color={isConnected ? Colors.primaryAccent : Colors.secondaryText}
        />
      </View>

      {/* Connection Indicator Dot */}
      <View
        style={[
          styles.statusDot,
          { backgroundColor: isConnected ? Colors.success : Colors.mutedText },
        ]}
      />

      {/* Device Name */}
      <Text style={[styles.deviceNameText, !isConnected && styles.deviceNameDisconnected]}>
        {compact ? 'Apple Watch' : 'Apple Watch Series 8'}
      </Text>

      {/* Battery Percentage (Connected State Only) */}
      {isConnected ? (
        <View style={styles.batteryPill}>
          <Ionicons
            name={getBatteryIcon(batteryLevel) as any}
            size={12}
            color={batteryColor}
            style={{ marginRight: 3 }}
          />
          <Text style={[styles.batteryText, { color: batteryColor }]}>{batteryLevel}%</Text>
        </View>
      ) : (
        <View style={styles.offlinePill}>
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.25)',
  },
  badgeConnected: {
    borderColor: 'rgba(53, 214, 242, 0.35)',
    backgroundColor: 'rgba(17, 26, 46, 0.85)',
  },
  badgeDisconnected: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(17, 26, 46, 0.6)',
  },
  badgeCompact: {
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  watchIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  watchIconConnected: {
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
  },
  watchIconDisconnected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  deviceNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryText,
    marginRight: 6,
    letterSpacing: 0.2,
  },
  deviceNameDisconnected: {
    color: Colors.secondaryText,
  },
  batteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  batteryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  offlinePill: {
    backgroundColor: 'rgba(255, 100, 124, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offlineText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.danger,
    textTransform: 'uppercase',
  },
});
