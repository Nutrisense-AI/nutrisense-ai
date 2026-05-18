-- ============================================================
-- NutriSense AI — Complete PostgreSQL Schema Migration
-- Version: 001 — Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE dietary_restriction AS ENUM (
  'none',
  'keto',
  'vegan',
  'vegetarian',
  'paleo',
  'low_fodmap',
  'gluten_free',
  'dairy_free',
  'low_carb',
  'mediterranean',
  'whole30',
  'carnivore'
);

CREATE TYPE allergen_type AS ENUM (
  'peanuts',
  'tree_nuts',
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'wheat',
  'soy',
  'sesame',
  'mustard',
  'celery',
  'lupin',
  'molluscs',
  'sulphites'
);

CREATE TYPE meal_type AS ENUM (
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'evening_snack',
  'water',
  'supplement'
);

CREATE TYPE log_source AS ENUM (
  'manual',
  'camera_ai',
  'barcode_scan',
  'smart_copy',
  'recipe_import'
);

CREATE TYPE purchase_product AS ENUM (
  'pro_pack_lifetime',
  'educational_module_macros',
  'educational_module_gut_health',
  'educational_module_sports_nutrition',
  'consultation_voucher_30min',
  'consultation_voucher_60min'
);

CREATE TYPE purchase_status AS ENUM (
  'pending',
  'completed',
  'refunded',
  'disputed',
  'expired'
);

CREATE TYPE purchase_platform AS ENUM (
  'ios_app_store',
  'android_play_store',
  'web_stripe'
);

CREATE TYPE inventory_status AS ENUM (
  'fresh',
  'use_soon',
  'expiring_today',
  'expired',
  'unknown'
);

-- ============================================================
-- TABLE: users_profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users_profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Personal Information
  display_name            TEXT,
  avatar_url              TEXT,
  date_of_birth           DATE,
  age                     INTEGER,  -- Computed by app from date_of_birth
  gender                  TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm               NUMERIC(5,1),
  timezone                TEXT DEFAULT 'UTC',

  -- Biometric Targets
  current_weight_kg       NUMERIC(5,2),
  target_weight_kg        NUMERIC(5,2),
  daily_calorie_goal      INTEGER NOT NULL DEFAULT 2000,
  daily_protein_goal_g    NUMERIC(6,1) NOT NULL DEFAULT 150.0,
  daily_carbs_goal_g      NUMERIC(6,1) NOT NULL DEFAULT 200.0,
  daily_fat_goal_g        NUMERIC(6,1) NOT NULL DEFAULT 65.0,
  daily_fiber_goal_g      NUMERIC(6,1) NOT NULL DEFAULT 25.0,
  daily_water_goal_ml     INTEGER NOT NULL DEFAULT 2500,
  daily_sodium_goal_mg    NUMERIC(7,1) DEFAULT 2300.0,
  daily_sugar_goal_g      NUMERIC(6,1) DEFAULT 50.0,

  -- Activity Level
  activity_level          TEXT DEFAULT 'moderately_active'
                            CHECK (activity_level IN (
                              'sedentary', 'lightly_active', 'moderately_active',
                              'very_active', 'extra_active'
                            )),
  fitness_goal            TEXT DEFAULT 'maintain'
                            CHECK (fitness_goal IN (
                              'lose_weight', 'maintain', 'gain_muscle', 'improve_health'
                            )),

  -- Dietary Configuration
  dietary_restrictions    dietary_restriction[] NOT NULL DEFAULT '{}',
  severe_allergens        allergen_type[] NOT NULL DEFAULT '{}',
  food_preferences        TEXT[] DEFAULT '{}',
  disliked_foods          TEXT[] DEFAULT '{}',

  -- App Settings
  onboarding_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  notifications_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  ai_coaching_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  smart_copy_enabled      BOOLEAN NOT NULL DEFAULT TRUE,

  -- Subscription / Pro Status (mirrored from RevenueCat for offline access)
  is_pro                  BOOLEAN NOT NULL DEFAULT FALSE,
  pro_unlocked_at         TIMESTAMPTZ,
  revenuecat_user_id      TEXT UNIQUE
);

