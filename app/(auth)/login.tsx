import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthProvider';
import { COLORS } from '@/constants';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Login Failed', error);
    } else {
      // Redirect to root index which will handle the onboarding check
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 48 }}>
            {/* Logo / Brand */}
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <LinearGradient
                colors={[COLORS.primary.DEFAULT, COLORS.accent.green]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 36 }}>🥗</Text>
              </LinearGradient>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: COLORS.text.primary,
                  letterSpacing: -0.5,
                }}
              >
                NutriSense AI
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: COLORS.text.secondary,
                  marginTop: 6,
                  textAlign: 'center',
                }}
              >
                Your intelligent nutrition companion
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 16 }}>
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: COLORS.text.secondary,
                    marginBottom: 8,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
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
              </View>

              <View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: COLORS.text.secondary,
                    marginBottom: 8,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.text.muted}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    style={{
                      backgroundColor: COLORS.background.elevated,
                      borderWidth: 1,
                      borderColor: COLORS.border.DEFAULT,
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      paddingRight: 52,
                      fontSize: 16,
                      color: COLORS.text.primary,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: 0,
                      bottom: 0,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={{ alignSelf: 'flex-end' }}
              >
                <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 14, fontWeight: '500' }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={{
                  marginTop: 8,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 17,
                        fontWeight: '700',
                        letterSpacing: 0.3,
                      }}
                    >
                      Sign In
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginVertical: 8,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border.DEFAULT }} />
                <Text style={{ color: COLORS.text.muted, fontSize: 13 }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border.DEFAULT }} />
              </View>

              {/* Sign Up Link */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/signup')}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border.light,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.text.primary, fontSize: 16, fontWeight: '600' }}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={{ marginTop: 'auto', paddingBottom: 24, paddingTop: 32, alignItems: 'center' }}>
              <Text style={{ color: COLORS.text.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                By continuing, you agree to NutriSense AI's{'\n'}
                <Text style={{ color: COLORS.primary.light }}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{ color: COLORS.primary.light }}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
