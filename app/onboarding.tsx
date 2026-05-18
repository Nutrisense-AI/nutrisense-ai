/**
 * NutriSense AI — Onboarding Wizard
 * Multi-step onboarding flow collecting user profile data.
 *
 * Steps:
 *   1. Welcome
 *   2. Personal Info (name, DOB, gender, height)
 *   3. Body Metrics (current weight, target weight)
 *   4. Activity & Goals
 *   5. Dietary Restrictions
 *   6. Allergen Flags
 *   7. Calorie Goal (auto-calculated or custom)
 *   8. All Set!
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/api/supabase';
import { useAuthStore, useProfileStore } from '@/context/store';
import { COLORS, DIETARY_RESTRICTION_LABELS, ALLERGEN_LABELS, ACTIVITY_LEVEL_LABELS, FITNESS_GOAL_LABELS } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 8;

// ============================================================
// Step Indicator
// ============================================================
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 4,
            width: i < current ? 28 : 16,
            borderRadius: 2,
            backgroundColor: i < current
              ? COLORS.primary.DEFAULT
              : i === current
              ? COLORS.primary.light
              : COLORS.border.DEFAULT,
          }}
        />
      ))}
    </View>
  );
}

// ============================================================
// Chip selector
// ============================================================
function ChipSelector<T extends string>({
  options,
  labels,
  selected,
  onToggle,
  multi = true,
}: {
  options: T[];
  labels: Record<string, string>;
  selected: T[];
  onToggle: (val: T) => void;
  multi?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onToggle(opt)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: isSelected ? COLORS.primary.DEFAULT : COLORS.border.DEFAULT,
              backgroundColor: isSelected ? COLORS.primary.muted : COLORS.background.card,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isSelected ? COLORS.primary.light : COLORS.text.secondary,
              }}
            >
              {labels[opt] ?? opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================================
// Main Onboarding Screen
// ============================================================
export default function OnboardingScreen() {
  const { user } = useAuthStore();
  const { setProfile } = useProfileStore();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<string>('prefer_not_to_say');
  const [heightCm, setHeightCm] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<string>('moderately_active');
  const [fitnessGoal, setFitnessGoal] = useState<string>('maintain_weight');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(['none']);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [proteinGoal, setProteinGoal] = useState('150');
  const [carbsGoal, setCarbsGoal] = useState('200');
  const [fatGoal, setFatGoal] = useState('65');

  const toggleDiet = (val: string) => {
    if (val === 'none') {
      setDietaryRestrictions(['none']);
      return;
    }
    setDietaryRestrictions((prev) => {
      const without = prev.filter((v) => v !== 'none');
      return without.includes(val) ? without.filter((v) => v !== val) : [...without, val];
    });
  };

  const toggleAllergen = (val: string) => {
    setAllergens((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    if (!user?.id) return;
    setIsSaving(true);

    const profileData = {
      id: user.id,
      display_name: displayName || user.email?.split('@')[0] || 'NutriSense User',
      date_of_birth: dob || null,
      gender: gender,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      current_weight_kg: currentWeight ? parseFloat(currentWeight) : null,
      target_weight_kg: targetWeight ? parseFloat(targetWeight) : null,
      activity_level: activityLevel,
      fitness_goal: fitnessGoal,
      dietary_restrictions: dietaryRestrictions,
      severe_allergens: allergens,
      daily_calorie_goal: parseInt(calorieGoal) || 2000,
      daily_protein_goal_g: parseFloat(proteinGoal) || 150,
      daily_carbs_goal_g: parseFloat(carbsGoal) || 200,
      daily_fat_goal_g: parseFloat(fatGoal) || 65,
      daily_fiber_goal_g: 25,
      daily_water_goal_ml: 2500,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users_profiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Profile save error:', error);
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save your profile: ' + error.message);
      return;
    }

    if (data) setProfile(data);
    
    // Ensure the profile state is updated before navigating
    setTimeout(() => {
      setIsSaving(false);
      router.replace('/(tabs)/dashboard');
    }, 500);
  };

  // ============================================================
  // Step content
  // ============================================================
  const renderStep = () => {
    switch (step) {
      // ---- Step 0: Welcome ----
      case 0:
        return (
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <Text style={{ fontSize: 64, marginBottom: 24 }}>🥗</Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: COLORS.text.primary, textAlign: 'center', marginBottom: 12 }}>
              Welcome to{'\n'}NutriSense AI
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
              Your AI-powered nutrition companion. Let's set up your personal profile to get started.
            </Text>
            <View style={{ gap: 12, width: '100%' }}>
              {['📸 AI food photo analysis', '🔍 Barcode scanner', '🧊 Smart Fridge tracking', '📊 Historical trend charts', '🍳 Zero-waste recipe generation'].map((f) => (
                <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 14, color: COLORS.text.secondary }}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      // ---- Step 1: Personal Info ----
      case 1:
        return (
          <View style={{ gap: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text.primary }}>
              Tell us about yourself
            </Text>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 6 }}>Display Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={COLORS.text.disabled}
                style={{
                  backgroundColor: COLORS.background.card,
                  borderRadius: 12,
                  padding: 14,
                  color: COLORS.text.primary,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border.DEFAULT,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 6 }}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput
                value={dob}
                onChangeText={setDob}
                placeholder="1990-01-15"
                placeholderTextColor={COLORS.text.disabled}
                style={{
                  backgroundColor: COLORS.background.card,
                  borderRadius: 12,
                  padding: 14,
                  color: COLORS.text.primary,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border.DEFAULT,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 8 }}>Gender</Text>
              <ChipSelector
                options={['male', 'female', 'other', 'prefer_not_to_say']}
                labels={{ male: '♂ Male', female: '♀ Female', other: '⚧ Other', prefer_not_to_say: '🤐 Prefer not to say' }}
                selected={[gender]}
                onToggle={(v) => setGender(v)}
                multi={false}
              />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 6 }}>Height (cm)</Text>
              <TextInput
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="175"
                keyboardType="numeric"
                placeholderTextColor={COLORS.text.disabled}
                style={{
                  backgroundColor: COLORS.background.card,
                  borderRadius: 12,
                  padding: 14,
                  color: COLORS.text.primary,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border.DEFAULT,
                }}
              />
            </View>
          </View>
        );

      // ---- Step 2: Body Metrics ----
      case 2:
        return (
          <View style={{ gap: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text.primary }}>
              Body Metrics
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.text.muted, lineHeight: 20 }}>
              Used to calculate your personalized calorie and macro targets.
            </Text>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 6 }}>Current Weight (kg)</Text>
              <TextInput
                value={currentWeight}
                onChangeText={setCurrentWeight}
                placeholder="75.0"
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.text.disabled}
                style={{
                  backgroundColor: COLORS.background.card,
                  borderRadius: 12,
                  padding: 14,
                  color: COLORS.text.primary,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border.DEFAULT,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 6 }}>Target Weight (kg)</Text>
              <TextInput
                value={targetWeight}
                onChangeText={setTargetWeight}
                placeholder="70.0"
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.text.disabled}
                style={{
                  backgroundColor: COLORS.background.card,
                  borderRadius: 12,
                  padding: 14,
                  color: COLORS.text.primary,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border.DEFAULT,
                }}
              />
            </View>
          </View>
        );

      // ---- Step 3: Activity & Goals ----
      case 3:
        return (
          <View style={{ gap: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text.primary }}>
              Activity & Goals
            </Text>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text.secondary, marginBottom: 10 }}>
                Activity Level
              </Text>
              <ChipSelector
                options={Object.keys(ACTIVITY_LEVEL_LABELS) as string[]}
                labels={ACTIVITY_LEVEL_LABELS}
                selected={[activityLevel]}
                onToggle={(v) => setActivityLevel(v)}
                multi={false}
              />
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text.secondary, marginBottom: 10 }}>
                Fitness Goal
              </Text>
              <ChipSelector
                options={Object.keys(FITNESS_GOAL_LABELS) as string[]}
                labels={FITNESS_GOAL_LABELS}
                selected={[fitnessGoal]}
                onToggle={(v) => setFitnessGoal(v)}
                multi={false}
              />
            </View>
          </View>
        );

      // ---- Step 4: Dietary Restrictions ----
      case 4:
        return (
          <View style={{ gap: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text.primary }}>
              Dietary Restrictions
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.text.muted }}>
              Select all that apply. The AI will respect these when analyzing food and generating recipes.
            </Text>
            <ChipSelector
              options={Object.keys(DIETARY_RESTRICTION_LABELS) as string[]}
              labels={DIETARY_RESTRICTION_LABELS}
              selected={dietaryRestrictions}
              onToggle={toggleDiet}
            />
          </View>
        );

      // ---- Step 5: Allergens ----
      case 5:
        return (
          <View style={{ gap: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text.primary }}>
              Severe Allergens
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.text.muted }}>
              The AI will flag any identified allergens in your food. Select any severe allergens.
            </Text>
            <ChipSelector
              options={Object.keys(ALLERGEN_LABELS) as string[]}
              labels={ALLERGEN_LABELS}
              selected={allergens}
              onToggle={toggleAllergen}
            />
            {allergens.length === 0 && (
              <Text style={{ fontSize: 13, color: COLORS.text.disabled, fontStyle: 'italic' }}>
                No allergens selected — tap any that apply.
              </Text>
            )}
          </View>
        );

      // ---- Step 6: Nutrition Goals ----
      case 6:
        return (
          <View style={{ gap: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text.primary }}>
              Daily Nutrition Goals
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.text.muted }}>
              We've pre-filled smart defaults based on your profile. Adjust as needed.
            </Text>
            {[
              { label: 'Daily Calories (kcal)', value: calorieGoal, setter: setCalorieGoal, placeholder: '2000' },
              { label: 'Protein (g)', value: proteinGoal, setter: setProteinGoal, placeholder: '150' },
              { label: 'Carbohydrates (g)', value: carbsGoal, setter: setCarbsGoal, placeholder: '200' },
              { label: 'Fat (g)', value: fatGoal, setter: setFatGoal, placeholder: '65' },
            ].map(({ label, value, setter, placeholder }) => (
              <View key={label}>
                <Text style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 6 }}>{label}</Text>
                <TextInput
                  value={value}
                  onChangeText={setter}
                  placeholder={placeholder}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.text.disabled}
                  style={{
                    backgroundColor: COLORS.background.card,
                    borderRadius: 12,
                    padding: 14,
                    color: COLORS.text.primary,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: COLORS.border.DEFAULT,
                  }}
                />
              </View>
            ))}
          </View>
        );

      // ---- Step 7: All Set ----
      case 7:
        return (
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <Text style={{ fontSize: 64, marginBottom: 24 }}>🎉</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.text.primary, textAlign: 'center', marginBottom: 12 }}>
              You're all set!
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
              Your personalized NutriSense AI profile is ready. Start tracking your nutrition journey today.
            </Text>
            <View style={{ gap: 10, width: '100%' }}>
              {[
                `🎯 Daily goal: ${calorieGoal} kcal`,
                `💪 Protein: ${proteinGoal}g | Carbs: ${carbsGoal}g | Fat: ${fatGoal}g`,
                dietaryRestrictions[0] !== 'none' ? `🥗 Diet: ${dietaryRestrictions.join(', ')}` : '🥗 No dietary restrictions',
                allergens.length > 0 ? `⚠️ Allergens flagged: ${allergens.length}` : '✅ No allergens flagged',
              ].map((line) => (
                <View key={line} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.card, borderRadius: 12, padding: 14 }}>
                  <Text style={{ fontSize: 14, color: COLORS.text.secondary }}>{line}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepIndicator current={step} total={TOTAL_STEPS} />

          {renderStep()}
        </ScrollView>

        {/* Bottom navigation */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            paddingTop: 12,
            flexDirection: 'row',
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.border.DEFAULT,
            backgroundColor: COLORS.background.DEFAULT,
          }}
        >
          {step > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              style={{
                flex: 1,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                backgroundColor: COLORS.background.card,
                borderWidth: 1,
                borderColor: COLORS.border.DEFAULT,
              }}
            >
              <Text style={{ color: COLORS.text.secondary, fontSize: 16, fontWeight: '600' }}>
                ← Back
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={step === TOTAL_STEPS - 1 ? handleFinish : handleNext}
            disabled={isSaving}
            style={{ flex: 2, borderRadius: 14, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  {step === TOTAL_STEPS - 1 ? '🚀 Start Tracking' : 'Continue →'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
