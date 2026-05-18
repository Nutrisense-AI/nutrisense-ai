import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/api/supabase';
import { useAuthStore, useDailyLogStore, useProfileStore } from '@/context/store';
import { CircularProgress } from '@/components/CircularProgress';
import { MacroBar } from '@/components/MacroBar';
import { FoodLogItem } from '@/components/FoodLogItem';
import { COLORS, MEAL_TYPE_LABELS } from '@/constants';
import { DailyFoodLog, MealType } from '@/types/database';

const MEAL_ORDER: MealType[] = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'evening_snack',
  'supplement',
  'water',
];

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const {
    logs,
    totals,
    selectedDate,
    isLoading,
    isSmartCopying,
    setLogs,
    setTotals,
    setLoading,
    setSmartCopying,
  } = useDailyLogStore();

  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  const fetchDailyData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const [logsResult, totalsResult] = await Promise.all([
      supabase
        .from('daily_food_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', selectedDate)
        .eq('is_deleted', false)
        .order('logged_at', { ascending: true }),
      supabase.rpc('get_daily_totals', {
        p_user_id: user.id,
        p_date: selectedDate,
      } as any),
    ]);

    if (logsResult.data) setLogs(logsResult.data);
    if (totalsResult.data && totalsResult.data.length > 0) {
      setTotals(totalsResult.data[0]);
    } else {
      setTotals({
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        total_fiber_g: 0,
        total_sodium_mg: 0,
        total_sugar_g: 0,
        log_count: 0,
      });
    }

    setLoading(false);
  }, [user?.id, selectedDate]);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDailyData();
    setRefreshing(false);
  };

  const handleSmartCopy = async () => {
    if (!user?.id) return;

    Alert.alert(
      '⚡ Smart Copy',
      "Copy yesterday's complete food log into today's timeline?",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy Now',
          onPress: async () => {
            setSmartCopying(true);
            const { data, error } = await supabase.rpc('smart_copy_yesterday_log', {
              p_user_id: user.id,
            } as any);
            setSmartCopying(false);

            if (error) {
              Alert.alert('Error', 'Failed to copy yesterday\'s log. Please try again.');
            } else if (data === 0) {
              Alert.alert(
                'Nothing to Copy',
                "Yesterday's food log is empty. Start logging today's meals!"
              );
            } else {
              Alert.alert(
                '✅ Copied!',
                `${data} food item${data !== 1 ? 's' : ''} copied from yesterday.`
              );
              fetchDailyData();
            }
          },
        },
      ]
    );
  };

  const calorieGoal = profile?.daily_calorie_goal ?? 2000;
  const proteinGoal = profile?.daily_protein_goal_g ?? 150;
  const carbsGoal = profile?.daily_carbs_goal_g ?? 200;
  const fatGoal = profile?.daily_fat_goal_g ?? 65;
  const fiberGoal = profile?.daily_fiber_goal_g ?? 25;

  const currentCalories = totals?.total_calories ?? 0;
  const currentProtein = totals?.total_protein_g ?? 0;
  const currentCarbs = totals?.total_carbs_g ?? 0;
  const currentFat = totals?.total_fat_g ?? 0;
  const currentFiber = totals?.total_fiber_g ?? 0;

  const calorieProgress = calorieGoal > 0 ? currentCalories / calorieGoal : 0;
  const remainingCalories = Math.max(calorieGoal - currentCalories, 0);

  // Group logs by meal type
  const logsByMeal: Record<string, DailyFoodLog[]> = {};
  logs.forEach((log) => {
    if (!logsByMeal[log.meal_type]) {
      logsByMeal[log.meal_type] = [];
    }
    logsByMeal[log.meal_type].push(log);
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary.DEFAULT}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 14, color: COLORS.text.muted, fontWeight: '500' }}>
                {greeting()},
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: COLORS.text.primary,
                  letterSpacing: -0.5,
                }}
              >
                {profile?.display_name?.split(' ')[0] ?? 'there'} 👋
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: COLORS.background.elevated,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border.DEFAULT,
              }}
            >
              <Text style={{ fontSize: 20 }}>👤</Text>
            </TouchableOpacity>
          </View>

          {/* Date */}
          <Text style={{ fontSize: 13, color: COLORS.text.muted, marginTop: 4 }}>
            {isToday
              ? 'Today — ' + new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Main Calorie Ring */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            backgroundColor: COLORS.background.card,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: COLORS.border.DEFAULT,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Calorie Ring */}
            <CircularProgress
              size={140}
              strokeWidth={12}
              progress={calorieProgress}
              color={COLORS.macro.calories}
              gradientEnd={COLORS.primary.DEFAULT}
              gradientId="calorieGrad"
              value={Math.round(currentCalories).toString()}
              unit="kcal"
              label="consumed"
              sublabel={`${Math.round(remainingCalories)} remaining`}
            />

            {/* Macro mini rings */}
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <CircularProgress
                  size={64}
                  strokeWidth={6}
                  progress={proteinGoal > 0 ? currentProtein / proteinGoal : 0}
                  color={COLORS.macro.protein}
                  gradientId="protGrad"
                  value={Math.round(currentProtein).toString()}
                  unit="g"
                  label="Protein"
                />
                <CircularProgress
                  size={64}
                  strokeWidth={6}
                  progress={carbsGoal > 0 ? currentCarbs / carbsGoal : 0}
                  color={COLORS.macro.carbs}
                  gradientId="carbGrad"
                  value={Math.round(currentCarbs).toString()}
                  unit="g"
                  label="Carbs"
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <CircularProgress
                  size={64}
                  strokeWidth={6}
                  progress={fatGoal > 0 ? currentFat / fatGoal : 0}
                  color={COLORS.macro.fat}
                  gradientId="fatGrad"
                  value={Math.round(currentFat).toString()}
                  unit="g"
                  label="Fat"
                />
                <CircularProgress
                  size={64}
                  strokeWidth={6}
                  progress={fiberGoal > 0 ? currentFiber / fiberGoal : 0}
                  color={COLORS.macro.fiber}
                  gradientId="fiberGrad"
                  value={Math.round(currentFiber).toString()}
                  unit="g"
                  label="Fiber"
                />
              </View>
            </View>
          </View>

          {/* Macro bars */}
          <View style={{ marginTop: 20 }}>
            <MacroBar
              label="Protein"
              current={currentProtein}
              goal={proteinGoal}
              color={COLORS.macro.protein}
            />
            <MacroBar
              label="Carbohydrates"
              current={currentCarbs}
              goal={carbsGoal}
              color={COLORS.macro.carbs}
            />
            <MacroBar
              label="Fat"
              current={currentFat}
              goal={fatGoal}
              color={COLORS.macro.fat}
            />
            <MacroBar
              label="Fiber"
              current={currentFiber}
              goal={fiberGoal}
              color={COLORS.macro.fiber}
            />
          </View>
        </View>

        {/* Action Buttons Row */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 20,
            marginTop: 16,
            gap: 12,
          }}
        >
          {/* Smart Copy Button */}
          {isToday && (
            <TouchableOpacity
              onPress={handleSmartCopy}
              disabled={isSmartCopying}
              style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isSmartCopying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={{ fontSize: 16 }}>⚡</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                      Smart Copy
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Scan Button */}
          <TouchableOpacity
            onPress={() => router.push('/camera')}
            style={{
              flex: 1,
              borderRadius: 14,
              backgroundColor: COLORS.background.elevated,
              borderWidth: 1,
              borderColor: COLORS.border.light,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>📷</Text>
            <Text style={{ color: COLORS.text.primary, fontSize: 14, fontWeight: '600' }}>
              Scan Food
            </Text>
          </TouchableOpacity>

          {/* Barcode Button */}
          <TouchableOpacity
            onPress={() => router.push('/barcode')}
            style={{
              flex: 1,
              borderRadius: 14,
              backgroundColor: COLORS.background.elevated,
              borderWidth: 1,
              borderColor: COLORS.border.light,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>📊</Text>
            <Text style={{ color: COLORS.text.primary, fontSize: 14, fontWeight: '600' }}>
              Barcode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Food Log by Meal */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary }}>
              Today's Log
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.text.muted }}>
              {logs.length} item{logs.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.primary.DEFAULT} size="large" />
            </View>
          ) : logs.length === 0 ? (
            <View
              style={{
                backgroundColor: COLORS.background.card,
                borderRadius: 20,
                padding: 32,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border.DEFAULT,
                borderStyle: 'dashed',
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🍽️</Text>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: COLORS.text.primary,
                  marginBottom: 6,
                }}
              >
                No meals logged yet
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.text.muted,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Tap "Scan Food" to analyze a meal with AI, or use "Smart Copy" to duplicate yesterday's log.
              </Text>
            </View>
          ) : (
            MEAL_ORDER.map((mealType) => {
              const mealLogs = logsByMeal[mealType];
              if (!mealLogs || mealLogs.length === 0) return null;

              const mealCalories = mealLogs.reduce((sum, l) => sum + l.calories, 0);

              return (
                <View key={mealType} style={{ marginBottom: 20 }}>
                  {/* Meal header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text.secondary }}>
                      {MEAL_TYPE_LABELS[mealType] ?? mealType}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.text.muted }}>
                      {Math.round(mealCalories)} kcal
                    </Text>
                  </View>

                  {mealLogs.map((log) => (
                    <FoodLogItem
                      key={log.id}
                      item={log}
                      onPress={() => {
                        // Navigate to food detail
                      }}
                    />
                  ))}
                </View>
              );
            })
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
