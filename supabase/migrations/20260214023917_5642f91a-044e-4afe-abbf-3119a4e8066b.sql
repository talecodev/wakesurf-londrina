
-- Drop the profile_id constraint and make it a single-owner config table
ALTER TABLE public.google_integrations DROP CONSTRAINT google_integrations_profile_id_key;
ALTER TABLE public.google_integrations DROP CONSTRAINT google_integrations_profile_id_fkey;
ALTER TABLE public.google_integrations ALTER COLUMN profile_id DROP NOT NULL;
ALTER TABLE public.google_integrations ADD COLUMN is_owner BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.google_integrations ADD CONSTRAINT google_integrations_owner_unique UNIQUE (is_owner) ;
