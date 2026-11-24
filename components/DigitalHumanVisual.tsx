// ==============================================================================
// BioSync 3D Sculpted Muscular Human Avatar Component (DigitalHumanVisual)
// High-detail anatomical muscular male silhouette, wireframe constellation mesh,
// 4 interactive touch zones, day/split recovery states, and telemetry cards.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, {
  G,
  Path,
  Circle,
  Line,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { MetricBaseline, HealthMetricRecord } from '../types';

export type BodyZone = 'head' | 'heart' | 'upper_body' | 'lower_body' | null;

export interface WorkoutSplit {
  id: string;
  dayLabel: string;
  splitName: string;
  focusMuscles: ('chest' | 'shoulders' | 'arms' | 'core' | 'legs')[];
  strainLevel: 'recovered' | 'moderate' | 'high';
  statusColor: string;
  recoveryPct: number;
}

export const WORKOUT_SPLITS: WorkoutSplit[] = [
  {
    id: 'mon',
    dayLabel: 'Mon',
    splitName: 'Leg Day',
    focusMuscles: ['legs'],
    strainLevel: 'high',
    statusColor: Colors.danger, // #FF647C
    recoveryPct: 42,
  },
  {
    id: 'tue',
    dayLabel: 'Tue',
    splitName: 'Chest & Arms',
    focusMuscles: ['chest', 'arms'],
    strainLevel: 'high',
    statusColor: Colors.danger,
    recoveryPct: 48,
  },
  {
    id: 'wed',
    dayLabel: 'Wed',
    splitName: 'Shoulder Day',
    focusMuscles: ['shoulders', 'arms'],
    strainLevel: 'moderate',
    statusColor: Colors.warning, // #FFB85C
    recoveryPct: 65,
  },
  {
    id: 'thu',
    dayLabel: 'Thu',
    splitName: 'Full Recovery',
    focusMuscles: [],
    strainLevel: 'recovered',
    statusColor: Colors.success, // #37D6A0
    recoveryPct: 94,
  },
  {
    id: 'fri',
    dayLabel: 'Fri',
    splitName: 'Back & Core',
    focusMuscles: ['core'],
    strainLevel: 'moderate',
    statusColor: Colors.warning,
    recoveryPct: 72,
  },
];

interface Props {
  currentMetric: HealthMetricRecord | null;
  baseline: MetricBaseline;
  size?: 'compact' | 'full';
  onZoneSelect?: (zone: BodyZone) => void;
}

