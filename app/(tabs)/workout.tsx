// ==============================================================================
// BioSync Workout & Gym Intelligence Screen
// Granular filtering, gym tracking, reps/sets/weight logging, routine builder, and AI
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/theme';
import {
  Exercise,
  WorkoutRoutine,
  WorkoutSession,
  GranularWorkoutFilter,
} from '../../types/workout';
import { EXERCISE_DATABASE, PREBUILT_ROUTINES } from '../../constants/exerciseDatabase';
import { WorkoutService } from '../../services/workoutService';
import { ExerciseFilterBar } from '../../components/ExerciseFilterBar';
import { ActiveWorkoutLogger } from '../../components/ActiveWorkoutLogger';
import { CustomRoutineModal } from '../../components/CustomRoutineModal';
import { WorkoutAiAssistant } from '../../components/WorkoutAiAssistant';
import { useHealth } from '../../context/HealthContext';

type WorkoutViewTab = 'routines' | 'exercises' | 'ai_coach' | 'history';

export default function WorkoutScreen() {
  const { currentMetric, addOrUpdateMetric } = useHealth();

  // Top Section Switcher
  const [activeTab, setActiveTab] = useState<WorkoutViewTab>('routines');

  // Routines state
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(PREBUILT_ROUTINES);

  // Granular Filter state
  const [filter, setFilter] = useState<GranularWorkoutFilter>({
    muscle: 'all',
    difficulty: 'all',
    impact: 'all',
    searchQuery: '',
  });

  // Modal states
  const [activeSessionRoutine, setActiveSessionRoutine] = useState<WorkoutRoutine | null>(null);
  const [activeSessionExercises, setActiveSessionExercises] = useState<Exercise[] | null>(null);
  const [isCustomRoutineModalVisible, setIsCustomRoutineModalVisible] = useState(false);

  // Past workout session history
  const [sessionHistory, setSessionHistory] = useState<WorkoutSession[]>([]);

  // Load custom routines and session history on mount
  useEffect(() => {
    loadRoutinesAndHistory();
  }, []);

  const loadRoutinesAndHistory = async () => {
    const allRoutines = await WorkoutService.getAllRoutines();
    setRoutines(allRoutines);
    const history = await WorkoutService.getWorkoutSessions();
    setSessionHistory(history);
  };

  const handleTabChange = (tab: WorkoutViewTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  // Launch a routine into active gym tracking
  const startRoutineSession = (routine: WorkoutRoutine) => {
    const routineExercises = routine.exerciseIds
      .map((id) => WorkoutService.getExerciseById(id))
      .filter((ex): ex is Exercise => ex !== undefined);

    setActiveSessionRoutine(routine);
    setActiveSessionExercises(routineExercises);
  };

  // Launch a single exercise into active gym tracking
  const startSingleExerciseSession = (exercise: Exercise) => {
    setActiveSessionRoutine({
      id: `single-${exercise.id}`,
      name: `${exercise.name} Focus`,
      description: `Targeted session focusing on ${exercise.targetMuscle.replace('_', ' ')}.`,
      targetMuscle: exercise.targetMuscle,
      difficulty: exercise.difficulty,
      impactLevel: exercise.impactLevel,
      estimatedDurationMin: 15,
      exerciseIds: [exercise.id],
      isCustom: true,
    });
    setActiveSessionExercises([exercise]);
  };

  // Handle completed workout session: sync to BioSync context & 3D avatar
  const handleFinishWorkout = async (session: WorkoutSession) => {
    setActiveSessionRoutine(null);
    setActiveSessionExercises(null);
    await loadRoutinesAndHistory();

    // Dynamically update BioSync baseline health context with logged exercise duration
    if (currentMetric) {
      await addOrUpdateMetric({
        ...currentMetric,
        id: `workout-metric-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        exercise_minutes: (currentMetric.exercise_minutes || 0) + session.durationMinutes,
      });
    }
  };

  // Filtered exercises for the directory view
  const filteredExercises = WorkoutService.filterExercises(filter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Main Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Workout & Gym Intelligence</Text>
          <Text style={styles.headerSubtitle}>
            Granular Biomechanics · Reps & Weight Tracking · AI Coach
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsCustomRoutineModalVisible(true)}
          style={styles.headerActionBtn}
        >
          <Ionicons name="add" size={16} color={Colors.background} />
          <Text style={styles.headerActionBtnText}>New Routine</Text>
        </TouchableOpacity>
      </View>

      {/* Top Segmented Navigation Tabs */}
      <View style={styles.segmentContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentRow}>
          {[
            { key: 'routines', label: 'Routines', icon: 'barbell' },
            { key: 'exercises', label: 'Exercise Library', icon: 'filter' },
            { key: 'ai_coach', label: 'AI Gym Coach', icon: 'sparkles' },
            { key: 'history', label: 'Log History', icon: 'time' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabChange(tab.key as WorkoutViewTab)}
                style={[styles.segmentTab, isActive && styles.segmentTabActive]}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? Colors.background : Colors.secondaryText}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.segmentTabText, isActive && styles.segmentTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* =================================================================== */}
        {/* TAB 1: ROUTINES & CUSTOM WORKOUT PROTOCOLS */}
        {/* =================================================================== */}
        {activeTab === 'routines' && (
          <View>
            {/* Quick Banner for Granular Filtering */}
            <TouchableOpacity
              onPress={() => setActiveTab('exercises')}
              style={styles.filterBanner}
            >
              <View style={styles.filterBannerLeft}>
                <View style={styles.filterBannerIcon}>
                  <Ionicons name="options-outline" size={18} color={Colors.primaryAccent} />
                </View>
                <View>
                  <Text style={styles.filterBannerTitle}>Granular Exercise Explorer</Text>
                  <Text style={styles.filterBannerSubtitle}>
                    Filter by Upper Back, Core, Difficulty & Quiet Apartment Friendly
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={16} color={Colors.primaryAccent} />
            </TouchableOpacity>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>WORKOUT ROUTINES ({routines.length})</Text>
              <TouchableOpacity
                onPress={() => setIsCustomRoutineModalVisible(true)}
                style={styles.sectionActionLink}
              >
                <Ionicons name="add-circle-outline" size={14} color={Colors.primaryAccent} />
                <Text style={styles.sectionActionText}>Build Custom</Text>
              </TouchableOpacity>
            </View>

            {routines.map((routine) => {
              const exCount = routine.exerciseIds.length;
              const isApartment = routine.impactLevel === 'apartment_friendly';
              return (
                <View key={routine.id} style={styles.routineCard}>
                  <View style={styles.routineCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.routineCardTitle}>{routine.name}</Text>
                      <Text style={styles.routineCardDesc}>{routine.description}</Text>
                    </View>
                    {routine.isCustom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>CUSTOM</Text>
                      </View>
                    )}
                  </View>

                  {/* Metadata Chips */}
                  <View style={styles.routineMetaRow}>
                    <View style={styles.metaChip}>
                      <Ionicons name="body-outline" size={12} color={Colors.primaryAccent} />
                      <Text style={styles.metaChipText}>
                        {routine.targetMuscle.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.metaChip}>
                      <Ionicons name="timer-outline" size={12} color={Colors.warning} />
                      <Text style={styles.metaChipText}>{routine.estimatedDurationMin} MINS</Text>
                    </View>

                    <View style={styles.metaChip}>
                      <Ionicons name="fitness-outline" size={12} color={Colors.secondaryText} />
                      <Text style={styles.metaChipText}>{exCount} EXERCISES</Text>
                    </View>

                    {isApartment && (
                      <View style={[styles.metaChip, styles.apartmentChip]}>
                        <Ionicons name="home-outline" size={12} color={Colors.secondaryAccent} />
                        <Text style={[styles.metaChipText, { color: Colors.secondaryAccent }]}>QUIET</Text>
                      </View>
                    )}
                  </View>

                  {/* Action Bar */}
                  <View style={styles.routineCardFooter}>
                    <TouchableOpacity
                      onPress={() => startRoutineSession(routine)}
                      style={styles.startRoutineBtn}
                    >
                      <Ionicons name="play" size={15} color={Colors.background} style={{ marginRight: 6 }} />
                      <Text style={styles.startRoutineBtnText}>Start Workout Session</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* =================================================================== */}
        {/* TAB 2: EXERCISE LIBRARY WITH GRANULAR MULTI-FILTERING */}
        {/* =================================================================== */}
        {activeTab === 'exercises' && (
          <View>
            {/* Granular Filtering Control Bar */}
            <ExerciseFilterBar
              filter={filter}
              onChangeFilter={setFilter}
              resultCount={filteredExercises.length}
            />

            {/* Exercise Cards */}
            {filteredExercises.map((ex) => (
              <View key={ex.id} style={styles.exerciseDirectoryCard}>
                <View style={styles.exDirHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exDirName}>{ex.name}</Text>
                    <View style={styles.exDirBadgeRow}>
                      <View style={styles.muscleBadge}>
                        <Text style={styles.muscleBadgeText}>
                          {ex.targetMuscle.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.difficultyBadge,
                          ex.difficulty === 'beginner' && styles.diffBeginner,
                          ex.difficulty === 'advanced' && styles.diffAdvanced,
                        ]}
                      >
                        <Text style={styles.difficultyBadgeText}>
                          {ex.difficulty.toUpperCase()}
                        </Text>
                      </View>

                      {ex.impactLevel === 'apartment_friendly' && (
                        <View style={styles.apartmentBadge}>
                          <Ionicons name="home" size={10} color={Colors.secondaryAccent} style={{ marginRight: 3 }} />
                          <Text style={styles.apartmentBadgeText}>APARTMENT QUIET</Text>
                        </View>
                      )}

                      {ex.impactLevel === 'low_impact' && (
                        <View style={styles.lowImpactBadge}>
                          <Text style={styles.lowImpactBadgeText}>LOW IMPACT</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => startSingleExerciseSession(ex)}
                    style={styles.quickLogBtn}
                  >
                    <Ionicons name="add" size={16} color={Colors.primaryAccent} />
                    <Text style={styles.quickLogBtnText}>Log</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.exDirDesc}>{ex.description}</Text>

                {/* Biomechanical Form Cue */}
                <View style={styles.formCueBox}>
                  <Ionicons name="bulb-outline" size={13} color={Colors.warning} style={{ marginRight: 6 }} />
                  <Text style={styles.formCueText}>
                    <Text style={styles.formCueBold}>Form Cue: </Text>
                    {ex.formCue}
                  </Text>
                </View>

                {/* Apartment Tip if present */}
                {ex.apartmentTip && (
                  <View style={styles.apartmentTipBox}>
                    <Ionicons name="home-outline" size={13} color={Colors.secondaryAccent} style={{ marginRight: 6 }} />
                    <Text style={styles.apartmentTipText}>{ex.apartmentTip}</Text>
                  </View>
                )}

                {/* Defaults Strip */}
                <View style={styles.exDirFooter}>
                  <Text style={styles.exDirFooterText}>
                    Default: {ex.defaultSets} sets × {ex.defaultReps} reps
                    {ex.defaultWeightKg > 0 ? ` @ ${ex.defaultWeightKg} kg` : ' (Bodyweight)'}
                  </Text>
                  <Text style={styles.exDirFooterText}>
                    Equipment: {ex.equipment.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* =================================================================== */}
        {/* TAB 3: AI GYM COACH */}
        {/* =================================================================== */}
        {activeTab === 'ai_coach' && (
          <WorkoutAiAssistant
            onSelectExercise={(ex) => {
              setActiveTab('exercises');
              setFilter({ ...filter, searchQuery: ex.name });
            }}
          />
        )}

        {/* =================================================================== */}
        {/* TAB 4: WORKOUT LOG HISTORY */}
        {/* =================================================================== */}
        {activeTab === 'history' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>WORKOUT LOG HISTORY ({sessionHistory.length})</Text>
            </View>

            {sessionHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="barbell-outline" size={36} color={Colors.secondaryText} />
                <Text style={styles.emptyTitle}>No Workouts Logged Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start an active routine or log an individual exercise to see your history and total volume.
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('routines')}
                  style={styles.emptyActionBtn}
                >
                  <Text style={styles.emptyActionBtnText}>Browse Routines</Text>
                </TouchableOpacity>
              </View>
            ) : (
              sessionHistory.map((sess) => (
                <View key={sess.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyCardTitle}>{sess.routineName}</Text>
                      <Text style={styles.historyCardDate}>
                        {new Date(sess.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.historyVolumeChip}>
                      <Text style={styles.historyVolumeVal}>
                        {sess.totalVolumeKg.toLocaleString()} kg
                      </Text>
                      <Text style={styles.historyVolumeLabel}>VOLUME</Text>
                    </View>
                  </View>

                  <View style={styles.historyStatsRow}>
                    <View style={styles.historyStatItem}>
                      <Ionicons name="timer-outline" size={13} color={Colors.secondaryText} />
                      <Text style={styles.historyStatText}>{sess.durationMinutes} mins</Text>
                    </View>
                    <View style={styles.historyStatItem}>
                      <Ionicons name="checkmark-circle-outline" size={13} color={Colors.success} />
                      <Text style={styles.historyStatText}>{sess.totalSets} completed sets</Text>
                    </View>
                    <View style={styles.historyStatItem}>
                      <Ionicons name="fitness-outline" size={13} color={Colors.primaryAccent} />
                      <Text style={styles.historyStatText}>{sess.totalReps} total reps</Text>
                    </View>
                  </View>

                  {/* Stimulated Muscles */}
                  <View style={styles.historyMusclesRow}>
                    {sess.primaryMuscles.map((m) => (
                      <View key={m} style={styles.historyMuscleTag}>
                        <Text style={styles.historyMuscleTagText}>
                          {m.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* =================================================================== */}
      {/* ACTIVE WORKOUT LOGGER MODAL */}
      {/* =================================================================== */}
      {activeSessionRoutine && activeSessionExercises && (
        <ActiveWorkoutLogger
          routine={activeSessionRoutine}
          initialExercises={activeSessionExercises}
          onClose={() => {
            setActiveSessionRoutine(null);
            setActiveSessionExercises(null);
          }}
          onFinishSession={handleFinishWorkout}
        />
      )}

      {/* =================================================================== */}
      {/* CUSTOM ROUTINE BUILDER MODAL */}
      {/* =================================================================== */}
      <CustomRoutineModal
        visible={isCustomRoutineModalVisible}
        onClose={() => setIsCustomRoutineModalVisible(false)}
        onRoutineCreated={() => {
          loadRoutinesAndHistory();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 14,
    backgroundColor: Colors.secondaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 4,
  },
  headerActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.background,
  },
  segmentContainer: {
    backgroundColor: Colors.secondaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  segmentRow: {
    paddingHorizontal: 14,
    gap: 8,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentTabActive: {
    backgroundColor: Colors.primaryAccent,
    borderColor: Colors.primaryAccent,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  segmentTabTextActive: {
    color: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(53, 214, 242, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
    padding: 14,
    marginBottom: 16,
  },
  filterBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  filterBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  filterBannerSubtitle: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.8,
  },
  sectionActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryAccent,
  },
  routineCard: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  routineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  routineCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  routineCardDesc: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 4,
    lineHeight: 17,
  },
  customBadge: {
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  routineMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  apartmentChip: {
    borderColor: 'rgba(139, 114, 255, 0.4)',
    backgroundColor: 'rgba(139, 114, 255, 0.08)',
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  routineCardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  startRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAccent,
    borderRadius: 10,
    paddingVertical: 10,
  },
  startRoutineBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.background,
  },
  exerciseDirectoryCard: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  exDirHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exDirName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 5,
  },
  exDirBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  difficultyBadge: {
    backgroundColor: 'rgba(255, 184, 92, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  diffBeginner: {
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
  },
  diffAdvanced: {
    backgroundColor: 'rgba(255, 100, 124, 0.15)',
  },
  difficultyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.warning,
  },
  apartmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 114, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  apartmentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryAccent,
  },
  lowImpactBadge: {
    backgroundColor: 'rgba(53, 214, 242, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  lowImpactBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.3)',
  },
  quickLogBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  exDirDesc: {
    fontSize: 12,
    color: Colors.secondaryText,
    lineHeight: 17,
    marginBottom: 8,
  },
  formCueBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 184, 92, 0.08)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  formCueText: {
    fontSize: 11,
    color: Colors.warning,
    flex: 1,
    lineHeight: 16,
  },
  formCueBold: {
    fontWeight: '800',
  },
  apartmentTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(139, 114, 255, 0.08)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  apartmentTipText: {
    fontSize: 11,
    color: Colors.secondaryAccent,
    flex: 1,
    lineHeight: 16,
  },
  exDirFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  exDirFooterText: {
    fontSize: 10,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryText,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionBtn: {
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.background,
  },
  historyCard: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  historyCardDate: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  historyVolumeChip: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-end',
  },
  historyVolumeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  historyVolumeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.secondaryText,
  },
  historyStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  historyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyStatText: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  historyMusclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  historyMuscleTag: {
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  historyMuscleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
});
