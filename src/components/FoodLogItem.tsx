import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { DailyFoodLog } from '@/types/database';
import { COLORS, MEAL_TYPE_ICONS } from '@/constants';
import { supabase } from '@/api/supabase';
import { useDailyLogStore } from '@/context/store';

interface FoodLogItemProps {
  item: DailyFoodLog;
  onPress?: () => void;
}

export function FoodLogItem({ item, onPress }: FoodLogItemProps) {
  const { removeLog } = useDailyLogStore();

  const handleDelete = () => {
    Alert.alert(
      'Remove Food',
      `Remove "${item.food_name}" from your log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('daily_food_logs')
              .update({ is_deleted: true } as any)
              .eq('id', item.id);

            if (!error) {
              removeLog(item.id);
            }
          },
        },
      ]
    );
  };

  const sourceIcon = {
    camera_ai: '🤖',
    barcode_scan: '📊',
    smart_copy: '📋',
    manual: '✏️',
    recipe_import: '🍳',
  }[item.log_source] ?? '✏️';

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={handleDelete}
      activeOpacity={0.7}
      style={{
        backgroundColor: COLORS.background.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border.DEFAULT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Meal type icon */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: COLORS.background.elevated,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 22 }}>
          {MEAL_TYPE_ICONS[item.meal_type] ?? '🍽️'}
        </Text>
      </View>

      {/* Food details */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: COLORS.text.primary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.food_name}
          </Text>
          <Text style={{ fontSize: 11 }}>{sourceIcon}</Text>
        </View>

        {item.brand_name && (
          <Text style={{ fontSize: 12, color: COLORS.text.muted, marginBottom: 4 }}>
            {item.brand_name}
          </Text>
        )}

        {/* Macro pills */}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <MacroPill label="P" value={item.protein_g} color={COLORS.macro.protein} />
          <MacroPill label="C" value={item.carbs_g} color={COLORS.macro.carbs} />
          <MacroPill label="F" value={item.fat_g} color={COLORS.macro.fat} />
        </View>
      </View>

      {/* Calories */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: COLORS.text.primary,
          }}
        >
          {Math.round(item.calories)}
        </Text>
        <Text style={{ fontSize: 11, color: COLORS.text.muted }}>kcal</Text>
      </View>
    </TouchableOpacity>
  );
}

function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${color}22`,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        gap: 2,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>
        {label}
      </Text>
      <Text style={{ fontSize: 10, color, fontWeight: '500' }}>
        {Math.round(value)}g
      </Text>
    </View>
  );
}
