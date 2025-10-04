-- Create table for remote scanning sessions
CREATE TABLE IF NOT EXISTS public.remote_scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  cashier_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour')
);

-- Create table for scanned items from remote device
CREATE TABLE IF NOT EXISTS public.remote_scanned_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.remote_scan_sessions(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.remote_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_scanned_items ENABLE ROW LEVEL SECURITY;

-- Policies for remote_scan_sessions
CREATE POLICY "Users can manage their own sessions"
  ON public.remote_scan_sessions
  FOR ALL
  USING (auth.uid() = cashier_id OR auth.uid() IS NULL);

-- Policies for remote_scanned_items
CREATE POLICY "Anyone can insert scanned items"
  ON public.remote_scanned_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read scanned items"
  ON public.remote_scanned_items
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update scanned items"
  ON public.remote_scanned_items
  FOR UPDATE
  USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.remote_scan_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.remote_scanned_items;

-- Add replica identity for realtime updates
ALTER TABLE public.remote_scan_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.remote_scanned_items REPLICA IDENTITY FULL;