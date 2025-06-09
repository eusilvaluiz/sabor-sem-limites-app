-- CORRIGIR POLITICAS RLS DA TABELA FAVORITES

DROP POLICY IF EXISTS "favorites_own_read" ON favorites;
DROP POLICY IF EXISTS "favorites_own_write" ON favorites;
DROP POLICY IF EXISTS "favorites_own_update" ON favorites;
DROP POLICY IF EXISTS "favorites_own_delete" ON favorites;

-- Politicas simples que funcionam
CREATE POLICY "favorites_user_read" ON favorites 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_user_insert" ON favorites 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_user_update" ON favorites 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "favorites_user_delete" ON favorites 
  FOR DELETE USING (auth.uid() = user_id); 