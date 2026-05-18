-- Create feature_requests table for customer insights
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('feature_request', 'bug_report', 'suggestion', 'question')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'in_progress', 'completed', 'closed')),
  votes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_feature_requests_user_id ON feature_requests(user_id);
CREATE INDEX idx_feature_requests_status ON feature_requests(status);
CREATE INDEX idx_feature_requests_created_at ON feature_requests(created_at DESC);

-- Enable RLS
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own requests
CREATE POLICY "Users can insert their own requests" ON feature_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can view all requests (for community voting)
CREATE POLICY "Users can view all requests" ON feature_requests
  FOR SELECT USING (true);

-- RLS Policy: Users can update their own requests
CREATE POLICY "Users can update their own requests" ON feature_requests
  FOR UPDATE USING (auth.uid() = user_id);
