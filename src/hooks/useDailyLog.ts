/**
 * useDailyLog — Hook for fetching and managing daily food logs.
 * Handles Supabase queries, totals computation, and smart copy.
 */

import { useCallback, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { useAuthStore, useDailyLogStore } from '@/context/store';
import { DailyFoodLog } from '@/types/database';

export function useDailyLog(date?: string) {
  const { user } = useAuthStore();
  const {
    logs,
    totals,
    selectedDate,
    isLoading,
    setLogs,
    setTotals,
    setSelectedDate,
    setLoading,
    addLog,
    removeLog,
    updateLog,
    clearLogs,
  } = useDailyLogStore();

  const targetDate = date ?? selectedDate;

  // ============================================================
  // Fetch logs for a given date
  // ============================================================
  const fetchLogs = useCallback(
    async (logDate: string = targetDate) => {
      if (!user?.id) return;
      setLoading(true);

      const { data: logsData, error } = await supabase
        .from('daily_food_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', logDate)
        .eq('is_deleted', false)
        .order('logged_at', { ascending: true });

      if (logsData) {
        setLogs(logsData);
        computeAndSetTotals(logsData);
      }

      setLoading(false);
    },
    [user?.id, targetDate]
  );

  // ============================================================
  // Compute totals from logs array
  // ============================================================
  const computeAndSetTotals = (logsArray: DailyFoodLog[]) => {
    const totals = logsArray.reduce(
      (acc, log) => ({
        total_calories: acc.total_calories + (log.calories ?? 0),
        total_protein_g: acc.total_protein_g + (log.protein_g ?? 0),
        total_carbs_g: acc.total_carbs_g + (log.carbs_g ?? 0),
        total_fat_g: acc.total_fat_g + (log.fat_g ?? 0),
        total_fiber_g: acc.total_fiber_g + (log.fiber_g ?? 0),
        total_sodium_mg: acc.total_sodium_mg + (log.sodium_mg ?? 0),
        total_sugar_g: acc.total_sugar_g + (log.sugar_g ?? 0),
        log_count: acc.log_count + 1,
      }),
      {
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        total_fiber_g: 0,
        total_sodium_mg: 0,
        total_sugar_g: 0,
        log_count: 0,
      }
    );
    setTotals(totals);
  };

  // ============================================================
  // Delete a log entry (soft delete)
  // ============================================================
  const deleteLog = useCallback(
    async (logId: string) => {
      const { error } = await supabase
        .from('daily_food_logs')
        .update({ is_deleted: true } as any)
        .eq('id', logId);

      if (!error) {
        removeLog(logId);
        const updatedLogs = logs.filter((l) => l.id !== logId);
        computeAndSetTotals(updatedLogs);
      }

      return { error };
    },
    [logs, removeLog]
  );

  // ============================================================
  // Smart Copy — copy yesterday's log to today
  // ============================================================
  const smartCopyYesterday = useCallback(async () => {
    if (!user?.id) return { error: 'Not authenticated', count: 0 };

    const { data, error } = await supabase.rpc('smart_copy_yesterday_log', {
      p_user_id: user.id,
    });

    if (!error) {
      await fetchLogs(selectedDate);
    }

    return { error: error?.message ?? null, count: data ?? 0 };
  }, [user?.id, selectedDate, fetchLogs]);

  // ============================================================
  // Change selected date
  // ============================================================
  const changeDate = useCallback(
    (newDate: string) => {
      setSelectedDate(newDate);
      clearLogs();
    },
    [setSelectedDate, clearLogs]
  );

  // ============================================================
  // Auto-fetch on mount and date change
  // ============================================================
  useEffect(() => {
    if (user?.id) {
      fetchLogs(targetDate);
    }
  }, [user?.id, targetDate]);

  return {
    logs,
    totals,
    selectedDate,
    isLoading,
    fetchLogs,
    deleteLog,
    smartCopyYesterday,
    changeDate,
    addLog,
    updateLog,
  };
}
