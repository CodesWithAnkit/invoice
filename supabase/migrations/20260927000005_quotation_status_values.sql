-- Phase 6 (R-11, AC-QUOTE-005): the full quotation status set.
-- Kept in its own migration: a new enum value can't be used in the same
-- transaction that adds it.
alter type public.quotation_status add value if not exists 'Viewed';
alter type public.quotation_status add value if not exists 'Archived';
