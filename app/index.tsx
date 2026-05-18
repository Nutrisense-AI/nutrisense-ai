import { Redirect } from 'expo-router';
import { useAuthStore, useProfileStore } from '@/context/store';
import { View, ActivityIndicator } from 'react-native';

/**
 * Root Index — Navigation Dispatcher
 * Ensures smooth, skip-free boot logic based on auth and onboarding status.
 */
export default function Index() {
  const { session, isInitialized, isLoading: authLoading } = useAuthStore();
  const { profile, isLoading: profileLoading } = useProfileStore();

  // Wait for both auth and profile to initialize to prevent visual skips
  if (!isInitialized || authLoading || (session && profileLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  // 1. If not logged in, go to login
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // 2. If logged in but onboarding not completed, go to onboarding
  if (!profile?.onboarding_completed) {
    return <Redirect href="/onboarding" />;
  }

  // 3. Otherwise, go to dashboard
  return <Redirect href="/(tabs)/dashboard" />;
}
