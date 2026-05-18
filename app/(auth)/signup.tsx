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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthProvider';
import { COLORS } from '@/constants';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(
      email.trim().toLowerCase(),
      password,
      displayName.trim()
    );
    setIsLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error);
    } else {
      Alert.alert(
        'Account Created!',
        'Your account is ready. Let\'s get started with your personalized setup.',
        [{ text: 'Start Onboarding', onPress: () => router.replace('/onboarding') }]
      );
    }
  };

  const inputStyle = {
    backgroundColor: COLORS.background.elevated,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
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
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
            {/* Header */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginBottom: 24 }}
            >
              <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 16 }}>← Back</Text>
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 30,
                fontWeight: '700',
                color: COLORS.text.primary,
                marginBottom: 8,
              }}
            >
              Create Account
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: COLORS.text.secondary,
                marginBottom: 32,
              }}
            >
              Start your personalized nutrition journey today.
            </Text>

            {/* Form */}
            <View style={{ gap: 16 }}>
              <View>
                <Text style={labelStyle}>Full Name</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Jane Smith"
                  placeholderTextColor={COLORS.text.muted}
                  autoCapitalize="words"
                  autoComplete="name"
                  style={inputStyle}
                />
              </View>

              <View>
                <Text style={labelStyle}>Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={inputStyle}
                />
              </View>

              <View>
                <Text style={labelStyle}>Password</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min. 8 characters"
                    placeholderTextColor={COLORS.text.muted}
                    secureTextEntry={!showPassword}
                    style={{ ...inputStyle, paddingRight: 52 }}
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

              <View>
                <Text style={labelStyle}>Confirm Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={COLORS.text.muted}
                  secureTextEntry={!showPassword}
                  style={inputStyle}
                />
              </View>

              {/* Create Account Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                style={{ marginTop: 8, borderRadius: 16, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}
                    >
                      Create Account
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 'auto', paddingBottom: 24, paddingTop: 32, alignItems: 'center' }}>
              <Text style={{ color: COLORS.text.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                By creating an account, you agree to NutriSense AI's{'\n'}
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
