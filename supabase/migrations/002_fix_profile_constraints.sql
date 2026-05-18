-- NutriSense AI — Fix Profile Constraints
-- Version: 002 — Syncing DB constraints with Frontend constants

-- Drop old constraints
ALTER TABLE public.users_profiles DROP CONSTRAINT IF EXISTS users_profiles_fitness_goal_check;
ALTER TABLE public.users_profiles DROP CONSTRAINT IF EXISTS users_profiles_activity_level_check;

-- Add updated constraints for fitness_goal
ALTER TABLE public.users_profiles ADD CONSTRAINT users_profiles_fitness_goal_check 
CHECK (fitness_goal IN (
  'lose_weight', 
  'maintain_weight', 
  'gain_muscle', 
  'improve_performance', 
  'eat_healthier', 
  'manage_condition'
));

-- Add updated constraints for activity_level (ensuring consistency)
ALTER TABLE public.users_profiles ADD CONSTRAINT users_profiles_activity_level_check 
CHECK (activity_level IN (
  'sedentary', 
  'lightly_active', 
  'moderately_active', 
  'very_active', 
  'extra_active'
));

-- RPC for incrementing votes on feature requests
CREATE OR REPLACE FUNCTION public.increment_feature_request_votes(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.feature_requests
  SET votes = COALESCE(votes, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
