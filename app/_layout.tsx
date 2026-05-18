/**
 * NutriSense AI — Root Layout
 * Expo Router root layout. Wraps the entire app with:
 *   - GestureHandlerRootView
 *   - SafeAreaProvider
 *   - AuthProvider (Supabase session)
 *   - IAPProvider (RevenueCat + built-in PaywallModal)
 *
 * All navigation routes are registered here.
 */

import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthProvider';
import { IAPProvider } from '@/context/IAPProvider';

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth group */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Main tab group */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Onboarding wizard — full screen modal on first launch */}
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />

        {/* Camera — full screen modal */}
        <Stack.Screen
          name="camera"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />

        {/* Barcode scanner — full screen modal */}
        <Stack.Screen
          name="barcode"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />

        {/* Food detail — bottom sheet modal */}
        <Stack.Screen
          name="food-detail"
          options={{ headerShown: false, presentation: 'modal' }}
        />

        {/* Recipe detail — bottom sheet modal */}
        <Stack.Screen
          name="recipe-detail"
          options={{ headerShown: false, presentation: 'modal' }}
        />

        {/* Legal — Terms of Service & Privacy Policy */}
        <Stack.Screen
          name="legal"
          options={{ headerShown: false, presentation: 'modal' }}
        />

        {/* Wearable sync — Pro-gated Apple Health / Google Fit */}
        <Stack.Screen
          name="wearable-sync"
          options={{ headerShown: false, presentation: 'modal' }}
        />

        {/* Admin Dashboard — Hidden feature */}
        <Stack.Screen
          name="admin-panel"
          options={{ headerShown: false, presentation: 'modal' }}
        />

        {/* Stripe Payment Success — Redirect after web checkout */}
        <Stack.Screen
          name="payment-success"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>

      {/* PaywallModal is rendered inside IAPProvider — no separate render needed here */}
      <StatusBar style="light" backgroundColor="#0A0A0F" />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen immediately since we don't load custom fonts
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <IAPProvider>
            <RootLayoutInner />
          </IAPProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
