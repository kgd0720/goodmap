-- Create tables
CREATE TABLE IF NOT EXISTS public.brochures (
  id text PRIMARY KEY,
  title text,
  description text,
  filename text,
  url text,
  type text,
  "allowDownload" boolean DEFAULT false,
  "thumbnailUrl" text,
  "uploadedAt" timestamp with time zone DEFAULT now(),
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.videos (
  id text PRIMARY KEY,
  title text,
  "desc" text,
  "youtubeUrl" text,
  duration text,
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0
);
