-- Incremental migration for a project that already ran the original schema.sql (which had no
-- UPDATE policy on `citations`). Only needed for the "organise your library into collections"
-- feature — lets a citation's `label` be renamed after it's saved. Safe to run even if you're not
-- sure whether you already have this: `create policy` fails loudly (not silently) if it already
-- exists, so just re-run schema.sql's full citations section instead in that case.
create policy "Users can update own citations"
  on public.citations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
