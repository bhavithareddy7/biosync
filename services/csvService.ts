// ==============================================================================
// BioSync CSV Import & Export Service (Section 11)
// Robust parsing, validation, duplicate detection, and schema verification.
// ==============================================================================

import { HealthMetricRecord } from '../types';
import { SAMPLE_CSV_CONTENT } from './mockData';

export interface CsvParseResult {
  validRecords: HealthMetricRecord[];
  errors: { row: number; reason: string; raw: string }[];
  duplicateCount: number;
  totalParsed: number;
}

export const getSampleCsvString = (): string => {
  return SAMPLE_CSV_CONTENT;
};

/**
 * Parses raw CSV string into validated HealthMetricRecord objects
 */
export const parseAndValidateCsv = (
  csvContent: string,
  existingRecords: HealthMetricRecord[] = []
): CsvParseResult => {
  const lines = csvContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const errors: { row: number; reason: string; raw: string }[] = [];
  const validRecords: HealthMetricRecord[] = [];
  const existingDateMap = new Set(existingRecords.map(r => r.date));
  let duplicateCount = 0;

  if (lines.length === 0) {
    return { validRecords: [], errors: [{ row: 0, reason: 'CSV is completely empty', raw: '' }], duplicateCount: 0, totalParsed: 0 };
  }

  // Parse header
  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const requiredCols = ['date', 'sleep_hours', 'steps', 'resting_heart_rate'];

  for (const req of requiredCols) {
    if (!headers.includes(req)) {
      return {
        validRecords: [],
        errors: [{ row: 1, reason: `Missing required column header: '${req}'`, raw: lines[0] }],
        duplicateCount: 0,
        totalParsed: 0,
      };
    }
  }

  const dateIdx = headers.indexOf('date');
  const sleepIdx = headers.indexOf('sleep_hours');
  const stepsIdx = headers.indexOf('steps');
  const hrIdx = headers.indexOf('resting_heart_rate');
  const exIdx = headers.indexOf('exercise_minutes');
  const moodIdx = headers.indexOf('mood_score');

  const seenDatesInFile = new Set<string>();

  // Process rows
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const rowNum = i + 1;
    const cols = rawLine.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

    if (cols.length < requiredCols.length) {
      errors.push({ row: rowNum, reason: `Insufficient columns (${cols.length} found)`, raw: rawLine });
      continue;
    }

    const dateVal = cols[dateIdx];
    // Simple ISO date validation YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal) || isNaN(Date.parse(dateVal))) {
      errors.push({ row: rowNum, reason: `Invalid date format '${dateVal}', expected YYYY-MM-DD`, raw: rawLine });
      continue;
    }

    const sleepVal = parseFloat(cols[sleepIdx]);
    if (isNaN(sleepVal) || sleepVal < 0 || sleepVal > 24) {
      errors.push({ row: rowNum, reason: `Invalid sleep hours '${cols[sleepIdx]}' (must be between 0 and 24)`, raw: rawLine });
      continue;
    }

    const stepsVal = parseInt(cols[stepsIdx], 10);
    if (isNaN(stepsVal) || stepsVal < 0 || stepsVal > 150000) {
      errors.push({ row: rowNum, reason: `Invalid steps '${cols[stepsIdx]}' (must be positive integer)`, raw: rawLine });
      continue;
    }

    const hrVal = parseInt(cols[hrIdx], 10);
    if (isNaN(hrVal) || hrVal < 30 || hrVal > 220) {
      errors.push({ row: rowNum, reason: `Invalid resting heart rate '${cols[hrIdx]}' (must be 30-220 BPM)`, raw: rawLine });
      continue;
    }

    const exVal = exIdx !== -1 && cols[exIdx] !== undefined ? parseInt(cols[exIdx], 10) : 0;
    const moodVal = moodIdx !== -1 && cols[moodIdx] !== undefined ? parseInt(cols[moodIdx], 10) : 3;

    // Check duplicate
    if (existingDateMap.has(dateVal) || seenDatesInFile.has(dateVal)) {
      duplicateCount++;
      // We overwrite duplicate with latest or skip according to preference
    }
    seenDatesInFile.add(dateVal);

    validRecords.push({
      id: `csv_${dateVal}_${Date.now()}`,
      date: dateVal,
      sleep_hours: Number(sleepVal.toFixed(1)),
      steps: stepsVal,
      resting_heart_rate: hrVal,
      exercise_minutes: isNaN(exVal) ? 0 : exVal,
      mood_score: isNaN(moodVal) || moodVal < 1 || moodVal > 5 ? 3 : moodVal,
      source: 'csv',
      created_at: new Date().toISOString(),
    });
  }

  return {
    validRecords,
    errors,
    duplicateCount,
    totalParsed: lines.length - 1,
  };
};

/**
 * Converts array of records to downloadable/exportable CSV format
 */
export const exportRecordsToCsv = (records: HealthMetricRecord[]): string => {
  const headers = ['date', 'sleep_hours', 'steps', 'resting_heart_rate', 'exercise_minutes', 'mood_score', 'source'];
  const rows = records.map(r =>
    [
      r.date,
      r.sleep_hours,
      r.steps,
      r.resting_heart_rate,
      r.exercise_minutes || 0,
      r.mood_score || 3,
      r.source,
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
};
