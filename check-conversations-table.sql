-- Verificar se a tabela ai_conversations existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'ai_conversations'
);

-- Se existir, mostrar estrutura
\d ai_conversations;

-- Verificar se a coluna conversation_id existe em ai_chat_messages
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_chat_messages' 
AND column_name = 'conversation_id';

-- Contar conversas existentes
SELECT COUNT(*) as total_conversations FROM ai_conversations;

-- Mostrar algumas conversas de exemplo
SELECT id, user_id, title, created_at 
FROM ai_conversations 
ORDER BY created_at DESC 
LIMIT 5; 