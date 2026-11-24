// ==============================================================================
// BioSync Screen 1: Futuristic Onboarding (Section 7)
// "Know Thyself. Your Body. Your Patterns. Your Intelligence."
// ==============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { StorageService } from '../services/storageService';
import { useHealth } from '../context/HealthContext';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { resetToDemoData } = useHealth();

  const handleExploreDemo = async () => {
    await StorageService.setOnboardingDone(true);
    await resetToDemoData();
    router.replace('/(tabs)');
  };

  const handleGetStarted = async () => {
    await StorageService.setOnboardingDone(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="finger-print" size={20} color={Colors.primaryAccent} />
          </View>
          <Text style={styles.brandName}>
            BIO<Text style={{ color: Colors.primaryAccent }}>SYNC</Text>
          </Text>
        </View>

        {/* Central Futuristic Digital Twin Hologram Graphic */}
        <View style={styles.hologramWrapper}>
          <Svg width={width - 48} height={260} viewBox="0 0 320 260">
            <Defs>
              <RadialGradient id="onboardingGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={Colors.primaryAccent} stopOpacity="0.4" />
                <Stop offset="60%" stopColor={Colors.secondaryAccent} stopOpacity="0.15" />
                <Stop offset="100%" stopColor={Colors.background} stopOpacity="0" />
              </RadialGradient>
              <LinearGradient id="humanOutlineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={Colors.primaryAccent} />
                <Stop offset="50%" stopColor={Colors.secondaryAccent} />
                <Stop offset="100%" stopColor={Colors.primaryAccent} />
              </LinearGradient>
            </Defs>

            {/* Glowing Orb */}
            <Circle cx={160} cy={130} r={110} fill="url(#onboardingGlow)" />

            {/* Futuristic Holographic Calibration Circles */}
            <Circle cx={160} cy={130} r={105} stroke={Colors.primaryAccent} strokeWidth="1" strokeDasharray="3 7" opacity={0.4} />
            <Circle cx={160} cy={130} r={80} stroke={Colors.secondaryAccent} strokeWidth="1.2" strokeDasharray="6 4" opacity={0.5} />
            <Circle cx={160} cy={130} r={55} stroke={Colors.primaryAccent} strokeWidth="1" strokeDasharray="2 4" opacity={0.3} />

            {/* Stylized Human Silhouette */}
            {/* Head */}
            <Circle cx={160} cy={60} r={22} fill={Colors.elevatedCard} stroke="url(#humanOutlineGrad)" strokeWidth="2" />
            <Circle cx={160} cy={60} r={5} fill={Colors.primaryAccent} />

            {/* Torso & Biometric Channels */}
            <Path
              d="M 125 105 Q 135 175 145 205 L 175 205 Q 185 175 195 105 Z"
              fill={Colors.cardBackground}
              stroke="url(#humanOutlineGrad)"
              strokeWidth="2"
            />

            {/* Core Neural Line */}
            <Path d="M 160 82 L 160 200" stroke={Colors.primaryAccent} strokeWidth="1.5" strokeDasharray="4 3" opacity={0.8} />

            {/* Biometric Nodes */}
            <Circle cx={166} cy={120} r={6} fill={Colors.danger} />
            <Circle cx={166} cy={120} r={14} stroke={Colors.danger} strokeWidth="1" opacity={0.4} />

            <Circle cx={160} cy={165} r={5} fill={Colors.success} />
            <Circle cx={160} cy={165} r={12} stroke={Colors.success} strokeWidth="1" opacity={0.4} />
          </Svg>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.headline}>Know Thyself.</Text>
          <Text style={styles.subtitle}>Your Body. Your Patterns. Your Intelligence.</Text>
          <Text style={styles.description}>
            Your personal health data tells a story. BioSync unifies your sleep, heart rate, and movement data to decode your unique physiological baselines.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleExploreDemo}>
            <Ionicons name="sparkles" size={18} color={Colors.background} style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Explore Demo Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGetStarted}>
            <Text style={styles.secondaryButtonText}>Set Up My Twin</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primaryAccent} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* Privacy Notice Box */}
        <View style={styles.privacyBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.secondaryText} style={{ marginRight: 8 }} />
          <Text style={styles.privacyText}>
            <Text style={{ fontWeight: '700', color: Colors.primaryText }}>Privacy Notice: </Text>
            Personal health data is sensitive and strictly user-controlled. All demo baselines execute locally on your device with no mandatory registration.
          </Text>
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
  container: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
  },
  brandName: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '900',
    color: Colors.primaryText,
    letterSpacing: 2,
  },
  hologramWrapper: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  headline: {
    fontSize: Typography.fontSize.hero,
    fontWeight: '900',
    color: Colors.primaryText,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '700',
    color: Colors.primaryAccent,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  description: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primaryAccent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Spacing.borderRadius.lg,
    marginBottom: 12,
    shadowColor: Colors.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius.lg,
  },
  secondaryButtonText: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize.bodyLarge,
    fontWeight: '700',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  privacyText: {
    fontSize: 11,
    color: Colors.secondaryText,
    flex: 1,
    lineHeight: 16,
  },
});
