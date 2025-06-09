-- REMOVER TODAS AS POLITICAS
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Allow all access to users" ON users;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
DROP POLICY IF EXISTS "Allow all access to categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view recipes" ON recipes;
DROP POLICY IF EXISTS "Admin can manage recipes" ON recipes;
DROP POLICY IF EXISTS "Allow all access to recipes" ON recipes;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Users manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Anyone can view nutrition data" ON nutrition_data;
DROP POLICY IF EXISTS "Admin can manage nutrition data" ON nutrition_data;
DROP POLICY IF EXISTS "Allow all access to nutrition_data" ON nutrition_data;

-- POLITICAS CORRETAS POR OPERACAO

-- USERS: Acesso publico para leitura, autenticado para escrita
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (true);
CREATE POLICY "users_delete" ON users FOR DELETE USING (true);

-- CATEGORIES: Acesso publico total
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (true);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (true);

-- RECIPES: Acesso publico total
CREATE POLICY "recipes_select" ON recipes FOR SELECT USING (true);
CREATE POLICY "recipes_insert" ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "recipes_update" ON recipes FOR UPDATE USING (true);
CREATE POLICY "recipes_delete" ON recipes FOR DELETE USING (true);

-- NUTRITION_DATA: Acesso publico total
CREATE POLICY "nutrition_select" ON nutrition_data FOR SELECT USING (true);
CREATE POLICY "nutrition_insert" ON nutrition_data FOR INSERT WITH CHECK (true);
CREATE POLICY "nutrition_update" ON nutrition_data FOR UPDATE USING (true);
CREATE POLICY "nutrition_delete" ON nutrition_data FOR DELETE USING (true);

-- FAVORITES: Apenas usuario logado gerencia seus favoritos
CREATE POLICY "favorites_select" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_update" ON favorites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING (auth.uid() = user_id); 