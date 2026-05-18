import { supabase } from './supabase';

export interface FeatureRequest {
  id?: string;
  user_id: string;
  request_type: 'feature_request' | 'bug_report' | 'suggestion' | 'question';
  title: string;
  description: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in_review' | 'planned' | 'in_progress' | 'completed' | 'closed';
  votes?: number;
  created_at?: string;
  updated_at?: string;
}

export async function submitFeatureRequest(request: Omit<FeatureRequest, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('feature_requests')
      .insert([request])
      .select()
      .single();

    if (error) {
      console.error('Error submitting feature request:', error);
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    console.error('Unexpected error in submitFeatureRequest:', err);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function getFeatureRequests(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('feature_requests')
      .select('*')
      .order('votes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching feature requests:', error);
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    console.error('Unexpected error in getFeatureRequests:', err);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function voteOnRequest(requestId: string) {
  try {
    // Correct way to call an RPC in Supabase JS
    const { data, error } = await supabase.rpc('increment_feature_request_votes', { 
      row_id: requestId 
    });

    if (error) {
      console.error('Error voting on request:', error);
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    console.error('Unexpected error in voteOnRequest:', err);
    return { error: 'An unexpected error occurred.' };
  }
}
