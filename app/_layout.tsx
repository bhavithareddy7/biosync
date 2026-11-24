// ==============================================================================
// BioSync Root Layout
// Configures providers, global dark styling, and navigation stack
// ==============================================================================

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HealthProvider } from '../context/HealthContext';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <HealthProvider>
        <StatusBar style="light" backgroundColor={Colors.background} translucent={false} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </HealthProvider>
    </SafeAreaProvider>
  );
}
