import { AllergenType, DietaryRestriction } from '@/types/database';

interface AnalyzeFoodParams {
  imageUri: string;
  imageBase64: string | null;
  mode: 'food' | 'fridge';
  userId: string;
  allergens: AllergenType[];
  dietaryRestrictions: DietaryRestriction[];
}

export interface FoodAnalysisResult {
  food_name: string;
  serving_description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  sugar_g: number;
  saturated_fat_g: number;
  ingredients: string[];
  allergen_flags: AllergenType[];
  health_snippet: string;
  confidence_score: number;
  dietary_flags: string[];
}

export interface FridgeAnalysisResult {
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    estimated_expiry_days: number;
    calories_per_100g: number | null;
    protein_per_100g: number | null;
    carbs_per_100g: number | null;
    fat_per_100g: number | null;
  }>;
  health_snippet: string;
}

// EXPO_PUBLIC_API_URL should be set to your Supabase project URL
// e.g. https://YOUR_PROJECT_ID.supabase.co
// The edge function will be called at: {SUPABASE_URL}/functions/v1/analyze-plate
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `${SUPABASE_URL}/functions/v1`;

export async function analyzeFood(
  params: AnalyzeFoodParams
): Promise<FoodAnalysisResult | FridgeAnalysisResult> {
  const { imageBase64, imageUri, mode, userId, allergens, dietaryRestrictions } = params;

  // Build form data with image
  const formData = new FormData();
  formData.append('mode', mode);
  formData.append('userId', userId);
  formData.append('allergens', JSON.stringify(allergens));
  formData.append('dietaryRestrictions', JSON.stringify(dietaryRestrictions));

  if (imageBase64) {
    formData.append('imageBase64', imageBase64);
  } else {
    // Fallback: send as file
    const filename = imageUri.split('/').pop() ?? 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('image', { uri: imageUri, name: filename, type } as any);
  }

  // Determine endpoint: if using default Supabase URL, it's /functions/v1/analyze-plate
  const endpoint = `${API_BASE_URL}/analyze-plate`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    headers: {
      'x-user-id': userId,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error ?? `Analysis failed with status ${response.status}`);
  }

  const result = await response.json();
  return result;
}
