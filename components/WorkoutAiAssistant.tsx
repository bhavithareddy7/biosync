// ==============================================================================
// BioSync Built-in Workout AI Coach Component
// Grounded in personal biometric baseline, form cues, and apartment substitutions
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/theme';
import { AI_WORKOUT_PROMPTS } from '../constants/exerciseDatabase';
import { WorkoutAiService, WorkoutAiResponse } from '../services/workoutAiService';
import { useHealth } from '../context/HealthContext';
import { Exercise } from '../types/workout';
import { WorkoutService } from '../services/workoutService';

interface WorkoutAiAssistantProps {
  onSelectExercise?: (exercise: Exercise) => void;
}

export const WorkoutAiAssistant: React.FC<WorkoutAiAssistantProps> = ({ onSelectExercise }) => {
  const { currentMetric, baseline } = useHealth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeResponse, setActiveResponse] = useState<WorkoutAiResponse | null>(() => {
    // Initial grounded greeting based on current baseline
    return WorkoutAiService.getAiFeedback(
      'My resting HR is 76 BPM and sleep was 5.5h. Should I lift heavy today?',
      currentMetric || undefined,
      baseline
    );
  });

  const handlePromptPress = (question: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setQuery(question);
    setIsLoading(true);
    setTimeout(() => {
      const response = WorkoutAiService.getAiFeedback(question, currentMetric || undefined, baseline);
      setActiveResponse(response);
      setIsLoading(false);
    }, 300);
  };

  const handleAsk = () => {
    if (!query.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsLoading(true);
    setTimeout(() => {
      const response = WorkoutAiService.getAiFeedback(query, currentMetric || undefined, baseline);
      setActiveResponse(response);
      setIsLoading(false);
    }, 400);
  };

  const suggestedEx = activeResponse?.suggestedExerciseId
    ? WorkoutService.getExerciseById(activeResponse.suggestedExerciseId)
    : undefined;

  return (
    <View style={styles.card}>
      {/* Header with AI Badge & Baseline Grounding Note */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIconBubble}>
            <Ionicons name="sparkles" size={16} color={Colors.secondaryAccent} />
          </View>
          <View>
            <Text style={styles.title}>BioSync AI Workout Coach</Text>
            <Text style={styles.subtitle}>Grounded in your recovery baselines & biomechanics</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.statusBadgeText}>ACTIVE</Text>
        </View>
      </View>

      {/* Baseline Context Pill */}
      <View style={styles.biometricPill}>
        <Ionicons name="pulse" size={13} color={Colors.warning} />
        <Text style={styles.biometricPillText}>
          Telemetry Context: <Text style={styles.biometricPillBold}>76 BPM RHR (+6) · 5.5h Sleep (-1.0h)</Text>
        </Text>
      </View>

      {/* Suggested Quick Question Chips */}
      <View style={styles.chipsSection}>
        <Text style={styles.chipsTitle}>FREQUENT COACH QUESTIONS:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {AI_WORKOUT_PROMPTS.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => handlePromptPress(p.question)}
              style={styles.chip}
            >
              <Ionicons name={p.icon as any} size={12} color={Colors.primaryAccent} style={{ marginRight: 5 }} />
              <Text style={styles.chipText}>{p.question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Freeform Query Input Bar */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask form tips, quiet substitutes, progression..."
          placeholderTextColor={Colors.secondaryText}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleAsk}
        />
        <TouchableOpacity onPress={handleAsk} style={styles.sendBtn} disabled={isLoading}>
          <Ionicons
            name={isLoading ? 'hourglass' : 'arrow-forward'}
            size={16}
            color={Colors.background}
          />
        </TouchableOpacity>
      </View>

      {/* AI Response Card */}
      {activeResponse && (
        <View style={styles.responseContainer}>
          <View style={styles.responseCategoryRow}>
            <View
              style={[
                styles.categoryBadge,
                activeResponse.category === 'baseline' && styles.categoryBadgeBaseline,
                activeResponse.category === 'apartment' && styles.categoryBadgeApartment,
              ]}
            >
              <Text
                style={[
                  styles.categoryBadgeText,
                  activeResponse.category === 'baseline' && { color: Colors.warning },
                  activeResponse.category === 'apartment' && { color: Colors.secondaryAccent },
                ]}
              >
                {activeResponse.category.toUpperCase()} GUIDANCE
              </Text>
            </View>
          </View>

          <Text style={styles.responseText}>{activeResponse.answer}</Text>

          {/* Actionable Cues Checklist */}
          {activeResponse.recommendedCues.length > 0 && (
            <View style={styles.cuesList}>
              <Text style={styles.cuesTitle}>KEY BIOMECHANICAL CUES:</Text>
              {activeResponse.recommendedCues.map((cue, idx) => (
                <View key={idx} style={styles.cueItem}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primaryAccent} style={{ marginRight: 6 }} />
                  <Text style={styles.cueText}>{cue}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Suggested Exercise Launcher Pill */}
          {suggestedEx && (
            <TouchableOpacity
              onPress={() => onSelectExercise?.(suggestedEx)}
              style={styles.suggestedExPill}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestedExLabel}>RECOMMENDED EXERCISE</Text>
                <Text style={styles.suggestedExName}>{suggestedEx.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primaryAccent} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 114, 255, 0.3)',
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 114, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 214, 160, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
  },
  biometricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 92, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
    gap: 6,
  },
  biometricPillText: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  biometricPillBold: {
    color: Colors.warning,
    fontWeight: '700',
  },
  chipsSection: {
    marginBottom: 12,
  },
  chipsTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 240,
  },
  chipText: {
    fontSize: 11,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: Colors.primaryText,
    fontSize: 12,
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: Colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondaryAccent,
  },
  responseCategoryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeBaseline: {
    backgroundColor: 'rgba(255, 184, 92, 0.15)',
  },
  categoryBadgeApartment: {
    backgroundColor: 'rgba(139, 114, 255, 0.15)',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  responseText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.primaryText,
    marginBottom: 12,
  },
  cuesList: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  cuesTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryText,
    marginBottom: 6,
  },
  cueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cueText: {
    fontSize: 11,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  suggestedExPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(53, 214, 242, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(53, 214, 242, 0.25)',
  },
  suggestedExLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  suggestedExName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryText,
    marginTop: 1,
  },
});
