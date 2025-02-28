-- This function will create the files table if it doesn't exist
-- It needs to be run in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_files_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'files'
  ) THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.files (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      filename text NOT NULL,
      file_path text NOT NULL,
      file_url text NOT NULL,
      size integer NOT NULL,
      created_at timestamp with time zone DEFAULT now(),
      is_deleted boolean DEFAULT false,
      is_starred boolean DEFAULT false
    );

    -- Create RLS policies
    ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
    
    -- Allow users to select their own files
    CREATE POLICY "Users can view their own files" 
      ON public.files FOR SELECT 
      USING (auth.uid() = user_id);
    
    -- Allow users to insert their own files
    CREATE POLICY "Users can insert their own files" 
      ON public.files FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    -- Allow users to update their own files
    CREATE POLICY "Users can update their own files" 
      ON public.files FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION create_files_table_if_not_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION create_files_table_if_not_exists() TO anon;

-- Run the function to create the table if needed
SELECT create_files_table_if_not_exists();

-- Ensure storage permissions are correct
-- These need to be executed in the Supabase Dashboard -> Storage -> Policies
/*
For bucket 'files':

1. Policy for file uploads:
CREATE POLICY "Allow authenticated users to upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure uploads go in user's own folder
  (storage.foldername(name))[1] = auth.uid()::text
);

2. Policy for file access:
CREATE POLICY "Allow users to view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  -- Ensure accessed files are in user's own folder
  (storage.foldername(name))[1] = auth.uid()::text
);

3. Make bucket public (in UI)
*/
