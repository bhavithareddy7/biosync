// ==============================================================================
// BioSync Granular Exercise Filter Bar
// Multi-dimensional filtering: Upper Back, Core, Difficulty, Apartment Friendly
// ==============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import {
  MuscleGroup,
  DifficultyLevel,
  ImpactLevel,
  GranularWorkoutFilter,
} from '../types/workout';

interface ExerciseFilterBarProps {
  filter: GranularWorkoutFilter;
  onChangeFilter: (newFilter: GranularWorkoutFilter) => void;
  resultCount: number;
}

const MUSCLE_OPTIONS: { label: string; value: MuscleGroup | 'all'; icon: string }[] = [
  { label: 'All Muscles', value: 'all', icon: 'apps' },
  { label: 'Upper Back', value: 'upper_back', icon: 'shield' },
  { label: 'Core', value: 'core', icon: 'flash' },
  { label: 'Chest', value: 'chest', icon: 'barbell' },
  { label: 'Shoulders', value: 'shoulders', icon: 'arrow-up-circle' },
  { label: 'Arms', value: 'arms', icon: 'fitness' },
  { label: 'Quads', value: 'quads', icon: 'walk' },
  { label: 'Hamstrings', value: 'hamstrings', icon: 'trending-down' },
  { label: 'Calves', value: 'calves', icon: 'chevron-up-circle' },
];

const DIFFICULTY_OPTIONS: { label: string; value: DifficultyLevel | 'all' }[] = [
  { label: 'All Levels', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const IMPACT_OPTIONS: { label: string; value: ImpactLevel | 'all'; icon: string }[] = [
  { label: 'All Environments', value: 'all', icon: 'globe-outline' },
  { label: 'Apartment Friendly (Quiet)', value: 'apartment_friendly', icon: 'home' },
  { label: 'Low Impact', value: 'low_impact', icon: 'water-outline' },
  { label: 'Gym Equipment', value: 'gym_equipment', icon: 'barbell-outline' },
];

export const ExerciseFilterBar: React.FC<ExerciseFilterBarProps> = ({
  filter,
  onChangeFilter,
  resultCount,
}) => {
  const isAnyFilterActive =
    filter.muscle !== 'all' ||
    filter.difficulty !== 'all' ||
    filter.impact !== 'all' ||
    filter.searchQuery.trim().length > 0;

  const resetFilters = () => {
    onChangeFilter({
      muscle: 'all',
      difficulty: 'all',
      impact: 'all',
      searchQuery: '',
    });
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={17} color={Colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises, form cues, equipment..."
          placeholderTextColor={Colors.secondaryText}
          value={filter.searchQuery}
          onChangeText={(text) => onChangeFilter({ ...filter, searchQuery: text })}
        />
        {filter.searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeFilter({ ...filter, searchQuery: '' })}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={16} color={Colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Target Muscle Group Pills */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>TARGET MUSCLE GROUP</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {MUSCLE_OPTIONS.map((opt) => {
            const isSelected = filter.muscle === opt.value;
            const isHighlight = opt.value === 'upper_back' || opt.value === 'core';
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onChangeFilter({ ...filter, muscle: opt.value })}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                  isHighlight && !isSelected && styles.filterPillHighlight,
                ]}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={13}
                  color={isSelected ? Colors.background : isHighlight ? Colors.primaryAccent : Colors.secondaryText}
                  style={styles.pillIcon}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                    isHighlight && !isSelected && styles.filterPillTextHighlight,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Environment & Impact Level Pills */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>IMPACT & ENVIRONMENT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {IMPACT_OPTIONS.map((opt) => {
            const isSelected = filter.impact === opt.value;
            const isApartment = opt.value === 'apartment_friendly' || opt.value === 'low_impact';
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onChangeFilter({ ...filter, impact: opt.value })}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActiveViolet,
                  isApartment && !isSelected && styles.filterPillApartment,
                ]}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={13}
                  color={isSelected ? '#FFFFFF' : isApartment ? Colors.secondaryAccent : Colors.secondaryText}
                  style={styles.pillIcon}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActiveWhite,
                    isApartment && !isSelected && styles.filterPillTextViolet,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Difficulty Level Pills */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeaderRow}>
          <Text style={styles.filterSectionTitle}>DIFFICULTY LEVEL</Text>
          {isAnyFilterActive && (
            <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
              <Ionicons name="refresh" size={12} color={Colors.danger} />
              <Text style={styles.resetBtnText}>Reset All</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isSelected = filter.difficulty === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onChangeFilter({ ...filter, difficulty: opt.value })}
                style={[styles.filterPillSmall, isSelected && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Results Summary Strip */}
      <View style={styles.resultSummary}>
        <Text style={styles.resultCountText}>
          Showing <Text style={styles.resultCountBold}>{resultCount}</Text> matching exercises
        </Text>
        {filter.muscle !== 'all' && (
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>{filter.muscle.replace('_', ' ').toUpperCase()}</Text>
          </View>
        )}
        {filter.impact === 'apartment_friendly' && (
          <View style={[styles.activeTag, { backgroundColor: 'rgba(139, 114, 255, 0.2)' }]}>
            <Text style={[styles.activeTagText, { color: Colors.secondaryAccent }]}>QUIET / APARTMENT</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.primaryText,
    fontSize: 13,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 10,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  filterSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetBtnText: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillSmall: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillHighlight: {
    borderColor: 'rgba(53, 214, 242, 0.4)',
    backgroundColor: 'rgba(53, 214, 242, 0.08)',
  },
  filterPillApartment: {
    borderColor: 'rgba(139, 114, 255, 0.4)',
    backgroundColor: 'rgba(139, 114, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: Colors.primaryAccent,
    borderColor: Colors.primaryAccent,
  },
  filterPillActiveViolet: {
    backgroundColor: Colors.secondaryAccent,
    borderColor: Colors.secondaryAccent,
  },
  pillIcon: {
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: Colors.background,
    fontWeight: '700',
  },
  filterPillTextActiveWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextHighlight: {
    color: Colors.primaryAccent,
    fontWeight: '700',
  },
  filterPillTextViolet: {
    color: Colors.secondaryAccent,
    fontWeight: '700',
  },
  resultSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  resultCountText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  resultCountBold: {
    color: Colors.primaryAccent,
    fontWeight: '800',
  },
  activeTag: {
    backgroundColor: 'rgba(53, 214, 242, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
});
