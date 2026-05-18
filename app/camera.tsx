import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/api/supabase';
import { useAuthStore, useDailyLogStore, useProfileStore } from '@/context/store';
import { COLORS, MEAL_TYPE_LABELS } from '@/constants';
import { MealType } from '@/types/database';
import { analyzeFood } from '@/api/analyzeFood';

const MEAL_OPTIONS: MealType[] = [
  'breakfast', 'morning_snack', 'lunch', 'afternoon_snack',
  'dinner', 'evening_snack', 'supplement',
];

export default function CameraScreen() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { addLog } = useDailyLogStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCameraReady, setIsCameraReady] = useState(Platform.OS === 'web');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [mode, setMode] = useState<'food' | 'fridge'>('food');

  const cameraRef = useRef<CameraView>(null);

  const handleCapture = useCallback(async () => {
    if (Platform.OS === 'web' || !cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: true,
        exif: false,
      });

      if (photo?.uri) {
        setCapturedImageUri(photo.uri);
        await runAnalysis(photo.uri, photo.base64 ?? null);
      }
    } catch (err) {
      Alert.alert('Capture Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, mode, profile]);

  const handlePickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCapturedImageUri(asset.uri);
      await runAnalysis(asset.uri, asset.base64 ?? null);
    }
  };

  const runAnalysis = async (uri: string, base64: string | null) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeFood({
        imageUri: uri,
        imageBase64: base64,
        mode,
        userId: user?.id ?? '',
        allergens: profile?.severe_allergens ?? [],
        dietaryRestrictions: profile?.dietary_restrictions ?? [],
      });

      setAnalysisResult(result);
    } catch (err: any) {
      Alert.alert('Analysis Error', err.message ?? 'Failed to analyze image. Please try again.');
      setCapturedImageUri(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogFood = async () => {
    if (!analysisResult || !user?.id) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_food_logs')
      .insert({
        user_id: user.id,
        log_date: today,
        logged_at: new Date().toISOString(),
        food_name: analysisResult.food_name,
        meal_type: selectedMealType,
        log_source: 'camera_ai',
        calories: analysisResult.calories,
        protein_g: analysisResult.protein_g,
        carbs_g: analysisResult.carbs_g,
        fat_g: analysisResult.fat_g,
        fiber_g: analysisResult.fiber_g ?? 0,
        sodium_mg: analysisResult.sodium_mg ?? 0,
        serving_description: analysisResult.serving_description,
        ai_identified_ingredients: analysisResult.ingredients,
        ai_allergen_flags: analysisResult.allergen_flags,
        ai_health_snippet: analysisResult.health_snippet,
        ai_confidence_score: analysisResult.confidence_score,
        image_url: capturedImageUri,
      } as any)
      .select()
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to log food. Please try again.');
      return;
    }

    if (data) addLog(data);

    Alert.alert(
      '✅ Logged!',
      `${analysisResult.food_name} added to your ${MEAL_TYPE_LABELS[selectedMealType]} log.`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  const handleRetake = () => {
    setCapturedImageUri(null);
    setAnalysisResult(null);
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>🌐</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text.primary, textAlign: 'center', marginBottom: 12 }}>
            Camera Not Available on Web
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            The camera feature is currently only available on the mobile app. Please use the image library to upload photos.
          </Text>
          <TouchableOpacity
            onPress={handlePickFromLibrary}
            style={{ borderRadius: 16, overflow: 'hidden', width: '100%' }}
          >
            <LinearGradient
              colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
              style={{ paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                Upload from Library
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.text.muted, fontSize: 15 }}>Go Back</Text>
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
          <Text style={{ fontSize: 48, marginBottom: 20 }}>📷</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text.primary, textAlign: 'center', marginBottom: 12 }}>
            Camera Access Required
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            NutriSense AI needs camera access to analyze your food and scan barcodes for instant nutritional data.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={{ borderRadius: 16, overflow: 'hidden', width: '100%' }}
          >
            <LinearGradient
              colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
              style={{ paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                Grant Camera Access
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.text.muted, fontSize: 15 }}>Not now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show analysis results
  if (capturedImageUri && (isAnalyzing || analysisResult)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, marginBottom: 16 }}>
            <TouchableOpacity onPress={handleRetake} style={{ marginRight: 12 }}>
              <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 16 }}>← Retake</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary, flex: 1 }}>
              {isAnalyzing ? 'Analyzing...' : 'Analysis Complete'}
            </Text>
          </View>

          {/* Captured image */}
          <Image
            source={{ uri: capturedImageUri }}
            style={{
              width: '100%',
              height: 240,
              resizeMode: 'cover',
            }}
          />

          {isAnalyzing ? (
            <View style={{ paddingVertical: 60, alignItems: 'center', gap: 16 }}>
              <ActivityIndicator color={COLORS.primary.DEFAULT} size="large" />
              <Text style={{ color: COLORS.text.secondary, fontSize: 15 }}>
                AI is analyzing your food...
              </Text>
              <Text style={{ color: COLORS.text.muted, fontSize: 13 }}>
                Identifying ingredients & calculating macros
              </Text>
            </View>
          ) : analysisResult ? (
            <View style={{ padding: 20 }}>
              {/* Allergen Warning */}
              {analysisResult.allergen_flags && analysisResult.allergen_flags.length > 0 && (
                <View
                  style={{
                    backgroundColor: COLORS.accent.pinkMuted,
                    borderWidth: 1,
                    borderColor: COLORS.accent.pink,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 16,
                    flexDirection: 'row',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.accent.pink, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
                      Allergen Alert
                    </Text>
                    <Text style={{ color: COLORS.text.secondary, fontSize: 13, lineHeight: 18 }}>
                      This food may contain: {analysisResult.allergen_flags.join(', ')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Food name & serving */}
              <View
                style={{
                  backgroundColor: COLORS.background.card,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border.DEFAULT,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 }}>
                  {analysisResult.food_name}
                </Text>
                {analysisResult.serving_description && (
                  <Text style={{ fontSize: 14, color: COLORS.text.muted, marginBottom: 12 }}>
                    {analysisResult.serving_description}
                  </Text>
                )}

                {/* Calorie highlight */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: COLORS.accent.pinkMuted,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 32, fontWeight: '700', color: COLORS.macro.calories }}>
                    {Math.round(analysisResult.calories)}
                  </Text>
                  <Text style={{ fontSize: 16, color: COLORS.text.secondary, marginLeft: 6 }}>
                    kcal
                  </Text>
                </View>

                {/* Macro grid */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { label: 'Protein', value: analysisResult.protein_g, color: COLORS.macro.protein, unit: 'g' },
                    { label: 'Carbs', value: analysisResult.carbs_g, color: COLORS.macro.carbs, unit: 'g' },
                    { label: 'Fat', value: analysisResult.fat_g, color: COLORS.macro.fat, unit: 'g' },
                    { label: 'Fiber', value: analysisResult.fiber_g ?? 0, color: COLORS.macro.fiber, unit: 'g' },
                  ].map((macro) => (
                    <View
                      key={macro.label}
                      style={{
                        flex: 1,
                        backgroundColor: `${macro.color}18`,
                        borderRadius: 10,
                        padding: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: macro.color }}>
                        {Math.round(macro.value)}{macro.unit}
                      </Text>
                      <Text style={{ fontSize: 11, color: COLORS.text.muted, marginTop: 2 }}>
                        {macro.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Identified Ingredients */}
              {analysisResult.ingredients && analysisResult.ingredients.length > 0 && (
                <View
                  style={{
                    backgroundColor: COLORS.background.card,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: COLORS.border.DEFAULT,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text.primary, marginBottom: 10 }}>
                    🔍 Identified Ingredients
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {analysisResult.ingredients.map((ing: string, idx: number) => (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: COLORS.primary.muted,
                          borderRadius: 20,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }}
                      >
                        <Text style={{ color: COLORS.primary.light, fontSize: 13, fontWeight: '500' }}>
                          {ing}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* AI Health Snippet */}
              {analysisResult.health_snippet && (
                <View
                  style={{
                    backgroundColor: COLORS.accent.greenMuted,
                    borderWidth: 1,
                    borderColor: COLORS.accent.green,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                    flexDirection: 'row',
                    gap: 10,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>💚</Text>
                  <Text style={{ flex: 1, color: COLORS.text.secondary, fontSize: 14, lineHeight: 20 }}>
                    {analysisResult.health_snippet}
                  </Text>
                </View>
              )}

              {/* Meal Type Picker */}
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
                  <Text style={{ color: COLORS.text.primary, fontSize: 15, fontWeight: '500' }}>
                    {MEAL_TYPE_LABELS[selectedMealType]}
                  </Text>
                  <Text style={{ color: COLORS.text.muted }}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Log Button */}
              <TouchableOpacity
                onPress={handleLogFood}
                style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 40 }}
              >
                <LinearGradient
                  colors={[COLORS.accent.green, '#00A882']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                    ✅ Log This Meal
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>

        {/* Meal Picker Modal */}
        <Modal visible={showMealPicker} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View
              style={{
                backgroundColor: COLORS.background.secondary,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary, marginBottom: 16 }}>
                Select Meal Type
              </Text>
              {MEAL_OPTIONS.map((meal) => (
                <TouchableOpacity
                  key={meal}
                  onPress={() => {
                    setSelectedMealType(meal);
                    setShowMealPicker(false);
                  }}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border.DEFAULT,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: COLORS.text.primary, fontSize: 16 }}>
                    {MEAL_TYPE_LABELS[meal]}
                  </Text>
                  {selectedMealType === meal && (
                    <Text style={{ color: COLORS.primary.DEFAULT, fontSize: 18 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setShowMealPicker(false)}
                style={{ paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
              >
                <Text style={{ color: COLORS.text.muted, fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Camera viewport
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        flash={flash}
      >
        {/* Top controls */}
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Mode toggle */}
              <TouchableOpacity
                onPress={() => setMode(mode === 'food' ? 'fridge' : 'food')}
                style={{
                  backgroundColor: mode === 'fridge' ? COLORS.primary.DEFAULT : 'rgba(0,0,0,0.5)',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                  {mode === 'food' ? '🍽️ Food' : '🧊 Fridge'}
                </Text>
              </TouchableOpacity>

              {/* Flash toggle */}
              <TouchableOpacity
                onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: flash === 'on' ? '#FFD740' : 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>{flash === 'on' ? '⚡' : '🔦'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mode label */}
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                {mode === 'food'
                  ? '📸 Point at your meal to analyze'
                  : '🧊 Scan your fridge or pantry shelf'}
              </Text>
            </View>
          </View>

          {/* Viewfinder overlay */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: 280,
                height: 280,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: 'rgba(108, 99, 255, 0.8)',
                backgroundColor: 'transparent',
              }}
            >
              {/* Corner accents */}
              {[
                { top: -2, left: -2 },
                { top: -2, right: -2 },
                { bottom: -2, left: -2 },
                { bottom: -2, right: -2 },
              ].map((pos, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    width: 24,
                    height: 24,
                    borderColor: COLORS.primary.DEFAULT,
                    borderTopWidth: i < 2 ? 3 : 0,
                    borderBottomWidth: i >= 2 ? 3 : 0,
                    borderLeftWidth: i % 2 === 0 ? 3 : 0,
                    borderRightWidth: i % 2 === 1 ? 3 : 0,
                    borderTopLeftRadius: i === 0 ? 8 : 0,
                    borderTopRightRadius: i === 1 ? 8 : 0,
                    borderBottomLeftRadius: i === 2 ? 8 : 0,
                    borderBottomRightRadius: i === 3 ? 8 : 0,
                    ...pos,
                  }}
                />
              ))}
            </View>
          </View>

          {/* Bottom controls */}
          <View
            style={{
              paddingBottom: 40,
              paddingHorizontal: 40,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Gallery button */}
            <TouchableOpacity
              onPress={handlePickFromLibrary}
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.15)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 24 }}>🖼️</Text>
            </TouchableOpacity>

            {/* Capture button */}
            <TouchableOpacity
              onPress={handleCapture}
              disabled={isCapturing}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isCapturing ? 'rgba(108,99,255,0.5)' : COLORS.primary.DEFAULT,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 4,
                borderColor: 'rgba(255,255,255,0.3)',
                shadowColor: COLORS.primary.DEFAULT,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              {isCapturing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
            </TouchableOpacity>

            {/* Flip camera */}
            <TouchableOpacity
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.15)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 24 }}>🔄</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
