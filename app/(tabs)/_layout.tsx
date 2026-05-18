import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { COLORS } from '@/constants';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? '700' : '400',
          color: focused ? COLORS.primary.DEFAULT : COLORS.text.muted,
          marginTop: 2,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background.secondary,
          borderTopColor: COLORS.border.DEFAULT,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📝" label="Log" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: focused ? COLORS.primary.DEFAULT : COLORS.background.elevated,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                borderWidth: focused ? 0 : 1,
                borderColor: COLORS.border.light,
                shadowColor: COLORS.primary.DEFAULT,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: focused ? 0.5 : 0,
                shadowRadius: 12,
                elevation: focused ? 8 : 0,
              }}
            >
              <Text style={{ fontSize: 24 }}>📷</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🤖" label="AI Chat" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🧊" label="Fridge" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
