// Supabase Edge Function: /api/analyze-plate
// Accepts mobile image uploads, routes to OpenAI Vision,
// returns strict JSON nutritional analysis with allergen detection.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================
// JSON Schema for food plate analysis
// ============================================================
const FOOD_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    food_name: {
      type: 'string',
      description: 'Primary name of the identified food or meal',
    },
    serving_description: {
      type: 'string',
      description: 'Description of the estimated serving size (e.g., "1 medium plate, ~350g")',
    },
    calories: {
      type: 'number',
      description: 'Total estimated calories (kcal)',
    },
    protein_g: {
      type: 'number',
      description: 'Total protein in grams',
    },
    carbs_g: {
      type: 'number',
      description: 'Total carbohydrates in grams',
    },
    fat_g: {
      type: 'number',
      description: 'Total fat in grams',
    },
    fiber_g: {
      type: 'number',
      description: 'Total dietary fiber in grams',
    },
    sodium_mg: {
      type: 'number',
      description: 'Total sodium in milligrams',
    },
    sugar_g: {
      type: 'number',
      description: 'Total sugar in grams',
    },
    saturated_fat_g: {
      type: 'number',
      description: 'Saturated fat in grams',
    },
    ingredients: {
      type: 'array',
      items: { type: 'string' },
      description: 'Array of identified ingredients or food components',
    },
    allergen_flags: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'peanuts', 'tree_nuts', 'milk', 'eggs', 'fish', 'shellfish',
          'wheat', 'soy', 'sesame', 'mustard', 'celery', 'lupin',
          'molluscs', 'sulphites',
        ],
      },
      description: 'Array of detected allergens present in the food',
    },
    health_snippet: {
      type: 'string',
      description: 'Exactly 2 sentences of motivational AI health coaching about this meal',
    },
    confidence_score: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Confidence score of the analysis (0.0 to 1.0)',
    },
    dietary_flags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Dietary categories this food fits (e.g., "keto", "vegan", "gluten_free")',
    },
  },
  required: [
    'food_name', 'serving_description', 'calories', 'protein_g',
    'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg', 'sugar_g',
    'saturated_fat_g', 'ingredients', 'allergen_flags',
    'health_snippet', 'confidence_score', 'dietary_flags',
  ],
  additionalProperties: false,
};

// ============================================================
// JSON Schema for fridge/pantry analysis
// ============================================================
const FRIDGE_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the food item' },
          quantity: { type: 'number', description: 'Estimated quantity visible' },
          unit: {
            type: 'string',
            description: 'Unit of measurement (item, kg, g, L, ml, pack, bottle, can, etc.)',
          },
          category: {
            type: 'string',
            enum: [
              'dairy', 'meat_raw', 'meat_cooked', 'poultry_raw', 'seafood_raw',
              'vegetables_leafy', 'vegetables_root', 'fruits_berries', 'fruits_citrus',
              'fruits_tropical', 'bread', 'eggs', 'condiments', 'leftovers',
              'frozen', 'canned', 'dry_goods', 'beverages', 'herbs_fresh', 'other',
            ],
          },
          estimated_expiry_days: {
            type: 'number',
            description: 'Estimated days until expiration based on typical storage life',
          },
          calories_per_100g: {
            type: ['number', 'null'],
            description: 'Approximate calories per 100g if known, null otherwise',
          },
          protein_per_100g: {
            type: ['number', 'null'],
            description: 'Approximate protein per 100g if known, null otherwise',
          },
          carbs_per_100g: {
            type: ['number', 'null'],
            description: 'Approximate carbs per 100g if known, null otherwise',
          },
          fat_per_100g: {
            type: ['number', 'null'],
            description: 'Approximate fat per 100g if known, null otherwise',
          },
        },
        required: ['name', 'quantity', 'unit', 'category', 'estimated_expiry_days'],
        additionalProperties: false,
      },
      description: 'Array of identified food items in the fridge/pantry',
    },
    health_snippet: {
      type: 'string',
      description: 'Brief 2-sentence observation about the nutritional quality of the visible inventory',
    },
  },
  required: ['items', 'health_snippet'],
  additionalProperties: false,
};

