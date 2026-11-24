// ==============================================================================
// BioSync 5-Tab Persistent Navigation System (Section 6)
// Dark navy background, electric cyan active indicators, muted grey-blue inactive
// ==============================================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primaryAccent,
        tabBarInactiveTintColor: Colors.secondaryText,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* Tab 1: Home Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeGlow} />}
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={20} color={color} />
            </View>
          ),
        }}
      />

      {/* Tab 2: My Twin */}
      <Tabs.Screen
        name="twin"
        options={{
          title: 'My Twin',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeGlow} />}
              <Ionicons name={focused ? 'body' : 'body-outline'} size={21} color={color} />
            </View>
          ),
        }}
      />

      {/* Tab 3: Workout Intelligence */}
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeGlow} />}
              <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={20} color={color} />
            </View>
          ),
        }}
      />

      {/* Tab 4: Insights */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeGlow} />}
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={20} color={color} />
            </View>
          ),
        }}
      />

      {/* Tab 4: My Data */}
      <Tabs.Screen
        name="data"
        options={{
          title: 'My Data',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeGlow} />}
              <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={20} color={color} />
            </View>
          ),
        }}
      />

      {/* Tab 5: Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeGlow} />}
              <Ionicons name={focused ? 'person' : 'person-outline'} size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.secondaryBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 32,
    height: 28,
  },
  activeGlow: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 3,
    backgroundColor: Colors.primaryAccent,
    borderRadius: 2,
    shadowColor: Colors.primaryAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
});
