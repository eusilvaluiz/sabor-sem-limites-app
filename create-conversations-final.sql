-- 1. Criar tabela ai_conversations se não existir
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar coluna conversation_id em ai_chat_messages se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_chat_messages' 
        AND column_name = 'conversation_id'
    ) THEN 
        ALTER TABLE ai_chat_messages 
        ADD COLUMN conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_conversation_id ON ai_chat_messages(conversation_id);

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para ai_conversations
DO $$
BEGIN
    -- Dropar políticas existentes se houver
    DROP POLICY IF EXISTS "Users can view own conversations" ON ai_conversations;
    DROP POLICY IF EXISTS "Users can create own conversations" ON ai_conversations;
    DROP POLICY IF EXISTS "Users can update own conversations" ON ai_conversations;
    DROP POLICY IF EXISTS "Users can delete own conversations" ON ai_conversations;
    DROP POLICY IF EXISTS "Admin can manage all conversations" ON ai_conversations;

    -- Criar novas políticas
    CREATE POLICY "Users can view own conversations" 
    ON ai_conversations FOR SELECT 
    USING (user_id = auth.uid());

    CREATE POLICY "Users can create own conversations" 
    ON ai_conversations FOR INSERT 
    WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update own conversations" 
    ON ai_conversations FOR UPDATE 
    USING (user_id = auth.uid());

    CREATE POLICY "Users can delete own conversations" 
    ON ai_conversations FOR DELETE 
    USING (user_id = auth.uid());

    CREATE POLICY "Admin can manage all conversations" 
    ON ai_conversations FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
END $$;

-- 6. Atualizar políticas de ai_chat_messages para incluir conversation_id
DO $$
BEGIN
    -- Dropar política existente de mensagens
    DROP POLICY IF EXISTS "Users can manage own chat messages" ON ai_chat_messages;
    
    -- Criar nova política que considera conversation_id
    CREATE POLICY "Users can manage own chat messages" 
    ON ai_chat_messages FOR ALL 
    USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
END $$;

-- 7. Criar trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_ai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at_trigger ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at_trigger
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_conversations_updated_at();

-- 8. Verificação final
SELECT 
    'ai_conversations criada' as status,
    (SELECT count(*) FROM information_schema.tables WHERE table_name = 'ai_conversations') as table_exists;

SELECT 
    'conversation_id column added' as status,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'ai_chat_messages' AND column_name = 'conversation_id') as column_exists; 