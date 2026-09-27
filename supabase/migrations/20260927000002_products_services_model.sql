-- Migration to add Phase 3 Products & Services fields to `products` table

DO $$ BEGIN
  CREATE TYPE public.item_kind AS ENUM ('product', 'service');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pricing_model_enum AS ENUM ('fixed', 'hourly', 'daily', 'percentage');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS kind public.item_kind NOT NULL DEFAULT 'product',
ADD COLUMN IF NOT EXISTS pricing_model public.pricing_model_enum NOT NULL DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS unit text,
ADD COLUMN IF NOT EXISTS default_rate_minor bigint,
ADD COLUMN IF NOT EXISTS default_percent_bp integer,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
