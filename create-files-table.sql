-- SQL script to create the files table in Supabase

-- Drop dependent tables first if they exist
DROP TABLE IF EXISTS public.shares CASCADE;

-- Now we can safely drop the files table
DROP TABLE IF EXISTS public.files CASCADE;

-- Create files table
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_url text,
  size bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  is_deleted boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  mime_type text,
  metadata jsonb
);

-- Add comments
COMMENT ON TABLE public.files IS 'Stores file metadata for uploaded files';
COMMENT ON COLUMN public.files.id IS 'Unique identifier for the file';
COMMENT ON COLUMN public.files.user_id IS 'ID of the user who owns the file';
COMMENT ON COLUMN public.files.filename IS 'Original filename of the uploaded file';
COMMENT ON COLUMN public.files.file_path IS 'Path to the file in storage';
COMMENT ON COLUMN public.files.file_url IS 'Public URL to access the file';
COMMENT ON COLUMN public.files.is_deleted IS 'Whether the file is in the trash';
COMMENT ON COLUMN public.files.is_starred IS 'Whether the file is starred by the user';

-- Create indexes for better performance
CREATE INDEX idx_files_user_id ON public.files(user_id);
CREATE INDEX idx_files_created_at ON public.files(created_at);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own files" 
  ON public.files FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own files" 
  ON public.files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" 
  ON public.files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" 
  ON public.files FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO authenticated;

-- Now recreate the shares table
CREATE TABLE IF NOT EXISTS public.shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, -- Owner of the file
  name text, -- Optional name for the share
  access_key text NOT NULL, -- Unique access key for the share link
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone, -- NULL means no expiration
  is_password_protected boolean DEFAULT false,
  password_hash text, -- Hashed password if protected
  view_count integer DEFAULT 0, -- Number of times this share has been viewed
  is_active boolean DEFAULT true
);

-- Add comments
COMMENT ON TABLE public.shares IS 'Stores share links for files';
COMMENT ON COLUMN public.shares.file_id IS 'ID of the shared file';
COMMENT ON COLUMN public.shares.user_id IS 'ID of the user who created the share';
COMMENT ON COLUMN public.shares.access_key IS 'Unique key used in the share URL';
COMMENT ON COLUMN public.shares.expires_at IS 'When the share link expires (NULL = never)';
COMMENT ON COLUMN public.shares.is_password_protected IS 'Whether the share requires a password';
COMMENT ON COLUMN public.shares.password_hash IS 'Hashed password for protected shares';

-- Create indexes
CREATE INDEX idx_shares_file_id ON public.shares(file_id);
CREATE INDEX idx_shares_user_id ON public.shares(user_id);
CREATE INDEX idx_shares_access_key ON public.shares(access_key);

-- Enable RLS
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Create policies for the shares table
CREATE POLICY "Users can view their own shares" 
  ON public.shares FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares for their files" 
  ON public.shares FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their shares" 
  ON public.shares FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their shares"
  ON public.shares FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shares TO authenticated;
GRANT SELECT ON public.shares TO anon;
