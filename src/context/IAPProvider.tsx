/**
 * IAPProvider — RevenueCat context provider
 * Manages Pro status, paywall display, and purchase flows.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
let Purchases: any;
if (Platform.OS !== 'web') {
  Purchases = require('react-native-purchases');
}
import {
  initializePurchases,
  checkProStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
  ENTITLEMENTS,
  PRODUCT_IDS,
} from '@/services/iap';
import { useAuthStore, useIAPStore } from '@/context/store';
import { COLORS } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// Context
// ============================================================
interface IAPContextValue {
  isPro: boolean;
  isLoading: boolean;
  openPaywall: (source?: string) => void;
  closePaywall: () => void;
  restorePurchasesAction: () => Promise<void>;
}

const IAPContext = createContext<IAPContextValue>({
  isPro: false,
  isLoading: true,
  openPaywall: () => {},
  closePaywall: () => {},
  restorePurchasesAction: async () => {},
});

export const useIAP = () => useContext(IAPContext);

// ============================================================
// Pro Feature Comparison Data
// ============================================================
const FREE_FEATURES = [
  'AI food photo analysis (5/day)',
  'Barcode scanner — Open Food Facts',
  'Daily macro tracking dashboard',
  'Smart Fridge inventory (up to 20 items)',
  'Basic recipe generation (1/day)',
  '7-day food log history',
];

const PRO_FEATURES = [
  '✨ Unlimited AI food photo analysis',
  '✨ Smart Fridge — unlimited items',
  '✨ 3 zero-waste recipes per generation',
  '✨ Historical trend charts (up to 90 days)',
  '✨ Wearable API sync (Apple Health / Fitbit)',
  '✨ Advanced allergen & dietary alerts',
  '✨ Unlimited food log history',
  '✨ Priority AI processing',
  '✨ Early access to new features',
];

// ============================================================
// Paywall Modal Component
// ============================================================
function PaywallModal({
  visible,
  onClose,
  onPurchase,
  onRestore,
  offering,
  isPurchasing,
  source,
}: {
  visible: boolean;
  onClose: () => void;
  onPurchase: (pkg: PurchasesPackage) => void;
  onRestore: () => void;
  offering: PurchasesOffering | null;
  isPurchasing: boolean;
  source: string;
}) {
  const lifetimePkg = offering?.availablePackages?.find(
    (p) => p.product.identifier === PRODUCT_IDS.PRO_LIFETIME
  ) ?? offering?.lifetime ?? offering?.availablePackages?.[0] ?? null;

  const price = lifetimePkg?.product?.priceString ?? '$29.00';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header gradient */}
          <LinearGradient
            colors={[COLORS.primary.dark, COLORS.primary.DEFAULT, '#8B7CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' }}
          >
            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 40, marginBottom: 12 }}>⭐</Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              NutriSense AI Pro
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.85)',
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Unlock the full power of AI nutrition tracking
            </Text>

            {source && (
              <View
                style={{
                  marginTop: 16,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
                  🔒 {source} requires Pro
                </Text>
              </View>
            )}
          </LinearGradient>

          <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
            {/* Price card */}
            <View
              style={{
                backgroundColor: COLORS.background.card,
                borderRadius: 20,
                padding: 20,
                marginBottom: 24,
                borderWidth: 2,
                borderColor: COLORS.primary.DEFAULT,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: COLORS.primary.muted,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: COLORS.primary.light, fontSize: 12, fontWeight: '700' }}>
                  ONE-TIME PAYMENT — LIFETIME ACCESS
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 48,
                  fontWeight: '800',
                  color: COLORS.text.primary,
                  marginBottom: 4,
                }}
              >
                {price}
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.text.muted }}>
                Pay once, use forever. No subscriptions.
              </Text>
            </View>

            {/* Feature comparison */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: COLORS.text.primary,
                marginBottom: 12,
              }}
            >
              What's included:
            </Text>

            {/* Pro features */}
            <View
              style={{
                backgroundColor: COLORS.background.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.primary.DEFAULT,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: COLORS.primary.light,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                ⭐ Pro — Everything
              </Text>
              {PRO_FEATURES.map((f) => (
                <Text
                  key={f}
                  style={{
                    fontSize: 14,
                    color: COLORS.text.primary,
                    marginBottom: 8,
                    lineHeight: 20,
                  }}
                >
                  {f}
                </Text>
              ))}
            </View>

            {/* Free features */}
            <View
              style={{
                backgroundColor: COLORS.background.elevated,
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: COLORS.border.DEFAULT,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: COLORS.text.muted,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                Free — Always included
              </Text>
              {FREE_FEATURES.map((f) => (
                <Text
                  key={f}
                  style={{
                    fontSize: 14,
                    color: COLORS.text.secondary,
                    marginBottom: 8,
                    lineHeight: 20,
                  }}
                >
                  ✓ {f}
                </Text>
              ))}
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={() => lifetimePkg && onPurchase(lifetimePkg)}
              disabled={isPurchasing || !lifetimePkg}
              style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}
            >
              <LinearGradient
                colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 10,
                }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={{ fontSize: 18 }}>⭐</Text>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 18,
                        fontWeight: '800',
                      }}
                    >
                      Unlock Pro — {price}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Restore */}
            <TouchableOpacity
              onPress={onRestore}
              style={{ alignItems: 'center', paddingVertical: 12 }}
            >
              <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 15, fontWeight: '600' }}>
                Restore Previous Purchase
              </Text>
            </TouchableOpacity>

            {/* Legal */}
            <Text
              style={{
                fontSize: 11,
                color: COLORS.text.muted,
                textAlign: 'center',
                lineHeight: 16,
                marginTop: 8,
              }}
            >
              Payment will be charged to your App Store / Google Play account. This is a one-time
              purchase granting lifetime access. By purchasing you agree to our Terms of Service
              and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============================================================
