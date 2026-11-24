// ==============================================================================
// BioSync Manual Data Entry Component (Section 11)
// Clean validated metric entry with error checking & immediate baseline update
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { HealthMetricRecord } from '../types';

interface Props {
  onSave: (record: HealthMetricRecord) => Promise<void>;
  initialDate?: string;
}

export const ManualEntryForm: React.FC<Props> = ({ onSave, initialDate }) => {
  const todayStr = initialDate || new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [sleep, setSleep] = useState('7.5');
  const [steps, setSteps] = useState('7000');
  const [heartRate, setHeartRate] = useState('68');
  const [exercise, setExercise] = useState('30');
  const [mood, setMood] = useState<number>(4);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errs.date = 'Date must follow YYYY-MM-DD';
    }

    const s = parseFloat(sleep);
    if (isNaN(s) || s < 0 || s > 24) {
      errs.sleep = 'Sleep must be between 0 and 24 hours';
    }

    const st = parseInt(steps, 10);
    if (isNaN(st) || st < 0 || st > 100000) {
      errs.steps = 'Steps must be between 0 and 100,000';
    }

    const hr = parseInt(heartRate, 10);
    if (isNaN(hr) || hr < 35 || hr > 220) {
      errs.heartRate = 'Resting HR must be between 35 and 220 BPM';
    }

    const ex = parseInt(exercise, 10);
    if (isNaN(ex) || ex < 0 || ex > 720) {
      errs.exercise = 'Exercise must be between 0 and 720 minutes';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    setIsSuccess(false);

    try {
      const record: HealthMetricRecord = {
        id: `manual_${date}_${Date.now()}`,
        date,
        sleep_hours: parseFloat(parseFloat(sleep).toFixed(1)),
        steps: parseInt(steps, 10),
        resting_heart_rate: parseInt(heartRate, 10),
        exercise_minutes: parseInt(exercise, 10),
        mood_score: mood,
        source: 'manual',
        created_at: new Date().toISOString(),
      };

      await onSave(record);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (e) {
      Alert.alert('Save Failed', 'Could not record metrics. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="create-outline" size={18} color={Colors.primaryAccent} />
        </View>
        <View>
          <Text style={styles.title}>Log Daily Wellness Metrics</Text>
          <Text style={styles.subtitle}>Enter verified daily measurements</Text>
        </View>
      </View>

      {/* Date Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>RECORD DATE (YYYY-MM-DD)</Text>
        <TextInput
          style={[styles.input, errors.date && styles.inputError]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.mutedText}
        />
        {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
      </View>

      {/* 2-Column Inputs */}
      <View style={styles.row}>
        {/* Sleep */}
        <View style={[styles.inputGroup, styles.col]}>
          <Text style={styles.label}>SLEEP (HOURS)</Text>
          <TextInput
            style={[styles.input, errors.sleep && styles.inputError]}
            value={sleep}
            onChangeText={setSleep}
            keyboardType="numeric"
            placeholder="e.g. 7.5"
            placeholderTextColor={Colors.mutedText}
          />
          {errors.sleep && <Text style={styles.errorText}>{errors.sleep}</Text>}
        </View>

        {/* Steps */}
        <View style={[styles.inputGroup, styles.col]}>
          <Text style={styles.label}>DAILY STEPS</Text>
          <TextInput
            style={[styles.input, errors.steps && styles.inputError]}
            value={steps}
            onChangeText={setSteps}
            keyboardType="number-pad"
            placeholder="e.g. 7000"
            placeholderTextColor={Colors.mutedText}
          />
          {errors.steps && <Text style={styles.errorText}>{errors.steps}</Text>}
        </View>
      </View>

      <View style={styles.row}>
        {/* Resting Heart Rate */}
        <View style={[styles.inputGroup, styles.col]}>
          <Text style={styles.label}>RESTING HR (BPM)</Text>
          <TextInput
            style={[styles.input, errors.heartRate && styles.inputError]}
            value={heartRate}
            onChangeText={setHeartRate}
            keyboardType="number-pad"
            placeholder="e.g. 68"
            placeholderTextColor={Colors.mutedText}
          />
          {errors.heartRate && <Text style={styles.errorText}>{errors.heartRate}</Text>}
        </View>

        {/* Exercise Duration */}
        <View style={[styles.inputGroup, styles.col]}>
          <Text style={styles.label}>EXERCISE (MINUTES)</Text>
          <TextInput
            style={[styles.input, errors.exercise && styles.inputError]}
            value={exercise}
            onChangeText={setExercise}
            keyboardType="number-pad"
            placeholder="e.g. 30"
            placeholderTextColor={Colors.mutedText}
          />
          {errors.exercise && <Text style={styles.errorText}>{errors.exercise}</Text>}
        </View>
      </View>

      {/* Mood Score (1-5) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>SUBJECTIVE WELLNESS / MOOD (1-5)</Text>
        <View style={styles.moodSelector}>
          {[1, 2, 3, 4, 5].map(score => {
            const isSelected = mood === score;
            return (
              <TouchableOpacity
                key={score}
                style={[styles.moodBtn, isSelected && styles.moodBtnSelected]}
                onPress={() => setMood(score)}
              >
                <Text style={[styles.moodBtnText, isSelected && styles.moodBtnTextSelected]}>
                  {score === 1 ? '😴 1' : score === 2 ? '😐 2' : score === 3 ? '🙂 3' : score === 4 ? '⚡ 4' : '🔥 5'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Success Notification */}
      {isSuccess && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.successText}>Metrics saved & personal baseline re-calculated!</Text>
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Ionicons name="cloud-upload-outline" size={18} color={Colors.background} style={{ marginRight: 6 }} />
        <Text style={styles.saveBtnText}>{isSaving ? 'Updating Twin...' : 'Save & Update Baseline'}</Text>
      </TouchableOpacity>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(53, 214, 242, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  subtitle: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.secondaryText,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: '48%',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.primaryText,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: Typography.fontSize.body,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 10,
    marginTop: 4,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 2,
  },
  moodBtnSelected: {
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    borderColor: Colors.primaryAccent,
  },
  moodBtnText: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  moodBtnTextSelected: {
    color: Colors.primaryAccent,
    fontWeight: '800',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 214, 160, 0.12)',
    padding: 10,
    borderRadius: Spacing.borderRadius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  saveBtn: {
    backgroundColor: Colors.primaryAccent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius.md,
    marginTop: 6,
  },
  saveBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
