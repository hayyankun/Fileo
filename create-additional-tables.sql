-- This script creates additional tables needed for Fileo application

-- Create shares table for file sharing functionality
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

-- Make sure files table has is_starred and is_deleted columns
DO $$ 
BEGIN
  -- Add is_starred column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'is_starred'
  ) THEN
    ALTER TABLE public.files ADD COLUMN is_starred boolean DEFAULT false;
  END IF;
  
  -- Add is_deleted column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE public.files ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
END $$;
