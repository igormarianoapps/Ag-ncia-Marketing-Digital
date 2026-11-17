create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  company text not null check (char_length(btrim(company)) between 1 and 160),
  email text not null check (char_length(btrim(email)) between 3 and 254),
  phone text not null check (phone ~ '^\([0-9]{2}\) [0-9]\.[0-9]{4}-[0-9]{4}$'),
  message text not null check (char_length(btrim(message)) between 1 and 2000)
);

alter table public.contact_leads enable row level security;
revoke all on public.contact_leads from public, anon, authenticated;
grant insert on public.contact_leads to service_role;
