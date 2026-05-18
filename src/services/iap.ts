/**
 * NutriSense AI — In-App Purchase Service
 * Powered by RevenueCat (react-native-purchases)
 *
 * Products:
 *   - com.nutrisenseai.pro.lifetime  → Pro Pack (Lifetime) $29
 *   - com.nutrisenseai.module.tdee   → TDEE + Macro Calculator Module $4.99
 *   - com.nutrisenseai.module.coaching → AI Coaching Module $9.99
 *   - com.nutrisenseai.consult.30min → 30-min Dietitian Consultation $49
 */

import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from '@/api/supabase';

// ============================================================
// Product IDs
// ============================================================
export const PRODUCT_IDS = {
  PRO_LIFETIME: 'com.nutrisenseai.pro.lifetime',
  MODULE_TDEE: 'com.nutrisenseai.module.tdee',
  MODULE_COACHING: 'com.nutrisenseai.module.coaching',
  CONSULT_30MIN: 'com.nutrisenseai.consult.30min',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

// RevenueCat entitlement IDs
export const ENTITLEMENTS = {
  PRO: 'pro',
  TDEE_MODULE: 'tdee_module',
  COACHING_MODULE: 'coaching_module',
} as const;

// ============================================================
// Initialize RevenueCat
// ============================================================
export async function initializePurchases(userId?: string): Promise<void> {
  // Use the live RevenueCat key obtained from the dashboard
  const apiKey = 'test_UEMxoYVjMbRRwOELZTzOIAAyZVz';

  if (!apiKey) {
    console.warn('[IAP] RevenueCat API key not configured. IAP disabled.');
    return;
  }

  if (__DEV__) {
    await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  await Purchases.configure({
    apiKey,
    appUserID: userId ?? null,
  });

  if (userId) {
    await Purchases.logIn(userId);
  }
}

// ============================================================
// Get current customer info
// ============================================================
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.error('[IAP] Failed to get customer info:', err);
    return null;
  }
}

// ============================================================
// Check if user has Pro entitlement
// ============================================================
export async function checkProStatus(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
  } catch {
    return false;
  }
}

// ============================================================
// Get available offerings
// ============================================================
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (err) {
    console.error('[IAP] Failed to get offerings:', err);
    return null;
  }
}

// ============================================================
// Purchase a package
// ============================================================
export interface PurchaseResult {
  success: boolean;
  isPro: boolean;
  error?: string;
  errorCode?: number;
  customerInfo?: CustomerInfo;
}

export async function purchasePackage(
  pkg: PurchasesPackage,
  userId: string
): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;

    // Sync purchase status to Supabase
    if (isPro) {
      await syncProStatusToSupabase(userId, true, customerInfo);
    }

    return { success: true, isPro, customerInfo };
  } catch (err: any) {
    if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, isPro: false, error: 'Purchase cancelled', errorCode: err.code };
    }

    console.error('[IAP] Purchase failed:', err);
    return {
      success: false,
      isPro: false,
      error: err.message ?? 'Purchase failed',
      errorCode: err.code,
    };
  }
}

// ============================================================
// Restore purchases
// ============================================================
export async function restorePurchases(userId: string): Promise<PurchaseResult> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;

    if (isPro) {
      await syncProStatusToSupabase(userId, true, customerInfo);
    }

    return { success: true, isPro, customerInfo };
  } catch (err: any) {
    console.error('[IAP] Restore failed:', err);
    return {
      success: false,
      isPro: false,
      error: err.message ?? 'Restore failed',
    };
  }
}

// ============================================================
// Sync Pro status to Supabase user profile
// ============================================================
async function syncProStatusToSupabase(
  userId: string,
  isPro: boolean,
  customerInfo: CustomerInfo
): Promise<void> {
  try {
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
    const purchaseDate = proEntitlement?.latestPurchaseDate ?? null;
    const originalPurchaseDate = proEntitlement?.originalPurchaseDate ?? null;

    await supabase
      .from('users_profiles')
      .update({
        is_pro: isPro,
        pro_unlocked_at: isPro ? (purchaseDate ?? new Date().toISOString()) : null,
        revenuecat_user_id: customerInfo.originalAppUserId,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId);
  } catch (err) {
    console.error('[IAP] Failed to sync pro status to Supabase:', err);
  }
}

// ============================================================
// Log in to RevenueCat with Supabase user ID
// ============================================================
export async function loginRevenueCat(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.error('[IAP] RevenueCat login failed:', err);
  }
}

// ============================================================
// Log out from RevenueCat
// ============================================================
export async function logoutRevenueCat(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (err) {
    console.error('[IAP] RevenueCat logout failed:', err);
  }
}
