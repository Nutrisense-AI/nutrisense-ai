import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthProvider';
import { COLORS } from '@/constants';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email.trim().toLowerCase());
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      setSent(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32 }}>
          <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 30, fontWeight: '700', color: COLORS.text.primary, marginBottom: 8 }}>
          Reset Password
        </Text>
        <Text style={{ fontSize: 15, color: COLORS.text.secondary, marginBottom: 32, lineHeight: 22 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        {sent ? (
          <View
            style={{
              backgroundColor: COLORS.accent.greenMuted,
              borderWidth: 1,
              borderColor: COLORS.accent.green,
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📧</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.accent.green, marginBottom: 8 }}>
              Email Sent!
            </Text>
            <Text style={{ color: COLORS.text.secondary, textAlign: 'center', lineHeight: 20 }}>
              Check your inbox for a password reset link. It may take a few minutes to arrive.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: COLORS.primary.DEFAULT, fontWeight: '600', fontSize: 15 }}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.text.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: COLORS.background.elevated,
                borderWidth: 1,
                borderColor: COLORS.border.DEFAULT,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: COLORS.text.primary,
              }}
            />

            <TouchableOpacity
              onPress={handleReset}
              disabled={isLoading}
              style={{ borderRadius: 16, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center' }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                    Send Reset Link
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
