// NutriSense AI — Database Type Definitions
// Supabase JS v2 compatible — fixes all 'never' type errors

export type DietaryRestriction =
  | 'none'
  | 'keto'
  | 'vegan'
  | 'vegetarian'
  | 'paleo'
  | 'low_fodmap'
  | 'gluten_free'
  | 'dairy_free'
  | 'low_carb'
  | 'mediterranean'
  | 'whole30'
  | 'carnivore';

export type AllergenType =
  | 'peanuts'
  | 'tree_nuts'
  | 'milk'
  | 'eggs'
  | 'fish'
  | 'shellfish'
  | 'wheat'
  | 'soy'
  | 'sesame'
  | 'mustard'
  | 'celery'
  | 'lupin'
  | 'molluscs'
  | 'sulphites';

export type MealType =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner'
  | 'evening_snack'
  | 'water'
  | 'supplement';

export type LogSource =
  | 'manual'
  | 'camera_ai'
  | 'barcode_scan'
  | 'smart_copy'
  | 'recipe_import';

export type PurchaseProduct =
  | 'pro_pack_lifetime'
  | 'educational_module_macros'
  | 'educational_module_gut_health'
  | 'educational_module_sports_nutrition'
  | 'consultation_voucher_30min'
  | 'consultation_voucher_60min';

export type PurchaseStatus = 'pending' | 'completed' | 'refunded' | 'disputed' | 'expired';
export type PurchasePlatform = 'ios_app_store' | 'android_play_store' | 'web_stripe';
export type InventoryStatus = 'fresh' | 'use_soon' | 'expiring_today' | 'expired' | 'unknown';

// ============================================================
// Row interfaces (match SQL table columns exactly)
// ============================================================

export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  height_cm: number | null;
  timezone: string;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  daily_calorie_goal: number;
  daily_protein_goal_g: number;
  daily_carbs_goal_g: number;
  daily_fat_goal_g: number;
  daily_fiber_goal_g: number;
  daily_water_goal_ml: number;
  daily_sodium_goal_mg: number | null;
  daily_sugar_goal_g: number | null;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  fitness_goal: 'lose_weight' | 'maintain_weight' | 'gain_muscle' | 'improve_performance' | 'eat_healthier' | 'manage_condition';
  dietary_restrictions: DietaryRestriction[];
  severe_allergens: AllergenType[];
  food_preferences: string[];
  disliked_foods: string[];
  onboarding_completed: boolean;
  notifications_enabled: boolean;
  ai_coaching_enabled: boolean;
  smart_copy_enabled: boolean;
  is_pro: boolean;
  pro_unlocked_at: string | null;
  revenuecat_user_id: string | null;
}

export interface DailyFoodLog {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  logged_at: string;
  log_date: string;
  food_name: string;
  brand_name: string | null;
  barcode_upc: string | null;
  meal_type: MealType;
  log_source: LogSource;
  serving_size_g: number | null;
  serving_description: string | null;
  quantity: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  polyunsaturated_fat_g: number | null;
  monounsaturated_fat_g: number | null;
  sodium_mg: number | null;
  potassium_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  magnesium_mg: number | null;
  phosphorus_mg: number | null;
  zinc_mg: number | null;
  vitamin_a_mcg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  vitamin_e_mg: number | null;
  vitamin_k_mcg: number | null;
  vitamin_b12_mcg: number | null;
  folate_mcg: number | null;
  cholesterol_mg: number | null;
  ai_identified_ingredients: string[] | null;
  ai_allergen_flags: AllergenType[] | null;
  ai_health_snippet: string | null;
  ai_confidence_score: number | null;
  image_url: string | null;
  notes: string | null;
  is_deleted: boolean;
}

export interface FridgeInventoryItem {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  item_name: string;
  category: string;
  brand_name: string | null;
  quantity: number;
  unit: string;
  notes: string | null;
  purchase_date: string | null;
  expiration_date: string | null;
  estimated_expiry_days: number | null;
  expiry_status: InventoryStatus;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  added_via: LogSource;
  image_url: string | null;
  barcode_upc: string | null;
  is_consumed: boolean;
  is_deleted: boolean;
}

