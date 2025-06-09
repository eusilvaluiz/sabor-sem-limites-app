-- REMOVER POLITICAS DE EMERGENCIA
DROP POLICY IF EXISTS "emergency_all_users" ON users;
DROP POLICY IF EXISTS "emergency_all_categories" ON categories;
DROP POLICY IF EXISTS "emergency_all_recipes" ON recipes;
DROP POLICY IF EXISTS "emergency_all_nutrition" ON nutrition_data;
DROP POLICY IF EXISTS "emergency_all_favorites" ON favorites;

-- POLITICAS RLS PARA PRODUCAO COM SUPABASE AUTH

-- USERS: Admin gerencia todos, usuario ve proprio perfil
CREATE POLICY "users_admin_all" ON users 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "users_own_profile" ON users 
  FOR SELECT USING (auth.uid() = id);

-- CATEGORIES: Todos podem ver, admin gerencia
CREATE POLICY "categories_public_read" ON categories 
  FOR SELECT USING (true);

CREATE POLICY "categories_admin_write" ON categories 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "categories_admin_update" ON categories 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "categories_admin_delete" ON categories 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RECIPES: Todos podem ver, admin gerencia
CREATE POLICY "recipes_public_read" ON recipes 
  FOR SELECT USING (true);

CREATE POLICY "recipes_admin_write" ON recipes 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "recipes_admin_update" ON recipes 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "recipes_admin_delete" ON recipes 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- NUTRITION_DATA: Todos podem ver, admin gerencia
CREATE POLICY "nutrition_public_read" ON nutrition_data 
  FOR SELECT USING (true);

CREATE POLICY "nutrition_admin_write" ON nutrition_data 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "nutrition_admin_update" ON nutrition_data 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "nutrition_admin_delete" ON nutrition_data 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- FAVORITES: Usuario autenticado gerencia proprios favoritos
CREATE POLICY "favorites_own_read" ON favorites 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_own_write" ON favorites 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_own_update" ON favorites 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "favorites_own_delete" ON favorites 
  FOR DELETE USING (auth.uid() = user_id); 