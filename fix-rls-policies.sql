-- REMOVER POLITICAS PROBLEMATICAS
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

-- POLITICAS SIMPLES SEM RECURSAO
-- Usuarios: acesso total para evitar recursao
CREATE POLICY "Allow all access to users" ON users
  FOR ALL USING (true);

-- Categorias: acesso total 
CREATE POLICY "Allow all access to categories" ON categories
  FOR ALL USING (true);

-- Receitas: acesso total
CREATE POLICY "Allow all access to recipes" ON recipes
  FOR ALL USING (true);

-- Favoritos: so usuario logado gerencia seus favoritos
CREATE POLICY "Users manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Dados nutricionais: acesso total
CREATE POLICY "Allow all access to nutrition_data" ON nutrition_data
  FOR ALL USING (true); 