async function analyzeWithOpenAI(
  imageBase64: string,
  mode: 'food' | 'fridge',
  userAllergens: string[],
  userDietaryRestrictions: string[]
): Promise<any> {
  const schema = mode === 'food' ? FOOD_ANALYSIS_SCHEMA : FRIDGE_ANALYSIS_SCHEMA;

  const systemPrompt =
    mode === 'food'
      ? `You are an expert nutritionist and food scientist AI. Analyze the food image provided and return precise nutritional data. 
         The user has the following severe allergens to flag: ${userAllergens.length > 0 ? userAllergens.join(', ') : 'none specified'}.
         The user follows these dietary restrictions: ${userDietaryRestrictions.length > 0 ? userDietaryRestrictions.join(', ') : 'none'}.
         Be conservative and accurate with calorie estimates. When uncertain, provide a reasonable range estimate in the serving_description.
         The health_snippet must be exactly 2 motivational sentences that are specific to the meal shown.`
      : `You are an expert nutritionist AI analyzing a fridge or pantry shelf image. 
         Identify all visible food items, estimate quantities, and provide typical storage life estimates.
         Be thorough - identify every visible food item including condiments, beverages, and packaged goods.
         The health_snippet should comment on the overall nutritional quality and variety of the visible inventory.`;

  const userPrompt =
    mode === 'food'
      ? 'Analyze this food image and provide complete nutritional information in the specified JSON format.'
      : 'Identify all food items visible in this fridge/pantry image and provide inventory data in the specified JSON format.';

  // Implement 30-second timeout resilience
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: mode === 'food' ? 'food_analysis' : 'fridge_analysis',
            strict: true,
            schema,
          },
        },
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      // Friendly notice for auth/balance delays
      if (response.status === 401 || response.status === 429) {
        throw new Error('AI Server warming up—please try scanning your food again in a few moments.');
      }
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    return JSON.parse(content);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('AI Server warming up—please try scanning your food again in a few moments.');
    }
    throw error;
  }
}

async function upsertFridgeItems(
  supabase: any,
  userId: string,
  items: any[],
  imageUrl: string | null
): Promise<void> {
  for (const item of items) {
    await supabase.rpc('upsert_fridge_item', {
      p_user_id: userId,
      p_item_name: item.name,
      p_quantity: item.quantity,
      p_unit: item.unit,
      p_category: item.category,
      p_estimated_expiry_days: item.estimated_expiry_days,
      p_calories_per_100g: item.calories_per_100g ?? null,
      p_protein_per_100g: item.protein_per_100g ?? null,
      p_carbs_per_100g: item.carbs_per_100g ?? null,
      p_fat_per_100g: item.fat_per_100g ?? null,
      p_image_url: imageUrl,
    });
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing x-user-id header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const mode = (formData.get('mode') as string) ?? 'food';
    const allergens = JSON.parse((formData.get('allergens') as string) ?? '[]');
    const dietaryRestrictions = JSON.parse(
      (formData.get('dietaryRestrictions') as string) ?? '[]'
    );

    let imageBase64: string | null = null;

    // Try base64 first (faster, no re-encoding needed)
    const base64Input = formData.get('imageBase64') as string | null;
    if (base64Input) {
      imageBase64 = base64Input;
    } else {
      // Fall back to file upload
      const imageFile = formData.get('image') as File | null;
      if (!imageFile) {
        return new Response(
          JSON.stringify({ error: 'No image provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      imageBase64 = btoa(String.fromCharCode(...uint8Array));
    }

    // Run OpenAI vision analysis
    const analysisResult = await analyzeWithOpenAI(
      imageBase64,
      mode as 'food' | 'fridge',
      allergens,
      dietaryRestrictions
    );

    // For fridge mode: automatically upsert items into inventory
    if (mode === 'fridge' && analysisResult.items?.length > 0) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await upsertFridgeItems(supabase, userId, analysisResult.items, null);
    }

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('analyze-plate error:', error);
    return new Response(
      JSON.stringify({
        error: error.message ?? 'Internal server error',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
