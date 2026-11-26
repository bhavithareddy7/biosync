// ==============================================================================
// BioSync Smartwatch Context Provider (Demo Apple Watch Series 8)
// Hackathon Demo: Connection state, battery monitoring, simulated health metrics & actions
// ==============================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface SmartwatchHealthData {
  steps: number;
  heartRate: number;
  restingHeartRate: number;
  sleepDuration: string;
  activeEnergy: number;
  workouts: string;
  lastUpdated: string;
}

export interface SmartwatchState {
  deviceName: string;
  manufacturer: string;
  model: string;
  size: string;
  firmwareVersion: string;
  serialNumber: string;
  isConnected: boolean;
  batteryLevel: number;
  lastSyncTime: string;
  isSyncing: boolean;
  isModalOpen: boolean;
  pingStatus: string | null;
  healthData: SmartwatchHealthData;
  isDemoDevice: true;
}

interface SmartwatchContextType extends SmartwatchState {
  openModal: () => void;
  closeModal: () => void;
  disconnectDevice: () => void;
  connectDevice: () => void;
  syncNow: () => Promise<void>;
  pingDevice: () => void;
  clearPingStatus: () => void;
  setBatteryLevel: (level: number) => void;
}

const DEFAULT_HEALTH_DATA: SmartwatchHealthData = {
  steps: 4000,
  heartRate: 76,
  restingHeartRate: 68,
  sleepDuration: '7h 20m',
  activeEnergy: 320,
  workouts: '3 this week',
  lastUpdated: '2 minutes ago',
};

const SmartwatchContext = createContext<SmartwatchContextType | undefined>(undefined);

export const SmartwatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [batteryLevel, setBatteryLevelState] = useState<number>(78);
  const [lastSyncTime, setLastSyncTime] = useState<string>('2 minutes ago');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<SmartwatchHealthData>(DEFAULT_HEALTH_DATA);

  const openModal = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const disconnectDevice = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setIsConnected(false);
  }, []);

  const connectDevice = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsConnected(true);
    setLastSyncTime('Just now');
  }, []);

  const syncNow = useCallback(async () => {
    if (!isConnected || isSyncing) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSyncing(true);
    // Simulate short network / bluetooth sync delay
    await new Promise((resolve) => setTimeout(resolve, 1400));

    setLastSyncTime('Just now');
    setHealthData((prev) => ({
      ...prev,
      lastUpdated: 'Just now',
    }));
    setIsSyncing(false);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isConnected, isSyncing]);

  const pingDevice = useCallback(() => {
    if (!isConnected) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setPingStatus('🔊 Apple Watch Series 8 pinged! Watch played audible chime and haptic alert.');
  }, [isConnected]);

  const clearPingStatus = useCallback(() => {
    setPingStatus(null);
  }, []);

  const setBatteryLevel = useCallback((level: number) => {
    setBatteryLevelState(Math.max(1, Math.min(100, level)));
  }, []);

  return (
    <SmartwatchContext.Provider
      value={{
        deviceName: 'Apple Watch Series 8',
        manufacturer: 'Apple',
        model: 'Series 8',
        size: '45mm',
        firmwareVersion: 'watchOS 10.5 (Demo)',
        serialNumber: 'DEMO-AW8-7829',
        isConnected,
        batteryLevel,
        lastSyncTime,
        isSyncing,
        isModalOpen,
        pingStatus,
        healthData,
        isDemoDevice: true,
        openModal,
        closeModal,
        disconnectDevice,
        connectDevice,
        syncNow,
        pingDevice,
        clearPingStatus,
        setBatteryLevel,
      }}
    >
      {children}
    </SmartwatchContext.Provider>
  );
};

export const useSmartwatch = () => {
  const context = useContext(SmartwatchContext);
  if (!context) {
    throw new Error('useSmartwatch must be used within a SmartwatchProvider');
  }
  return context;
};