export const DigitalHumanVisual: React.FC<Props> = ({
  currentMetric,
  baseline,
  size = 'full',
  onZoneSelect,
}) => {
  const router = useRouter();
  const isFull = size === 'full';
  const screenWidth = Dimensions.get('window').width;
  const containerWidth = isFull ? screenWidth - 32 : screenWidth - 64;
  const containerHeight = isFull ? 460 : 250;

  // Selected Day Split
  const [selectedSplitId, setSelectedSplitId] = useState<string>('mon');
  const activeSplit = WORKOUT_SPLITS.find(s => s.id === selectedSplitId) || WORKOUT_SPLITS[0];

  // Active Interactive Body Zone
  const [activeZone, setActiveZone] = useState<BodyZone>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const cardSlideAnim = useRef(new Animated.Value(0)).current;
  const neuralWaveAnim = useRef(new Animated.Value(0)).current;

  // Metrics from baseline engine
  const sleepVal = currentMetric?.sleep_hours ?? 5.5;
  const sleepBaseline = baseline.avgSleep || 7.5;
  const sleepDiff = Number((sleepVal - sleepBaseline).toFixed(1));

  const hrVal = currentMetric?.resting_heart_rate ?? 76;
  const hrBaseline = baseline.avgHeartRate || 68;
  const hrDiff = hrVal - hrBaseline;

  const stepsVal = currentMetric?.steps ?? 4000;
  const stepsBaseline = baseline.avgSteps || 7000;
  const stepsDiff = stepsVal - stepsBaseline;

  const exVal = currentMetric?.exercise_minutes ?? 25;
  const exBaseline = baseline.avgExercise || 30;

  // Idle subtle breathing animation
  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.025,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, [pulseAnim]);

  // Heartbeat pulse synced to BPM (faster if HR elevated)
  useEffect(() => {
    const bpm = hrVal || 76;
    const beatInterval = (60 / bpm) * 1000;

    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScaleAnim, {
          toValue: 1.25,
          duration: beatInterval * 0.25,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartScaleAnim, {
          toValue: 0.95,
          duration: beatInterval * 0.25,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartScaleAnim, {
          toValue: 1.15,
          duration: beatInterval * 0.2,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartScaleAnim, {
          toValue: 1,
          duration: beatInterval * 0.3,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    heartbeat.start();
    return () => heartbeat.stop();
  }, [heartScaleAnim, hrVal]);

  // Card slide-in animation when zone selected
  useEffect(() => {
    if (activeZone) {
      Animated.spring(cardSlideAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [activeZone, cardSlideAnim]);

  // Trigger haptic feedback safely
  const triggerHaptics = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(style);
      }
    } catch {}
  };

  const handleZonePress = (zone: BodyZone) => {
    triggerHaptics(Haptics.ImpactFeedbackStyle.Medium);
    const nextZone = activeZone === zone ? null : zone;
    setActiveZone(nextZone);
    if (onZoneSelect) onZoneSelect(nextZone);
  };

  const handleSplitChange = (splitId: string) => {
    triggerHaptics(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSplitId(splitId);
  };

  // Determine muscle group dynamic fill color based on active split
  const getMuscleColor = (muscle: 'chest' | 'shoulders' | 'arms' | 'core' | 'legs') => {
    if (activeSplit.strainLevel === 'recovered') return Colors.success;
    if (activeSplit.focusMuscles.includes(muscle)) {
      return activeSplit.statusColor; // #FF647C or #FFB85C
    }
    return 'rgba(53, 214, 242, 0.45)'; // Default baseline cyan glow
  };

  const chestColor = getMuscleColor('chest');
  const shoulderColor = getMuscleColor('shoulders');
  const armsColor = getMuscleColor('arms');
  const coreColor = getMuscleColor('core');
  const legsColor = getMuscleColor('legs');

  return (
    <View style={[styles.container, isFull ? styles.fullContainer : styles.compactContainer]}>
      {/* 1. HORIZONTAL WORKOUT SPLIT / RECOVERY SELECTOR */}
      {isFull && (
        <View style={styles.splitSelectorContainer}>
          <View style={styles.splitHeaderRow}>
            <View style={styles.splitTitleGroup}>
              <Ionicons name="barbell-outline" size={14} color={Colors.primaryAccent} />
              <Text style={styles.splitHeaderTitle}>ANATOMICAL MUSCLE LOAD BY SPLIT</Text>
            </View>
            <View style={[styles.recoveryTag, { borderColor: activeSplit.statusColor }]}>
              <View style={[styles.recoveryDot, { backgroundColor: activeSplit.statusColor }]} />
              <Text style={[styles.recoveryTagText, { color: activeSplit.statusColor }]}>
                {activeSplit.recoveryPct}% RECOVERED
              </Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.splitScroll}>
            {WORKOUT_SPLITS.map(split => {
              const isSelected = split.id === selectedSplitId;
              return (
                <TouchableOpacity
                  key={split.id}
                  style={[
                    styles.splitPill,
                    isSelected && { borderColor: split.statusColor, backgroundColor: `${split.statusColor}18` },
                  ]}
                  onPress={() => handleSplitChange(split.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pillDot, { backgroundColor: split.statusColor }]} />
                  <Text style={[styles.pillDay, isSelected && { color: Colors.primaryText }]}>
                    {split.dayLabel}:
                  </Text>
                  <Text style={[styles.pillName, isSelected && { color: split.statusColor }]}>
                    {split.splitName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 2. THE SCULPTED 3D VOLUMETRIC MUSCULAR HUMAN AVATAR */}
      <View style={[styles.svgWrapper, { width: containerWidth, height: containerHeight }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%', height: '100%', alignItems: 'center' }}>
          <Svg width={containerWidth} height={containerHeight} viewBox="0 0 400 680">
            <Defs>
              {/* Volumetric Radial Core Glow */}
              <RadialGradient id="avatarBackdropGlow" cx="50%" cy="40%" r="55%">
                <Stop offset="0%" stopColor={Colors.primaryAccent} stopOpacity="0.28" />
                <Stop offset="45%" stopColor={Colors.secondaryAccent} stopOpacity="0.12" />
                <Stop offset="100%" stopColor={Colors.background} stopOpacity="0" />
              </RadialGradient>

              {/* 3D Anatomical Flesh / Muscle Gradient */}
              <LinearGradient id="muscleBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#1E3156" />
                <Stop offset="45%" stopColor="#111D35" />
                <Stop offset="80%" stopColor="#0B1324" />
                <Stop offset="100%" stopColor="#070C18" />
              </LinearGradient>

              {/* Specular Rim Light Cyan */}
              <LinearGradient id="cyanRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={Colors.primaryAccent} stopOpacity="0.95" />
                <Stop offset="50%" stopColor="#6EE7B7" stopOpacity="0.5" />
                <Stop offset="100%" stopColor={Colors.secondaryAccent} stopOpacity="0.9" />
              </LinearGradient>

              {/* Neural Cranial Radiation */}
              <RadialGradient id="neuralGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={Colors.primaryAccent} stopOpacity="0.9" />
                <Stop offset="60%" stopColor={Colors.secondaryAccent} stopOpacity="0.4" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>

              {/* Cardiac Core Glow */}
              <RadialGradient id="cardiacPulseGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={Colors.danger} stopOpacity="0.95" />
                <Stop offset="65%" stopColor="#FF8B9E" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Ambient Holographic Halo */}
            <Circle cx="200" cy="270" r="230" fill="url(#avatarBackdropGlow)" />

            {/* Cybernetic Biometric Orbital Calibration Rings */}
            <Circle cx="200" cy="270" r="215" stroke={Colors.primaryAccent} strokeWidth="1" strokeDasharray="3 8" opacity={0.25} />
            <Circle cx="200" cy="270" r="165" stroke={Colors.secondaryAccent} strokeWidth="1.2" strokeDasharray="6 6" opacity={0.3} />
            <Circle cx="200" cy="270" r="115" stroke={Colors.primaryAccent} strokeWidth="1" strokeDasharray="2 5" opacity={0.2} />

            {/* ============================================================== */}
            {/* ANATOMICAL 3D MUSCULAR BASE SILHOUETTE                         */}
            {/* ============================================================== */}
            <G id="muscularSilhouette" stroke="#24334C" strokeWidth="1.2">
              {/* Head & Cranium */}
              <Path
                d="M 188 28 C 194 24, 206 24, 212 28 C 224 33, 226 50, 222 62 C 220 70, 212 80, 204 84 L 196 84 C 188 80, 180 70, 178 62 C 174 50, 176 33, 188 28 Z"
                fill="url(#muscleBodyGrad)"
                stroke={activeZone === 'head' ? Colors.primaryAccent : '#35D6F288'}
                strokeWidth={activeZone === 'head' ? 2.5 : 1.5}
              />

              {/* Neck & Trapezius */}
              <Path
                d="M 186 78 L 176 102 L 148 116 L 152 126 L 182 112 L 190 114 L 190 84 Z"
                fill="url(#muscleBodyGrad)"
                stroke={shoulderColor}
                strokeWidth="1.2"
              />
              <Path
                d="M 214 78 L 224 102 L 252 116 L 248 126 L 218 112 L 210 114 L 210 84 Z"
                fill="url(#muscleBodyGrad)"
                stroke={shoulderColor}
                strokeWidth="1.2"
              />

              {/* Deltoids (Shoulders) */}
              <Path
                d="M 148 116 C 132 124, 126 142, 130 162 C 134 168, 142 168, 148 160 C 154 148, 154 130, 150 118 Z"
                fill="url(#muscleBodyGrad)"
                stroke={shoulderColor}
                strokeWidth="1.5"
              />
              <Path
                d="M 252 116 C 268 124, 274 142, 270 162 C 266 168, 258 168, 252 160 C 246 148, 246 130, 250 118 Z"
                fill="url(#muscleBodyGrad)"
                stroke={shoulderColor}
                strokeWidth="1.5"
              />

              {/* Pectoralis Major (Chest Plates) */}
              {/* Left Pectoral */}
              <Path
                d="M 184 108 L 154 122 C 150 134, 152 152, 160 162 C 172 168, 192 168, 196 156 L 196 112 Z"
                fill="url(#muscleBodyGrad)"
                stroke={activeZone === 'heart' ? Colors.danger : chestColor}
                strokeWidth={activeZone === 'heart' ? 2.5 : 1.5}
              />
              {/* Right Pectoral */}
              <Path
                d="M 216 108 L 246 122 C 250 134, 248 152, 240 162 C 228 168, 208 168, 204 156 L 204 112 Z"
                fill="url(#muscleBodyGrad)"
                stroke={activeZone === 'heart' ? Colors.danger : chestColor}
                strokeWidth={activeZone === 'heart' ? 2.5 : 1.5}
              />

              {/* Biceps & Triceps (Upper Arms) */}
              <Path
                d="M 130 164 C 122 176, 120 200, 126 220 L 138 220 C 144 200, 146 178, 144 164 Z"
                fill="url(#muscleBodyGrad)"
                stroke={armsColor}
                strokeWidth="1.2"
              />
              <Path
                d="M 270 164 C 278 176, 280 200, 274 220 L 262 220 C 256 200, 254 178, 256 164 Z"
                fill="url(#muscleBodyGrad)"
                stroke={armsColor}
                strokeWidth="1.2"
              />

              {/* Forearms & Hands */}
              <Path
                d="M 126 222 C 118 238, 114 265, 110 292 C 108 304, 102 320, 96 332 L 102 338 C 110 326, 118 306, 124 290 C 132 268, 136 242, 138 222 Z"
                fill="url(#muscleBodyGrad)"
                stroke={armsColor}
                strokeWidth="1.2"
              />
              <Path
                d="M 274 222 C 282 238, 286 265, 290 292 C 292 304, 298 320, 304 332 L 298 338 C 290 326, 282 306, 276 290 C 268 268, 264 242, 262 222 Z"
                fill="url(#muscleBodyGrad)"
                stroke={armsColor}
                strokeWidth="1.2"
              />

              {/* Six-Pack Rectus Abdominis Plates */}
              {/* Upper Abs */}
              <Path d="M 184 172 L 196 172 L 196 190 L 182 188 Z" fill="url(#muscleBodyGrad)" stroke={coreColor} strokeWidth="1.2" />
              <Path d="M 216 172 L 204 172 L 204 190 L 218 188 Z" fill="url(#muscleBodyGrad)" stroke={coreColor} strokeWidth="1.2" />
              {/* Mid Abs */}
              <Path d="M 182 194 L 196 194 L 196 214 L 180 210 Z" fill="url(#muscleBodyGrad)" stroke={coreColor} strokeWidth="1.2" />
              <Path d="M 218 194 L 204 194 L 204 214 L 220 210 Z" fill="url(#muscleBodyGrad)" stroke={coreColor} strokeWidth="1.2" />
              {/* Lower Abs */}
              <Path d="M 180 218 L 196 218 L 196 238 L 178 232 Z" fill="url(#muscleBodyGrad)" stroke={coreColor} strokeWidth="1.2" />
              <Path d="M 220 218 L 204 218 L 204 238 L 222 232 Z" fill="url(#muscleBodyGrad)" stroke={coreColor} strokeWidth="1.2" />

              {/* Serratus / Obliques / V-Taper */}
              <Path d="M 160 172 C 166 195, 168 225, 172 250 L 182 254 L 180 218 L 160 172 Z" fill="url(#muscleBodyGrad)" stroke={coreColor} strokeWidth="1.2" />
              <Path d="M 240 172 C 234 195, 232 225, 228 250 L 218 254 L 220 218 L 240 172 Z" fill="url(#muscleBodyGrad)" stroke={coreColor} strokeWidth="1.2" />

              {/* Pelvis & Inguinal V-Groove */}
              <Path
                d="M 172 252 L 200 286 L 228 252 L 218 256 L 200 274 L 182 256 Z"
                fill="url(#muscleBodyGrad)"
                stroke={Colors.primaryAccent}
                strokeWidth="1.2"
              />

              {/* Quadriceps (Left & Right Powerful Thighs) */}
              {/* Left Quadriceps (Vastus Lateralis, Rectus Femoris, Vastus Medialis) */}
              <Path
                d="M 170 262 C 156 295, 154 340, 166 384 L 180 388 C 190 350, 194 300, 198 286 C 188 280, 178 268, 170 262 Z"
                fill="url(#muscleBodyGrad)"
                stroke={activeZone === 'lower_body' ? Colors.primaryAccent : legsColor}
                strokeWidth={activeZone === 'lower_body' ? 2.5 : 1.5}
              />
              {/* Right Quadriceps */}
              <Path
                d="M 230 262 C 244 295, 246 340, 234 384 L 220 388 C 210 350, 206 300, 202 286 C 212 280, 222 268, 230 262 Z"
                fill="url(#muscleBodyGrad)"
                stroke={activeZone === 'lower_body' ? Colors.primaryAccent : legsColor}
                strokeWidth={activeZone === 'lower_body' ? 2.5 : 1.5}
              />

              {/* Patella (Knees) */}
              <Circle cx="174" cy="402" r="9" fill="#17233A" stroke={legsColor} strokeWidth="1.5" />
              <Circle cx="226" cy="402" r="9" fill="#17233A" stroke={legsColor} strokeWidth="1.5" />

              {/* Lower Legs (Calves & Shins) */}
              {/* Left Calf / Shin */}
              <Path
                d="M 166 414 C 158 438, 158 475, 168 518 L 178 522 C 184 485, 186 445, 180 416 Z"
                fill="url(#muscleBodyGrad)"
                stroke={legsColor}
                strokeWidth="1.4"
              />
              {/* Right Calf / Shin */}
              <Path
                d="M 234 414 C 242 438, 242 475, 232 518 L 222 522 C 216 485, 214 445, 220 416 Z"
                fill="url(#muscleBodyGrad)"
                stroke={legsColor}
                strokeWidth="1.4"
              />

              {/* Feet / Ankles */}
              <Path
                d="M 168 522 L 158 554 L 180 554 L 178 522 Z"
                fill="url(#muscleBodyGrad)"
                stroke={legsColor}
                strokeWidth="1.2"
              />
              <Path
                d="M 232 522 L 242 554 L 220 554 L 222 522 Z"
                fill="url(#muscleBodyGrad)"
                stroke={legsColor}
                strokeWidth="1.2"
              />
            </G>

            {/* ============================================================== */}
            {/* WIREFRAME CONSTELLATION MESH FILAMENTS (REFERENCE IMAGE STYLE) */}
            {/* ============================================================== */}
            <G id="wireframeMesh" stroke="rgba(53, 214, 242, 0.45)" strokeWidth="0.8" strokeDasharray="3 3">
              {/* Cranial grid */}
              <Line x1="184" y1="45" x2="216" y2="45" />
              <Line x1="200" y1="28" x2="200" y2="76" />
              <Line x1="188" y1="62" x2="200" y2="52" />
              <Line x1="212" y1="62" x2="200" y2="52" />

              {/* Clavicle & Chest cross-ties */}
              <Line x1="150" y1="116" x2="200" y2="108" />
              <Line x1="250" y1="116" x2="200" y2="108" />
              <Line x1="150" y1="116" x2="175" y2="140" />
              <Line x1="250" y1="116" x2="225" y2="140" />
              <Line x1="175" y1="140" x2="200" y2="160" />
              <Line x1="225" y1="140" x2="200" y2="160" />

              {/* Spinal Central Axis Conduit */}
              <Line x1="200" y1="108" x2="200" y2="280" stroke={Colors.primaryAccent} strokeWidth="1.5" strokeDasharray="4 4" opacity={0.8} />

              {/* Abdominal hexagonal grid */}
              <Line x1="175" y1="190" x2="225" y2="190" />
              <Line x1="175" y1="215" x2="225" y2="215" />
              <Line x1="175" y1="240" x2="225" y2="240" />
              <Line x1="180" y1="172" x2="200" y2="226" />
              <Line x1="220" y1="172" x2="200" y2="226" />
              <Line x1="200" y1="226" x2="172" y2="252" />
              <Line x1="200" y1="226" x2="228" y2="252" />

              {/* Quadriceps Diamond Grid */}
              <Line x1="170" y1="262" x2="182" y2="330" />
              <Line x1="200" y1="286" x2="182" y2="330" />
              <Line x1="182" y1="330" x2="174" y2="402" />
              <Line x1="230" y1="262" x2="218" y2="330" />
              <Line x1="200" y1="286" x2="218" y2="330" />
              <Line x1="218" y1="330" x2="226" y2="402" />

              {/* Tibial Calf Mesh */}
              <Line x1="174" y1="402" x2="172" y2="465" />
              <Line x1="172" y1="465" x2="172" y2="522" />
              <Line x1="226" y1="402" x2="228" y2="465" />
              <Line x1="228" y1="465" x2="228" y2="522" />
            </G>

            {/* ============================================================== */}
            {/* CONSTELLATION BIOMETRIC SENSOR NODES (CYAN DOTS)               */}
            {/* ============================================================== */}
            <G id="sensorNodes" fill={Colors.primaryAccent}>
              <Circle cx="200" cy="52" r="3" />
              <Circle cx="150" cy="116" r="3" />
              <Circle cx="250" cy="116" r="3" />
              <Circle cx="132" cy="164" r="2.5" />
              <Circle cx="268" cy="164" r="2.5" />
              <Circle cx="126" cy="222" r="2.5" />
              <Circle cx="274" cy="222" r="2.5" />
              <Circle cx="200" cy="172" r="2" />
              <Circle cx="200" cy="194" r="2" />
              <Circle cx="200" cy="218" r="2" />
              <Circle cx="200" cy="286" r="3" />
              <Circle cx="182" cy="330" r="2.5" />
              <Circle cx="218" cy="330" r="2.5" />
              <Circle cx="174" cy="402" r="3" />
              <Circle cx="226" cy="402" r="3" />
              <Circle cx="172" cy="522" r="2.5" />
              <Circle cx="228" cy="522" r="2.5" />
            </G>

            {/* ============================================================== */}
            {/* ZONE 1: HEAD / NEURAL RECOVERY CORE                            */}
            {/* ============================================================== */}
            <G id="headZone">
              <Circle cx="200" cy="52" r="16" fill="url(#neuralGlow)" />
              {activeZone === 'head' && (
                <>
                  <Circle cx="200" cy="52" r="28" stroke={Colors.primaryAccent} strokeWidth="1.5" strokeDasharray="4 4" opacity={0.8} />
                  <Circle cx="200" cy="52" r="38" stroke={Colors.secondaryAccent} strokeWidth="1" strokeDasharray="2 6" opacity={0.5} />
                </>
              )}
            </G>

            {/* ============================================================== */}
            {/* ZONE 2: HEART / CARDIOVASCULAR CORE (LEFT THORAX)             */}
            {/* ============================================================== */}
            <G id="heartZone">
              <Circle cx="188" cy="144" r="14" fill="url(#cardiacPulseGlow)" />
              <Circle cx="188" cy="144" r="6" fill={Colors.danger} />
              <Circle cx="188" cy="144" r="18" stroke={Colors.danger} strokeWidth="1" opacity={0.5} />
              {activeZone === 'heart' && (
                <>
                  <Circle cx="188" cy="144" r="26" stroke={Colors.danger} strokeWidth="1.5" strokeDasharray="4 4" opacity={0.9} />
                  <Circle cx="188" cy="144" r="36" stroke={Colors.danger} strokeWidth="1" strokeDasharray="3 5" opacity={0.4} />
                </>
              )}
            </G>

            {/* ============================================================== */}
            {/* ZONE 3: UPPER BODY TARGET RETICLE (WHEN SELECTED)              */}
            {/* ============================================================== */}
            {activeZone === 'upper_body' && (
              <G id="upperBodyTarget">
                <Circle cx="200" cy="205" r="48" stroke={Colors.warning} strokeWidth="1.5" strokeDasharray="5 5" opacity={0.7} />
                <Circle cx="200" cy="205" r="62" stroke={Colors.warning} strokeWidth="1" strokeDasharray="2 6" opacity={0.4} />
              </G>
            )}

            {/* ============================================================== */}
            {/* ZONE 4: LOWER BODY TARGET RETICLE (WHEN SELECTED)              */}
            {/* ============================================================== */}
            {activeZone === 'lower_body' && (
              <G id="lowerBodyTarget">
                <Circle cx="200" cy="385" r="58" stroke={Colors.primaryAccent} strokeWidth="1.5" strokeDasharray="5 5" opacity={0.8} />
                <Circle cx="200" cy="385" r="76" stroke={Colors.primaryAccent} strokeWidth="1" strokeDasharray="3 6" opacity={0.4} />
              </G>
            )}
          </Svg>
        </Animated.View>

        {/* 4 TOUCH-INTERACTIVE HOTSPOT BUTTONS OVERLAYING THE AVATAR */}
        {/* Hotspot 1: Head / Brain */}
        <TouchableOpacity
          style={[styles.hotspotTouch, { top: isFull ? 24 : 10, left: containerWidth / 2 - 40 }]}
          onPress={() => handleZonePress('head')}
          activeOpacity={0.7}
        >
          <View style={[styles.radarBadge, activeZone === 'head' && styles.radarBadgeActive]}>
            <Ionicons name="sparkles" size={10} color={Colors.primaryAccent} />
            <Text style={styles.radarText}>NEURAL</Text>
          </View>
        </TouchableOpacity>

        {/* Hotspot 2: Heart / Cardiovascular */}
        <TouchableOpacity
          style={[styles.hotspotTouch, { top: isFull ? 120 : 65, left: containerWidth / 2 - 68 }]}
          onPress={() => handleZonePress('heart')}
          activeOpacity={0.7}
        >
          <View style={[styles.radarBadge, activeZone === 'heart' && styles.radarBadgeCardiacActive]}>
            <Ionicons name="heart" size={10} color={Colors.danger} />
            <Text style={[styles.radarText, { color: Colors.danger }]}>{hrVal} BPM</Text>
          </View>
        </TouchableOpacity>

        {/* Hotspot 3: Upper Body / Core */}
        <TouchableOpacity
          style={[styles.hotspotTouch, { top: isFull ? 190 : 105, right: containerWidth / 2 - 120 }]}
          onPress={() => handleZonePress('upper_body')}
          activeOpacity={0.7}
        >
          <View style={[styles.radarBadge, activeZone === 'upper_body' && styles.radarBadgeWarningActive]}>
            <Ionicons name="shield-outline" size={10} color={Colors.warning} />
            <Text style={[styles.radarText, { color: Colors.warning }]}>CORE LOAD</Text>
          </View>
        </TouchableOpacity>

        {/* Hotspot 4: Lower Body / Legs */}
        <TouchableOpacity
          style={[styles.hotspotTouch, { bottom: isFull ? 100 : 40, left: containerWidth / 2 - 110 }]}
          onPress={() => handleZonePress('lower_body')}
          activeOpacity={0.7}
        >
          <View style={[styles.radarBadge, activeZone === 'lower_body' && styles.radarBadgeSuccessActive]}>
            <Ionicons name="footsteps" size={10} color={Colors.success} />
            <Text style={[styles.radarText, { color: Colors.success }]}>{stepsVal.toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. ANIMATED GLASSMORPHIC DETAIL CARD UPON HOTSPOT TAP */}
      {activeZone && (
        <Animated.View
          style={[
            styles.detailCard,
            {
              opacity: cardSlideAnim,
              transform: [
                {
                  translateY: cardSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Card Header & Close */}
          <View style={styles.detailHeader}>
            <View style={styles.detailTitleGroup}>
              {activeZone === 'head' && (
                <>
                  <View style={[styles.detailIconCircle, { backgroundColor: 'rgba(53, 214, 242, 0.15)' }]}>
                    <Ionicons name="moon-outline" size={18} color={Colors.primaryAccent} />
                  </View>
                  <View>
                    <Text style={styles.detailTitle}>Brain & Neural Recovery</Text>
                    <Text style={styles.detailSub}>Cranial Biometrics & Cognitive Focus Load</Text>
                  </View>
                </>
              )}

              {activeZone === 'heart' && (
                <>
                  <View style={[styles.detailIconCircle, { backgroundColor: 'rgba(255, 100, 124, 0.15)' }]}>
                    <Ionicons name="heart-outline" size={18} color={Colors.danger} />
                  </View>
                  <View>
                    <Text style={styles.detailTitle}>Cardiovascular Core</Text>
                    <Text style={styles.detailSub}>Resting Heart Rate & Autonomic Tone</Text>
                  </View>
                </>
              )}

              {activeZone === 'upper_body' && (
                <>
                  <View style={[styles.detailIconCircle, { backgroundColor: 'rgba(255, 184, 92, 0.15)' }]}>
                    <Ionicons name="barbell-outline" size={18} color={Colors.warning} />
                  </View>
                  <View>
                    <Text style={styles.detailTitle}>Upper Body & Core Load</Text>
                    <Text style={styles.detailSub}>Pectorals, Deltoids & Abdominal Strain</Text>
                  </View>
                </>
              )}

              {activeZone === 'lower_body' && (
                <>
                  <View style={[styles.detailIconCircle, { backgroundColor: 'rgba(55, 214, 160, 0.15)' }]}>
                    <Ionicons name="footsteps-outline" size={18} color={Colors.success} />
                  </View>
                  <View>
                    <Text style={styles.detailTitle}>Lower Body & Mobility</Text>
                    <Text style={styles.detailSub}>Quadriceps, Calves & Stride Fatigue</Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveZone(null)}>
              <Ionicons name="close" size={18} color={Colors.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Card Body by Zone */}
          {activeZone === 'head' && (
            <View style={styles.detailBody}>
              <View style={styles.detailRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.itemLabel}>SLEEP RECORDED</Text>
                  <Text style={styles.itemVal}>{sleepVal} hrs</Text>
                  <Text style={[styles.itemDelta, sleepDiff < 0 ? styles.deltaWarn : styles.deltaGood]}>
                    {sleepDiff >= 0 ? `+${sleepDiff}` : `${sleepDiff}`} hrs vs baseline ({sleepBaseline}h)
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.itemLabel}>DEEP SLEEP</Text>
                  <Text style={styles.itemVal}>1.1 hrs</Text>
                  <Text style={styles.itemSubText}>20% Restorative ratio</Text>
                </View>
              </View>

              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>COGNITIVE LOAD & FOCUS WINDOW:</Text>
                <Text style={styles.statusBoxVal}>
                  {sleepDiff < -1.0
                    ? 'Elevated Mental Fatigue · Optimal Peak Focus Window: 10:00 AM – 1:00 PM'
                    : 'Cognitive Recovery Balanced · High Alertness Anticipated'}
                </Text>
              </View>

              <View style={styles.actionBox}>
                <Ionicons name="bulb-outline" size={14} color={Colors.primaryAccent} style={{ marginRight: 6 }} />
                <Text style={styles.actionText}>
                  Dim screen backlights 45 minutes before sleep and prioritize consistent sleep schedule.
                </Text>
              </View>
            </View>
          )}

          {activeZone === 'heart' && (
            <View style={styles.detailBody}>
              <View style={styles.detailRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.itemLabel}>RESTING HEART RATE</Text>
                  <Text style={[styles.itemVal, { color: Colors.danger }]}>{hrVal} BPM</Text>
                  <Text style={[styles.itemDelta, hrDiff > 0 ? styles.deltaWarn : styles.deltaGood]}>
                    {hrDiff >= 0 ? `+${hrDiff}` : `${hrDiff}`} BPM vs norm ({hrBaseline} bpm)
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.itemLabel}>CARDIO EFFICIENCY</Text>
                  <Text style={styles.itemVal}>{hrVal > 72 ? 'Elevated' : 'Nominal'}</Text>
                  <Text style={styles.itemSubText}>Target Rest: 60–68 BPM</Text>
                </View>
              </View>

              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>AUTONOMIC SYMPATHETIC TONE:</Text>
                <Text style={styles.statusBoxVal}>
                  {hrDiff > 4
                    ? 'Heightened physiological stress response. Often correlates with acute sleep reduction or caffeine.'
                    : 'Parasympathetic recovery dominant. Steady cardiac rhythm.'}
                </Text>
              </View>

              <View style={styles.actionBox}>
                <Ionicons name="water-outline" size={14} color={Colors.danger} style={{ marginRight: 6 }} />
                <Text style={styles.actionText}>
                  Increase water hydration and practice 3 minutes of slow diaphragmatic pacing (4-7-8 breathing).
                </Text>
              </View>
            </View>
          )}

          {activeZone === 'upper_body' && (
            <View style={styles.detailBody}>
              <View style={styles.detailRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.itemLabel}>ACTIVE SPLIT</Text>
                  <Text style={[styles.itemVal, { color: activeSplit.statusColor }]}>{activeSplit.splitName}</Text>
                  <Text style={styles.itemSubText}>{activeSplit.strainLevel.toUpperCase()} STRAIN</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.itemLabel}>EXERCISE DURATION</Text>
                  <Text style={styles.itemVal}>{exVal} min</Text>
                  <Text style={styles.itemSubText}>Baseline: {exBaseline} min</Text>
                </View>
              </View>

              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>MUSCLE RECOVERY & DOMS STATUS:</Text>
                <Text style={styles.statusBoxVal}>
                  Pectorals and anterior deltoids at 68% localized fatigue. Estimated 24h supercompensation window.
                </Text>
              </View>

              <View style={styles.actionBox}>
                <Ionicons name="barbell-outline" size={14} color={Colors.warning} style={{ marginRight: 6 }} />
                <Text style={styles.actionText}>
                  Ensure post-exertion amino acid intake and perform 2 sets of doorway pectoral stretches.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/workout' as any)}
                style={styles.openWorkoutBtn}
              >
                <Ionicons name="barbell" size={15} color={Colors.background} style={{ marginRight: 6 }} />
                <Text style={styles.openWorkoutBtnText}>Open Workout Intelligence Hub</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeZone === 'lower_body' && (
            <View style={styles.detailBody}>
              <View style={styles.detailRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.itemLabel}>DAILY STEPS</Text>
                  <Text style={styles.itemVal}>{stepsVal.toLocaleString()}</Text>
                  <Text style={[styles.itemDelta, stepsDiff < 0 ? styles.deltaWarn : styles.deltaGood]}>
                    {stepsDiff >= 0 ? `+${stepsDiff.toLocaleString()}` : `${stepsDiff.toLocaleString()}`} vs baseline
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.itemLabel}>SEDENTARY DURATION</Text>
                  <Text style={styles.itemVal}>4.2 hrs</Text>
                  <Text style={styles.itemSubText}>Continuous desk load</Text>
                </View>
              </View>

              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>LOWER BODY MOBILITY INDEX:</Text>
                <Text style={styles.statusBoxVal}>
                  Step volume is below 7-day average. Quadriceps and hip flexors show tightening from prolonged sitting.
                </Text>
              </View>

              <View style={styles.actionBox}>
                <Ionicons name="walk-outline" size={14} color={Colors.success} style={{ marginRight: 6 }} />
                <Text style={styles.actionText}>
                  Take a brief 10-minute campus walk or perform standing calf raises to restore lower-body circulation.
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* Tap Guidance Prompt (When no zone active) */}
      {!activeZone && isFull && (
        <View style={styles.tapPromptRow}>
          <Ionicons name="hand-left-outline" size={14} color={Colors.primaryAccent} />
          <Text style={styles.tapPromptText}>
            Tap any muscle zone (Head, Heart, Core, Legs) to inspect real-time biometrics.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
  },
  fullContainer: {
    paddingVertical: 14,
    marginVertical: 10,
  },
  compactContainer: {
    paddingVertical: 8,
    marginVertical: 6,
  },
  splitSelectorContainer: {
    width: '100%',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  splitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitHeaderTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.8,
    marginLeft: 5,
  },
  recoveryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Spacing.borderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  recoveryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  recoveryTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  splitScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  splitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  pillDay: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
    marginRight: 3,
  },
  pillName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hotspotTouch: {
    position: 'absolute',
    padding: 6,
    zIndex: 10,
  },
  radarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 26, 46, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  radarBadgeActive: {
    borderColor: Colors.primaryAccent,
    backgroundColor: 'rgba(53, 214, 242, 0.25)',
  },
  radarBadgeCardiacActive: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(255, 100, 124, 0.25)',
  },
  radarBadgeWarningActive: {
    borderColor: Colors.warning,
    backgroundColor: 'rgba(255, 184, 92, 0.25)',
  },
  radarBadgeSuccessActive: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(55, 214, 160, 0.25)',
  },
  radarText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryAccent,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  detailCard: {
    width: '92%',
    backgroundColor: 'rgba(13, 20, 37, 0.96)',
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderGlow,
    padding: 14,
    marginTop: 8,
    shadowColor: Colors.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  detailTitle: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  detailSub: {
    fontSize: 10,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailBody: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricItem: {
    flex: 1,
    backgroundColor: Colors.elevatedCard,
    borderRadius: Spacing.borderRadius.md,
    padding: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.5,
  },
  itemVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryText,
    marginVertical: 2,
  },
  itemDelta: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemSubText: {
    fontSize: 10,
    color: Colors.secondaryText,
  },
  deltaWarn: {
    color: Colors.warning,
  },
  deltaGood: {
    color: Colors.success,
  },
  statusBox: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusBoxLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  statusBoxVal: {
    fontSize: 11,
    color: Colors.primaryText,
    lineHeight: 16,
    fontWeight: '600',
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 214, 242, 0.08)',
    borderRadius: Spacing.borderRadius.md,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryAccent,
  },
  actionText: {
    fontSize: 11,
    color: Colors.primaryText,
    flex: 1,
    lineHeight: 16,
  },
  tapPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tapPromptText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  openWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAccent,
    borderRadius: Spacing.borderRadius.md,
    paddingVertical: 10,
    marginTop: 10,
  },
  openWorkoutBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.background,
  },
});

export default DigitalHumanVisual;
