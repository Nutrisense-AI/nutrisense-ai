import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '@/constants';

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, goal, color, unit = 'g' }: MacroBarProps) {
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  const percentage = Math.round(progress * 100);
  const isOver = current > goal;

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text.secondary }}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: isOver ? COLORS.status.warning : COLORS.text.primary,
            }}
          >
            {Math.round(current)}{unit}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.text.muted }}>
            / {Math.round(goal)}{unit}
          </Text>
        </View>
      </View>

      {/* Track */}
      <View
        style={{
          height: 6,
          backgroundColor: COLORS.background.elevated,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: isOver ? COLORS.status.warning : color,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}
