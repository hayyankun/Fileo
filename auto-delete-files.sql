-- SQL script to create an auto-deletion function for files after a specific period
-- This marks files as deleted (moves them to trash) after the specified period

-- Extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a settings table to store global application settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default auto-deletion settings (30 days)
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'auto_deletion',
  '{"enabled": true, "days_to_keep": 30, "notify_before_days": 7}',
  'Settings for automatic file deletion'
) ON CONFLICT (key) DO NOTHING;

-- Enable RLS on settings table
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy for settings
CREATE POLICY "Only admins can modify settings" 
  ON public.app_settings 
  USING (auth.jwt() ->> 'role' = 'admin');
  
-- Everyone can view settings
CREATE POLICY "Everyone can view settings" 
  ON public.app_settings 
  FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT ALL ON public.app_settings TO authenticated WITH admin role;

-- Create function to mark old files as deleted
CREATE OR REPLACE FUNCTION public.mark_old_files_as_deleted()
RETURNS INTEGER AS $$
DECLARE
  days_to_keep INTEGER;
  enabled BOOLEAN;
  files_marked INTEGER;
BEGIN
  -- Get settings from the app_settings table
  SELECT 
    (value->>'days_to_keep')::INTEGER,
    (value->>'enabled')::BOOLEAN
  INTO 
    days_to_keep,
    enabled
  FROM public.app_settings
  WHERE key = 'auto_deletion';
  
  -- Default values if settings not found
  days_to_keep := COALESCE(days_to_keep, 30);
  enabled := COALESCE(enabled, true);
  
  -- Only proceed if enabled
  IF NOT enabled THEN
    RETURN 0;
  END IF;
  
  -- Mark files as deleted if they are older than the cutoff date
  UPDATE public.files
  SET 
    is_deleted = true,
    deleted_at = NOW()
  WHERE 
    created_at < (NOW() - (days_to_keep || ' days')::INTERVAL)
    AND is_deleted = false;
  
  -- Get count of affected rows
  GET DIAGNOSTICS files_marked = ROW_COUNT;
  
  RETURN files_marked;
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run daily at midnight
SELECT cron.schedule('0 0 * * *', 'SELECT public.mark_old_files_as_deleted();');

-- Create a function to get notification about files that will be deleted soon
CREATE OR REPLACE FUNCTION public.get_files_to_be_deleted_soon(user_id UUID)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  days_left INTEGER
) AS $$
DECLARE
  days_to_keep INTEGER;
  notify_before_days INTEGER;
BEGIN
  -- Get settings
  SELECT 
    (value->>'days_to_keep')::INTEGER,
    (value->>'notify_before_days')::INTEGER
  INTO 
    days_to_keep,
    notify_before_days
  FROM public.app_settings
  WHERE key = 'auto_deletion';
  
  -- Default values if settings not found
  days_to_keep := COALESCE(days_to_keep, 30);
  notify_before_days := COALESCE(notify_before_days, 7);
  
  RETURN QUERY
  SELECT 
    f.id,
    f.filename,
    f.created_at,
    days_to_keep - EXTRACT(DAY FROM NOW() - f.created_at)::INTEGER AS days_left
  FROM 
    public.files f
  WHERE 
    f.user_id = user_id
    AND f.is_deleted = false
    AND f.created_at < (NOW() - ((days_to_keep - notify_before_days) || ' days')::INTERVAL)
    AND f.created_at > (NOW() - (days_to_keep || ' days')::INTERVAL)
  ORDER BY 
    f.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_files_to_be_deleted_soon(UUID) TO authenticated;
