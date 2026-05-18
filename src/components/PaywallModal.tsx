/**
 * PaywallModal — Re-export from IAPProvider for use in _layout.tsx.
 * The full paywall is embedded inside IAPProvider; this component
 * acts as a bridge for the layout's conditional render.
 */

// The PaywallModal is rendered inside IAPProvider as part of the
// context provider tree. This export is a no-op placeholder that
// satisfies the import in _layout.tsx — the actual modal is
// controlled by IAPProvider's internal state.

import React from 'react';
import { View } from 'react-native';

export function PaywallModal() {
  // Actual paywall is rendered by IAPProvider.
  // This component exists to satisfy the import in _layout.tsx.
  return null;
}
