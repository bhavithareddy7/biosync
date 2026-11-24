// ==============================================================================
// BioSync Custom Routine Builder Modal
// Create custom workout routines with exercise picker and persistent storage
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/theme';
import {
  MuscleGroup,
  DifficultyLevel,
  ImpactLevel,
  WorkoutRoutine,
} from '../types/workout';
import { EXERCISE_DATABASE } from '../constants/exerciseDatabase';
import { WorkoutService } from '../services/workoutService';

interface CustomRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onRoutineCreated: (newRoutine: WorkoutRoutine) => void;
}

const MUSCLE_CHOICES: { label: string; value: MuscleGroup | 'multi' }[] = [
  { label: 'Upper Back', value: 'upper_back' },
  { label: 'Core', value: 'core' },
  { label: 'Multi-Muscle', value: 'multi' },
  { label: 'Chest', value: 'chest' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Arms', value: 'arms' },
  { label: 'Lower Body', value: 'quads' },
  { label: 'Full Body', value: 'full_body' },
];

const DIFFICULTY_CHOICES: { label: string; value: DifficultyLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const IMPACT_CHOICES: { label: string; value: ImpactLevel; icon: string }[] = [
  { label: 'Apartment Friendly (Quiet)', value: 'apartment_friendly', icon: 'home' },
  { label: 'Low Impact', value: 'low_impact', icon: 'water-outline' },
  { label: 'Gym Equipment', value: 'gym_equipment', icon: 'barbell' },
  { label: 'Bodyweight Only', value: 'bodyweight', icon: 'body' },
];

export const CustomRoutineModal: React.FC<CustomRoutineModalProps> = ({
  visible,
  onClose,
  onRoutineCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetMuscle, setTargetMuscle] = useState<MuscleGroup | 'multi'>('upper_back');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [impactLevel, setImpactLevel] = useState<ImpactLevel>('apartment_friendly');
  const [estimatedDurationMin, setEstimatedDurationMin] = useState('30');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([
    'ex-lat-pulldown',
    'ex-deadbug',
  ]);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const toggleExercise = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveRoutine = async () => {
    if (!name.trim()) {
      Alert.alert('Routine Name Required', 'Please provide a name for your custom routine.');
      return;
    }

    if (selectedExerciseIds.length === 0) {
      Alert.alert('No Exercises Selected', 'Please select at least 1 exercise for this routine.');
      return;
    }

    const duration = parseInt(estimatedDurationMin, 10) || 30;

    const created = await WorkoutService.saveCustomRoutine({
      name: name.trim(),
      description: description.trim() || 'Custom user routine built in BioSync.',
      targetMuscle,
      difficulty,
      impactLevel,
      estimatedDurationMin: duration,
      exerciseIds: selectedExerciseIds,
    });

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onRoutineCreated(created);
    onClose();
  };

  const filteredExercises = EXERCISE_DATABASE.filter((ex) => {
    if (!exerciseSearch.trim()) return true;
    const q = exerciseSearch.toLowerCase();
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.targetMuscle.toLowerCase().includes(q) ||
      ex.equipment.toLowerCase().includes(q)
    );
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Build Custom Routine</Text>
              <Text style={styles.headerSubtitle}>Design your individualized gym protocol</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Routine Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>ROUTINE NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Upper Back & Core Hypertrophy"
                placeholderTextColor={Colors.secondaryText}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>GOAL / DESCRIPTION</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="e.g. Focus on scapular posture, quiet floor movements"
                placeholderTextColor={Colors.secondaryText}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            {/* Muscle Focus */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>TARGET FOCUS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {MUSCLE_CHOICES.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setTargetMuscle(opt.value)}
                    style={[styles.pill, targetMuscle === opt.value && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, targetMuscle === opt.value && styles.pillTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Difficulty Level */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>DIFFICULTY LEVEL</Text>
              <View style={styles.segmentedRow}>
                {DIFFICULTY_CHOICES.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setDifficulty(opt.value)}
                    style={[styles.segmentBtn, difficulty === opt.value && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentBtnText, difficulty === opt.value && styles.segmentBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Impact / Environment */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>ENVIRONMENT & IMPACT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {IMPACT_CHOICES.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setImpactLevel(opt.value)}
                    style={[styles.pill, impactLevel === opt.value && styles.pillActiveViolet]}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={13}
                      color={impactLevel === opt.value ? '#FFF' : Colors.secondaryText}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.pillText, impactLevel === opt.value && styles.pillTextActiveWhite]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Exercise Picker Section */}
            <View style={styles.formGroup}>
              <View style={styles.pickerHeader}>
                <Text style={styles.label}>SELECT EXERCISES ({selectedExerciseIds.length})</Text>
                <Text style={styles.pickerCountText}>
                  Tap to add or remove
                </Text>
              </View>

              {/* Search Inside Picker */}
              <View style={styles.pickerSearch}>
                <Ionicons name="search" size={14} color={Colors.secondaryText} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="Filter exercises..."
                  placeholderTextColor={Colors.secondaryText}
                  value={exerciseSearch}
                  onChangeText={setExerciseSearch}
                />
              </View>

              {/* Exercise Item List */}
              <View style={styles.exerciseSelectorBox}>
                {filteredExercises.map((ex) => {
                  const isChecked = selectedExerciseIds.includes(ex.id);
                  return (
                    <TouchableOpacity
                      key={ex.id}
                      onPress={() => toggleExercise(ex.id)}
                      style={[styles.exercisePickItem, isChecked && styles.exercisePickItemActive]}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                        {isChecked && <Ionicons name="checkmark" size={14} color={Colors.background} />}
                      </View>

                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.exPickName, isChecked && styles.exPickNameActive]}>
                          {ex.name}
                        </Text>
                        <Text style={styles.exPickMeta}>
                          {ex.targetMuscle.replace('_', ' ').toUpperCase()} · {ex.equipment} · {ex.difficulty}
                        </Text>
                      </View>

                      {ex.impactLevel === 'apartment_friendly' && (
                        <View style={styles.apartmentBadge}>
                          <Text style={styles.apartmentBadgeText}>QUIET</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Save Action */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSaveRoutine} style={styles.saveBtn}>
              <Ionicons name="save-outline" size={18} color={Colors.background} style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Routine ({selectedExerciseIds.length} Exercises)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.secondaryBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.primaryText,
    fontSize: 13,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primaryAccent,
    borderColor: Colors.primaryAccent,
  },
  pillActiveViolet: {
    backgroundColor: Colors.secondaryAccent,
    borderColor: Colors.secondaryAccent,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  pillTextActive: {
    color: Colors.background,
    fontWeight: '800',
  },
  pillTextActiveWhite: {
    color: '#FFF',
    fontWeight: '800',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 7,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primaryAccent,
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  segmentBtnTextActive: {
    color: Colors.background,
    fontWeight: '800',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerCountText: {
    fontSize: 11,
    color: Colors.primaryAccent,
    fontWeight: '600',
  },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    height: 36,
    marginBottom: 8,
  },
  pickerSearchInput: {
    flex: 1,
    color: Colors.primaryText,
    fontSize: 12,
  },
  exerciseSelectorBox: {
    maxHeight: 220,
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exercisePickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  exercisePickItemActive: {
    backgroundColor: 'rgba(53, 214, 242, 0.08)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primaryAccent,
    borderColor: Colors.primaryAccent,
  },
  exPickName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  exPickNameActive: {
    color: Colors.primaryAccent,
  },
  exPickMeta: {
    fontSize: 10,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  apartmentBadge: {
    backgroundColor: 'rgba(139, 114, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  apartmentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryAccent,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.secondaryBackground,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.background,
  },
});
