-- =============================================
-- POLÍTICAS RLS PARA SISTEMA DE FAVORITOS
-- =============================================

-- PRIMEIRO: REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view recipes" ON recipes;
DROP POLICY IF EXISTS "Admin can manage recipes" ON recipes;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Anyone can view nutrition data" ON nutrition_data;
DROP POLICY IF EXISTS "Admin can manage nutrition data" ON nutrition_data;
DROP POLICY IF EXISTS "Anyone can view active chef config" ON chef_leia_config;
DROP POLICY IF EXISTS "Admin can manage chef config" ON chef_leia_config;
DROP POLICY IF EXISTS "Users can manage own chat" ON ai_chat_messages;
DROP POLICY IF EXISTS "Admin can view all chats" ON ai_chat_messages;
DROP POLICY IF EXISTS "Anyone can share recipes" ON recipe_shares;
DROP POLICY IF EXISTS "Users can view own shares" ON recipe_shares;

-- SEGUNDO: CRIAR POLÍTICAS NOVAS

-- TABELA USERS
-- Usuários podem ver próprio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar próprio perfil  
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admin pode gerenciar todos os usuários
CREATE POLICY "Admin can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TABELA CATEGORIES  
-- Todos podem ver categorias
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- Admin pode gerenciar categorias
CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TABELA RECIPES
-- Todos podem ver receitas
CREATE POLICY "Anyone can view recipes" ON recipes
  FOR SELECT USING (true);

-- Admin pode gerenciar receitas
CREATE POLICY "Admin can manage recipes" ON recipes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TABELA FAVORITES - MAIS IMPORTANTE!
-- Usuários podem gerenciar próprios favoritos
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- TABELA NUTRITION_DATA
-- Todos podem ver dados nutricionais
CREATE POLICY "Anyone can view nutrition data" ON nutrition_data
  FOR SELECT USING (true);

-- Admin pode gerenciar dados nutricionais
CREATE POLICY "Admin can manage nutrition data" ON nutrition_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TABELA CHEF_LEIA_CONFIG
-- Todos podem ver configuração ativa
CREATE POLICY "Anyone can view active chef config" ON chef_leia_config
  FOR SELECT USING (is_active = true);

-- Admin pode gerenciar configuração
CREATE POLICY "Admin can manage chef config" ON chef_leia_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TABELA AI_CHAT_MESSAGES
-- Usuários podem gerenciar próprio chat
CREATE POLICY "Users can manage own chat" ON ai_chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- Admin pode ver todos os chats
CREATE POLICY "Admin can view all chats" ON ai_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TABELA RECIPE_SHARES
-- Todos podem compartilhar receitas
CREATE POLICY "Anyone can share recipes" ON recipe_shares
  FOR INSERT WITH CHECK (true);

-- Usuários podem ver próprios compartilhamentos
CREATE POLICY "Users can view own shares" ON recipe_shares
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- AGORA EXECUTE ESTE ARQUIVO NO SEU SUPABASE!
-- ============================================= 