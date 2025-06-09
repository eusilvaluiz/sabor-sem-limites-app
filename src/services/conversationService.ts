import { supabase } from '@/lib/supabase'

export interface DatabaseConversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

// Converter dados do banco para interface do frontend
function convertFromDatabase(dbConversation: DatabaseConversation): Conversation {
  return {
    id: dbConversation.id,
    userId: dbConversation.user_id,
    title: dbConversation.title,
    createdAt: dbConversation.created_at,
    updatedAt: dbConversation.updated_at
  }
}

// Converter dados do frontend para interface do banco
function convertToDatabase(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Omit<DatabaseConversation, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: conversation.userId,
    title: conversation.title
  }
}

export const conversationService = {
  // Criar nova conversa
  async createConversation(userId: string, firstMessage: string): Promise<Conversation> {
    try {
      console.log('🗣️ ConversationService - Criando conversa:', { userId, firstMessage });
      
      // Truncar a primeira mensagem para 25 caracteres + "..."
      const title = firstMessage.length > 25 
        ? firstMessage.substring(0, 25) + "..." 
        : firstMessage

      console.log('🗣️ ConversationService - Título gerado:', title);

      const conversationData = convertToDatabase({
        userId,
        title
      })

      console.log('🗣️ ConversationService - Dados para inserir:', conversationData);

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert([conversationData])
        .select()
        .single()

      if (error) {
        console.error('🗣️ ConversationService - Erro ao inserir:', error);
        throw new Error(`Erro ao criar conversa: ${error.message}`)
      }

      console.log('🗣️ ConversationService - Conversa criada com sucesso:', data);
      return convertFromDatabase(data)
    } catch (error) {
      console.error('🗣️ ConversationService - Erro geral ao criar conversa:', error)
      throw error
    }
  },

  // Carregar conversas do usuário
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      console.log('🗣️ ConversationService - Buscando conversas para:', userId);
      
      // Verificar se o usuário está autenticado no Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🗣️ ConversationService - Usuário autenticado:', user?.id);
      console.log('🗣️ ConversationService - Erro de auth:', authError);

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      console.log('🗣️ ConversationService - Query result:', { data, error });

      if (error) {
        console.error('🗣️ ConversationService - Erro na query:', error);
        throw new Error(`Erro ao carregar conversas: ${error.message}`)
      }

      const result = (data || []).map(convertFromDatabase);
      console.log('🗣️ ConversationService - Conversas convertidas:', result);
      
      return result;
    } catch (error) {
      console.error('🗣️ ConversationService - Erro geral ao carregar conversas:', error)
      throw error
    }
  },

  // Deletar conversa
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)

      if (error) {
        throw new Error(`Erro ao deletar conversa: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error)
      throw error
    }
  },

  // Atualizar timestamp da conversa (quando recebe nova mensagem)
  async updateConversationTimestamp(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (error) {
        throw new Error(`Erro ao atualizar conversa: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error)
      throw error
    }
  }
} 