import { supabase } from './supabase';

const STRIPE_PUBLIC_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY || '';
const STRIPE_API_URL = process.env.EXPO_PUBLIC_STRIPE_API_URL || 'https://api.stripe.com/v1';

export interface StripeCheckoutSession {
  id: string;
  client_secret: string;
  url?: string;
}

/**
 * Create a Stripe checkout session for the $29 lifetime pass
 */
export async function createCheckoutSession(userId: string, userEmail: string): Promise<{ data?: StripeCheckoutSession; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'create-stripe-checkout',
      {
        body: JSON.stringify({
          userId,
          userEmail,
          priceId: process.env.EXPO_PUBLIC_STRIPE_PRICE_ID,
          amount: 2900, // $29.00 in cents
        }),
      }
    );

    if (error) {
      console.error('Error creating checkout session:', error);
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    console.error('Unexpected error in createCheckoutSession:', err);
    return { error: 'Failed to create checkout session' };
  }
}

/**
 * Verify a Stripe payment and update user pro status
 */
export async function verifyPayment(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'verify-stripe-payment',
      {
        body: JSON.stringify({ sessionId }),
      }
    );

    if (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in verifyPayment:', err);
    return { success: false, error: 'Failed to verify payment' };
  }
}

/**
 * Get Stripe public key for client-side initialization
 */
export function getStripePublicKey(): string {
  return STRIPE_PUBLIC_KEY;
}
