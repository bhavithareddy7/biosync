// ==============================================================================
// BioSync Entry Point Controller
// Checks onboarding state and routes appropriately
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { StorageService } from '../services/storageService';
import { Colors } from '../constants/theme';

export default function EntryIndex() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    const checkState = async () => {
      const done = await StorageService.isOnboardingDone();
      setOnboardingDone(done);
    };
    checkState();
  }, []);

  if (onboardingDone === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAccent} />
      </View>
    );
  }

  if (onboardingDone) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
