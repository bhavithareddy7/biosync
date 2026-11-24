// ==============================================================================
// BioSync Central Health Context Provider
// Manages reactive metrics, mathematical baseline updates, and patterns
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HealthMetricRecord, MetricBaseline, MetricDeviation, DetectedPattern, UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { calculatePersonalBaseline, computeMetricDeviations, detectBaselinePatterns } from '../services/baselineEngine';
import { parseAndValidateCsv, CsvParseResult } from '../services/csvService';
import { INITIAL_USER_PROFILE } from '../services/mockData';

interface HealthContextType {
  metrics: HealthMetricRecord[];
  profile: UserProfile;
  currentMetric: HealthMetricRecord | null;
  baseline: MetricBaseline;
  deviations: MetricDeviation[];
  patterns: DetectedPattern[];
  windowDays: number;
  isLoading: boolean;
  healthConnectStatus: 'connected' | 'disconnected' | 'connecting';
  setWindowDays: (days: number) => void;
  addOrUpdateMetric: (record: HealthMetricRecord) => Promise<void>;
  deleteMetric: (id: string) => Promise<void>;
  importCsvData: (csvText: string) => Promise<CsvParseResult>;
  resetToDemoData: () => Promise<void>;
  clearAllUserData: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  toggleHealthConnect: () => void;
  refreshCalculations: () => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<HealthMetricRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [windowDays, setWindowDays] = useState<number>(7);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [healthConnectStatus, setHealthConnectStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Computed state
  const [currentMetric, setCurrentMetric] = useState<HealthMetricRecord | null>(null);
  const [baseline, setBaseline] = useState<MetricBaseline>({
    windowDays: 7,
    recordCount: 0,
    sufficientData: false,
    calculatedAt: new Date().toISOString(),
    avgSleep: 7.5,
    avgSteps: 7000,
    avgHeartRate: 68,
    avgExercise: 30,
  });
  const [deviations, setDeviations] = useState<MetricDeviation[]>([]);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);

  // Calculate baselines and patterns whenever metrics or windowDays changes
  const runCalculations = useCallback((records: HealthMetricRecord[], window: number) => {
    if (!records || records.length === 0) {
      setCurrentMetric(null);
      setDeviations([]);
      setPatterns([]);
      return;
    }

    // Sort descending by date
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    setCurrentMetric(latest);

    // Baseline calculated excluding latest day to compare current day against prior historical days
    const computedBaseline = calculatePersonalBaseline(sorted, window, latest.date);
    setBaseline(computedBaseline);

    const computedDeviations = computeMetricDeviations(latest, computedBaseline);
    setDeviations(computedDeviations);

    const computedPatterns = detectBaselinePatterns(latest, computedBaseline, computedDeviations);
    setPatterns(computedPatterns);
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [loadedMetrics, loadedProfile] = await Promise.all([
          StorageService.getMetrics(),
          StorageService.getProfile(),
        ]);
        setMetrics(loadedMetrics);
        setProfile(loadedProfile);
        setWindowDays(loadedProfile.baselineWindowDays || 7);
        if (loadedProfile.healthConnectConnected) {
          setHealthConnectStatus('connected');
        }
        runCalculations(loadedMetrics, loadedProfile.baselineWindowDays || 7);
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [runCalculations]);

  // Handle window days switch (7 vs 14 vs 30 days)
  const handleSetWindowDays = (days: number) => {
    setWindowDays(days);
    runCalculations(metrics, days);
    updateProfile({ baselineWindowDays: days });
  };

  const addOrUpdateMetric = async (record: HealthMetricRecord) => {
    const updated = await StorageService.addOrUpdateMetric(record);
    setMetrics(updated);
    runCalculations(updated, windowDays);
  };

  const deleteMetric = async (id: string) => {
    const updated = await StorageService.deleteMetric(id);
    setMetrics(updated);
    runCalculations(updated, windowDays);
  };

  const importCsvData = async (csvText: string): Promise<CsvParseResult> => {
    const result = parseAndValidateCsv(csvText, metrics);
    if (result.validRecords.length > 0) {
      // Merge with existing
      const existingMap = new Map(metrics.map(r => [r.date, r]));
      result.validRecords.forEach(r => {
        existingMap.set(r.date, r);
      });
      const merged = Array.from(existingMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      await StorageService.saveMetrics(merged);
      setMetrics(merged);
      runCalculations(merged, windowDays);
    }
    return result;
  };

  const resetToDemoData = async () => {
    setIsLoading(true);
    const demo = await StorageService.resetToDemoData();
    setMetrics(demo);
    setProfile(INITIAL_USER_PROFILE);
    setHealthConnectStatus('disconnected');
    setWindowDays(7);
    runCalculations(demo, 7);
    setIsLoading(false);
  };

  const clearAllUserData = async () => {
    setIsLoading(true);
    await StorageService.clearAllUserData();
    setMetrics([]);
    setProfile({
      id: 'usr_new',
      name: 'User',
      baselineWindowDays: 7,
      healthConnectConnected: false,
    });
    setBaseline({
      windowDays: 7,
      recordCount: 0,
      sufficientData: false,
      calculatedAt: new Date().toISOString(),
      avgSleep: 0,
      avgSteps: 0,
      avgHeartRate: 0,
      avgExercise: 0,
    });
    setDeviations([]);
    setPatterns([]);
    setCurrentMetric(null);
    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    await StorageService.saveProfile(updated);
  };

  const toggleHealthConnect = () => {
    if (healthConnectStatus === 'connected') {
      setHealthConnectStatus('disconnected');
      updateProfile({ healthConnectConnected: false });
    } else {
      setHealthConnectStatus('connecting');
      setTimeout(() => {
        setHealthConnectStatus('connected');
        updateProfile({ healthConnectConnected: true, lastSyncTime: new Date().toISOString() });
      }, 1200);
    }
  };

  return (
    <HealthContext.Provider
      value={{
        metrics,
        profile,
        currentMetric,
        baseline,
        deviations,
        patterns,
        windowDays,
        isLoading,
        healthConnectStatus,
        setWindowDays: handleSetWindowDays,
        addOrUpdateMetric,
        deleteMetric,
        importCsvData,
        resetToDemoData,
        clearAllUserData,
        updateProfile,
        toggleHealthConnect,
        refreshCalculations: () => runCalculations(metrics, windowDays),
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
