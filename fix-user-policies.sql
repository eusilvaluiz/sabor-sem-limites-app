-- CORRIGIR POLITICAS RLS DA TABELA USERS
-- Remove politicas recursivas que impedem fetchUserProfile

DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_own_profile" ON users;

-- Politica simples: usuario autenticado pode ler tabela users
CREATE POLICY "users_authenticated_read" ON users 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Politica para escrita: apenas o proprio usuario pode atualizar
CREATE POLICY "users_own_update" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Politica para insercao: permitir criacao via admin (usersService)
CREATE POLICY "users_create_new" ON users 
  FOR INSERT WITH CHECK (true); 