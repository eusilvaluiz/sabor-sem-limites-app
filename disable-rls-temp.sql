-- TEMPORÁRIO: Desabilitar RLS para testar se é problema de autenticação
ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY;

-- Verificar se há conversas na tabela
SELECT COUNT(*) as total_conversations FROM ai_conversations;

-- Verificar estrutura da tabela
\d ai_conversations;

-- Mostrar algumas conversas
SELECT * FROM ai_conversations ORDER BY created_at DESC LIMIT 3; 