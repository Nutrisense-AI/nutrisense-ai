// Supabase Edge Function: /api/generate-recipe
// Accepts fridge inventory array and returns 3 zero-waste recipes
// using OpenAI GPT-4 with strict JSON schema output.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================
// JSON Schema for recipe generation
// ============================================================
const RECIPE_SCHEMA = {
  type: 'object',
  properties: {
    recipes: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Creative, appetizing recipe name',
          },
          description: {
            type: 'string',
            description: 'One to two sentence description of the dish',
          },
          prep_time_minutes: {
            type: 'number',
            description: 'Preparation time in minutes',
          },
          cook_time_minutes: {
            type: 'number',
            description: 'Cooking time in minutes',
          },
          servings: {
            type: 'number',
            description: 'Number of servings the recipe yields',
          },
          calories_per_serving: {
            type: 'number',
            description: 'Estimated calories per serving',
          },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item: {
                  type: 'string',
                  description: 'Ingredient name',
                },
                amount: {
                  type: 'string',
                  description: 'Quantity and unit (e.g., "2 cups", "150g", "1 tbsp")',
                },
              },
              required: ['item', 'amount'],
              additionalProperties: false,
            },
            description: 'Complete list of ingredients with amounts',
          },
          instructions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Step-by-step cooking instructions, each step as a separate string',
          },
          macros: {
            type: 'object',
            properties: {
              protein_g: { type: 'number' },
              carbs_g: { type: 'number' },
              fat_g: { type: 'number' },
              fiber_g: { type: 'number' },
            },
            required: ['protein_g', 'carbs_g', 'fat_g', 'fiber_g'],
            additionalProperties: false,
            description: 'Macronutrients per serving in grams',
          },
          waste_reduction_tip: {
            type: 'string',
            description: 'One specific tip for reducing food waste with this recipe (e.g., using scraps, storing leftovers)',
          },
        },
        required: [
          'name', 'description', 'prep_time_minutes', 'cook_time_minutes',
          'servings', 'calories_per_serving', 'ingredients', 'instructions',
          'macros', 'waste_reduction_tip',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['recipes'],
  additionalProperties: false,
};

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

    const body = await req.json();
    const { inventory } = body;

    if (!inventory || !Array.isArray(inventory) || inventory.length === 0) {
      return new Response(
        JSON.stringify({ error: 'inventory array is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build inventory description for the prompt
    const inventoryDescription = inventory
      .map((item: any) => {
        const expiryNote =
          item.expiry_status === 'expired'
            ? ' (EXPIRED — do not use)'
            : item.expiry_status === 'expiring_today'
            ? ' (expires today — prioritize)'
            : item.expiry_status === 'use_soon'
            ? ' (use soon)'
            : '';
        return `- ${item.name}: ${item.quantity} ${item.unit}${expiryNote}`;
      })
      .join('\n');

    // Prioritize expiring items
    const expiringItems = inventory
      .filter((i: any) => i.expiry_status === 'expiring_today' || i.expiry_status === 'use_soon')
      .map((i: any) => i.name);

    const priorityNote =
      expiringItems.length > 0
        ? `\n\nPRIORITY: Please prioritize using these items that are expiring soon: ${expiringItems.join(', ')}`
        : '';

    const systemPrompt = `You are a professional chef and nutritionist AI specializing in zero-waste cooking. 
Your goal is to create practical, delicious recipes that use ingredients from the user's fridge inventory.
Focus on:
1. Using ingredients that are expiring soon first
2. Minimizing food waste by using whole ingredients
3. Creating nutritionally balanced meals
4. Providing realistic cooking times and clear instructions
5. Varying the recipe types (e.g., one quick meal, one hearty dish, one creative option)

Always provide exactly 3 recipes. Each recipe should be distinct in style, cooking method, or cuisine type.`;

    const userPrompt = `Here is my current fridge/pantry inventory:\n\n${inventoryDescription}${priorityNote}\n\nPlease create 3 zero-waste recipes I can make with these ingredients. You may assume I have basic pantry staples (salt, pepper, olive oil, garlic, onion) even if not listed.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'recipe_generation',
            strict: true,
            schema: RECIPE_SCHEMA,
          },
        },
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('generate-recipe error:', error);
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
