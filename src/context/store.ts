import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import {
  UserProfile,
  DailyFoodLog,
  FridgeInventoryItem,
  DailyTotals,
} from '@/types/database';

// ============================================================
// AUTH STORE
// ============================================================

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  clearAuth: () => set({ session: null, user: null }),
}));

// ============================================================
// USER PROFILE STORE
// ============================================================

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  setProfile: (profile) => set({ profile, error: null }),
  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearProfile: () => set({ profile: null }),
}));

// ============================================================
// DAILY LOG STORE
// ============================================================

interface DailyLogState {
  logs: DailyFoodLog[];
  totals: DailyTotals | null;
  selectedDate: string;
  isLoading: boolean;
  isSmartCopying: boolean;
  error: string | null;
  setLogs: (logs: DailyFoodLog[]) => void;
  addLog: (log: DailyFoodLog) => void;
  removeLog: (id: string) => void;
  updateLog: (id: string, updates: Partial<DailyFoodLog>) => void;
  setTotals: (totals: DailyTotals | null) => void;
  setSelectedDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
  setSmartCopying: (copying: boolean) => void;
  setError: (error: string | null) => void;
  clearLogs: () => void;
}

export const useDailyLogStore = create<DailyLogState>((set) => ({
  logs: [],
  totals: null,
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: false,
  isSmartCopying: false,
  error: null,
  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
  removeLog: (id) =>
    set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
  updateLog: (id, updates) =>
    set((state) => ({
      logs: state.logs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  setTotals: (totals) => set({ totals }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setLoading: (isLoading) => set({ isLoading }),
  setSmartCopying: (isSmartCopying) => set({ isSmartCopying }),
  setError: (error) => set({ error }),
  clearLogs: () => set({ logs: [], totals: null }),
}));

// ============================================================
// FRIDGE STORE
// ============================================================

interface FridgeState {
  items: FridgeInventoryItem[];
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;
  setItems: (items: FridgeInventoryItem[]) => void;
  addItem: (item: FridgeInventoryItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<FridgeInventoryItem>) => void;
  setLoading: (loading: boolean) => void;
  setScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFridgeStore = create<FridgeState>((set) => ({
  items: [],
  isLoading: false,
  isScanning: false,
  error: null,
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setScanning: (isScanning) => set({ isScanning }),
  setError: (error) => set({ error }),
}));

// ============================================================
// IAP / PRO STORE
// ============================================================

interface IAPState {
  isPro: boolean;
  isLoading: boolean;
  showPaywall: boolean;
  paywallTriggerScreen: string | null;
  setIsPro: (isPro: boolean) => void;
  setLoading: (loading: boolean) => void;
  openPaywall: (triggerScreen?: string) => void;
  closePaywall: () => void;
}

export const useIAPStore = create<IAPState>((set) => ({
  isPro: false,
  isLoading: false,
  showPaywall: false,
  paywallTriggerScreen: null,
  setIsPro: (isPro) => set({ isPro }),
  setLoading: (isLoading) => set({ isLoading }),
  openPaywall: (triggerScreen) =>
    set({ showPaywall: true, paywallTriggerScreen: triggerScreen ?? null }),
  closePaywall: () =>
    set({ showPaywall: false, paywallTriggerScreen: null }),
}));