export interface MobilePurchase {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  product: PurchaseProduct;
  platform: PurchasePlatform;
  status: PurchaseStatus;
  amount_usd: number;
  transaction_id: string | null;
  original_transaction_id: string | null;
  receipt_data: string | null;
  revenuecat_purchase_id: string | null;
  entitlement_id: string | null;
  is_sandbox: boolean;
  purchased_at: string;
  expires_at: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
}

export interface WeightLog {
  id: string;
  user_id: string;
  created_at: string;
  logged_at: string;
  log_date: string;
  weight_kg: number;
  body_fat_percentage: number | null;
  muscle_mass_kg: number | null;
  notes: string | null;
}

export interface DailySummary {
  id: string;
  user_id: string;
  summary_date: string;
  created_at: string;
  updated_at: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_water_ml: number;
  total_sodium_mg: number | null;
  total_sugar_g: number | null;
  calorie_goal: number;
  protein_goal_g: number;
  carbs_goal_g: number;
  fat_goal_g: number;
  calorie_adherence: number | null;
  macro_adherence: number | null;
}

export interface SavedRecipe {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  recipe_name: string;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  calories_per_serving: number | null;
  protein_per_serving_g: number | null;
  carbs_per_serving_g: number | null;
  fat_per_serving_g: number | null;
  fiber_per_serving_g: number | null;
  ingredients: Array<{ item: string; amount: string }>;
  instructions: string[];
  waste_reduction_tip: string | null;
  is_favorite: boolean;
  generated_from_inventory: string[];
}

export interface DailyTotals {
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_sodium_mg: number;
  total_sugar_g: number;
  log_count: number;
}

// ============================================================
// Supabase Database generic — Supabase JS v2 compatible
// This is the type passed to createClient<Database>()
// ============================================================
export type Database = {
  public: {
    Tables: {
      users_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      daily_food_logs: {
        Row: DailyFoodLog;
        Insert: Omit<DailyFoodLog, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailyFoodLog, 'id' | 'created_at' | 'updated_at'>>;
      };
      fridge_inventory: {
        Row: FridgeInventoryItem;
        Insert: Omit<FridgeInventoryItem, 'id' | 'created_at' | 'updated_at' | 'expiry_status'>;
        Update: Partial<Omit<FridgeInventoryItem, 'id' | 'created_at' | 'updated_at'>>;
      };
      mobile_purchases: {
        Row: MobilePurchase;
        Insert: Omit<MobilePurchase, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MobilePurchase, 'id' | 'created_at' | 'updated_at'>>;
      };
      weight_logs: {
        Row: WeightLog;
        Insert: Omit<WeightLog, 'id' | 'created_at'>;
        Update: Partial<Omit<WeightLog, 'id' | 'created_at'>>;
      };
      daily_summaries: {
        Row: DailySummary;
        Insert: Omit<DailySummary, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailySummary, 'id' | 'created_at' | 'updated_at'>>;
      };
      saved_recipes: {
        Row: SavedRecipe;
        Insert: Omit<SavedRecipe, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SavedRecipe, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      smart_copy_yesterday_log: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_daily_totals: {
        Args: { p_user_id: string; p_date?: string };
        Returns: DailyTotals[];
      };
      upsert_fridge_item: {
        Args: {
          p_user_id: string;
          p_item_name: string;
          p_quantity?: number;
          p_unit?: string;
          p_category?: string;
          p_estimated_expiry_days?: number;
          p_calories_per_100g?: number;
          p_protein_per_100g?: number;
          p_carbs_per_100g?: number;
          p_fat_per_100g?: number;
          p_image_url?: string;
        };
        Returns: string;
      };
      calculate_expiry_status: {
        Args: { expiration_date: string };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
