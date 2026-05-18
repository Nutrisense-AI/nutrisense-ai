import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';
import { useIAPStore } from '@/context/store';

interface FreemiumGateProps {
  featureName: string;
  children: React.ReactNode;
}

/**
 * FreemiumGate Component
 * Wraps premium features and shows a paywall if user is not pro
 */
export default function FreemiumGate({ featureName, children }: FreemiumGateProps) {
  const { isPro, openPaywall } = useIAPStore();

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>✨ Premium Feature</Text>
        <Text style={styles.description}>{featureName} is available with NutriSense Pro</Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => openPaywall(featureName)}
        >
          <Text style={styles.upgradeButtonText}>Unlock for $29</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.DEFAULT,
  },
  overlay: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary.DEFAULT,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
