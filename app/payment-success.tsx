import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants';
import { verifyPayment } from '@/src/api/stripe';
import { useIAPStore } from '@/context/store';

export default function PaymentSuccessScreen() {
  const { session_id } = useLocalSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const { setIsPro } = useIAPStore();

  useEffect(() => {
    verifyPaymentSession();
  }, [session_id]);

  const verifyPaymentSession = async () => {
    if (!session_id) {
      setIsVerifying(false);
      return;
    }

    const { success } = await verifyPayment(session_id as string);
    setIsSuccess(success);
    setIsVerifying(false);

    if (success) {
      setIsPro(true);
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 3000);
    }
  };

  if (isVerifying) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
          <Text style={styles.verifyingText}>Verifying your payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>❌</Text>
          <Text style={styles.title}>Payment Verification Failed</Text>
          <Text style={styles.message}>
            We couldn't verify your payment. Please contact support or try again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Welcome to NutriSense Pro!</Text>
          <Text style={styles.message}>
            Your lifetime access is now active. You have unlimited access to all premium features.
          </Text>
          <View style={styles.featuresContainer}>
            <Text style={styles.featureItem}>✓ AI Nutritionist Chat</Text>
            <Text style={styles.featureItem}>✓ Advanced Analytics</Text>
            <Text style={styles.featureItem}>✓ Custom Meal Plans</Text>
            <Text style={styles.featureItem}>✓ Unlimited Scans</Text>
          </View>
          <Text style={styles.redirectText}>Redirecting to dashboard...</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.DEFAULT,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: COLORS.primary.DEFAULT,
    fontSize: 16,
    fontWeight: '700',
  },
  verifyingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
  redirectText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
