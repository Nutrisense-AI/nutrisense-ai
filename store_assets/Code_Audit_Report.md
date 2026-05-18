# NutriSense AI — Final Code Audit Report

**Date:** May 14, 2026  
**Audit Scope:** Full cross-stack synchronization check across SQL schema, Edge Functions, and frontend state.

## Summary

All critical issues identified during this audit have been resolved. The project is now in a clean, production-ready state with zero known runtime connection errors.

## Issues Found and Fixed

| # | Severity | File | Issue | Fix Applied |
|---|---|---|---|---|
| 1 | **Critical** | `src/services/iap.ts` | Table name typo: `.from('user_profiles')` — missing the `s` | Fixed to `.from('users_profiles')` |
| 2 | **Critical** | `src/services/iap.ts` | Column names `pro_purchase_date` and `revenuecat_customer_id` do not exist in schema | Fixed to `pro_unlocked_at` and `revenuecat_user_id` |
| 3 | **High** | `src/constants/index.ts` | `PRO_PRODUCT_ID` was `nutrisense_pro_lifetime` — inconsistent with `iap.ts` | Aligned to `com.nutrisenseai.pro.lifetime` |
| 4 | **High** | `src/constants/index.ts` | `IAP_PRODUCTS.PRO_PACK_LIFETIME.id` was `nutrisense_pro_lifetime` | Aligned to `com.nutrisenseai.pro.lifetime` |
| 5 | **Medium** | `src/constants/index.ts` | `PRO_ENTITLEMENT_ID` was `pro_pack` — inconsistent with `ENTITLEMENTS.PRO = 'pro'` in `iap.ts` | Aligned to `pro` |
| 6 | **Medium** | `app/onboarding.tsx` | Default `fitnessGoal` state was `'maintain'` — not a valid enum value in the updated SQL schema | Fixed to `'maintain_weight'` |
| 7 | **Medium** | `supabase/migrations/001_initial_schema.sql` | `fitness_goal` CHECK constraint used old values (`maintain`, `improve_health`) | Patched to include all 6 new enum values |
| 8 | **Low** | `supabase/config.toml` | Edge functions had `verify_jwt = false` — security risk in production | Changed to `verify_jwt = true` |
| 9 | **Low** | `src/api/analyzeFood.ts` | `API_BASE_URL` had no fallback to Supabase URL | Added fallback: `${SUPABASE_URL}/functions/v1` |
| 10 | **Low** | `src/api/generateRecipes.ts` | Same as above | Same fix applied |

## Schema vs. Frontend Cross-Reference

### Table: `users_profiles`
All reads and writes from `AuthProvider.tsx`, `onboarding.tsx`, and `iap.ts` reference correct column names: `display_name`, `is_pro`, `pro_unlocked_at`, `revenuecat_user_id`, `fitness_goal`, `activity_level`, `dietary_restrictions`, `severe_allergens`.

### Table: `daily_food_logs`
All inserts from `camera.tsx`, `barcode.tsx`, `recipe-detail.tsx`, and reads from `useDailyLog.ts`, `dashboard.tsx`, `food-detail.tsx` reference correct column names. All required NOT NULL columns (`food_name`, `meal_type`, `log_source`, `calories`, `protein_g`, `carbs_g`, `fat_g`) are always provided.

### Table: `fridge_inventory`
All reads and updates from `fridge.tsx` reference correct column names: `item_name`, `category`, `quantity`, `unit`, `expiry_status`, `is_consumed`, `is_deleted`, `expiration_date`.

### Table: `saved_recipes`
The insert in `recipe-detail.tsx` references correct column names: `recipe_name`, `description`, `servings`, `ingredients` (JSONB), `instructions` (JSONB), `is_favorite`, `generated_from_inventory`.

### RPC Functions
All three RPC calls are verified:
* `smart_copy_yesterday_log(p_user_id)` — called correctly in `dashboard.tsx` and `useDailyLog.ts`.
* `get_daily_totals(p_user_id, p_date)` — called correctly in `dashboard.tsx`.
* `upsert_fridge_item(p_user_id, p_item_name, ...)` — called correctly in the `analyze-plate` Edge Function.

### Path Aliases
All 13 `@/` import aliases resolve correctly to files in `src/`. Both `tsconfig.json` and `babel.config.js` are aligned.

## Clean Items (No Issues Found)

The following components and files were audited and found to be clean with no issues:

* `app/_layout.tsx` — Provider hierarchy is correct.
* `app/(tabs)/_layout.tsx` — Tab navigation is correct.
* `supabase/functions/analyze-plate/index.ts` — OpenAI Vision schema, CORS headers, and Supabase upsert are correct.
* `supabase/functions/generate-recipe/index.ts` — OpenAI recipe schema and response format are correct.
* `src/context/IAPProvider.tsx` — RevenueCat initialization, purchase flow, and restore flow are correct.
* `src/context/AuthProvider.tsx` — Supabase session management and profile loading are correct.
* `src/context/store.ts` — All Zustand slices export correctly.
* All `@/` import aliases resolve to existing files.
