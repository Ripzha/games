-- Figurenbelegung für das Valentinsspiel
--
-- Einmal im Supabase-Projekt ausführen:
--   Dashboard -> SQL Editor -> New query -> einfügen -> Run
--
-- Wer eine Figur wählt, trägt sie hier ein und bekommt einen Schlüssel.
-- Die Figur ist damit belegt, bis jemand die Zeile im Dashboard löscht.
-- Ein zweiter Eintrag auf dieselbe Figur geht nicht — das verhindert der
-- Primärschlüssel, nicht eine Prüfung, die man umgehen könnte.
--
-- Den Schlüssel bekommt nur der zu sehen, der die Figur eingetragen hat.
-- Lesen darf jeder, aber nur die Spalten figur und gewaehlt — die Spalte
-- schluessel ist für anon gesperrt. Sonst könnte jeder die Schlüssel der
-- anderen abholen.

create table if not exists public.valentin_spieler (
  figur      text        primary key check (char_length(figur) between 1 and 40),
  schluessel text        not null    check (char_length(schluessel) between 6 and 40),
  gewaehlt   timestamptz not null default now()
);

alter table public.valentin_spieler enable row level security;

drop policy if exists "spieler lesen" on public.valentin_spieler;
create policy "spieler lesen"
  on public.valentin_spieler
  for select
  to anon, authenticated
  using (true);

drop policy if exists "spieler eintragen" on public.valentin_spieler;
create policy "spieler eintragen"
  on public.valentin_spieler
  for insert
  to anon, authenticated
  with check (true);

-- Spaltenweise Rechte: schluessel darf niemand lesen.
revoke all on public.valentin_spieler from anon, authenticated;
grant select (figur, gewaehlt)   on public.valentin_spieler to anon, authenticated;
grant insert (figur, schluessel) on public.valentin_spieler to anon, authenticated;

-- Zum Wechseln auf ein anderes Gerät: Figur und Schlüssel eingeben, die
-- Funktion sagt nur ja oder nein zurück. Sie läuft mit erhöhten Rechten,
-- gibt aber nichts preis ausser dieser einen Antwort.
create or replace function public.valentin_uebernehmen(p_figur text, p_schluessel text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.valentin_spieler
    where figur = p_figur and schluessel = p_schluessel
  );
$$;

revoke all on function public.valentin_uebernehmen(text, text) from public;
grant execute on function public.valentin_uebernehmen(text, text) to anon, authenticated;

-- Zum Freigeben einer Figur, falls jemand ausfällt:
--   delete from public.valentin_spieler where figur = 'chase';
-- Zum Leeren vor dem Event:
--   truncate public.valentin_spieler;
