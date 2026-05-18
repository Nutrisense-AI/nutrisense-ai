import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { supabase } from '@/api/supabase';
import { useAuthStore, useProfileStore } from '@/context/store';
import { useIAP } from '@/context/IAPProvider';
import { COLORS, CHART_DAYS_OPTIONS } from '@/constants';
import { DailySummary } from '@/types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, bottom: 30, left: 40, right: 16 };

interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

function LineChart({
  data,
  color,
  goal,
  unit,
  gradientId,
}: {
  data: ChartDataPoint[];
  color: string;
  goal?: number;
  unit: string;
  gradientId: string;
}) {
  if (data.length < 2) return null;

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, goal ?? 0) * 1.15;
  const minVal = 0;

  const xStep = innerWidth / (data.length - 1);
  const yScale = (val: number) =>
    PADDING.top + innerHeight - ((val - minVal) / (maxVal - minVal)) * innerHeight;

  const points = data.map((d, i) => ({
    x: PADDING.left + i * xStep,
    y: yScale(d.value),
  }));

  // Build smooth path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + xStep / 3;
    const cp1y = points[i - 1].y;
    const cp2x = points[i].x - xStep / 3;
    const cp2y = points[i].y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
  }

  // Fill path
  const fillD =
    pathD +
    ` L ${points[points.length - 1].x} ${PADDING.top + innerHeight}` +
    ` L ${points[0].x} ${PADDING.top + innerHeight} Z`;

  const goalY = goal ? yScale(goal) : null;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Goal line */}
      {goalY !== null && (
        <>
          <Line
            x1={PADDING.left}
            y1={goalY}
            x2={CHART_WIDTH - PADDING.right}
            y2={goalY}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.4}
          />
          <SvgText
            x={CHART_WIDTH - PADDING.right - 2}
            y={goalY - 4}
            fontSize={9}
            fill={color}
            textAnchor="end"
            opacity={0.7}
          >
            Goal
          </SvgText>
        </>
      )}

      {/* Fill */}
      <Path d={fillD} fill={`url(#${gradientId})`} />

      {/* Line */}
      <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}

      {/* X axis labels (show every nth) */}
      {data.map((d, i) => {
        if (i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return null;
        return (
          <SvgText
            key={i}
            x={points[i].x}
            y={CHART_HEIGHT - 4}
            fontSize={9}
            fill={COLORS.text.muted}
            textAnchor="middle"
          >
            {d.label}
          </SvgText>
        );
      })}

      {/* Y axis labels */}
      {[0, 0.5, 1].map((frac) => {
        const val = minVal + frac * (maxVal - minVal);
        const y = yScale(val);
        return (
          <SvgText
            key={frac}
            x={PADDING.left - 4}
            y={y + 3}
            fontSize={9}
            fill={COLORS.text.muted}
            textAnchor="end"
          >
            {Math.round(val)}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export default function HistoricalChartsScreen() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { isPro, openPaywall } = useIAP();

  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<30 | 14 | 7 | 90>(30);
  const [activeMetric, setActiveMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat' | 'fiber'>('calories');

  useEffect(() => {
    if (!isPro) {
      openPaywall('Historical Charts');
    }
  }, [isPro]);

  const fetchSummaries = useCallback(async () => {
    if (!user?.id || !isPro) return;
    setIsLoading(true);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - selectedDays);

    const { data } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .gte('summary_date', fromDate.toISOString().split('T')[0])
      .order('summary_date', { ascending: true });

    if (data) setSummaries(data);
    setIsLoading(false);
  }, [user?.id, selectedDays, isPro]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  if (!isPro) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>📊</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text.primary, textAlign: 'center', marginBottom: 12 }}>
            Pro Feature
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Historical Trend Charts require NutriSense AI Pro. Unlock lifetime access for $29.
          </Text>
          <TouchableOpacity
            onPress={() => openPaywall('Historical Charts')}
            style={{
              backgroundColor: COLORS.primary.DEFAULT,
              borderRadius: 16,
              paddingHorizontal: 32,
              paddingVertical: 16,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
              Unlock Pro — $29
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const metricConfig = {
    calories: {
      label: 'Calories',
      color: COLORS.macro.calories,
      key: 'total_calories' as keyof DailySummary,
      goal: profile?.daily_calorie_goal,
      unit: 'kcal',
      gradientId: 'calGrad',
    },
    protein: {
      label: 'Protein',
      color: COLORS.macro.protein,
      key: 'total_protein_g' as keyof DailySummary,
      goal: profile?.daily_protein_goal_g,
      unit: 'g',
      gradientId: 'protGrad',
    },
    carbs: {
      label: 'Carbs',
      color: COLORS.macro.carbs,
      key: 'total_carbs_g' as keyof DailySummary,
      goal: profile?.daily_carbs_goal_g,
      unit: 'g',
      gradientId: 'carbGrad',
    },
    fat: {
      label: 'Fat',
      color: COLORS.macro.fat,
      key: 'total_fat_g' as keyof DailySummary,
      goal: profile?.daily_fat_goal_g,
      unit: 'g',
      gradientId: 'fatGrad',
    },
    fiber: {
      label: 'Fiber',
      color: COLORS.macro.fiber,
      key: 'total_fiber_g' as keyof DailySummary,
      goal: profile?.daily_fiber_goal_g,
      unit: 'g',
      gradientId: 'fiberGrad',
    },
  };

  const active = metricConfig[activeMetric];

  const chartData: ChartDataPoint[] = summaries.map((s) => ({
    date: s.summary_date,
    value: Number(s[active.key]) ?? 0,
    label: new Date(s.summary_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
  }));

  // Calculate stats
  const values = chartData.map((d) => d.value);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const goalVal = Number(active.goal) ?? 0;
  const daysOnTarget = values.filter((v) =>
    goalVal > 0 ? Math.abs(v - goalVal) / goalVal <= 0.1 : false
  ).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.text.primary }}>
            📊 Trend Charts
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View
              style={{
                backgroundColor: COLORS.primary.muted,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: COLORS.primary.light, fontSize: 11, fontWeight: '700' }}>
                ⭐ PRO
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: COLORS.text.muted }}>
              Historical nutrition analytics
            </Text>
          </View>
        </View>

        {/* Day range selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}
        >
          {CHART_DAYS_OPTIONS.map((days) => (
            <TouchableOpacity
              key={days}
              onPress={() => setSelectedDays(days)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  selectedDays === days ? COLORS.primary.DEFAULT : COLORS.background.elevated,
                borderWidth: 1,
                borderColor:
                  selectedDays === days ? COLORS.primary.DEFAULT : COLORS.border.DEFAULT,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: selectedDays === days ? '#FFFFFF' : COLORS.text.muted,
                }}
              >
                {days}d
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Metric selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}
        >
          {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map((key) => {
            const cfg = metricConfig[key];
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveMetric(key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor:
                    activeMetric === key ? `${cfg.color}33` : COLORS.background.elevated,
                  borderWidth: 1,
                  borderColor: activeMetric === key ? cfg.color : COLORS.border.DEFAULT,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: activeMetric === key ? cfg.color : COLORS.text.muted,
                  }}
                >
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chart */}
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: COLORS.background.card,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border.DEFAULT,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text.primary }}>
              {active.label} — Last {selectedDays} Days
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.text.muted }}>
              {active.unit}
            </Text>
          </View>

          {isLoading ? (
            <View style={{ height: CHART_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.primary.DEFAULT} />
            </View>
          ) : chartData.length < 2 ? (
            <View style={{ height: CHART_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: COLORS.text.muted, fontSize: 14 }}>
                Not enough data yet. Keep logging!
              </Text>
            </View>
          ) : (
            <LineChart
              data={chartData}
              color={active.color}
              goal={goalVal}
              unit={active.unit}
              gradientId={active.gradientId}
            />
          )}
        </View>

        {/* Stats cards */}
        {chartData.length > 0 && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              flexDirection: 'row',
              gap: 10,
            }}
          >
            {[
              { label: 'Average', value: Math.round(avg), color: active.color },
              { label: 'Highest', value: Math.round(max), color: COLORS.status.warning },
              { label: 'Lowest', value: Math.round(min), color: COLORS.status.success },
              { label: 'On Target', value: `${daysOnTarget}d`, color: COLORS.primary.DEFAULT },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.background.card,
                  borderRadius: 14,
                  padding: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border.DEFAULT,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: stat.color }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.text.muted, marginTop: 3, textAlign: 'center' }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
