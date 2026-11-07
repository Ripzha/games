-- Figur abgeben — Ergänzung zu spieler.sql
--
-- Einmal im Supabase-Projekt ausführen:
--   Dashboard -> SQL Editor -> New query -> einfügen -> Run
--
-- Bisher konnte eine Figur nur im Dashboard freigegeben werden. Löschen
-- darf anon nämlich nicht, und das soll auch so bleiben — sonst könnte
-- jeder jede Figur freiräumen.
--
-- Diese Funktion löscht die Zeile nur, wenn der richtige Schlüssel
-- mitkommt. Sie läuft mit erhöhten Rechten, gibt aber nichts preis
-- ausser ja oder nein.

create or replace function public.valentin_abgeben(p_figur text, p_schluessel text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  getroffen integer;
begin
  delete from public.valentin_spieler
   where figur = p_figur and schluessel = p_schluessel;
  get diagnostics getroffen = row_count;
  return getroffen > 0;
end;
$$;

revoke all on function public.valentin_abgeben(text, text) from public;
grant execute on function public.valentin_abgeben(text, text) to anon, authenticated;
