import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants';
import { useIAPStore } from '@/context/store';

interface PremiumPaywallProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: () => Promise<void>;
}

export default function PremiumPaywall({ visible, onClose, onPurchase }: PremiumPaywallProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { closePaywall } = useIAPStore();

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await onPurchase();
      closePaywall();
    } catch (error) {
      Alert.alert('Purchase Failed', 'Unable to complete your purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        >
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Header */}
            <Text style={styles.emoji}>👑</Text>
            <Text style={styles.title}>NutriSense Pro</Text>
            <Text style={styles.subtitle}>Unlock your full potential</Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              {[
                '🤖 AI Nutritionist Chat - Get personalized advice anytime',
                '📊 Advanced Analytics - Track detailed macro trends',
                '🍽️ Meal Planning - AI-generated custom meal plans',
                '📸 Unlimited Scans - Analyze unlimited food photos',
                '🔄 Smart Sync - Sync across all your devices',
                '⚡ Priority Support - Get help when you need it',
              ].map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Pricing Card */}
            <View style={styles.pricingCard}>
              <Text style={styles.pricingLabel}>Limited Time Offer</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>$29</Text>
                <Text style={styles.priceLabel}>Lifetime Access</Text>
              </View>
              <Text style={styles.priceDescription}>One-time payment. No recurring charges.</Text>
            </View>

            {/* Purchase Button */}
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={handlePurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.purchaseButtonText}>Get Lifetime Access</Text>
              )}
            </TouchableOpacity>

            {/* Referral Hint */}
            <TouchableOpacity style={styles.referralHint}>
              <Text style={styles.referralText}>💝 Invite 3 friends for 24 hours free trial</Text>
            </TouchableOpacity>

            {/* Footer */}
            <Text style={styles.footer}>
              By purchasing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  background: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  featureIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  pricingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  pricingLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  priceDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  purchaseButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  purchaseButtonText: {
    color: COLORS.primary.DEFAULT,
    fontSize: 17,
    fontWeight: '700',
  },
  referralHint: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  referralText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