// IAPProvider
// ============================================================
export function IAPProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { isPro, setIsPro, showPaywall: paywallVisible, paywallTriggerScreen: paywallSource, openPaywall, closePaywall } = useIAPStore();

  const [isLoading, setIsLoading] = useState(true);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Initialize RevenueCat on mount
  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'web') {
        setIsLoading(false);
        return;
      }
      try {
        await initializePurchases(user?.id);

        // Fetch offerings in parallel with pro check
        const [proStatus, offeringData] = await Promise.all([
          checkProStatus(),
          getOfferings(),
        ]);

        setIsPro(proStatus);
        setOffering(offeringData);

        // Listen for customer info updates
        Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
          const proActive = info.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
          setIsPro(proActive);
        });
      } catch (err) {
        console.warn('[IAP] Initialization failed (likely dev/simulator):', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [user?.id]);



  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      if (!user?.id) {
        Alert.alert('Sign In Required', 'Please sign in to make a purchase.');
        return;
      }

      setIsPurchasing(true);
      const result = await purchasePackage(pkg, user.id);
      setIsPurchasing(false);

      if (result.success && result.isPro) {
        setIsPro(true);
        closePaywall();
        Alert.alert(
          '🎉 Welcome to Pro!',
          'You now have lifetime access to all NutriSense AI Pro features.',
          [{ text: 'Let\'s Go!' }]
        );
      } else if (result.error && !result.error.includes('cancelled')) {
        Alert.alert('Purchase Failed', result.error);
      }
    },
    [user?.id]
  );

  const restorePurchasesAction = useCallback(async () => {
    if (!user?.id) return;

    const result = await restorePurchases(user.id);

    if (result.isPro) {
      setIsPro(true);
      closePaywall();
      Alert.alert('✅ Restored!', 'Your Pro purchase has been restored.');
    } else {
      Alert.alert(
        'No Purchases Found',
        'No previous Pro purchase was found for this account.'
      );
    }
  }, [user?.id]);

  return (
    <IAPContext.Provider
      value={{
        isPro,
        isLoading,
        openPaywall,
        closePaywall,
        restorePurchasesAction,
      }}
    >
      {children}
      <PaywallModal
        visible={paywallVisible}
        onClose={closePaywall}
        onPurchase={handlePurchase}
        onRestore={restorePurchasesAction}
        offering={offering}
        isPurchasing={isPurchasing}
        source={paywallSource}
      />
    </IAPContext.Provider>
  );
}
