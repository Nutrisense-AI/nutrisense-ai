/**
 * NutriSense AI — Wearable API Sync Screen (Pro Feature)
 * Integrates with Apple Health (iOS) and Google Fit (Android).
 * Gated behind the Pro Pack entitlement.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useIAP } from '@/context/IAPProvider';
import { COLORS } from '@/constants';

// ============================================================
// Types
// ============================================================
interface SyncSetting {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

// ============================================================
// Main Screen
// ============================================================
export default function WearableSyncScreen() {
  const { isPro, openPaywall } = useIAP();
  const [syncSettings, setSyncSettings] = useState<SyncSetting[]>([
    {
      id: 'calories_burned',
      label: 'Calories Burned',
      description: 'Import active calorie burn from workouts',
      icon: '🔥',
      enabled: true,
    },
    {
      id: 'steps',
      label: 'Step Count',
      description: 'Sync daily step count to adjust calorie goals',
      icon: '👟',
      enabled: true,
    },
    {
      id: 'heart_rate',
      label: 'Heart Rate',
      description: 'Monitor resting and active heart rate trends',
      icon: '❤️',
      enabled: false,
    },
    {
      id: 'sleep',
      label: 'Sleep Data',
      description: 'Track sleep quality and its impact on nutrition',
      icon: '😴',
      enabled: false,
    },
    {
      id: 'weight',
      label: 'Body Weight',
      description: 'Sync weight measurements automatically',
      icon: '⚖️',
      enabled: true,
    },
    {
      id: 'water',
      label: 'Water Intake',
      description: 'Import water tracking from health apps',
      icon: '💧',
      enabled: false,
    },
    {
      id: 'workouts',
      label: 'Workout Sessions',
      description: 'Log workout nutrition needs automatically',
      icon: '🏋️',
      enabled: true,
    },
  ]);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const platformName = Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit';
  const platformIcon = Platform.OS === 'ios' ? '🍎' : '🤖';

  const toggleSetting = (id: string) => {
    setSyncSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleConnect = async () => {
    if (!isPro) {
      openPaywall('Wearable API Sync');
      return;
    }

    setIsConnecting(true);

    // Simulate connection — in production, use expo-health or react-native-health
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsConnecting(false);
    setIsConnected(true);

    Alert.alert(
      `✅ Connected to ${platformName}`,
      `NutriSense AI is now syncing with ${platformName}. Your activity data will be used to refine your daily calorie and macro goals.`,
      [{ text: 'Great!' }]
    );
  };

  const handleDisconnect = () => {
    Alert.alert(
      `Disconnect ${platformName}`,
      `Stop syncing data from ${platformName}? Your existing logs will not be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => setIsConnected(false),
        },
      ]
    );
  };

  // ---- Pro gate ----
  if (!isPro) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border.DEFAULT }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 22, color: COLORS.text.secondary }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary }}>
            Wearable Sync
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 56, marginBottom: 20 }}>⌚</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text.primary, textAlign: 'center', marginBottom: 12 }}>
            Pro Feature
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Sync with {platformName} to automatically adjust your calorie goals based on real activity data.
          </Text>
          <TouchableOpacity
            onPress={() => openPaywall('Wearable API Sync')}
            style={{ borderRadius: 16, overflow: 'hidden', width: '100%' }}
          >
            <LinearGradient
              colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                ⭐ Unlock Pro — $29 Lifetime
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border.DEFAULT }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22, color: COLORS.text.secondary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary }}>
          Wearable Sync
        </Text>
        <View style={{ marginLeft: 'auto', backgroundColor: COLORS.primary.muted, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, color: COLORS.primary.light, fontWeight: '700' }}>PRO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Connection card */}
        <View
          style={{
            backgroundColor: COLORS.background.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: isConnected ? COLORS.accent.green : COLORS.border.DEFAULT,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: 40 }}>{platformIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary }}>
                {platformName}
              </Text>
              <Text style={{ fontSize: 13, color: isConnected ? COLORS.accent.green : COLORS.text.muted }}>
                {isConnected ? '● Connected' : '○ Not connected'}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 14, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 16 }}>
            {isConnected
              ? `NutriSense AI is actively syncing with ${platformName}. Activity data is used to dynamically adjust your daily calorie and macro targets.`
              : `Connect ${platformName} to automatically import activity data and optimize your nutrition goals based on real calorie burn.`}
          </Text>

          <TouchableOpacity
            onPress={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            style={{ borderRadius: 12, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={
                isConnected
                  ? ['#FF4081', '#CC0055']
                  : [COLORS.primary.DEFAULT, COLORS.primary.dark]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                {isConnecting
                  ? 'Connecting...'
                  : isConnected
                  ? `Disconnect ${platformName}`
                  : `Connect ${platformName}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sync settings */}
        {isConnected && (
          <>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              Data to Sync
            </Text>
            <View style={{ backgroundColor: COLORS.background.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border.DEFAULT, overflow: 'hidden' }}>
              {syncSettings.map((setting, idx) => (
                <View
                  key={setting.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: idx < syncSettings.length - 1 ? 1 : 0,
                    borderBottomColor: COLORS.border.DEFAULT,
                    gap: 14,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{setting.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text.primary }}>
                      {setting.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.text.muted, marginTop: 2 }}>
                      {setting.description}
                    </Text>
                  </View>
                  <Switch
                    value={setting.enabled}
                    onValueChange={() => toggleSetting(setting.id)}
                    trackColor={{ false: COLORS.border.DEFAULT, true: COLORS.primary.DEFAULT }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Info card */}
        <View style={{ backgroundColor: COLORS.background.elevated, borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 1, borderColor: COLORS.border.DEFAULT }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.muted, marginBottom: 8 }}>
            📋 About Wearable Sync
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.text.secondary, lineHeight: 20 }}>
            NutriSense AI reads health data from {platformName} to provide smarter, activity-adjusted nutrition recommendations. Your health data is processed on-device and never shared with third parties. You can disconnect at any time.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
