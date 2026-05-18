/**
 * NutriSense AI — Recipe Detail Modal
 * Full recipe view with ingredients, instructions, macros, and log-to-diary action.
 * Accessible via router.push('/recipe-detail', { params: { recipeJson } })
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/api/supabase';
import { useAuthStore } from '@/context/store';
import { useDailyLogStore } from '@/context/store';
import { COLORS, MEAL_TYPE_LABELS } from '@/constants';

interface RecipeIngredient {
  item: string;
  amount: string;
}

interface Recipe {
  name: string;
  description?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  calories_per_serving?: number;
  protein_per_serving_g?: number;
  carbs_per_serving_g?: number;
  fat_per_serving_g?: number;
  fiber_per_serving_g?: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  waste_reduction_tip?: string;
}

export default function RecipeDetailScreen() {
  const { recipeJson } = useLocalSearchParams<{ recipeJson: string }>();
  const { user } = useAuthStore();
  const { addLog } = useDailyLogStore();
  const [isLogging, setIsLogging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  let recipe: Recipe | null = null;
  try {
    recipe = recipeJson ? JSON.parse(decodeURIComponent(recipeJson)) : null;
  } catch {
    recipe = null;
  }

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.text.muted }}>Recipe not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.primary.DEFAULT }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  const handleLogToDay = async () => {
    if (!user?.id) return;
    setIsLogging(true);

    const logEntry = {
      user_id: user.id,
      logged_at: new Date().toISOString(),
      log_date: new Date().toISOString().split('T')[0],
      food_name: recipe!.name,
      meal_type: 'lunch' as const,
      log_source: 'recipe_import' as const,
      serving_description: `1 serving of ${recipe!.name}`,
      quantity: 1,
      calories: recipe!.calories_per_serving ?? 0,
      protein_g: recipe!.protein_per_serving_g ?? 0,
      carbs_g: recipe!.carbs_per_serving_g ?? 0,
      fat_g: recipe!.fat_per_serving_g ?? 0,
      fiber_g: recipe!.fiber_per_serving_g ?? 0,
      sodium_mg: 0,
      sugar_g: 0,
      saturated_fat_g: 0,
      trans_fat_g: 0,
      polyunsaturated_fat_g: 0,
      monounsaturated_fat_g: 0,
      ai_identified_ingredients: recipe!.ingredients.map((i) => i.item),
      is_deleted: false,
    };

    const { data, error } = await supabase
      .from('daily_food_logs')
      .insert(logEntry)
      .select()
      .single();

    setIsLogging(false);

    if (data) {
      addLog(data);
      Alert.alert('✅ Logged!', `"${recipe!.name}" has been added to today's food log.`, [
        { text: 'View Dashboard', onPress: () => router.replace('/(tabs)/dashboard') },
        { text: 'Stay Here' },
      ]);
    } else {
      Alert.alert('Error', 'Failed to log recipe. Please try again.');
    }
  };

  const handleSaveRecipe = async () => {
    if (!user?.id) return;
    setIsSaving(true);

    const { error } = await supabase.from('saved_recipes').insert({
      user_id: user.id,
      recipe_name: recipe!.name,
      description: recipe!.description ?? null,
      prep_time_minutes: recipe!.prep_time_minutes ?? null,
      cook_time_minutes: recipe!.cook_time_minutes ?? null,
      servings: recipe!.servings ?? 1,
      calories_per_serving: recipe!.calories_per_serving ?? null,
      protein_per_serving_g: recipe!.protein_per_serving_g ?? null,
      carbs_per_serving_g: recipe!.carbs_per_serving_g ?? null,
      fat_per_serving_g: recipe!.fat_per_serving_g ?? null,
      fiber_per_serving_g: recipe!.fiber_per_serving_g ?? null,
      ingredients: recipe!.ingredients,
      instructions: recipe!.instructions,
      waste_reduction_tip: recipe!.waste_reduction_tip ?? null,
      is_favorite: false,
      generated_from_inventory: [],
    } as any);

    setIsSaving(false);

    if (!error) {
      Alert.alert('💾 Saved!', 'Recipe saved to your collection.');
    } else {
      Alert.alert('Error', 'Could not save recipe.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border.DEFAULT,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22, color: COLORS.text.secondary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.text.primary }} numberOfLines={1}>
          {recipe.name}
        </Text>
        <TouchableOpacity onPress={handleSaveRecipe} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={COLORS.primary.DEFAULT} size="small" />
          ) : (
            <Text style={{ fontSize: 20 }}>💾</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Title & meta */}
        <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.text.primary, marginBottom: 8 }}>
          {recipe.name}
        </Text>
        {recipe.description && (
          <Text style={{ fontSize: 15, color: COLORS.text.secondary, lineHeight: 22, marginBottom: 16 }}>
            {recipe.description}
          </Text>
        )}

        {/* Meta chips */}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {totalTime > 0 && (
            <View style={{ backgroundColor: COLORS.background.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: COLORS.text.secondary }}>⏱ {totalTime} min total</Text>
            </View>
          )}
          {recipe.prep_time_minutes !== undefined && (
            <View style={{ backgroundColor: COLORS.background.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: COLORS.text.secondary }}>🔪 {recipe.prep_time_minutes} min prep</Text>
            </View>
          )}
          {recipe.cook_time_minutes !== undefined && (
            <View style={{ backgroundColor: COLORS.background.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: COLORS.text.secondary }}>🔥 {recipe.cook_time_minutes} min cook</Text>
            </View>
          )}
          {recipe.servings && (
            <View style={{ backgroundColor: COLORS.background.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: COLORS.text.secondary }}>🍽 {recipe.servings} servings</Text>
            </View>
          )}
        </View>

        {/* Macro cards */}
        {recipe.calories_per_serving !== undefined && (
          <>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Per Serving
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Calories', value: recipe.calories_per_serving, unit: 'kcal', color: COLORS.macro.calories },
                { label: 'Protein', value: recipe.protein_per_serving_g, unit: 'g', color: COLORS.macro.protein },
                { label: 'Carbs', value: recipe.carbs_per_serving_g, unit: 'g', color: COLORS.macro.carbs },
                { label: 'Fat', value: recipe.fat_per_serving_g, unit: 'g', color: COLORS.macro.fat },
              ].map(({ label, value, unit, color }) => (
                value !== undefined && (
                  <View
                    key={label}
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.background.card,
                      borderRadius: 12,
                      padding: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: COLORS.border.DEFAULT,
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '800', color }}>{Math.round(value)}</Text>
                    <Text style={{ fontSize: 10, color: COLORS.text.muted, marginTop: 2 }}>{unit}</Text>
                    <Text style={{ fontSize: 11, color: COLORS.text.secondary, marginTop: 1 }}>{label}</Text>
                  </View>
                )
              ))}
            </View>
          </>
        )}

        {/* Ingredients */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
          Ingredients
        </Text>
        <View style={{ backgroundColor: COLORS.background.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border.DEFAULT }}>
          {recipe.ingredients.map((ing, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: idx < recipe!.ingredients.length - 1 ? 1 : 0,
                borderBottomColor: COLORS.border.DEFAULT,
                gap: 12,
              }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary.muted, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: COLORS.primary.light, fontWeight: '700' }}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: COLORS.text.primary, fontWeight: '600' }}>{ing.item}</Text>
                <Text style={{ fontSize: 12, color: COLORS.text.muted }}>{ing.amount}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
          Instructions
        </Text>
        <View style={{ gap: 12, marginBottom: 20 }}>
          {recipe.instructions.map((step, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                gap: 14,
                backgroundColor: COLORS.background.card,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: COLORS.border.DEFAULT,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.primary.DEFAULT,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>{idx + 1}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: COLORS.text.secondary, lineHeight: 22 }}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* Waste reduction tip */}
        {recipe.waste_reduction_tip && (
          <View
            style={{
              backgroundColor: COLORS.accent.greenMuted,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: COLORS.accent.green,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.accent.green, marginBottom: 6 }}>
              ♻️ Zero-Waste Tip
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.text.secondary, lineHeight: 20 }}>
              {recipe.waste_reduction_tip}
            </Text>
          </View>
        )}

        {/* Log to diary CTA */}
        <TouchableOpacity
          onPress={handleLogToDay}
          disabled={isLogging}
          style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 40 }}
        >
          <LinearGradient
            colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
          >
            {isLogging ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={{ fontSize: 18 }}>📋</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  Log to Today's Diary
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
