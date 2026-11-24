// ==============================================================================
// BioSync Storage Service
// Handles offline-first persistent caching with AsyncStorage & seed initialization
// ==============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthMetricRecord, UserProfile, ChatMessage } from '../types';
import { INITIAL_USER_PROFILE, generateRealisticHistoricalData } from './mockData';

const KEYS = {
  METRICS: '@biosync_metrics_v1',
  PROFILE: '@biosync_profile_v1',
  ONBOARDING_DONE: '@biosync_onboarding_done_v1',
  CHAT_MESSAGES: '@biosync_chat_messages_v1',
  DEMO_MODE: '@biosync_demo_mode_v1',
};

export const StorageService = {
  // --- METRICS ---
  async getMetrics(): Promise<HealthMetricRecord[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.METRICS);
      if (data) {
        return JSON.parse(data);
      }
      // If no data exists, initialize with the 30-day realistic sample dataset
      const seed = generateRealisticHistoricalData();
      await AsyncStorage.setItem(KEYS.METRICS, JSON.stringify(seed));
      return seed;
    } catch (e) {
      console.error('Error reading metrics from storage:', e);
      return generateRealisticHistoricalData();
    }
  },

  async saveMetrics(records: HealthMetricRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.METRICS, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving metrics to storage:', e);
    }
  },

  async addOrUpdateMetric(record: HealthMetricRecord): Promise<HealthMetricRecord[]> {
    const existing = await this.getMetrics();
    const index = existing.findIndex(r => r.date === record.date);
    let updated: HealthMetricRecord[];

    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...updated[index], ...record };
    } else {
      updated = [record, ...existing];
    }

    // Sort descending by date
    updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    await this.saveMetrics(updated);
    return updated;
  },

  async deleteMetric(id: string): Promise<HealthMetricRecord[]> {
    const existing = await this.getMetrics();
    const updated = existing.filter(r => r.id !== id);
    await this.saveMetrics(updated);
    return updated;
  },

  // --- USER PROFILE ---
  async getProfile(): Promise<UserProfile> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PROFILE);
      if (data) {
        return JSON.parse(data);
      }
      await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(INITIAL_USER_PROFILE));
      return INITIAL_USER_PROFILE;
    } catch (e) {
      return INITIAL_USER_PROFILE;
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  },

  // --- ONBOARDING ---
  async isOnboardingDone(): Promise<boolean> {
    try {
      const done = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
      return done === 'true';
    } catch {
      return false;
    }
  },

  async setOnboardingDone(done: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, done ? 'true' : 'false');
    } catch (e) {
      console.error('Error setting onboarding status:', e);
    }
  },

  // --- CHAT MESSAGES ---
  async getChatMessages(): Promise<ChatMessage[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  },

  async saveChatMessages(messages: ChatMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving chat messages:', e);
    }
  },

  // --- PURGE / RESET (Section 12: Data Deletion Controls) ---
  async resetToDemoData(): Promise<HealthMetricRecord[]> {
    const seed = generateRealisticHistoricalData();
    await AsyncStorage.setItem(KEYS.METRICS, JSON.stringify(seed));
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(INITIAL_USER_PROFILE));
    await AsyncStorage.removeItem(KEYS.CHAT_MESSAGES);
    return seed;
  },

  async clearAllUserData(): Promise<void> {
    await AsyncStorage.clear();
  },
};
