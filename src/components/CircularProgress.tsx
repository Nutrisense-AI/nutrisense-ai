import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  color: string;
  gradientEnd?: string;
  backgroundColor?: string;
  label?: string;
  value?: string;
  unit?: string;
  sublabel?: string;
  gradientId?: string;
}

export function CircularProgress({
  size,
  strokeWidth,
  progress,
  color,
  gradientEnd,
  backgroundColor = '#2A2A3E',
  label,
  value,
  unit,
  sublabel,
  gradientId = 'grad',
}: CircularProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const center = size / 2;

  const useGradient = !!gradientEnd;
  const strokeSource = useGradient ? `url(#${gradientId})` : color;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {useGradient && (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} />
              <Stop offset="100%" stopColor={gradientEnd!} />
            </LinearGradient>
          </Defs>
        )}
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeSource}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Center content */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {value !== undefined && (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}>
            <Text
              style={{
                fontSize: size > 100 ? 24 : 16,
                fontWeight: '700',
                color: '#F0F0FF',
                letterSpacing: -0.5,
              }}
            >
              {value}
            </Text>
            {unit && (
              <Text style={{ fontSize: size > 100 ? 12 : 10, color: '#A0A0C0', fontWeight: '500' }}>
                {unit}
              </Text>
            )}
          </View>
        )}
        {label && (
          <Text
            style={{
              fontSize: size > 100 ? 12 : 10,
              color: '#A0A0C0',
              fontWeight: '600',
              textAlign: 'center',
              marginTop: 2,
            }}
          >
            {label}
          </Text>
        )}
        {sublabel && (
          <Text
            style={{
              fontSize: 10,
              color: '#606080',
              textAlign: 'center',
              marginTop: 1,
            }}
          >
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}
