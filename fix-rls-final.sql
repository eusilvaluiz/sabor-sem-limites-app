-- SOLUÇÃO DEFINITIVA: Políticas RLS Corretas para DeliciasDoBem
-- Este arquivo resolve o problema de travamento na consulta de usuários

-- 1. LIMPAR todas as políticas existentes
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 2. RECRIAR políticas SIMPLES e CORRETAS para tabela users
CREATE POLICY "users_can_view_own_profile" ON users
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "admin_can_view_all_users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "users_can_update_own_profile" ON users
  FOR UPDATE
  USING (auth.uid()::text = id);

CREATE POLICY "admin_can_manage_all_users" ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND u.role = 'admin'
    )
  );

-- 3. GARANTIR que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS para outras tabelas (simplificadas)
-- FAVORITOS
DROP POLICY IF EXISTS "users_manage_own_favorites" ON favorites;
DROP POLICY IF EXISTS "Users manage own favorites" ON favorites;

CREATE POLICY "favorites_users_own" ON favorites
  FOR ALL
  USING (auth.uid()::text = user_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RECEITAS (público para leitura)
DROP POLICY IF EXISTS "recipes_public_read" ON recipes;
DROP POLICY IF EXISTS "recipes_admin_manage" ON recipes;

CREATE POLICY "recipes_public_select" ON recipes
  FOR SELECT
  USING (true);

CREATE POLICY "recipes_admin_manage" ON recipes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND u.role = 'admin'
    )
  );

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- CATEGORIAS (público para leitura)
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_manage" ON categories;

CREATE POLICY "categories_public_select" ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "categories_admin_manage" ON categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::text 
      AND u.role = 'admin'
    )
  );

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICAÇÃO final
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('users', 'favorites', 'recipes', 'categories')
ORDER BY tablename, policyname; 