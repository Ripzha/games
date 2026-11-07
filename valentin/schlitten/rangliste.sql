-- Rangliste für Vaas' Schrottschlitten
--
-- Einmal im Supabase-Projekt ausführen:
--   Dashboard -> SQL Editor -> New query -> einfügen -> Run
--
-- Jeder darf lesen und eintragen. Ändern und Löschen kann niemand,
-- weil es dafür keine Regel gibt — ohne Regel verbietet Supabase es.

create table if not exists public.schlitten_rangliste (
  id        bigint generated always as identity primary key,
  figur     text        not null check (char_length(figur) between 1 and 40),
  punkte    integer     not null check (punkte >= 0 and punkte <= 10000000),
  geschafft boolean     not null default false,
  gefahren  timestamptz not null default now()
);

create index if not exists schlitten_rangliste_punkte_idx
  on public.schlitten_rangliste (punkte desc);

alter table public.schlitten_rangliste enable row level security;

drop policy if exists "rangliste lesen" on public.schlitten_rangliste;
create policy "rangliste lesen"
  on public.schlitten_rangliste
  for select
  to anon, authenticated
  using (true);

drop policy if exists "rangliste eintragen" on public.schlitten_rangliste;
create policy "rangliste eintragen"
  on public.schlitten_rangliste
  for insert
  to anon, authenticated
  with check (true);

-- Zum Leeren der Rangliste, falls beim Testen Unsinn drin steht.
-- Nicht Teil der Einrichtung, nur bei Bedarf einzeln ausführen:
--   truncate public.schlitten_rangliste;
