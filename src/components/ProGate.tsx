/**
 * ProGate — UI components for Pro feature gating.
 *
 * Components:
 *   - <ProBadge />          : Small "PRO" badge label
 *   - <ProGate feature="">  : Wraps content; shows paywall CTA if not Pro
 *   - <ProLockedOverlay />  : Blurred overlay for locked Pro content
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIAP } from '@/context/IAPProvider';
import { COLORS } from '@/constants';

// ============================================================
// ProBadge
// ============================================================
interface ProBadgeProps {
  size?: 'sm' | 'md';
}

export function ProBadge({ size = 'sm' }: ProBadgeProps) {
  return (
    <View
      style={{
        backgroundColor: COLORS.primary.muted,
        borderRadius: size === 'sm' ? 6 : 8,
        paddingHorizontal: size === 'sm' ? 6 : 10,
        paddingVertical: size === 'sm' ? 2 : 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: COLORS.primary.light,
          fontSize: size === 'sm' ? 10 : 12,
          fontWeight: '800',
          letterSpacing: 0.5,
        }}
      >
        ⭐ PRO
      </Text>
    </View>
  );
}

// ============================================================
// ProGate
// ============================================================
interface ProGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProGate({ feature, children, fallback }: ProGateProps) {
  const { isPro, openPaywall } = useIAP();

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <TouchableOpacity
      onPress={() => openPaywall(feature)}
      activeOpacity={0.85}
      style={{
        backgroundColor: COLORS.background.card,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary.DEFAULT,
        borderStyle: 'dashed',
      }}
    >
      <ProBadge size="md" />
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: COLORS.text.primary,
          marginTop: 12,
          marginBottom: 6,
          textAlign: 'center',
        }}
      >
        {feature}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: COLORS.text.muted,
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        Upgrade to Pro for lifetime access
      </Text>
      <View style={{ borderRadius: 12, overflow: 'hidden' }}>
        <LinearGradient
          colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
          style={{ paddingHorizontal: 24, paddingVertical: 10 }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
            Unlock Pro — $29
          </Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// ProLockedOverlay
// ============================================================
interface ProLockedOverlayProps {
  feature: string;
  children: React.ReactNode;
}

export function ProLockedOverlay({ feature, children }: ProLockedOverlayProps) {
  const { isPro, openPaywall } = useIAP();

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Blurred/dimmed content */}
      <View style={{ opacity: 0.3, pointerEvents: 'none' }}>
        {children}
      </View>

      {/* Lock overlay */}
      <TouchableOpacity
        onPress={() => openPaywall(feature)}
        activeOpacity={0.9}
        style={StyleSheet.absoluteFillObject}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 16,
          }}
        >
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🔒</Text>
          <ProBadge size="md" />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: '600',
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            Tap to unlock {feature}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
