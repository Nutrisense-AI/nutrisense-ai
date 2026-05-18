/**
 * useMacroProgress — Computes macro progress percentages vs user goals.
 * Returns clamped percentages (0–100) and over-goal flags.
 */

import { useMemo } from 'react';
import { useDailyLogStore, useProfileStore } from '@/context/store';
import { DEFAULT_USER_GOALS } from '@/constants';

export interface MacroProgressData {
  calories: {
    current: number;
    goal: number;
    percentage: number;
    remaining: number;
    isOver: boolean;
  };
  protein: {
    current: number;
    goal: number;
    percentage: number;
    remaining: number;
    isOver: boolean;
  };
  carbs: {
    current: number;
    goal: number;
    percentage: number;
    remaining: number;
    isOver: boolean;
  };
  fat: {
    current: number;
    goal: number;
    percentage: number;
    remaining: number;
    isOver: boolean;
  };
  fiber: {
    current: number;
    goal: number;
    percentage: number;
    remaining: number;
    isOver: boolean;
  };
  overallScore: number; // 0–100, weighted average adherence
}

export function useMacroProgress(): MacroProgressData {
  const { totals } = useDailyLogStore();
  const { profile } = useProfileStore();

  return useMemo(() => {
    const goals = {
      calories: profile?.daily_calorie_goal ?? DEFAULT_USER_GOALS.calories,
      protein: profile?.daily_protein_goal_g ?? DEFAULT_USER_GOALS.protein_g,
      carbs: profile?.daily_carbs_goal_g ?? DEFAULT_USER_GOALS.carbs_g,
      fat: profile?.daily_fat_goal_g ?? DEFAULT_USER_GOALS.fat_g,
      fiber: profile?.daily_fiber_goal_g ?? DEFAULT_USER_GOALS.fiber_g,
    };

    const current = {
      calories: totals?.total_calories ?? 0,
      protein: totals?.total_protein_g ?? 0,
      carbs: totals?.total_carbs_g ?? 0,
      fat: totals?.total_fat_g ?? 0,
      fiber: totals?.total_fiber_g ?? 0,
    };

    const computeMacro = (curr: number, goal: number) => {
      const rawPct = goal > 0 ? (curr / goal) * 100 : 0;
      return {
        current: Math.round(curr * 10) / 10,
        goal,
        percentage: Math.min(100, rawPct),
        remaining: Math.max(0, goal - curr),
        isOver: curr > goal,
      };
    };

    const caloriesData = computeMacro(current.calories, goals.calories);
    const proteinData = computeMacro(current.protein, goals.protein);
    const carbsData = computeMacro(current.carbs, goals.carbs);
    const fatData = computeMacro(current.fat, goals.fat);
    const fiberData = computeMacro(current.fiber, goals.fiber);

    // Overall score: weighted average (calories 40%, protein 25%, carbs 20%, fat 10%, fiber 5%)
    // Penalize both under and over by using |pct - 100| distance
    const score = (macro: ReturnType<typeof computeMacro>) =>
      Math.max(0, 100 - Math.abs(macro.percentage - 100));

    const overallScore = Math.round(
      score(caloriesData) * 0.4 +
      score(proteinData) * 0.25 +
      score(carbsData) * 0.2 +
      score(fatData) * 0.1 +
      score(fiberData) * 0.05
    );

    return {
      calories: caloriesData,
      protein: proteinData,
      carbs: carbsData,
      fat: fatData,
      fiber: fiberData,
      overallScore,
    };
  }, [totals, profile]);
}
