// ==============================================================================
// BioSync CSV Importer Component (Section 11)
// File upload, text input, validation summary, preview table & duplicate detection
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Typography, Spacing } from '../constants/theme';
import { CsvParseResult, parseAndValidateCsv, getSampleCsvString } from '../services/csvService';
import { HealthMetricRecord } from '../types';

interface Props {
  existingRecords: HealthMetricRecord[];
  onImportSuccess: (result: CsvParseResult) => void;
}

export const CsvImporter: React.FC<Props> = ({ existingRecords, onImportSuccess }) => {
  const [csvRawText, setCsvRawText] = useState('');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [showPasteBox, setShowPasteBox] = useState(false);

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        // Read file contents using fetch on local uri
        const response = await fetch(file.uri);
        const text = await response.text();
        setCsvRawText(text);
        const analyzed = parseAndValidateCsv(text, existingRecords);
        setParseResult(analyzed);
      }
    } catch (e) {
      Alert.alert('File Picker', 'Could not access file. You can paste CSV text directly below.');
      setShowPasteBox(true);
    }
  };

  const handleLoadSample = () => {
    const sample = getSampleCsvString();
    setCsvRawText(sample);
    const analyzed = parseAndValidateCsv(sample, existingRecords);
    setParseResult(analyzed);
  };

  const handleManualParse = (text: string) => {
    setCsvRawText(text);
    if (text.trim().length > 10) {
      const analyzed = parseAndValidateCsv(text, existingRecords);
      setParseResult(analyzed);
    } else {
      setParseResult(null);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validRecords.length === 0) return;
    onImportSuccess(parseResult);
    Alert.alert(
      'Import Complete',
      `Successfully integrated ${parseResult.validRecords.length} records into your personal baseline.`
    );
    setParseResult(null);
    setCsvRawText('');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-text-outline" size={18} color={Colors.primaryAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>CSV Bulk Health Import</Text>
          <Text style={styles.subtitle}>Import external wearable or app records</Text>
        </View>
      </View>

      <Text style={styles.expectedFormat}>
        Expected headers: <Text style={styles.codeText}>date,sleep_hours,steps,resting_heart_rate,exercise_minutes,mood_score</Text>
      </Text>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleLoadSample}>
          <Ionicons name="flash-outline" size={14} color={Colors.primaryAccent} style={{ marginRight: 4 }} />
          <Text style={styles.secondaryBtnText}>Load Sample CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={handlePickFile}>
          <Ionicons name="folder-open-outline" size={14} color={Colors.background} style={{ marginRight: 4 }} />
          <Text style={styles.primaryBtnText}>Select File</Text>
        </TouchableOpacity>
      </View>

      {/* Paste / Direct Input Toggle */}
      <TouchableOpacity
        style={styles.togglePasteRow}
        onPress={() => setShowPasteBox(!showPasteBox)}
      >
        <Ionicons name={showPasteBox ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.secondaryText} />
        <Text style={styles.togglePasteText}>
          {showPasteBox ? 'Hide CSV Text Box' : 'Or Paste CSV Text Directly'}
        </Text>
      </TouchableOpacity>

      {showPasteBox && (
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={5}
          placeholder="Paste CSV rows here..."
          placeholderTextColor={Colors.mutedText}
          value={csvRawText}
          onChangeText={handleManualParse}
        />
      )}

      {/* Parse Results Report */}
      {parseResult && (
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>VALIDATION SUMMARY</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{parseResult.validRecords.length}</Text>
              <Text style={styles.statLabel}>Valid Records</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: Colors.warning }]}>{parseResult.duplicateCount}</Text>
              <Text style={styles.statLabel}>Duplicates</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: parseResult.errors.length > 0 ? Colors.danger : Colors.success }]}>
                {parseResult.errors.length}
              </Text>
              <Text style={styles.statLabel}>Errors</Text>
            </View>
          </View>

          {/* Error messages if any */}
          {parseResult.errors.length > 0 && (
            <View style={styles.errorsBox}>
              <Text style={styles.errorHeader}>PARSING ISSUES DETECTED:</Text>
              {parseResult.errors.slice(0, 3).map((err, idx) => (
                <Text key={idx} style={styles.errorItem}>
                  • Row {err.row}: {err.reason}
                </Text>
              ))}
            </View>
          )}

          {/* Preview Table */}
          {parseResult.validRecords.length > 0 && (
            <View style={styles.previewBox}>
              <Text style={styles.previewHeader}>RECORD PREVIEW (FIRST 4):</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>
                <Text style={styles.th}>Sleep</Text>
                <Text style={styles.th}>Steps</Text>
                <Text style={styles.th}>HR</Text>
              </View>
              {parseResult.validRecords.slice(0, 4).map(r => (
                <View key={r.date} style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 1.2 }]}>{r.date}</Text>
                  <Text style={styles.td}>{r.sleep_hours}h</Text>
                  <Text style={styles.td}>{r.steps}</Text>
                  <Text style={styles.td}>{r.resting_heart_rate} bpm</Text>
                </View>
              ))}

              {/* Confirm Import Button */}
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmImport}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.background} style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>
                  Confirm & Sync {parseResult.validRecords.length} Records
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  expectedFormat: {
    fontSize: 11,
    color: Colors.mutedText,
    marginBottom: 12,
  },
  codeText: {
    color: Colors.primaryAccent,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.primaryAccent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Spacing.borderRadius.md,
    marginLeft: 6,
  },
  primaryBtnText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Spacing.borderRadius.md,
    marginRight: 6,
  },
  secondaryBtnText: {
    color: Colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  togglePasteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  togglePasteText: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginLeft: 4,
  },
  textArea: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.primaryText,
    padding: 10,
    fontSize: 11,
    fontFamily: 'monospace',
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  reportContainer: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Spacing.borderRadius.md,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  reportTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.elevatedCard,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryAccent,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  errorsBox: {
    backgroundColor: 'rgba(255, 100, 124, 0.1)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  errorHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.danger,
    marginBottom: 4,
  },
  errorItem: {
    fontSize: 10,
    color: Colors.primaryText,
  },
  previewBox: {
    marginTop: 6,
  },
  previewHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondaryText,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  th: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedText,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  td: {
    flex: 1,
    fontSize: 10,
    color: Colors.primaryText,
  },
  confirmBtn: {
    backgroundColor: Colors.primaryAccent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Spacing.borderRadius.md,
    marginTop: 12,
  },
  confirmBtnText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '800',
  },
});
