-- Create the routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  stops JSONB NOT NULL,
  routes JSONB NOT NULL,
  selected_route JSONB,
  quantum_params JSONB,
  classical_params JSONB
);

-- Enable Row Level Security (RLS)
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to insert their own routes
CREATE POLICY "Users can insert their own routes"
ON routes
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to view their own routes
CREATE POLICY "Users can view their own routes"
ON routes
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create a policy that allows users to update their own routes
CREATE POLICY "Users can update their own routes"
ON routes
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to delete their own routes
CREATE POLICY "Users can delete their own routes"
ON routes
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