-- Index for quick profile lookups
CREATE INDEX idx_users_profiles_revenuecat ON public.users_profiles(revenuecat_user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_profiles_updated_at
  BEFORE UPDATE ON public.users_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: daily_food_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_food_logs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logged_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  log_date                DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Food Item Details
  food_name               TEXT NOT NULL,
  brand_name              TEXT,
  barcode_upc             TEXT,
  meal_type               meal_type NOT NULL DEFAULT 'lunch',
  log_source              log_source NOT NULL DEFAULT 'manual',
  serving_size_g          NUMERIC(7,2),
  serving_description     TEXT,
  quantity                NUMERIC(5,2) NOT NULL DEFAULT 1.0,

  -- Core Macronutrients (per total serving * quantity)
  calories                NUMERIC(7,1) NOT NULL DEFAULT 0,
  protein_g               NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs_g                 NUMERIC(6,2) NOT NULL DEFAULT 0,
  fat_g                   NUMERIC(6,2) NOT NULL DEFAULT 0,
  fiber_g                 NUMERIC(6,2) DEFAULT 0,
  sugar_g                 NUMERIC(6,2) DEFAULT 0,
  saturated_fat_g         NUMERIC(6,2) DEFAULT 0,
  trans_fat_g             NUMERIC(6,2) DEFAULT 0,
  polyunsaturated_fat_g   NUMERIC(6,2) DEFAULT 0,
  monounsaturated_fat_g   NUMERIC(6,2) DEFAULT 0,

  -- Micronutrients (mg unless noted)
  sodium_mg               NUMERIC(7,2) DEFAULT 0,
  potassium_mg            NUMERIC(7,2) DEFAULT 0,
  calcium_mg              NUMERIC(7,2) DEFAULT 0,
  iron_mg                 NUMERIC(6,3) DEFAULT 0,
  magnesium_mg            NUMERIC(7,2) DEFAULT 0,
  phosphorus_mg           NUMERIC(7,2) DEFAULT 0,
  zinc_mg                 NUMERIC(6,3) DEFAULT 0,
  vitamin_a_mcg           NUMERIC(7,2) DEFAULT 0,
  vitamin_c_mg            NUMERIC(7,2) DEFAULT 0,
  vitamin_d_mcg           NUMERIC(6,3) DEFAULT 0,
  vitamin_e_mg            NUMERIC(6,3) DEFAULT 0,
  vitamin_k_mcg           NUMERIC(7,2) DEFAULT 0,
  vitamin_b12_mcg         NUMERIC(6,3) DEFAULT 0,
  folate_mcg              NUMERIC(7,2) DEFAULT 0,
  cholesterol_mg          NUMERIC(7,2) DEFAULT 0,

  -- AI Analysis Metadata
  ai_identified_ingredients  TEXT[],
  ai_allergen_flags           allergen_type[],
  ai_health_snippet           TEXT,
  ai_confidence_score         NUMERIC(4,3) CHECK (ai_confidence_score BETWEEN 0 AND 1),
  image_url                   TEXT,

  -- Notes
  notes                   TEXT,
  is_deleted              BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_food_logs_user_date ON public.daily_food_logs(user_id, log_date);
CREATE INDEX idx_food_logs_user_id ON public.daily_food_logs(user_id);
CREATE INDEX idx_food_logs_log_date ON public.daily_food_logs(log_date);
CREATE INDEX idx_food_logs_barcode ON public.daily_food_logs(barcode_upc) WHERE barcode_upc IS NOT NULL;
CREATE INDEX idx_food_logs_meal_type ON public.daily_food_logs(user_id, meal_type);

CREATE TRIGGER trigger_daily_food_logs_updated_at
  BEFORE UPDATE ON public.daily_food_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: fridge_inventory
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fridge_inventory (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Item Details
  item_name               TEXT NOT NULL,
  category                TEXT DEFAULT 'other',
  brand_name              TEXT,
  quantity                NUMERIC(7,2) NOT NULL DEFAULT 1,
  unit                    TEXT DEFAULT 'item',
  notes                   TEXT,

  -- Expiration Tracking
  purchase_date           DATE DEFAULT CURRENT_DATE,
  expiration_date         DATE,
  estimated_expiry_days   INTEGER,
  expiry_status           inventory_status NOT NULL DEFAULT 'fresh',

  -- Nutritional Reference (per 100g)
  calories_per_100g       NUMERIC(6,1),
  protein_per_100g        NUMERIC(5,2),
  carbs_per_100g          NUMERIC(5,2),
  fat_per_100g            NUMERIC(5,2),

  -- Source
  added_via               log_source DEFAULT 'manual',
  image_url               TEXT,
  barcode_upc             TEXT,

  -- Status
  is_consumed             BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted              BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_fridge_user_id ON public.fridge_inventory(user_id);
CREATE INDEX idx_fridge_expiry ON public.fridge_inventory(user_id, expiry_status) WHERE is_deleted = FALSE AND is_consumed = FALSE;
CREATE INDEX idx_fridge_item_name ON public.fridge_inventory USING gin(item_name gin_trgm_ops);

CREATE TRIGGER trigger_fridge_inventory_updated_at
  BEFORE UPDATE ON public.fridge_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate expiry_status based on expiration_date
CREATE OR REPLACE FUNCTION calculate_expiry_status()
RETURNS TRIGGER AS $$
DECLARE
  days_until_expiry INTEGER;
BEGIN
  IF NEW.expiration_date IS NULL THEN
    NEW.expiry_status := 'unknown';
  ELSE
    days_until_expiry := (NEW.expiration_date - CURRENT_DATE)::INTEGER;
    IF days_until_expiry < 0 THEN
      NEW.expiry_status := 'expired';
    ELSIF days_until_expiry = 0 THEN
      NEW.expiry_status := 'expiring_today';
    ELSIF days_until_expiry <= 3 THEN
      NEW.expiry_status := 'use_soon';
    ELSE
      NEW.expiry_status := 'fresh';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fridge_expiry_status
  BEFORE INSERT OR UPDATE ON public.fridge_inventory
  FOR EACH ROW EXECUTE FUNCTION calculate_expiry_status();

-- ============================================================
-- TABLE: mobile_purchases
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mobile_purchases (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Purchase Details
  product                 purchase_product NOT NULL,
  platform                purchase_platform NOT NULL,
  status                  purchase_status NOT NULL DEFAULT 'pending',
  amount_usd              NUMERIC(8,2) NOT NULL,

  -- Platform-Specific IDs
  transaction_id          TEXT UNIQUE,
  original_transaction_id TEXT,
  receipt_data            TEXT,
  revenuecat_purchase_id  TEXT UNIQUE,

  -- Entitlement
  entitlement_id          TEXT,
  is_sandbox              BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at              TIMESTAMPTZ,

  -- Refund Tracking
  refunded_at             TIMESTAMPTZ,
  refund_reason           TEXT
);

-- Indexes
CREATE INDEX idx_purchases_user_id ON public.mobile_purchases(user_id);
CREATE INDEX idx_purchases_product ON public.mobile_purchases(user_id, product);
CREATE INDEX idx_purchases_status ON public.mobile_purchases(status);
CREATE INDEX idx_purchases_transaction ON public.mobile_purchases(transaction_id);

CREATE TRIGGER trigger_mobile_purchases_updated_at
  BEFORE UPDATE ON public.mobile_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: weight_logs (for Historical Trend Charts)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.weight_logs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logged_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  log_date                DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg               NUMERIC(5,2) NOT NULL,
  body_fat_percentage     NUMERIC(4,1),
  muscle_mass_kg          NUMERIC(5,2),
  notes                   TEXT
);

CREATE INDEX idx_weight_logs_user_date ON public.weight_logs(user_id, log_date);

-- ============================================================
-- TABLE: daily_summaries (materialized-style for trend charts)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  summary_date            DATE NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Totals
  total_calories          NUMERIC(7,1) NOT NULL DEFAULT 0,
  total_protein_g         NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_carbs_g           NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_fat_g             NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_fiber_g           NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_water_ml          INTEGER NOT NULL DEFAULT 0,
  total_sodium_mg         NUMERIC(7,2) DEFAULT 0,
  total_sugar_g           NUMERIC(6,2) DEFAULT 0,

  -- Goals (snapshot at time of summary)
  calorie_goal            INTEGER NOT NULL DEFAULT 2000,
  protein_goal_g          NUMERIC(6,1) NOT NULL DEFAULT 150,
  carbs_goal_g            NUMERIC(6,1) NOT NULL DEFAULT 200,
  fat_goal_g              NUMERIC(6,1) NOT NULL DEFAULT 65,

  -- Adherence Scores
  calorie_adherence       NUMERIC(4,3),
  macro_adherence         NUMERIC(4,3),

  UNIQUE(user_id, summary_date)
);

CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date);

CREATE TRIGGER trigger_daily_summaries_updated_at
  BEFORE UPDATE ON public.daily_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VIEWS
-- ============================================================

-- View: today's food log with running totals
CREATE OR REPLACE VIEW public.v_today_food_log AS
SELECT
  fl.*,
  SUM(fl.calories) OVER (PARTITION BY fl.user_id, fl.log_date) AS daily_total_calories,
  SUM(fl.protein_g) OVER (PARTITION BY fl.user_id, fl.log_date) AS daily_total_protein,
  SUM(fl.carbs_g) OVER (PARTITION BY fl.user_id, fl.log_date) AS daily_total_carbs,
  SUM(fl.fat_g) OVER (PARTITION BY fl.user_id, fl.log_date) AS daily_total_fat
FROM public.daily_food_logs fl
WHERE fl.is_deleted = FALSE;

-- View: fridge items not consumed or deleted
CREATE OR REPLACE VIEW public.v_active_fridge_inventory AS
SELECT *
FROM public.fridge_inventory
WHERE is_deleted = FALSE AND is_consumed = FALSE
ORDER BY
  CASE expiry_status
    WHEN 'expired' THEN 1
    WHEN 'expiring_today' THEN 2
    WHEN 'use_soon' THEN 3
    WHEN 'fresh' THEN 4
    ELSE 5
  END,
  expiration_date ASC NULLS LAST;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fridge_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- users_profiles policies
