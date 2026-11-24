// ==============================================================================
// BioSync Screen 5: My Data (Section 11)
// Unified personal health data hub: Manual Entry, CSV Import, Health Connect & Data History Table
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useHealth } from '../../context/HealthContext';
import { ManualEntryForm } from '../../components/ManualEntryForm';
import { CsvImporter } from '../../components/CsvImporter';
import { HealthConnectCard } from '../../components/HealthConnectCard';
import { HealthMetricRecord } from '../../types';

export default function MyDataScreen() {
  const {
    metrics,
    addOrUpdateMetric,
    deleteMetric,
    importCsvData,
    healthConnectStatus,
    toggleHealthConnect,
    profile,
  } = useHealth();

  const [activeSection, setActiveSection] = useState<'history' | 'manual' | 'csv' | 'health_connect'>('manual');
  const [searchDate, setSearchDate] = useState('');

  const filteredMetrics = metrics.filter(r =>
    searchDate ? r.date.includes(searchDate.trim()) : true
  );

  const handleDelete = (id: string, date: string) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to remove the metrics for ${date}? This will re-calculate your baseline immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMetric(id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>My Data</Text>
            <Text style={styles.screenSubtitle}>Your information. Your control.</Text>
          </View>
          <View style={styles.recordsBadge}>
            <Text style={styles.recordsBadgeText}>{metrics.length} RECORDS</Text>
          </View>
        </View>

        {/* SECTION A: DATA SOURCES OVERVIEW */}
        <View style={styles.sourcesGrid}>
          {/* Source 1: Manual */}
          <TouchableOpacity
            style={[styles.sourceCard, activeSection === 'manual' && styles.sourceCardActive]}
            onPress={() => setActiveSection('manual')}
          >
            <View style={styles.sourceTop}>
              <Ionicons name="create-outline" size={18} color={Colors.primaryAccent} />
              <View style={[styles.statusPill, { backgroundColor: 'rgba(53, 214, 242, 0.15)' }]}>
                <Text style={[styles.statusText, { color: Colors.primaryAccent }]}>DIRECT</Text>
              </View>
            </View>
            <Text style={styles.sourceName}>Manual Entry</Text>
            <Text style={styles.sourceDesc}>Daily verified logs</Text>
          </TouchableOpacity>

          {/* Source 2: CSV Import */}
          <TouchableOpacity
            style={[styles.sourceCard, activeSection === 'csv' && styles.sourceCardActive]}
            onPress={() => setActiveSection('csv')}
          >
            <View style={styles.sourceTop}>
              <Ionicons name="document-text-outline" size={18} color={Colors.secondaryAccent} />
              <View style={[styles.statusPill, { backgroundColor: 'rgba(139, 114, 255, 0.15)' }]}>
                <Text style={[styles.statusText, { color: Colors.secondaryAccent }]}>BULK</Text>
              </View>
            </View>
            <Text style={styles.sourceName}>CSV Import</Text>
            <Text style={styles.sourceDesc}>Exported records</Text>
          </TouchableOpacity>

          {/* Source 3: Health Connect */}
          <TouchableOpacity
            style={[styles.sourceCard, activeSection === 'health_connect' && styles.sourceCardActive]}
            onPress={() => setActiveSection('health_connect')}
          >
            <View style={styles.sourceTop}>
              <Ionicons name="logo-android" size={18} color={healthConnectStatus === 'connected' ? Colors.success : Colors.warning} />
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      healthConnectStatus === 'connected'
                        ? 'rgba(55, 214, 160, 0.15)'
                        : 'rgba(255, 184, 92, 0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        healthConnectStatus === 'connected'
                          ? Colors.success
                          : Colors.warning,
                    },
                  ]}
                >
                  {healthConnectStatus === 'connected' ? 'CONNECTED' : 'STANDBY'}
                </Text>
              </View>
            </View>
            <Text style={styles.sourceName}>Health Connect</Text>
            <Text style={styles.sourceDesc}>Android sync bridge</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION NAVIGATION TABS */}
        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'manual' && styles.sectionTabActive]}
            onPress={() => setActiveSection('manual')}
          >
            <Text style={[styles.sectionTabText, activeSection === 'manual' && styles.sectionTabTextActive]}>
              Manual Form
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'csv' && styles.sectionTabActive]}
            onPress={() => setActiveSection('csv')}
          >
            <Text style={[styles.sectionTabText, activeSection === 'csv' && styles.sectionTabTextActive]}>
              CSV Upload
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'health_connect' && styles.sectionTabActive]}
            onPress={() => setActiveSection('health_connect')}
          >
            <Text style={[styles.sectionTabText, activeSection === 'health_connect' && styles.sectionTabTextActive]}>
              Health Connect
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'history' && styles.sectionTabActive]}
            onPress={() => setActiveSection('history')}
          >
            <Text style={[styles.sectionTabText, activeSection === 'history' && styles.sectionTabTextActive]}>
              History ({metrics.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION B: MANUAL DATA ENTRY FORM */}
        {activeSection === 'manual' && (
          <ManualEntryForm onSave={addOrUpdateMetric} />
        )}

        {/* SECTION C: CSV IMPORT */}
        {activeSection === 'csv' && (
          <CsvImporter
            existingRecords={metrics}
            onImportSuccess={() => setActiveSection('history')}
          />
        )}

        {/* SECTION D: HEALTH CONNECT BRIDGE */}
        {activeSection === 'health_connect' && (
          <HealthConnectCard
            status={healthConnectStatus}
            onToggleConnect={toggleHealthConnect}
            lastSyncTime={profile.lastSyncTime}
          />
        )}

        {/* SECTION E: DATA HISTORY TABLE */}
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyTitle}>Personal Records History</Text>
              <Text style={styles.historySub}>Inspect, filter or delete individual records</Text>
            </View>

            {/* Filter Input */}
            <View style={styles.filterInputContainer}>
              <Ionicons name="search" size={14} color={Colors.mutedText} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.filterInput}
                placeholder="Filter date..."
                placeholderTextColor={Colors.mutedText}
                value={searchDate}
                onChangeText={setSearchDate}
              />
              {searchDate ? (
                <TouchableOpacity onPress={() => setSearchDate('')}>
                  <Ionicons name="close-circle" size={14} color={Colors.secondaryText} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.3 }]}>Date</Text>
            <Text style={styles.th}>Sleep</Text>
            <Text style={styles.th}>Steps</Text>
            <Text style={styles.th}>HR</Text>
            <Text style={styles.th}>Ex</Text>
            <Text style={[styles.th, { width: 32, textAlign: 'center' }]}>Act</Text>
          </View>

          {/* Table Rows */}
          {filteredMetrics.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No matching metric records found.</Text>
            </View>
          ) : (
            filteredMetrics.slice(0, 15).map(record => (
              <View key={record.id} style={styles.tableRow}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.tdDate}>{record.date}</Text>
                  <Text style={styles.tdSource}>{record.source}</Text>
                </View>
                <Text style={styles.td}>{record.sleep_hours}h</Text>
                <Text style={styles.td}>{record.steps.toLocaleString()}</Text>
                <Text style={[styles.td, { color: record.resting_heart_rate > 72 ? Colors.danger : Colors.primaryText }]}>
                  {record.resting_heart_rate}
                </Text>
                <Text style={styles.td}>{record.exercise_minutes || 0}m</Text>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(record.id, record.date)}
                >
                  <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}

          {filteredMetrics.length > 15 && (
            <Text style={styles.moreRecordsNote}>
              Showing most recent 15 of {filteredMetrics.length} recorded entries
            </Text>
          )}
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
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: Typography.fontSize.mainHeading,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  screenSubtitle: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  recordsBadge: {
    backgroundColor: Colors.secondaryBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recordsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  sourcesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sourceCard: {
    width: '31%',
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceCardActive: {
    borderColor: Colors.primaryAccent,
    backgroundColor: Colors.elevatedCard,
  },
  sourceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  sourceName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  sourceDesc: {
    fontSize: 9,
    color: Colors.mutedText,
    marginTop: 2,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 3,
    marginBottom: 16,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Spacing.borderRadius.sm,
  },
  sectionTabActive: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  sectionTabTextActive: {
    color: Colors.primaryAccent,
  },
  historyContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 6,
  },
  historyHeader: {
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: Typography.fontSize.cardHeading,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  historySub: {
    fontSize: Typography.fontSize.secondary,
    color: Colors.secondaryText,
    marginTop: 2,
    marginBottom: 8,
  },
  filterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 36,
  },
  filterInput: {
    flex: 1,
    color: Colors.primaryText,
    fontSize: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginTop: 4,
  },
  th: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tdDate: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  tdSource: {
    fontSize: 9,
    color: Colors.mutedText,
    textTransform: 'uppercase',
  },
  td: {
    flex: 1,
    fontSize: 11,
    color: Colors.secondaryText,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  moreRecordsNote: {
    fontSize: 10,
    color: Colors.mutedText,
    textAlign: 'center',
    marginTop: 10,
  },
});
