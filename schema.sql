create table public.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  fb_lead_id text unique,
  name text not null,
  email text,
  phone text,
  company text,
  doors int,
  message text,
  fit_score smallint check (fit_score between 1 and 5),
  fit_reason text,
  draft_reply text
);

-- RLS on with no policies: only the server's secret key can touch this table
alter table public.leads enable row level security;
