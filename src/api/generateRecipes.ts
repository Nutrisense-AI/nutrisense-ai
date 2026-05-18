interface InventoryItemInput {
  name: string;
  quantity: number;
  unit: string;
  expiry_status: string;
}

interface GenerateRecipesParams {
  inventoryItems: InventoryItemInput[];
  userId: string;
}

export interface Recipe {
  name: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  calories_per_serving: number;
  ingredients: Array<{ item: string; amount: string }>;
  instructions: string[];
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  waste_reduction_tip: string;
}

// EXPO_PUBLIC_API_URL should be set to your Supabase project URL
// The edge function will be called at: {SUPABASE_URL}/functions/v1/generate-recipe
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `${SUPABASE_URL}/functions/v1`;

export async function generateRecipes(
  params: GenerateRecipesParams
): Promise<Recipe[]> {
  // Determine endpoint: if using default Supabase URL, it's /functions/v1/generate-recipe
  const endpoint = `${API_BASE_URL}/generate-recipe`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
    },
    body: JSON.stringify({
      inventory: params.inventoryItems,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error ?? `Recipe generation failed with status ${response.status}`);
  }

  const result = await response.json();
  return result.recipes ?? [];
}
