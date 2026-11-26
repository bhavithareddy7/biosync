// ==============================================================================
// BioSync Smartwatch Device Details Panel (Modal / Bottom Sheet)
// Apple Watch Series 8 Interactive Demo: Device Specs, Battery Gauge, Health Metrics & Actions
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useSmartwatch } from '../context/SmartwatchContext';

export const SmartwatchModal: React.FC = () => {
  const {
    deviceName,
    manufacturer,
    model,
    size,
    firmwareVersion,
    serialNumber,
    isConnected,
    batteryLevel,
    lastSyncTime,
    isSyncing,
    isModalOpen,
    pingStatus,
    healthData,
    closeModal,
    disconnectDevice,
    connectDevice,
    syncNow,
    pingDevice,
    clearPingStatus,
    setBatteryLevel,
  } = useSmartwatch();

  // Confirmation dialog state for Disconnecting
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  // Battery color logic: Green (>20%), Orange (10-20%), Red (<10%)
  const getBatteryColor = (level: number) => {
    if (level > 20) return Colors.success; // #37D6A0
    if (level >= 10) return Colors.warning; // #FFB85C
    return Colors.danger; // #FF647C
  };

  const getBatteryLabel = (level: number) => {
    if (level > 20) return 'Healthy Battery';
    if (level >= 10) return 'Low Battery (Charge Recommended)';
    return 'Critically Low Battery (Connect Charger)';
  };

  const batteryColor = getBatteryColor(batteryLevel);

  const handleDisconnectClick = () => {
    setShowConfirmDisconnect(true);
  };

  const handleConfirmDisconnect = () => {
    disconnectDevice();
    setShowConfirmDisconnect(false);
  };

  const handleCancelDisconnect = () => {
    setShowConfirmDisconnect(false);
  };

  return (
    <Modal
      visible={isModalOpen}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* MODAL HEADER */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.headerIconBox}>
                <Ionicons name="watch" size={20} color={Colors.primaryAccent} />
              </View>
              <View>
                <Text style={styles.modalTitle}>{deviceName}</Text>
                <Text style={styles.modalSubtitle}>Hardware & Biometric Telemetry</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={closeModal}
              style={styles.closeBtn}
              accessibilityLabel="Close Apple Watch details"
            >
              <Ionicons name="close" size={20} color={Colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* DEMO DEVICE DISCLAIMER BANNER */}
            <View style={styles.demoBanner}>
              <View style={styles.demoBannerHeader}>
                <View style={styles.demoBadge}>
                  <Ionicons name="hardware-chip-outline" size={12} color={Colors.primaryAccent} style={{ marginRight: 4 }} />
                  <Text style={styles.demoBadgeText}>DEMO DEVICE</Text>
                </View>
                <Text style={styles.demoSub}>HACKATHON SIMULATION</Text>
              </View>
              <Text style={styles.demoDesc}>
                This device interface simulates an active Apple Watch Series 8 connection for demonstration purposes. All sensor data and communication states are generated locally.
              </Text>
            </View>

            {/* PING NOTIFICATION BANNER */}
            {pingStatus && (
              <View style={styles.pingBanner}>
                <Ionicons name="volume-high" size={18} color={Colors.primaryAccent} style={{ marginRight: 8 }} />
                <Text style={styles.pingBannerText}>{pingStatus}</Text>
                <TouchableOpacity onPress={clearPingStatus} style={{ marginLeft: 8 }}>
                  <Ionicons name="close-circle" size={16} color={Colors.secondaryText} />
                </TouchableOpacity>
              </View>
            )}

            {/* CONFIRMATION DIALOG FOR DISCONNECTION */}
            {showConfirmDisconnect && (
              <View style={styles.confirmBox}>
                <View style={styles.confirmHeader}>
                  <Ionicons name="warning" size={18} color={Colors.warning} style={{ marginRight: 6 }} />
                  <Text style={styles.confirmTitle}>Disconnect Demo Device?</Text>
                </View>
                <Text style={styles.confirmDesc}>
                  Are you sure you want to disconnect this demo device? BioSync will pause biometric sync until reconnected.
                </Text>
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    onPress={handleCancelDisconnect}
                    style={styles.confirmCancelBtn}
                  >
                    <Text style={styles.confirmCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmDisconnect}
                    style={styles.confirmDisconnectBtn}
                  >
                    <Text style={styles.confirmDisconnectBtnText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* APPLE WATCH PRODUCT CARD WITH VISUAL ILLUSTRATION */}
            <View style={styles.deviceHeroCard}>
              {/* Product Vector Illustration */}
              <View style={styles.watchIllustrationContainer}>
                {/* Watch Strap Top */}
                <View style={styles.strapTop} />

                {/* Watch Body / Case */}
                <View style={styles.watchCase}>
                  {/* Digital Crown */}
                  <View style={styles.digitalCrown} />
                  {/* Side Button */}
                  <View style={styles.sideButton} />

                  {/* OLED Screen */}
                  <View style={styles.watchScreen}>
                    {/* Screen Status Bar */}
                    <View style={styles.screenStatusBar}>
                      <Text style={styles.screenTimeText}>09:41</Text>
                      <View style={[styles.screenDot, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
                    </View>

                    {/* Miniature Watch Face Display */}
                    <View style={styles.screenCenter}>
                      <Ionicons
                        name="heart"
                        size={16}
                        color={isConnected ? Colors.danger : Colors.mutedText}
                      />
                      <Text style={styles.screenBpmText}>
                        {isConnected ? `${healthData.heartRate} BPM` : 'OFFLINE'}
                      </Text>
                    </View>

                    {/* Activity Rings Mini Graphic */}
                    <View style={styles.ringsRow}>
                      <View style={[styles.ringPip, { backgroundColor: '#FF647C' }]} />
                      <View style={[styles.ringPip, { backgroundColor: '#37D6A0' }]} />
                      <View style={[styles.ringPip, { backgroundColor: '#35D6F2' }]} />
                    </View>
                  </View>
                </View>

                {/* Watch Strap Bottom */}
                <View style={styles.strapBottom} />
              </View>

              {/* Hardware Specs List */}
              <View style={styles.specsList}>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>MANUFACTURER</Text>
                  <Text style={styles.specVal}>{manufacturer}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>DEVICE</Text>
                  <Text style={styles.specVal}>Smartwatch</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>MODEL</Text>
                  <Text style={styles.specVal}>{model} ({size})</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>CONNECTION</Text>
                  <View style={styles.connectionStatusPill}>
                    <View style={[styles.connDot, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
                    <Text style={[styles.connText, { color: isConnected ? Colors.success : Colors.danger }]}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>BATTERY</Text>
                  <Text style={[styles.specVal, { color: isConnected ? batteryColor : Colors.secondaryText }]}>
                    {isConnected ? `${batteryLevel}%` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>LAST SYNC</Text>
                  <Text style={styles.specVal}>{isConnected ? lastSyncTime : 'Never'}</Text>
                </View>
              </View>
            </View>

            {/* SECTION 3: BATTERY DISPLAY GAUGE */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="battery-charging" size={16} color={batteryColor} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Battery Display</Text>
                </View>
                <Text style={[styles.batteryPercentTitle, { color: batteryColor }]}>
                  {isConnected ? `${batteryLevel}% Battery` : 'Watch Offline'}
                </Text>
              </View>

              {/* Visual Battery Bar */}
              <View style={styles.batteryTrack}>
                <View
                  style={[
                    styles.batteryFill,
                    {
                      width: isConnected ? `${batteryLevel}%` : '0%',
                      backgroundColor: batteryColor,
                    },
                  ]}
                />
              </View>

              <View style={styles.batterySubRow}>
                <Text style={[styles.batteryStateDesc, { color: batteryColor }]}>
                  {isConnected ? getBatteryLabel(batteryLevel) : 'Battery telemetry unavailable'}
                </Text>
                <Text style={styles.batterySyncDesc}>Optimized Battery Health</Text>
              </View>

              {/* Hackathon Demo Presets (Test green/orange/red thresholds live) */}
              <View style={styles.demoChipsRow}>
                <Text style={styles.demoChipsLabel}>DEMO BATTERY LEVELS:</Text>
                <TouchableOpacity
                  onPress={() => setBatteryLevel(78)}
                  style={[styles.demoChip, batteryLevel === 78 && styles.demoChipActive]}
                >
                  <Text style={[styles.demoChipText, { color: Colors.success }]}>78% (Healthy)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setBatteryLevel(18)}
                  style={[styles.demoChip, batteryLevel === 18 && styles.demoChipActive]}
                >
                  <Text style={[styles.demoChipText, { color: Colors.warning }]}>18% (Low)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setBatteryLevel(8)}
                  style={[styles.demoChip, batteryLevel === 8 && styles.demoChipActive]}
                >
                  <Text style={[styles.demoChipText, { color: Colors.danger }]}>8% (Critical)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECTION 4: HEALTH DATA FROM YOUR WATCH */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="heart-circle" size={18} color={Colors.primaryAccent} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Health Data from Your Watch</Text>
                </View>
                <View style={styles.simulatedPill}>
                  <Text style={styles.simulatedPillText}>SIMULATED DATA</Text>
                </View>
              </View>

              <Text style={styles.healthIntroText}>
                Continuous biometric stream transmitted via Apple Watch Series 8 optical & electrical sensors:
              </Text>

              {/* Health Metrics Grid (6 demo metrics specified) */}
              <View style={styles.metricsGrid}>
                {/* 1. Steps */}
                <View style={styles.metricItemCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(53, 214, 242, 0.15)' }]}>
                    <Ionicons name="footsteps" size={16} color={Colors.primaryAccent} />
                  </View>
                  <View style={styles.metricTextWrap}>
                    <Text style={styles.metricName}>Steps</Text>
                    <Text style={styles.metricValue}>
                      {isConnected ? healthData.steps.toLocaleString() : '--'}
                    </Text>
                    <Text style={styles.metricUpdated}>Updated {healthData.lastUpdated}</Text>
                  </View>
                  <Text style={styles.metricSimTag}>SIMULATED</Text>
                </View>

                {/* 2. Heart Rate */}
                <View style={styles.metricItemCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(255, 100, 124, 0.15)' }]}>
                    <Ionicons name="heart" size={16} color={Colors.danger} />
                  </View>
                  <View style={styles.metricTextWrap}>
                    <Text style={styles.metricName}>Heart Rate</Text>
                    <Text style={styles.metricValue}>
                      {isConnected ? `${healthData.heartRate} BPM` : '--'}
                    </Text>
                    <Text style={styles.metricUpdated}>Updated {healthData.lastUpdated}</Text>
                  </View>
                  <Text style={styles.metricSimTag}>SIMULATED</Text>
                </View>

                {/* 3. Resting Heart Rate */}
                <View style={styles.metricItemCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(139, 114, 255, 0.15)' }]}>
                    <Ionicons name="pulse" size={16} color={Colors.secondaryAccent} />
                  </View>
                  <View style={styles.metricTextWrap}>
                    <Text style={styles.metricName}>Resting Heart Rate</Text>
                    <Text style={styles.metricValue}>
                      {isConnected ? `${healthData.restingHeartRate} BPM` : '--'}
                    </Text>
                    <Text style={styles.metricUpdated}>Updated Today</Text>
                  </View>
                  <Text style={styles.metricSimTag}>SIMULATED</Text>
                </View>

                {/* 4. Sleep Duration */}
                <View style={styles.metricItemCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Ionicons name="moon" size={16} color="#818CF8" />
                  </View>
                  <View style={styles.metricTextWrap}>
                    <Text style={styles.metricName}>Sleep Duration</Text>
                    <Text style={styles.metricValue}>
                      {isConnected ? healthData.sleepDuration : '--'}
                    </Text>
                    <Text style={styles.metricUpdated}>Updated Last night</Text>
                  </View>
                  <Text style={styles.metricSimTag}>SIMULATED</Text>
                </View>

                {/* 5. Active Energy */}
                <View style={styles.metricItemCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Ionicons name="flame" size={16} color={Colors.warning} />
                  </View>
                  <View style={styles.metricTextWrap}>
                    <Text style={styles.metricName}>Active Energy</Text>
                    <Text style={styles.metricValue}>
                      {isConnected ? `${healthData.activeEnergy} kcal` : '--'}
                    </Text>
                    <Text style={styles.metricUpdated}>Updated {healthData.lastUpdated}</Text>
                  </View>
                  <Text style={styles.metricSimTag}>SIMULATED</Text>
                </View>

                {/* 6. Workouts */}
                <View style={styles.metricItemCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(55, 214, 160, 0.15)' }]}>
                    <Ionicons name="barbell" size={16} color={Colors.success} />
                  </View>
                  <View style={styles.metricTextWrap}>
                    <Text style={styles.metricName}>Workouts</Text>
                    <Text style={styles.metricValue}>
                      {isConnected ? healthData.workouts : '--'}
                    </Text>
                    <Text style={styles.metricUpdated}>Updated This week</Text>
                  </View>
                  <Text style={styles.metricSimTag}>SIMULATED</Text>
                </View>
              </View>
            </View>

            {/* SECTION 5: DEVICE ACTIONS */}
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>DEVICE ACTIONS</Text>

              <View style={styles.actionsBtnRow}>
                {/* Action A: Disconnect / Reconnect Device */}
                {isConnected ? (
                  <TouchableOpacity
                    onPress={handleDisconnectClick}
                    style={styles.disconnectBtn}
                  >
                    <Ionicons name="power-outline" size={16} color={Colors.danger} style={{ marginRight: 6 }} />
                    <Text style={styles.disconnectBtnText}>Disconnect Device</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={connectDevice}
                    style={styles.reconnectBtn}
                  >
                    <Ionicons name="link-outline" size={16} color={Colors.success} style={{ marginRight: 6 }} />
                    <Text style={styles.reconnectBtnText}>Reconnect Apple Watch</Text>
                  </TouchableOpacity>
                )}

                {/* Action B: Force Sync / Sync Now */}
                <TouchableOpacity
                  onPress={syncNow}
                  disabled={!isConnected || isSyncing}
                  style={[
                    styles.syncBtn,
                    (!isConnected || isSyncing) && styles.actionBtnDisabled,
                  ]}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color={Colors.primaryAccent} style={{ marginRight: 6 }} />
                  ) : (
                    <Ionicons name="sync-outline" size={16} color={Colors.primaryAccent} style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.syncBtnText}>
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Text>
                </TouchableOpacity>

                {/* Action C: Ping Watch / Locate */}
                <TouchableOpacity
                  onPress={pingDevice}
                  disabled={!isConnected}
                  style={[
                    styles.pingBtn,
                    !isConnected && styles.actionBtnDisabled,
                  ]}
                >
                  <Ionicons name="volume-high-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.pingBtnText}>Ping Watch</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 15, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
    shadowColor: Colors.primaryAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryText,
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  demoBanner: {
    backgroundColor: 'rgba(53, 214, 242, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.25)',
    padding: 12,
    marginBottom: 14,
  },
  demoBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 214, 242, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryAccent,
    letterSpacing: 0.5,
  },
  demoSub: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondaryText,
    letterSpacing: 0.8,
  },
  demoDesc: {
    fontSize: 11,
    color: Colors.secondaryText,
    lineHeight: 16,
  },
  pingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55, 214, 160, 0.4)',
    padding: 10,
    marginBottom: 14,
  },
  pingBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryText,
    flex: 1,
  },
  confirmBox: {
    backgroundColor: 'rgba(255, 100, 124, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 124, 0.4)',
    padding: 12,
    marginBottom: 14,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  confirmTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.danger,
  },
  confirmDesc: {
    fontSize: 11,
    color: Colors.primaryText,
    lineHeight: 16,
    marginBottom: 10,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  confirmCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  confirmCancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  confirmDisconnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.danger,
  },
  confirmDisconnectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deviceHeroCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    alignItems: 'center',
  },
  watchIllustrationContainer: {
    width: 90,
    alignItems: 'center',
    marginRight: 14,
  },
  strapTop: {
    width: 32,
    height: 12,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  strapBottom: {
    width: 32,
    height: 12,
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  watchCase: {
    width: 66,
    height: 80,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#38BDF8',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  digitalCrown: {
    position: 'absolute',
    right: -5,
    top: 18,
    width: 4,
    height: 16,
    backgroundColor: '#94A3B8',
    borderRadius: 2,
  },
  sideButton: {
    position: 'absolute',
    right: -4,
    top: 42,
    width: 3,
    height: 14,
    backgroundColor: '#64748B',
    borderRadius: 1,
  },
  watchScreen: {
    width: 54,
    height: 68,
    backgroundColor: '#020617',
    borderRadius: 13,
    padding: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  screenTimeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
  },
  screenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  screenCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenBpmText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  ringsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  ringPip: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  specsList: {
    flex: 1,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryText,
    letterSpacing: 0.4,
  },
  specVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  connectionStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  connText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  batteryPercentTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  batteryTrack: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  batteryFill: {
    height: '100%',
    borderRadius: 7,
  },
  batterySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  batteryStateDesc: {
    fontSize: 11,
    fontWeight: '700',
  },
  batterySyncDesc: {
    fontSize: 10,
    color: Colors.secondaryText,
  },
  demoChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  demoChipsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryText,
    marginRight: 4,
  },
  demoChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  demoChipActive: {
    borderColor: Colors.primaryAccent,
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
  },
  demoChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  simulatedPill: {
    backgroundColor: 'rgba(255, 184, 92, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 92, 0.35)',
  },
  simulatedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  healthIntroText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginBottom: 12,
    lineHeight: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48.5%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTextWrap: {
    flex: 1,
  },
  metricName: {
    fontSize: 10,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryText,
    marginTop: 1,
  },
  metricUpdated: {
    fontSize: 8,
    color: Colors.mutedText,
    marginTop: 1,
  },
  metricSimTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 7,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.4,
  },
  actionsContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  actionsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  actionsBtnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  disconnectBtn: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 100, 124, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 124, 0.35)',
  },
  disconnectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
  },
  reconnectBtn: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(55, 214, 160, 0.4)',
  },
  reconnectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  syncBtn: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.35)',
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryAccent,
  },
  pingBtn: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 114, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 114, 255, 0.4)',
  },
  pingBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
});
