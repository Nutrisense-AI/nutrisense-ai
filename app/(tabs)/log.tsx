import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFridgeStore, useAuthStore } from '@/context/store';
import { COLORS } from '@/constants';
import { generateRecipes } from '@/api/generateRecipes';

interface Recipe {
  name: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  calories_per_serving: number;
  ingredients: Array<{ item: string; amount: string }>;
  instructions: string[];
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  waste_reduction_tip: string;
}

export default function LogScreen() {
  const { user } = useAuthStore();
  const { items } = useFridgeStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  const activeItems = items.filter(
    (i) => !i.is_consumed && !i.is_deleted
  );

  const handleGenerateRecipes = async () => {
    if (activeItems.length === 0) {
      Alert.alert(
        'Empty Fridge',
        'Add items to your fridge inventory first by scanning with the camera.'
      );
      return;
    }

    setIsGenerating(true);
    setRecipes([]);

    try {
      const result = await generateRecipes({
        inventoryItems: activeItems.map((i) => ({
          name: i.item_name,
          quantity: i.quantity,
          unit: i.unit,
          expiry_status: i.expiry_status,
        })),
        userId: user?.id ?? '',
      });

      setRecipes(result);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to generate recipes. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const difficultyColor = (minutes: number) => {
    if (minutes <= 20) return COLORS.accent.green;
    if (minutes <= 40) return COLORS.accent.yellow;
    return COLORS.accent.orange;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.text.primary }}>
            🍳 Recipe Generator
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.text.muted, marginTop: 4 }}>
            Zero-waste recipes from your fridge inventory
          </Text>
        </View>

        {/* Inventory summary */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 12,
            backgroundColor: COLORS.background.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border.DEFAULT,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text.secondary, marginBottom: 10 }}>
            Current Inventory ({activeItems.length} items)
          </Text>

          {activeItems.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🧊</Text>
              <Text style={{ color: COLORS.text.muted, fontSize: 14, textAlign: 'center' }}>
                Your fridge is empty. Scan ingredients to get started.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/camera')}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: COLORS.primary.DEFAULT, fontWeight: '600', fontSize: 14 }}>
                  📷 Scan Fridge →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {activeItems.slice(0, 12).map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: COLORS.background.elevated,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: COLORS.border.DEFAULT,
                  }}
                >
                  <Text style={{ color: COLORS.text.primary, fontSize: 13, fontWeight: '500' }}>
                    {item.item_name}
                  </Text>
                </View>
              ))}
              {activeItems.length > 12 && (
                <View
                  style={{
                    backgroundColor: COLORS.primary.muted,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: COLORS.primary.light, fontSize: 13, fontWeight: '600' }}>
                    +{activeItems.length - 12} more
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Generate button */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <TouchableOpacity
            onPress={handleGenerateRecipes}
            disabled={isGenerating || activeItems.length === 0}
            style={{ borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={
                activeItems.length === 0
                  ? [COLORS.background.elevated, COLORS.background.elevated]
                  : [COLORS.primary.DEFAULT, COLORS.primary.dark]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                    Generating Recipes...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 20 }}>✨</Text>
                  <Text
                    style={{
                      color: activeItems.length === 0 ? COLORS.text.muted : '#FFFFFF',
                      fontSize: 16,
                      fontWeight: '700',
                    }}
                  >
                    Generate 3 Zero-Waste Recipes
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recipes */}
        {recipes.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary, marginBottom: 16 }}>
              🍽️ Your Recipes
            </Text>

            {recipes.map((recipe, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: COLORS.background.card,
                  borderRadius: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border.DEFAULT,
                  overflow: 'hidden',
                }}
              >
                {/* Recipe header */}
                <TouchableOpacity
                  onPress={() =>
                    setExpandedRecipe(expandedRecipe === index ? null : index)
                  }
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[
                      index === 0
                        ? COLORS.primary.muted
                        : index === 1
                        ? COLORS.accent.greenMuted
                        : COLORS.accent.orangeMuted,
                      'transparent',
                    ]}
                    style={{ padding: 16 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <View
                            style={{
                              backgroundColor: COLORS.primary.DEFAULT,
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                              RECIPE {index + 1}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 }}>
                          {recipe.name}
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.text.secondary, lineHeight: 18 }}>
                          {recipe.description}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 18, color: COLORS.text.muted }}>
                        {expandedRecipe === index ? '▲' : '▼'}
                      </Text>
                    </View>

                    {/* Quick stats */}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12 }}>⏱️</Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: difficultyColor(
                              recipe.prep_time_minutes + recipe.cook_time_minutes
                            ),
                            fontWeight: '600',
                          }}
                        >
                          {recipe.prep_time_minutes + recipe.cook_time_minutes} min
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12 }}>👥</Text>
                        <Text style={{ fontSize: 12, color: COLORS.text.muted }}>
                          {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12 }}>🔥</Text>
                        <Text style={{ fontSize: 12, color: COLORS.macro.calories, fontWeight: '600' }}>
                          {recipe.calories_per_serving} kcal
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Expanded content */}
                {expandedRecipe === index && (
                  <View style={{ padding: 16 }}>
                    {/* Macros */}
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 8,
                        marginBottom: 16,
                      }}
                    >
                      {[
                        { label: 'Protein', value: recipe.macros.protein_g, color: COLORS.macro.protein },
                        { label: 'Carbs', value: recipe.macros.carbs_g, color: COLORS.macro.carbs },
                        { label: 'Fat', value: recipe.macros.fat_g, color: COLORS.macro.fat },
                        { label: 'Fiber', value: recipe.macros.fiber_g, color: COLORS.macro.fiber },
                      ].map((m) => (
                        <View
                          key={m.label}
                          style={{
                            flex: 1,
                            backgroundColor: `${m.color}18`,
                            borderRadius: 10,
                            padding: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '700', color: m.color }}>
                            {m.value}g
                          </Text>
                          <Text style={{ fontSize: 10, color: COLORS.text.muted, marginTop: 2 }}>
                            {m.label}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Ingredients */}
                    <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text.primary, marginBottom: 10 }}>
                      🛒 Ingredients
                    </Text>
                    {recipe.ingredients.map((ing, i) => (
                      <View
                        key={i}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          paddingVertical: 7,
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.border.DEFAULT,
                        }}
                      >
                        <Text style={{ color: COLORS.text.primary, fontSize: 14 }}>
                          {ing.item}
                        </Text>
                        <Text style={{ color: COLORS.text.muted, fontSize: 14 }}>
                          {ing.amount}
                        </Text>
                      </View>
                    ))}

                    {/* Instructions */}
                    <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text.primary, marginTop: 16, marginBottom: 10 }}>
                      📋 Instructions
                    </Text>
                    {recipe.instructions.map((step, i) => (
                      <View
                        key={i}
                        style={{
                          flexDirection: 'row',
                          gap: 12,
                          marginBottom: 10,
                          alignItems: 'flex-start',
                        }}
                      >
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: COLORS.primary.muted,
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 12, fontWeight: '700' }}>
                            {i + 1}
                          </Text>
                        </View>
                        <Text style={{ flex: 1, color: COLORS.text.secondary, fontSize: 14, lineHeight: 20 }}>
                          {step}
                        </Text>
                      </View>
                    ))}

                    {/* Waste reduction tip */}
                    <View
                      style={{
                        backgroundColor: COLORS.accent.greenMuted,
                        borderWidth: 1,
                        borderColor: COLORS.accent.green,
                        borderRadius: 12,
                        padding: 12,
                        marginTop: 12,
                        flexDirection: 'row',
                        gap: 8,
                        alignItems: 'flex-start',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>♻️</Text>
                      <Text style={{ flex: 1, color: COLORS.text.secondary, fontSize: 13, lineHeight: 18 }}>
                        <Text style={{ fontWeight: '700', color: COLORS.accent.green }}>
                          Zero-Waste Tip:{' '}
                        </Text>
                        {recipe.waste_reduction_tip}
                      </Text>
                    </View>

                    {/* View Full Recipe button */}
                    <TouchableOpacity
                      onPress={() => {
                        // Normalise shape to what recipe-detail expects
                        const detailPayload = {
                          name: recipe.name,
                          description: recipe.description,
                          prep_time_minutes: recipe.prep_time_minutes,
                          cook_time_minutes: recipe.cook_time_minutes,
                          servings: recipe.servings,
                          calories_per_serving: recipe.calories_per_serving,
                          protein_per_serving_g: recipe.macros.protein_g,
                          carbs_per_serving_g: recipe.macros.carbs_g,
                          fat_per_serving_g: recipe.macros.fat_g,
                          fiber_per_serving_g: recipe.macros.fiber_g,
                          ingredients: recipe.ingredients,
                          instructions: recipe.instructions,
                          waste_reduction_tip: recipe.waste_reduction_tip,
                        };
                        router.push({
                          pathname: '/recipe-detail',
                          params: { recipeJson: encodeURIComponent(JSON.stringify(detailPayload)) },
                        });
                      }}
                      style={{ marginTop: 14, borderRadius: 12, overflow: 'hidden' }}
                    >
                      <LinearGradient
                        colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ paddingVertical: 12, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                          📄 View Full Recipe
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
