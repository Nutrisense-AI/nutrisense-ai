/**
 * NutriSense AI — Food Detail Modal
 * Displays the full nutritional breakdown for a logged food item.
 * Accessible via router.push('/food-detail', { params: { logId } })
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/api/supabase';
import { DailyFoodLog } from '@/types/database';
import { COLORS, MEAL_TYPE_LABELS, MEAL_TYPE_ICONS, ALLERGEN_LABELS } from '@/constants';
import { useDailyLogStore } from '@/context/store';

// ============================================================
// Nutrient Row
// ============================================================
function NutrientRow({
  label,
  value,
  unit,
  color,
  highlight,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
  color?: string;
  highlight?: boolean;
}) {
  if (value === null || value === undefined) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.DEFAULT,
        backgroundColor: highlight ? 'rgba(108,99,255,0.05)' : 'transparent',
        paddingHorizontal: highlight ? 8 : 0,
        borderRadius: highlight ? 8 : 0,
      }}
    >
      <Text style={{ fontSize: 14, color: COLORS.text.secondary }}>{label}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: color ?? COLORS.text.primary,
        }}
      >
        {typeof value === 'number' ? value.toFixed(value < 10 ? 1 : 0) : value} {unit}
      </Text>
    </View>
  );
}

// ============================================================
// Section Header
// ============================================================
function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 20,
        marginBottom: 8,
      }}
    >
      {title}
    </Text>
  );
}

// ============================================================
// Main Screen
// ============================================================
export default function FoodDetailScreen() {
  const { logId } = useLocalSearchParams<{ logId: string }>();
  const { removeLog } = useDailyLogStore();
  const [log, setLog] = useState<DailyFoodLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!logId) {
      router.back();
      return;
    }
    fetchLog();
  }, [logId]);

  const fetchLog = async () => {
    const { data, error } = await supabase
      .from('daily_food_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (data) setLog(data);
    setIsLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Food',
      `Remove "${log?.food_name}" from your log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('daily_food_logs')
              .update({ is_deleted: true } as any)
              .eq('id', logId);
            removeLog(logId!);
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary.DEFAULT} size="large" />
      </View>
    );
  }

  if (!log) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.text.muted }}>Food item not found.</Text>
      </View>
    );
  }

  const mealIcon = MEAL_TYPE_ICONS[log.meal_type] ?? '🍽️';
  const mealLabel = MEAL_TYPE_LABELS[log.meal_type] ?? log.meal_type;

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
          {log.food_name}
        </Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={{ fontSize: 20 }}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Food image */}
        {log.image_url && (
          <Image
            source={{ uri: log.image_url }}
            style={{ width: '100%', height: 200, borderRadius: 16, marginBottom: 20 }}
            resizeMode="cover"
          />
        )}

        {/* Identity card */}
        <View
          style={{
            backgroundColor: COLORS.background.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 4,
            borderWidth: 1,
            borderColor: COLORS.border.DEFAULT,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4 }}>
            {log.food_name}
          </Text>
          {log.brand_name && (
            <Text style={{ fontSize: 14, color: COLORS.text.muted, marginBottom: 8 }}>
              {log.brand_name}
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: COLORS.background.elevated, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>{mealIcon} {mealLabel}</Text>
            </View>
            {log.serving_description && (
              <View style={{ backgroundColor: COLORS.background.elevated, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>
                  {log.quantity}× {log.serving_description}
                </Text>
              </View>
            )}
            <View style={{ backgroundColor: COLORS.background.elevated, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>
                {log.log_source?.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Core macros */}
        <SectionHeader title="Core Macronutrients" />
        <View style={{ backgroundColor: COLORS.background.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border.DEFAULT }}>
          <NutrientRow label="Calories" value={log.calories} unit="kcal" color={COLORS.macro.calories} highlight />
          <NutrientRow label="Protein" value={log.protein_g} unit="g" color={COLORS.macro.protein} />
          <NutrientRow label="Carbohydrates" value={log.carbs_g} unit="g" color={COLORS.macro.carbs} />
          <NutrientRow label="  — of which Sugars" value={log.sugar_g} unit="g" />
          <NutrientRow label="  — of which Fiber" value={log.fiber_g} unit="g" color={COLORS.macro.fiber} />
          <NutrientRow label="Total Fat" value={log.fat_g} unit="g" color={COLORS.macro.fat} />
          <NutrientRow label="  — Saturated Fat" value={log.saturated_fat_g} unit="g" />
          <NutrientRow label="  — Trans Fat" value={log.trans_fat_g} unit="g" />
          <NutrientRow label="  — Polyunsaturated" value={log.polyunsaturated_fat_g} unit="g" />
          <NutrientRow label="  — Monounsaturated" value={log.monounsaturated_fat_g} unit="g" />
          <NutrientRow label="Cholesterol" value={log.cholesterol_mg} unit="mg" />
        </View>

        {/* Minerals */}
        <SectionHeader title="Minerals" />
        <View style={{ backgroundColor: COLORS.background.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border.DEFAULT }}>
          <NutrientRow label="Sodium" value={log.sodium_mg} unit="mg" />
          <NutrientRow label="Potassium" value={log.potassium_mg} unit="mg" />
          <NutrientRow label="Calcium" value={log.calcium_mg} unit="mg" />
          <NutrientRow label="Iron" value={log.iron_mg} unit="mg" />
          <NutrientRow label="Magnesium" value={log.magnesium_mg} unit="mg" />
          <NutrientRow label="Phosphorus" value={log.phosphorus_mg} unit="mg" />
          <NutrientRow label="Zinc" value={log.zinc_mg} unit="mg" />
        </View>

        {/* Vitamins */}
        <SectionHeader title="Vitamins" />
        <View style={{ backgroundColor: COLORS.background.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border.DEFAULT }}>
          <NutrientRow label="Vitamin A" value={log.vitamin_a_mcg} unit="mcg" />
          <NutrientRow label="Vitamin C" value={log.vitamin_c_mg} unit="mg" />
          <NutrientRow label="Vitamin D" value={log.vitamin_d_mcg} unit="mcg" />
          <NutrientRow label="Vitamin E" value={log.vitamin_e_mg} unit="mg" />
          <NutrientRow label="Vitamin K" value={log.vitamin_k_mcg} unit="mcg" />
          <NutrientRow label="Vitamin B12" value={log.vitamin_b12_mcg} unit="mcg" />
          <NutrientRow label="Folate" value={log.folate_mcg} unit="mcg" />
        </View>

        {/* AI Analysis */}
        {(log.ai_health_snippet || (log.ai_identified_ingredients && log.ai_identified_ingredients.length > 0)) && (
          <>
            <SectionHeader title="AI Analysis" />
            <View style={{ backgroundColor: COLORS.primary.muted, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.primary.DEFAULT }}>
              {log.ai_health_snippet && (
                <Text style={{ fontSize: 14, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 12 }}>
                  🤖 {log.ai_health_snippet}
                </Text>
              )}
              {log.ai_confidence_score !== null && log.ai_confidence_score !== undefined && (
                <Text style={{ fontSize: 12, color: COLORS.text.muted }}>
                  Confidence: {Math.round(log.ai_confidence_score * 100)}%
                </Text>
              )}
              {log.ai_identified_ingredients && log.ai_identified_ingredients.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, color: COLORS.text.muted, marginBottom: 6 }}>Identified Ingredients:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {log.ai_identified_ingredients.map((ing) => (
                      <View key={ing} style={{ backgroundColor: COLORS.background.elevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* Allergen flags */}
        {log.ai_allergen_flags && log.ai_allergen_flags.length > 0 && (
          <>
            <SectionHeader title="Allergen Warnings" />
            <View style={{ backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.status.error }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {log.ai_allergen_flags.map((allergen) => (
                  <View key={allergen} style={{ backgroundColor: 'rgba(255,107,107,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ fontSize: 13, color: COLORS.status.error, fontWeight: '600' }}>
                      ⚠️ {ALLERGEN_LABELS[allergen as keyof typeof ALLERGEN_LABELS] ?? allergen}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Notes */}
        {log.notes && (
          <>
            <SectionHeader title="Notes" />
            <View style={{ backgroundColor: COLORS.background.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border.DEFAULT }}>
              <Text style={{ fontSize: 14, color: COLORS.text.secondary, lineHeight: 20 }}>{log.notes}</Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
