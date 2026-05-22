-- Run once in Supabase SQL editor (existing projects)
alter table public.leads
  add column if not exists use_case text not null default 'sales';

alter table public.leads
  drop constraint if exists leads_use_case_check;

alter table public.leads
  add constraint leads_use_case_check
  check (use_case in ('sales', 'apollo'));

create index if not exists leads_use_case_idx on public.leads (use_case);
