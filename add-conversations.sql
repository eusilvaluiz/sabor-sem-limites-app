-- ========================================
-- ADICIONAR SISTEMA DE CONVERSAS CHEF LÉIA
-- ========================================

-- 1. Criar tabela de conversas
CREATE TABLE ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar conversation_id à tabela de mensagens
ALTER TABLE ai_chat_messages 
ADD COLUMN conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE;

-- 3. Criar índices para performance
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX idx_ai_chat_messages_conversation_id ON ai_chat_messages(conversation_id);

-- 4. Trigger para updated_at automático na tabela de conversas
CREATE TRIGGER update_ai_conversations_updated_at 
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS Policies para ai_conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own conversations
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own conversations
CREATE POLICY "Users can insert own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own conversations
CREATE POLICY "Users can update own conversations" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own conversations
CREATE POLICY "Users can delete own conversations" ON ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Admin can manage all conversations
CREATE POLICY "Admin can manage conversations" ON ai_conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 6. Atualizar política de mensagens para incluir conversation_id
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own messages" ON ai_chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON ai_chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON ai_chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON ai_chat_messages;

-- Novas políticas para mensagens
CREATE POLICY "Users can view own messages" ON ai_chat_messages
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_chat_messages.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages" ON ai_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (conversation_id IS NULL OR EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_chat_messages.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own messages" ON ai_chat_messages
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_chat_messages.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own messages" ON ai_chat_messages
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_chat_messages.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Admin pode gerenciar todas as mensagens
CREATE POLICY "Admin can manage all messages" ON ai_chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ========================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ======================================== 