CREATE POLICY "Users can view own profile"
  ON public.users_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users_profiles FOR UPDATE
  USING (auth.uid() = id);

-- daily_food_logs policies
CREATE POLICY "Users can view own food logs"
  ON public.daily_food_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food logs"
  ON public.daily_food_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food logs"
  ON public.daily_food_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs"
  ON public.daily_food_logs FOR DELETE
  USING (auth.uid() = user_id);

-- fridge_inventory policies
CREATE POLICY "Users can view own fridge"
  ON public.fridge_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fridge items"
  ON public.fridge_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fridge items"
  ON public.fridge_inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fridge items"
  ON public.fridge_inventory FOR DELETE
  USING (auth.uid() = user_id);

-- mobile_purchases policies
CREATE POLICY "Users can view own purchases"
  ON public.mobile_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON public.mobile_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- weight_logs policies
CREATE POLICY "Users can manage own weight logs"
  ON public.weight_logs FOR ALL
  USING (auth.uid() = user_id);

-- daily_summaries policies
CREATE POLICY "Users can manage own daily summaries"
  ON public.daily_summaries FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Smart Copy — duplicate yesterday's food log into today
CREATE OR REPLACE FUNCTION public.smart_copy_yesterday_log(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_today DATE := CURRENT_DATE;
  v_count INTEGER;
BEGIN
  -- Delete any existing entries for today that were smart-copied (to allow re-copy)
  DELETE FROM public.daily_food_logs
  WHERE user_id = p_user_id
    AND log_date = v_today
    AND log_source = 'smart_copy';

  -- Insert yesterday's entries as today's entries
  INSERT INTO public.daily_food_logs (
    user_id, logged_at, log_date, food_name, brand_name, barcode_upc,
    meal_type, log_source, serving_size_g, serving_description, quantity,
    calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g,
    saturated_fat_g, trans_fat_g, sodium_mg, potassium_mg, calcium_mg,
    iron_mg, vitamin_a_mcg, vitamin_c_mg, vitamin_d_mcg, notes
  )
  SELECT
    user_id,
    NOW(),
    v_today,
    food_name, brand_name, barcode_upc,
    meal_type, 'smart_copy', serving_size_g, serving_description, quantity,
    calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g,
    saturated_fat_g, trans_fat_g, sodium_mg, potassium_mg, calcium_mg,
    iron_mg, vitamin_a_mcg, vitamin_c_mg, vitamin_d_mcg, notes
  FROM public.daily_food_logs
  WHERE user_id = p_user_id
    AND log_date = v_yesterday
    AND is_deleted = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get daily totals for a specific date
CREATE OR REPLACE FUNCTION public.get_daily_totals(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_calories NUMERIC,
  total_protein_g NUMERIC,
  total_carbs_g NUMERIC,
  total_fat_g NUMERIC,
  total_fiber_g NUMERIC,
  total_sodium_mg NUMERIC,
  total_sugar_g NUMERIC,
  log_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(fl.calories), 0)::NUMERIC AS total_calories,
    COALESCE(SUM(fl.protein_g), 0)::NUMERIC AS total_protein_g,
    COALESCE(SUM(fl.carbs_g), 0)::NUMERIC AS total_carbs_g,
    COALESCE(SUM(fl.fat_g), 0)::NUMERIC AS total_fat_g,
    COALESCE(SUM(fl.fiber_g), 0)::NUMERIC AS total_fiber_g,
    COALESCE(SUM(fl.sodium_mg), 0)::NUMERIC AS total_sodium_mg,
    COALESCE(SUM(fl.sugar_g), 0)::NUMERIC AS total_sugar_g,
    COUNT(*)::INTEGER AS log_count
  FROM public.daily_food_logs fl
  WHERE fl.user_id = p_user_id
    AND fl.log_date = p_date
    AND fl.is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Upsert fridge item from AI scan
CREATE OR REPLACE FUNCTION public.upsert_fridge_item(
  p_user_id UUID,
  p_item_name TEXT,
  p_quantity NUMERIC DEFAULT 1,
  p_unit TEXT DEFAULT 'item',
  p_category TEXT DEFAULT 'other',
  p_estimated_expiry_days INTEGER DEFAULT NULL,
  p_calories_per_100g NUMERIC DEFAULT NULL,
  p_protein_per_100g NUMERIC DEFAULT NULL,
  p_carbs_per_100g NUMERIC DEFAULT NULL,
  p_fat_per_100g NUMERIC DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_item_id UUID;
  v_expiry_date DATE;
BEGIN
  IF p_estimated_expiry_days IS NOT NULL THEN
    v_expiry_date := CURRENT_DATE + p_estimated_expiry_days;
  END IF;

  -- Try to find existing active item with same name
  SELECT id INTO v_item_id
  FROM public.fridge_inventory
  WHERE user_id = p_user_id
    AND LOWER(item_name) = LOWER(p_item_name)
    AND is_deleted = FALSE
    AND is_consumed = FALSE
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    -- Update existing item
    UPDATE public.fridge_inventory
    SET
      quantity = quantity + p_quantity,
      estimated_expiry_days = COALESCE(p_estimated_expiry_days, estimated_expiry_days),
      expiration_date = COALESCE(v_expiry_date, expiration_date),
      calories_per_100g = COALESCE(p_calories_per_100g, calories_per_100g),
      protein_per_100g = COALESCE(p_protein_per_100g, protein_per_100g),
      carbs_per_100g = COALESCE(p_carbs_per_100g, carbs_per_100g),
      fat_per_100g = COALESCE(p_fat_per_100g, fat_per_100g),
      image_url = COALESCE(p_image_url, image_url),
      added_via = 'camera_ai',
      updated_at = NOW()
    WHERE id = v_item_id;
  ELSE
    -- Insert new item
    INSERT INTO public.fridge_inventory (
      user_id, item_name, quantity, unit, category,
      estimated_expiry_days, expiration_date,
      calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
      image_url, added_via
    ) VALUES (
      p_user_id, p_item_name, p_quantity, p_unit, p_category,
      p_estimated_expiry_days, v_expiry_date,
      p_calories_per_100g, p_protein_per_100g, p_carbs_per_100g, p_fat_per_100g,
      p_image_url, 'camera_ai'
    )
    RETURNING id INTO v_item_id;
  END IF;

  RETURN v_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED DATA: Default expiry windows by category
-- ============================================================

CREATE TABLE IF NOT EXISTS public.food_category_expiry_defaults (
  category        TEXT PRIMARY KEY,
  expiry_days     INTEGER NOT NULL,
  storage_tip     TEXT
);

INSERT INTO public.food_category_expiry_defaults (category, expiry_days, storage_tip) VALUES
  ('dairy', 7, 'Keep refrigerated below 4°C'),
  ('meat_raw', 3, 'Keep refrigerated, use or freeze within 3 days'),
  ('meat_cooked', 4, 'Refrigerate promptly, use within 4 days'),
  ('poultry_raw', 2, 'Keep refrigerated, use within 2 days or freeze'),
  ('seafood_raw', 2, 'Keep refrigerated on ice, use within 2 days'),
  ('vegetables_leafy', 5, 'Store in crisper drawer, keep dry'),
  ('vegetables_root', 14, 'Store in cool, dark place'),
  ('fruits_berries', 5, 'Refrigerate, do not wash until ready to eat'),
  ('fruits_citrus', 21, 'Can be stored at room temperature or refrigerated'),
  ('fruits_tropical', 7, 'Ripen at room temperature, then refrigerate'),
  ('bread', 5, 'Store in cool dry place or freeze for longer'),
  ('eggs', 35, 'Keep refrigerated in original carton'),
  ('condiments', 90, 'Refrigerate after opening'),
  ('leftovers', 4, 'Refrigerate promptly, use within 4 days'),
  ('frozen', 90, 'Keep frozen at -18°C or below'),
  ('canned', 730, 'Store in cool, dry place; refrigerate after opening'),
  ('dry_goods', 365, 'Store in airtight container in cool, dry place'),
  ('beverages', 7, 'Refrigerate after opening'),
  ('herbs_fresh', 7, 'Wrap in damp paper towel, refrigerate'),
  ('other', 7, 'Check packaging for storage instructions')
ON CONFLICT (category) DO NOTHING;

-- ============================================================
-- TABLE: saved_recipes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saved_recipes (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users_profiles(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  recipe_name             TEXT NOT NULL,
  description             TEXT,
  prep_time_minutes       INTEGER,
  cook_time_minutes       INTEGER,
  servings                INTEGER NOT NULL DEFAULT 1,
  calories_per_serving    NUMERIC(7,1),
  protein_per_serving_g   NUMERIC(6,2),
  carbs_per_serving_g     NUMERIC(6,2),
  fat_per_serving_g       NUMERIC(6,2),
  fiber_per_serving_g     NUMERIC(6,2),

  -- JSONB arrays for structured data
  ingredients             JSONB NOT NULL DEFAULT '[]',
  instructions            JSONB NOT NULL DEFAULT '[]',
  waste_reduction_tip     TEXT,

  -- Metadata
  is_favorite             BOOLEAN NOT NULL DEFAULT FALSE,
  generated_from_inventory TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_saved_recipes_user_id ON public.saved_recipes(user_id);
CREATE INDEX idx_saved_recipes_favorite ON public.saved_recipes(user_id, is_favorite);

CREATE TRIGGER trigger_saved_recipes_updated_at
  BEFORE UPDATE ON public.saved_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved recipes"
  ON public.saved_recipes FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- PATCH: Expand fitness_goal CHECK constraint to match app constants
-- ============================================================
-- The original constraint used 'maintain' and 'improve_health'.
-- The app constants use 'maintain_weight', 'improve_performance',
-- 'eat_healthier', and 'manage_condition'. This patch aligns them.

ALTER TABLE public.users_profiles
  DROP CONSTRAINT IF EXISTS users_profiles_fitness_goal_check;

ALTER TABLE public.users_profiles
  ADD CONSTRAINT users_profiles_fitness_goal_check
  CHECK (fitness_goal IN (
    'lose_weight',
    'maintain_weight',
    'gain_muscle',
    'improve_performance',
    'eat_healthier',
    'manage_condition'
  ));

-- Update default value to use new enum value
ALTER TABLE public.users_profiles
  ALTER COLUMN fitness_goal SET DEFAULT 'maintain_weight';
