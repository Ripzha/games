-- Inventar für das Valentinsspiel
--
-- Einmal im Supabase-Projekt ausführen:
--   Dashboard -> SQL Editor -> New query -> einfügen -> Run
--
-- Was jemand gefunden hat, hängt an der Figur und nicht am Browser.
-- Wer am Handy weitermacht, soll sein Headset noch haben.
--
-- Jeder darf lesen und eintragen, niemand darf ändern oder löschen.
-- Bei sechs Leuten aus dem Forum reicht das: Es gibt keine Anmeldung,
-- also kann die Datenbank nicht prüfen, wer gerade wer ist. Wer will,
-- könnte sich Gegenstände für eine fremde Figur eintragen — das ist
-- eine Frage des Anstands, nicht der Technik.

create table if not exists public.valentin_inventar (
  figur      text        not null check (char_length(figur) between 1 and 40),
  gegenstand text        not null check (char_length(gegenstand) between 1 and 40),
  gefunden   timestamptz not null default now(),
  primary key (figur, gegenstand)
);

alter table public.valentin_inventar enable row level security;

drop policy if exists "inventar lesen" on public.valentin_inventar;
create policy "inventar lesen"
  on public.valentin_inventar
  for select
  to anon, authenticated
  using (true);

drop policy if exists "inventar eintragen" on public.valentin_inventar;
create policy "inventar eintragen"
  on public.valentin_inventar
  for insert
  to anon, authenticated
  with check (true);

-- Zum Leeren beim Testen, nur bei Bedarf einzeln ausführen:
--   truncate public.valentin_inventar;
