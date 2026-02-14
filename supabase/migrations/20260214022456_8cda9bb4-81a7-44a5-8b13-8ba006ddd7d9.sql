
-- Create google_integrations table
CREATE TABLE public.google_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiration TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (matching existing app pattern - no auth)
CREATE POLICY "Anyone can read google_integrations"
ON public.google_integrations FOR SELECT USING (true);

CREATE POLICY "Anyone can insert google_integrations"
ON public.google_integrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update google_integrations"
ON public.google_integrations FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete google_integrations"
ON public.google_integrations FOR DELETE USING (true);

-- Add google_event_id and google_calendar_id to sessions
ALTER TABLE public.sessions
ADD COLUMN google_event_id TEXT,
ADD COLUMN google_calendar_id TEXT,
ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;
