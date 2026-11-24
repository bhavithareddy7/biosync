// ==============================================================================
// BioSync Active Gym Tracker & Sets/Reps/Weight Logger
// Live session timer, rest countdown, volume calculation, and completion summary
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/theme';
import {
  Exercise,
  WorkoutRoutine,
  WorkoutSession,
  WorkoutExerciseLog,
  WorkoutSet,
  MuscleGroup,
} from '../types/workout';
import { WorkoutService } from '../services/workoutService';

interface ActiveWorkoutLoggerProps {
  routine?: WorkoutRoutine | null;
  initialExercises?: Exercise[];
  onClose: () => void;
  onFinishSession: (session: WorkoutSession) => void;
}

export const ActiveWorkoutLogger: React.FC<ActiveWorkoutLoggerProps> = ({
  routine,
  initialExercises = [],
  onClose,
  onFinishSession,
}) => {
  // Session elapsed timer (seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rest Timer State
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);
  const [restInitialSeconds, setRestInitialSeconds] = useState(60);

  // Exercises actively being logged
  const [exerciseLogs, setExerciseLogs] = useState<WorkoutExerciseLog[]>(() => {
    return initialExercises.map((ex, exIdx) => ({
      id: `log-${ex.id}-${exIdx}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      targetMuscle: ex.targetMuscle,
      equipment: ex.equipment,
      sets: Array.from({ length: ex.defaultSets || 3 }).map((_, sIdx) => ({
        id: `set-${ex.id}-${sIdx + 1}`,
        setNumber: sIdx + 1,
        reps: ex.defaultReps || 10,
        weightKg: ex.defaultWeightKg || 0,
        completed: false,
        previousReference: ex.defaultWeightKg > 0 ? `${ex.defaultWeightKg} kg × ${ex.defaultReps}` : `Bodyweight × ${ex.defaultReps}`,
      })),
    }));
  });

  // Summary Modal state upon completion
  const [completedSummary, setCompletedSummary] = useState<WorkoutSession | null>(null);

  // 1. Elapsed Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Rest Timer Countdown Effect
  useEffect(() => {
    if (restSecondsRemaining === null) return;
    if (restSecondsRemaining <= 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setRestSecondsRemaining(null);
      return;
    }

    const restTimer = setInterval(() => {
      setRestSecondsRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(restTimer);
  }, [restSecondsRemaining]);

  const startRestTimer = (seconds: number) => {
    setRestInitialSeconds(seconds);
    setRestSecondsRemaining(seconds);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle set completion
  const toggleSetCompleted = (exIdx: number, setIdx: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setExerciseLogs((prev) => {
      const updated = [...prev];
      const targetSet = updated[exIdx].sets[setIdx];
      const isNowCompleted = !targetSet.completed;
      targetSet.completed = isNowCompleted;

      // Automatically trigger 60s rest timer when a set is completed
      if (isNowCompleted && restSecondsRemaining === null) {
        setRestInitialSeconds(60);
        setRestSecondsRemaining(60);
      }

      return updated;
    });
  };

  // Update set weight
  const updateSetWeight = (exIdx: number, setIdx: number, text: string) => {
    const val = parseFloat(text) || 0;
    setExerciseLogs((prev) => {
      const updated = [...prev];
      updated[exIdx].sets[setIdx].weightKg = val;
      return updated;
    });
  };

  // Update set reps
  const updateSetReps = (exIdx: number, setIdx: number, text: string) => {
    const val = parseInt(text, 10) || 0;
    setExerciseLogs((prev) => {
      const updated = [...prev];
      updated[exIdx].sets[setIdx].reps = val;
      return updated;
    });
  };

  // Add set to exercise
  const addSetToExercise = (exIdx: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExerciseLogs((prev) => {
      const updated = [...prev];
      const ex = updated[exIdx];
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSetNumber = ex.sets.length + 1;
      ex.sets.push({
        id: `set-${ex.exerciseId}-${newSetNumber}-${Date.now()}`,
        setNumber: newSetNumber,
        reps: lastSet ? lastSet.reps : 10,
        weightKg: lastSet ? lastSet.weightKg : 0,
        completed: false,
        previousReference: lastSet ? `${lastSet.weightKg} kg × ${lastSet.reps}` : undefined,
      });
      return updated;
    });
  };

  // Delete set from exercise
  const deleteSet = (exIdx: number, setIdx: number) => {
    setExerciseLogs((prev) => {
      const updated = [...prev];
      if (updated[exIdx].sets.length > 1) {
        updated[exIdx].sets.splice(setIdx, 1);
        // re-number remaining sets
        updated[exIdx].sets.forEach((s, idx) => {
          s.setNumber = idx + 1;
        });
      }
      return updated;
    });
  };

  // Calculate live session statistics
  const totalCompletedSets = exerciseLogs.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  const totalVolumeKg = exerciseLogs.reduce((acc, ex) => {
    return (
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.reps * (s.weightKg > 0 ? s.weightKg : 1), 0)
    );
  }, 0);

  const totalReps = exerciseLogs.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.completed).reduce((sum, s) => sum + s.reps, 0);
  }, 0);

  // Finish workout confirmation
  const handleFinishWorkout = () => {
    if (totalCompletedSets === 0) {
      Alert.alert(
        'No Sets Completed',
        'Check at least one completed set before finishing your session.',
        [{ text: 'OK' }]
      );
      return;
    }

    const primaryMuscles: MuscleGroup[] = Array.from(
      new Set(exerciseLogs.map((e) => e.targetMuscle))
    );

    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineId: routine?.id,
      routineName: routine?.name || 'Custom Gym Session',
      date: new Date().toISOString(),
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      totalVolumeKg,
      totalSets: totalCompletedSets,
      totalReps,
      exercises: exerciseLogs,
      primaryMuscles,
      perceivedStrain: 3,
    };

    setCompletedSummary(session);
  };

  const confirmSaveAndExit = async () => {
    if (!completedSummary) return;
    await WorkoutService.saveWorkoutSession(completedSummary);
    onFinishSession(completedSummary);
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.secondaryText} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {routine?.name || 'Live Gym Workout'}
            </Text>
            <View style={styles.headerSubRow}>
              <View style={styles.liveIndicator} />
              <Text style={styles.elapsedTimer}>{formatTime(elapsedSeconds)}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleFinishWorkout} style={styles.finishTopBtn}>
            <Ionicons name="checkmark-done" size={16} color={Colors.background} />
            <Text style={styles.finishTopBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>

        {/* Live Volume & Stats HUD Strip */}
        <View style={styles.statsHud}>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>TOTAL VOLUME</Text>
            <Text style={styles.hudValueCyan}>
              {totalVolumeKg.toLocaleString()} <Text style={styles.hudUnit}>kg</Text>
            </Text>
          </View>

          <View style={styles.hudDivider} />

          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>SETS LOGGED</Text>
            <Text style={styles.hudValue}>{totalCompletedSets}</Text>
          </View>

          <View style={styles.hudDivider} />

          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>REPS</Text>
            <Text style={styles.hudValue}>{totalReps}</Text>
          </View>
        </View>

        {/* Rest Timer Floating Banner */}
        {restSecondsRemaining !== null && (
          <View style={styles.restBanner}>
            <View style={styles.restLeft}>
              <Ionicons name="timer-outline" size={18} color={Colors.primaryAccent} />
              <Text style={styles.restText}>
                Rest Interval: <Text style={styles.restTimeBold}>{formatTime(restSecondsRemaining)}</Text>
              </Text>
            </View>

            <View style={styles.restPresetRow}>
              {[30, 60, 90, 120].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  onPress={() => startRestTimer(sec)}
                  style={[styles.restPresetBtn, restInitialSeconds === sec && styles.restPresetBtnActive]}
                >
                  <Text style={styles.restPresetBtnText}>{sec}s</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setRestSecondsRemaining(null)} style={styles.restCancelBtn}>
                <Ionicons name="close-circle" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Exercise Logging Cards Scroll */}
        <ScrollView style={styles.exerciseList} contentContainerStyle={styles.exerciseListContent}>
          {exerciseLogs.map((exLog, exIdx) => {
            const rawEx = WorkoutService.getExerciseById(exLog.exerciseId);

            // Calculate estimated 1RM for this exercise based on top set
            const topSet = exLog.sets
              .filter((s) => s.completed && s.weightKg > 0)
              .sort((a, b) => b.weightKg * b.reps - a.weightKg * a.reps)[0];
            const est1RM = topSet ? WorkoutService.calculate1RM(topSet.weightKg, topSet.reps) : null;

            return (
              <View key={exLog.id} style={styles.exerciseCard}>
                {/* Exercise Header */}
                <View style={styles.exCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exCardTitle}>{exLog.exerciseName}</Text>
                    <View style={styles.exBadgeRow}>
                      <View style={styles.muscleBadge}>
                        <Text style={styles.muscleBadgeText}>
                          {exLog.targetMuscle.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.equipmentBadge}>
                        <Text style={styles.equipmentBadgeText}>
                          {exLog.equipment.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {est1RM && (
                    <View style={styles.oneRmChip}>
                      <Text style={styles.oneRmLabel}>EST. 1RM</Text>
                      <Text style={styles.oneRmVal}>{est1RM} kg</Text>
                    </View>
                  )}
                </View>

                {/* Form cue callout */}
                {rawEx?.formCue && (
                  <View style={styles.cueBox}>
                    <Ionicons name="bulb-outline" size={13} color={Colors.warning} />
                    <Text style={styles.cueText}>{rawEx.formCue}</Text>
                  </View>
                )}

                {/* Sets Table */}
                <View style={styles.setTable}>
                  {/* Table Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.colHeader, { width: 36 }]}>SET</Text>
                    <Text style={[styles.colHeader, { flex: 1 }]}>PREVIOUS</Text>
                    <Text style={[styles.colHeader, { width: 68 }]}>KG</Text>
                    <Text style={[styles.colHeader, { width: 56 }]}>REPS</Text>
                    <Text style={[styles.colHeader, { width: 38, textAlign: 'center' }]}>DONE</Text>
                  </View>

                  {/* Table Rows */}
                  {exLog.sets.map((set, setIdx) => {
                    const isDone = set.completed;
                    return (
                      <View
                        key={set.id}
                        style={[styles.tableRow, isDone && styles.tableRowDone]}
                      >
                        <View style={[styles.setNumCircle, isDone && styles.setNumCircleDone]}>
                          <Text style={[styles.setNumText, isDone && styles.setNumTextDone]}>
                            {set.setNumber}
                          </Text>
                        </View>

                        <Text style={styles.prevText} numberOfLines={1}>
                          {set.previousReference || '—'}
                        </Text>

                        {/* Weight Input */}
                        <TextInput
                          style={[styles.numericInput, isDone && styles.numericInputDone]}
                          keyboardType="numeric"
                          defaultValue={set.weightKg.toString()}
                          onChangeText={(txt) => updateSetWeight(exIdx, setIdx, txt)}
                          selectTextOnFocus
                        />

                        {/* Reps Input */}
                        <TextInput
                          style={[styles.numericInput, isDone && styles.numericInputDone]}
                          keyboardType="numeric"
                          defaultValue={set.reps.toString()}
                          onChangeText={(txt) => updateSetReps(exIdx, setIdx, txt)}
                          selectTextOnFocus
                        />

                        {/* Complete Checkbox */}
                        <TouchableOpacity
                          onPress={() => toggleSetCompleted(exIdx, setIdx)}
                          style={[styles.checkBtn, isDone && styles.checkBtnDone]}
                        >
                          <Ionicons
                            name={isDone ? 'checkmark' : 'checkmark-outline'}
                            size={18}
                            color={isDone ? Colors.background : Colors.secondaryText}
                          />
                        </TouchableOpacity>

                        {/* Delete set option */}
                        {exLog.sets.length > 1 && !isDone && (
                          <TouchableOpacity
                            onPress={() => deleteSet(exIdx, setIdx)}
                            style={styles.delSetBtn}
                          >
                            <Ionicons name="trash-outline" size={13} color={Colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Add Set Button */}
                <TouchableOpacity
                  onPress={() => addSetToExercise(exIdx)}
                  style={styles.addSetBtn}
                >
                  <Ionicons name="add" size={15} color={Colors.primaryAccent} />
                  <Text style={styles.addSetBtnText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Bottom Complete Workout Action */}
          <TouchableOpacity onPress={handleFinishWorkout} style={styles.completeBigBtn}>
            <Ionicons name="trophy" size={20} color={Colors.background} style={{ marginRight: 8 }} />
            <Text style={styles.completeBigBtnText}>Complete & Save Workout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Workout Complete Summary Modal */}
        {completedSummary && (
          <Modal transparent animationType="fade" visible={true}>
            <View style={styles.summaryOverlay}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryTrophyCircle}>
                  <Ionicons name="trophy" size={32} color={Colors.primaryAccent} />
                </View>

                <Text style={styles.summaryTitle}>Workout Accomplished!</Text>
                <Text style={styles.summarySubtitle}>{completedSummary.routineName}</Text>

                <View style={styles.summaryGrid}>
                  <View style={styles.summaryGridItem}>
                    <Text style={styles.summaryGridLabel}>TOTAL VOLUME</Text>
                    <Text style={styles.summaryGridValCyan}>
                      {completedSummary.totalVolumeKg.toLocaleString()} kg
                    </Text>
                  </View>

                  <View style={styles.summaryGridItem}>
                    <Text style={styles.summaryGridLabel}>DURATION</Text>
                    <Text style={styles.summaryGridVal}>
                      {completedSummary.durationMinutes} mins
                    </Text>
                  </View>

                  <View style={styles.summaryGridItem}>
                    <Text style={styles.summaryGridLabel}>TOTAL SETS</Text>
                    <Text style={styles.summaryGridVal}>{completedSummary.totalSets}</Text>
                  </View>

                  <View style={styles.summaryGridItem}>
                    <Text style={styles.summaryGridLabel}>TOTAL REPS</Text>
                    <Text style={styles.summaryGridVal}>{completedSummary.totalReps}</Text>
                  </View>
                </View>

                <View style={styles.musclesTrainedRow}>
                  <Text style={styles.musclesTrainedLabel}>STIMULATED MUSCLES:</Text>
                  <View style={styles.musclesPills}>
                    {completedSummary.primaryMuscles.map((m) => (
                      <View key={m} style={styles.musclePillTrained}>
                        <Text style={styles.musclePillTrainedText}>
                          {m.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity onPress={confirmSaveAndExit} style={styles.saveAndCloseBtn}>
                  <Text style={styles.saveAndCloseBtnText}>Save to BioSync History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 13, 27, 0.95)',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 14,
    backgroundColor: Colors.secondaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  elapsedTimer: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryAccent,
    fontVariant: ['tabular-nums'],
  },
  finishTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 4,
  },
  finishTopBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.background,
  },
  statsHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.cardBackground,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hudItem: {
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hudValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  hudValueCyan: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  hudUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  hudDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  restLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restText: {
    fontSize: 12,
    color: Colors.primaryText,
  },
  restTimeBold: {
    color: Colors.primaryAccent,
    fontWeight: '800',
  },
  restPresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restPresetBtn: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restPresetBtnActive: {
    borderColor: Colors.primaryAccent,
  },
  restPresetBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  restCancelBtn: {
    padding: 2,
    marginLeft: 4,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    padding: 16,
    paddingBottom: 40,
  },
  exerciseCard: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 16,
  },
  exCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  exBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  muscleBadge: {
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  muscleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  equipmentBadge: {
    backgroundColor: 'rgba(139, 114, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  equipmentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryAccent,
  },
  oneRmChip: {
    alignItems: 'flex-end',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  oneRmLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.secondaryText,
  },
  oneRmVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.success,
  },
  cueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 92, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 6,
  },
  cueText: {
    fontSize: 11,
    color: Colors.warning,
    flex: 1,
    fontWeight: '500',
  },
  setTable: {
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 6,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  tableRowDone: {
    backgroundColor: 'rgba(55, 214, 160, 0.06)',
  },
  setNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  setNumCircleDone: {
    backgroundColor: 'rgba(55, 214, 160, 0.2)',
  },
  setNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondaryText,
  },
  setNumTextDone: {
    color: Colors.success,
  },
  prevText: {
    flex: 1,
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  numericInput: {
    width: 62,
    height: 34,
    backgroundColor: Colors.cardBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.primaryText,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  numericInputDone: {
    borderColor: 'rgba(55, 214, 160, 0.4)',
  },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  delSetBtn: {
    padding: 6,
    marginLeft: 2,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(53, 214, 242, 0.08)',
    gap: 4,
  },
  addSetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryAccent,
  },
  completeBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAccent,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    elevation: 4,
  },
  completeBigBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.background,
  },
  summaryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primaryAccent,
    padding: 24,
    alignItems: 'center',
  },
  summaryTrophyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginBottom: 18,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  summaryGridItem: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
  },
  summaryGridLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  summaryGridVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  summaryGridValCyan: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  musclesTrainedRow: {
    width: '100%',
    marginBottom: 20,
  },
  musclesTrainedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryText,
    marginBottom: 6,
  },
  musclesPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  musclePillTrained: {
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  musclePillTrainedText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
  },
  saveAndCloseBtn: {
    backgroundColor: Colors.primaryAccent,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveAndCloseBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.background,
  },
});
