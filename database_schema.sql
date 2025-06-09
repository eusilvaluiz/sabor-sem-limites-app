-- =============================================
-- DELICIASDOBEM - ESTRUTURA COMPLETA DO BANCO
-- =============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. TABELA USERS (USUÁRIOS)
-- =============================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. TABELA CATEGORIES (CATEGORIAS)
-- =============================================
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  image_url TEXT,
  recipe_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. TABELA RECIPES (RECEITAS)
-- =============================================
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  servings INTEGER NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('Fácil', 'Médio', 'Difícil')),
  is_gluten_free BOOLEAN DEFAULT FALSE,
  is_lactose_free BOOLEAN DEFAULT FALSE,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. TABELA NUTRITION_DATA (DADOS NUTRICIONAIS)
-- =============================================
CREATE TABLE nutrition_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  calories DECIMAL(8,2),
  protein DECIMAL(8,2),
  carbs DECIMAL(8,2),
  fat DECIMAL(8,2),
  fiber DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. TABELA FAVORITES (FAVORITOS)
-- =============================================
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- =============================================
-- 6. TABELA CHEF_LEIA_CONFIG (CONFIGURAÇÃO IA)
-- =============================================
CREATE TABLE chef_leia_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'Chef LéIA',
  description TEXT NOT NULL,
  assistant_id VARCHAR(255), -- OpenAI Assistant ID
  avatar_type VARCHAR(20) CHECK (avatar_type IN ('emoji', 'image')) DEFAULT 'emoji',
  avatar_emoji VARCHAR(10) DEFAULT '👩‍🍳',
  avatar_color VARCHAR(7) DEFAULT '#ec4899',
  avatar_image_url TEXT,
  suggestions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. TABELA AI_CHAT_MESSAGES (MENSAGENS IA)
-- =============================================
CREATE TABLE ai_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chat_type VARCHAR(20) CHECK (chat_type IN ('general', 'recipe', 'function')) NOT NULL,
  message_type VARCHAR(10) CHECK (message_type IN ('user', 'ai')) NOT NULL,
  message TEXT NOT NULL,
  thread_id VARCHAR(255), -- Para Assistant OpenAI
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE, -- Para chat contextual
  function_type VARCHAR(50), -- Para os 4 boxes (adjust_servings, substitute_ingredients, etc)
  context_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. TABELA RECIPE_SHARES (COMPARTILHAMENTOS)
-- =============================================
CREATE TABLE recipe_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform VARCHAR(50) NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_recipes_category_id ON recipes(category_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_is_gluten_free ON recipes(is_gluten_free);
CREATE INDEX idx_recipes_is_lactose_free ON recipes(is_lactose_free);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);
CREATE INDEX idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_messages_chat_type ON ai_chat_messages(chat_type);
CREATE INDEX idx_ai_chat_messages_thread_id ON ai_chat_messages(thread_id);
CREATE INDEX idx_ai_chat_messages_recipe_id ON ai_chat_messages(recipe_id);
CREATE INDEX idx_ai_chat_messages_created_at ON ai_chat_messages(created_at DESC);
CREATE INDEX idx_recipe_shares_recipe_id ON recipe_shares(recipe_id);
CREATE INDEX idx_recipe_shares_platform ON recipe_shares(platform);

-- =============================================
-- TRIGGERS PARA CONTADORES
-- =============================================
CREATE OR REPLACE FUNCTION update_category_recipe_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories SET recipe_count = recipe_count + 1 WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories SET recipe_count = recipe_count - 1 WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id THEN
    UPDATE categories SET recipe_count = recipe_count - 1 WHERE id = OLD.category_id;
    UPDATE categories SET recipe_count = recipe_count + 1 WHERE id = NEW.category_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipe_category_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_category_recipe_count();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nutrition_data_updated_at BEFORE UPDATE ON nutrition_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chef_leia_config_updated_at BEFORE UPDATE ON chef_leia_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HABILITAR ROW LEVEL SECURITY
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chef_leia_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS CORRIGIDAS
-- =============================================

-- USUÁRIOS
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can manage all users" ON users 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- CATEGORIAS
CREATE POLICY "Everyone can view categories" ON categories 
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert categories" ON categories 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Admin can update categories" ON categories 
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Admin can delete categories" ON categories 
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- RECEITAS
CREATE POLICY "Everyone can view recipes" ON recipes 
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert recipes" ON recipes 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Admin can update recipes" ON recipes 
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Admin can delete recipes" ON recipes 
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- DADOS NUTRICIONAIS
CREATE POLICY "Everyone can view nutrition data" ON nutrition_data 
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage nutrition data" ON nutrition_data 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- FAVORITOS
CREATE POLICY "Users manage own favorites" ON favorites 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CONFIGURAÇÃO CHEF LÉIA
CREATE POLICY "Everyone can view chef config" ON chef_leia_config 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manages chef config" ON chef_leia_config 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- MENSAGENS IA
CREATE POLICY "Users manage own chat" ON ai_chat_messages 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all chats" ON ai_chat_messages 
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- COMPARTILHAMENTOS
CREATE POLICY "Everyone can share recipes" ON recipe_shares 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own shares" ON recipe_shares 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Inserir categorias padrão
INSERT INTO categories (name, image_url, recipe_count) VALUES
('Doces', '/placeholder.svg', 0),
('Salgados', '/placeholder.svg', 0),
('Lanches', '/placeholder.svg', 0),
('Sobremesas', '/placeholder.svg', 0),
('Pães', '/placeholder.svg', 0),
('Bebidas', '/placeholder.svg', 0),
('Massas', '/placeholder.svg', 0),
('Saladas', '/placeholder.svg', 0),
('Sopas', '/placeholder.svg', 0),
('Vitaminas', '/placeholder.svg', 0),
('Molhos', '/placeholder.svg', 0),
('Bolos', '/placeholder.svg', 0);

-- Inserir configuração inicial da Chef LéIA
INSERT INTO chef_leia_config (title, description, suggestions) VALUES
('Chef LéIA', 
 'Sua assistente pessoal para dúvidas sobre nutrição, dietas e alimentação saudável',
 '["Quantas calorias devo consumir por dia?", "Quais são as melhores fontes de proteína?", "Como montar um cardápio saudável?", "Preciso de suplementos vitamínicos?"]'
);

-- =============================================
-- COMENTÁRIOS FINAIS
-- =============================================

/*
ESTRUTURA CRIADA PARA DELICIASDOBEM:

✅ Sistema de usuários com roles (admin/user)
✅ Gestão completa de receitas e categorias  
✅ Sistema de favoritos
✅ Integração com OpenAI (Assistant ID + prompts)
✅ Chat contextual por receita
✅ Tracking de compartilhamentos
✅ Dados nutricionais
✅ Row Level Security configurado CORRETAMENTE
✅ Índices para performance
✅ Triggers para contadores automáticos
✅ Dados iniciais

PRÓXIMOS PASSOS:
1. Criar usuário admin inicial
2. Configurar Assistant ID da OpenAI
3. Conectar frontend com Supabase
4. Implementar autenticação
*/ 