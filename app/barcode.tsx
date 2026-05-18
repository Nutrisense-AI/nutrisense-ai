import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/api/supabase';
import { useAuthStore, useDailyLogStore } from '@/context/store';
import { COLORS, MEAL_TYPE_LABELS, OPEN_FOOD_FACTS_BASE_URL } from '@/constants';
import { MealType } from '@/types/database';

const MEAL_OPTIONS: MealType[] = [
  'breakfast', 'morning_snack', 'lunch', 'afternoon_snack',
  'dinner', 'evening_snack', 'supplement',
];

interface FoodProduct {
  product_name: string;
  brands: string;
  serving_size: string;
  nutriments: {
    'energy-kcal_serving': number;
    'energy-kcal_100g': number;
    proteins_serving: number;
    proteins_100g: number;
    carbohydrates_serving: number;
    carbohydrates_100g: number;
    fat_serving: number;
    fat_100g: number;
    fiber_serving: number;
    fiber_100g: number;
    sodium_serving: number;
    sodium_100g: number;
    sugars_serving: number;
    sugars_100g: number;
    'saturated-fat_serving': number;
    'saturated-fat_100g': number;
  };
  allergens_tags: string[];
  ingredients_text: string;
  image_url: string;
}

export default function BarcodeScannerScreen() {
  const { user } = useAuthStore();
  const { addLog } = useDailyLogStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [scanEnabled, setScanEnabled] = useState(true);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (!scanEnabled || isLookingUp) return;

      setScanEnabled(false);
      setScannedBarcode(result.data);
      setIsLookingUp(true);

      try {
        const response = await fetch(
          `${OPEN_FOOD_FACTS_BASE_URL}/product/${result.data}?fields=product_name,brands,serving_size,nutriments,allergens_tags,ingredients_text,image_url`,
          {
            headers: {
              'User-Agent': 'NutriSenseAI/1.0.0 (contact@nutrisenseai.com)',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Network error');
        }

        const data = await response.json();

        if (data.status === 1 && data.product) {
          setProduct(data.product);
        } else {
          Alert.alert(
            'Product Not Found',
            `No nutritional data found for barcode ${result.data}. Try scanning again or enter manually.`,
            [{ text: 'OK', onPress: () => setScanEnabled(true) }]
          );
        }
      } catch (err) {
        Alert.alert(
          'Lookup Failed',
          'Could not fetch product data. Check your internet connection.',
          [{ text: 'Retry', onPress: () => setScanEnabled(true) }]
        );
      } finally {
        setIsLookingUp(false);
      }
    },
    [scanEnabled, isLookingUp]
  );

  const handleLogProduct = async () => {
    if (!product || !user?.id) return;

    const n = product.nutriments;
    const today = new Date().toISOString().split('T')[0];

    // Prefer per-serving values, fall back to per-100g
    const calories = n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? 0;
    const protein = n.proteins_serving ?? n.proteins_100g ?? 0;
    const carbs = n.carbohydrates_serving ?? n.carbohydrates_100g ?? 0;
    const fat = n.fat_serving ?? n.fat_100g ?? 0;
    const fiber = n.fiber_serving ?? n.fiber_100g ?? 0;
    const sodium = (n.sodium_serving ?? n.sodium_100g ?? 0) * 1000; // convert g to mg
    const sugar = n.sugars_serving ?? n.sugars_100g ?? 0;
    const saturatedFat = n['saturated-fat_serving'] ?? n['saturated-fat_100g'] ?? 0;

    const { data, error } = await supabase
      .from('daily_food_logs')
      .insert({
        user_id: user.id,
        log_date: today,
        logged_at: new Date().toISOString(),
        food_name: product.product_name || 'Unknown Product',
        brand_name: product.brands || null,
        barcode_upc: scannedBarcode,
        meal_type: selectedMealType,
        log_source: 'barcode_scan',
        serving_description: product.serving_size || null,
        calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        fiber_g: fiber,
        sodium_mg: sodium,
        sugar_g: sugar,
        saturated_fat_g: saturatedFat,
        image_url: product.image_url || null,
      } as any)
      .select()
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to log product. Please try again.');
      return;
    }

    if (data) addLog(data);

    Alert.alert(
      '✅ Logged!',
      `${product.product_name} added to your ${MEAL_TYPE_LABELS[selectedMealType]} log.`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  const handleRescan = () => {
    setScannedBarcode(null);
    setProduct(null);
    setScanEnabled(true);
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>🚫</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text.primary, textAlign: 'center', marginBottom: 12 }}>
            Barcode Scanning Not Supported on Web
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Please use the mobile app for barcode scanning functionality.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ borderRadius: 16, overflow: 'hidden', width: '100%' }}>
            <LinearGradient colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]} style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary.DEFAULT} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>📊</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text.primary, textAlign: 'center', marginBottom: 12 }}>
            Camera Access Required
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Camera access is needed to scan product barcodes.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={{ borderRadius: 16, overflow: 'hidden', width: '100%' }}>
            <LinearGradient colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]} style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>Grant Camera Access</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show product result
  if (product) {
    const n = product.nutriments;
    const calories = n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? 0;
    const protein = n.proteins_serving ?? n.proteins_100g ?? 0;
    const carbs = n.carbohydrates_serving ?? n.carbohydrates_100g ?? 0;
    const fat = n.fat_serving ?? n.fat_100g ?? 0;
    const fiber = n.fiber_serving ?? n.fiber_100g ?? 0;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, marginBottom: 20 }}>
            <TouchableOpacity onPress={handleRescan} style={{ marginRight: 12 }}>
              <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 16 }}>← Rescan</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary }}>
              Product Found
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {/* Product info card */}
            <View
              style={{
                backgroundColor: COLORS.background.card,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.border.DEFAULT,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: COLORS.background.elevated,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 28 }}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 }}>
                    {product.product_name || 'Unknown Product'}
                  </Text>
                  {product.brands && (
                    <Text style={{ fontSize: 13, color: COLORS.text.muted }}>
                      {product.brands}
                    </Text>
                  )}
                  {product.serving_size && (
                    <Text style={{ fontSize: 13, color: COLORS.text.muted }}>
                      Serving: {product.serving_size}
                    </Text>
                  )}
                </View>
              </View>

              {/* Barcode */}
              <View
                style={{
                  backgroundColor: COLORS.background.elevated,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  alignSelf: 'flex-start',
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: COLORS.text.muted, fontSize: 11, fontFamily: 'Courier' }}>
                  UPC: {scannedBarcode}
                </Text>
              </View>

              {/* Calorie highlight */}
              <View
                style={{
                  backgroundColor: COLORS.accent.pinkMuted,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.macro.calories }}>
                  {Math.round(calories)}
                </Text>
                <Text style={{ fontSize: 16, color: COLORS.text.secondary }}>kcal per serving</Text>
              </View>

              {/* Macro grid */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { label: 'Protein', value: protein, color: COLORS.macro.protein },
                  { label: 'Carbs', value: carbs, color: COLORS.macro.carbs },
                  { label: 'Fat', value: fat, color: COLORS.macro.fat },
                  { label: 'Fiber', value: fiber, color: COLORS.macro.fiber },
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
                    <Text style={{ fontSize: 15, fontWeight: '700', color: m.color }}>
                      {Math.round(m.value)}g
                    </Text>
                    <Text style={{ fontSize: 10, color: COLORS.text.muted, marginTop: 2 }}>
                      {m.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Allergens */}
            {product.allergens_tags && product.allergens_tags.length > 0 && (
              <View
                style={{
                  backgroundColor: COLORS.accent.pinkMuted,
                  borderWidth: 1,
                  borderColor: COLORS.accent.pink,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: COLORS.accent.pink, fontWeight: '700', fontSize: 14, marginBottom: 6 }}>
                  ⚠️ Contains Allergens
                </Text>
                <Text style={{ color: COLORS.text.secondary, fontSize: 13 }}>
                  {product.allergens_tags
                    .map((t) => t.replace('en:', '').replace(/-/g, ' '))
                    .join(', ')}
                </Text>
              </View>
            )}

            {/* Meal type picker */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text.secondary, marginBottom: 8 }}>
                Log as:
              </Text>
              <TouchableOpacity
                onPress={() => setShowMealPicker(true)}
                style={{
                  backgroundColor: COLORS.background.elevated,
                  borderWidth: 1,
                  borderColor: COLORS.border.light,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.text.primary, fontSize: 15 }}>
                  {MEAL_TYPE_LABELS[selectedMealType]}
                </Text>
                <Text style={{ color: COLORS.text.muted }}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Log button */}
            <TouchableOpacity
              onPress={handleLogProduct}
              style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 40 }}
            >
              <LinearGradient
                colors={[COLORS.accent.green, '#00A882']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                  ✅ Log This Product
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Meal Picker Modal */}
        <Modal visible={showMealPicker} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View style={{ backgroundColor: COLORS.background.secondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary, marginBottom: 16 }}>
                Select Meal Type
              </Text>
              {MEAL_OPTIONS.map((meal) => (
                <TouchableOpacity
                  key={meal}
                  onPress={() => { setSelectedMealType(meal); setShowMealPicker(false); }}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border.DEFAULT, flexDirection: 'row', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: COLORS.text.primary, fontSize: 16 }}>{MEAL_TYPE_LABELS[meal]}</Text>
                  {selectedMealType === meal && <Text style={{ color: COLORS.primary.DEFAULT }}>✓</Text>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowMealPicker(false)} style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: COLORS.text.muted, fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Barcode scanner viewport
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        flash={flash ? 'on' : 'off'}
        barcodeScannerSettings={{
          barcodeTypes: [
            'upc_a', 'upc_e', 'ean13', 'ean8',
            'code39', 'code93', 'code128', 'qr',
            'pdf417', 'aztec', 'datamatrix',
          ],
        }}
        onBarcodeScanned={scanEnabled ? handleBarcodeScanned : undefined}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Top bar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>

            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                📊 Barcode Scanner
              </Text>
            </View>

            {/* Flash toggle */}
            <TouchableOpacity
              onPress={() => setFlash(!flash)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: flash ? '#FFD740' : 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>⚡</Text>
            </TouchableOpacity>
          </View>

          {/* Scanning frame */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {isLookingUp ? (
              <View style={{ alignItems: 'center', gap: 16 }}>
                <ActivityIndicator color={COLORS.primary.DEFAULT} size="large" />
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                  Looking up product...
                </Text>
              </View>
            ) : (
              <View>
                {/* Barcode target frame */}
                <View
                  style={{
                    width: 300,
                    height: 160,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: 'rgba(108, 99, 255, 0.9)',
                    backgroundColor: 'transparent',
                    overflow: 'hidden',
                  }}
                >
                  {/* Scanning line animation placeholder */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '50%',
                      height: 2,
                      backgroundColor: 'rgba(108, 99, 255, 0.8)',
                    }}
                  />
                  {/* Corner accents */}
                  {[
                    { top: -1, left: -1 },
                    { top: -1, right: -1 },
                    { bottom: -1, left: -1 },
                    { bottom: -1, right: -1 },
                  ].map((pos, i) => (
                    <View
                      key={i}
                      style={{
                        position: 'absolute',
                        width: 20,
                        height: 20,
                        borderColor: COLORS.primary.DEFAULT,
                        borderTopWidth: i < 2 ? 3 : 0,
                        borderBottomWidth: i >= 2 ? 3 : 0,
                        borderLeftWidth: i % 2 === 0 ? 3 : 0,
                        borderRightWidth: i % 2 === 1 ? 3 : 0,
                        ...pos,
                      }}
                    />
                  ))}
                </View>

                <Text
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 14,
                    textAlign: 'center',
                    marginTop: 20,
                    fontWeight: '500',
                  }}
                >
                  Align barcode within the frame
                </Text>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 12,
                    textAlign: 'center',
                    marginTop: 6,
                  }}
                >
                  Supports UPC-A, UPC-E, EAN-13, EAN-8
                </Text>
              </View>
            )}
          </View>

          {/* Bottom info */}
          <View style={{ paddingBottom: 40, alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' }}>
                Powered by Open Food Facts — 100% free database
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
