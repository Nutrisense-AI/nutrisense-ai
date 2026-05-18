/**
 * useProGate — Hook to enforce Pro-only feature access.
 *
 * Usage:
 *   const { requirePro } = useProGate();
 *   const handlePress = requirePro('Feature Name', () => { ... });
 */

import { useCallback } from 'react';
import { useIAP } from '@/context/IAPProvider';

export function useProGate() {
  const { isPro, openPaywall } = useIAP();

  /**
   * Wraps a callback so it only executes if the user has Pro.
   * If not Pro, opens the paywall with the given feature name.
   */
  const requirePro = useCallback(
    <T extends (...args: any[]) => any>(featureName: string, callback: T): T => {
      return ((...args: Parameters<T>) => {
        if (isPro) {
          return callback(...args);
        } else {
          openPaywall(featureName);
          return undefined;
        }
      }) as T;
    },
    [isPro, openPaywall]
  );

  /**
   * Returns true if the user can access a Pro feature.
   * If not Pro, opens the paywall and returns false.
   */
  const checkPro = useCallback(
    (featureName: string): boolean => {
      if (isPro) return true;
      openPaywall(featureName);
      return false;
    },
    [isPro, openPaywall]
  );

  return { isPro, requirePro, checkPro };
}
