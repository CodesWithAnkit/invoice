-- Phase 4: Add extra columns to projects for full detail page support
alter table public.projects
  add column if not exists description text,
  add column if not exists notes text,
  add column if not exists start_date date,
  add column if not exists expected_end_date date;
