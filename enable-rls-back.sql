-- Reabilitar RLS na tabela ai_conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Verificar se está funcionando
SELECT COUNT(*) as total_conversations FROM ai_conversations; 