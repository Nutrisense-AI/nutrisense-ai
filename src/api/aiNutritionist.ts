import { supabase } from './supabase';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getAiNutritionistResponse(messages: ChatMessage[]) {
  try {
    // We use a direct fetch to handle the stream correctly, 
    // as supabase.functions.invoke might try to parse the JSON.
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-nutritionist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { error: error.message || `AI error: ${response.status}` };
    }

    return { data: response.body };
  } catch (err: any) {
    console.error('Unexpected error in getAiNutritionistResponse:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
