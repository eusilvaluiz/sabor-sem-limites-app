import { supabase } from '@/lib/supabase'
import { aiService } from './openai'
import { conversationService } from './conversationService'

export interface DatabaseChatMessage {
  id: string
  user_id: string
  chat_type: 'general' | 'recipe' | 'function'
  message_type: 'user' | 'ai'
  message: string
  thread_id: string | null
  recipe_id: string | null
  function_type: string | null
  context_data: any | null
  conversation_id: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  userId: string
  chatType: 'general' | 'recipe' | 'function'
  messageType: 'user' | 'ai'
  message: string
  threadId: string | null
  recipeId: string | null
  functionType: string | null
  contextData: any | null
  conversationId: string | null
  createdAt: string
}

// Converter dados do banco para interface do frontend
function convertFromDatabase(dbMessage: DatabaseChatMessage): ChatMessage {
  return {
    id: dbMessage.id,
    userId: dbMessage.user_id,
    chatType: dbMessage.chat_type,
    messageType: dbMessage.message_type,
    message: dbMessage.message,
    threadId: dbMessage.thread_id,
    recipeId: dbMessage.recipe_id,
    functionType: dbMessage.function_type,
    contextData: dbMessage.context_data,
    conversationId: dbMessage.conversation_id,
    createdAt: dbMessage.created_at
  }
}

// Converter dados do frontend para interface do banco
function convertToDatabase(message: Omit<ChatMessage, 'id' | 'createdAt'>): Omit<DatabaseChatMessage, 'id' | 'created_at'> {
  return {
    user_id: message.userId,
    chat_type: message.chatType,
    message_type: message.messageType,
    message: message.message,
    thread_id: message.threadId,
    recipe_id: message.recipeId,
    function_type: message.functionType,
    context_data: message.contextData,
    conversation_id: message.conversationId
  }
}

export const chatService = {
  // Enviar mensagem para Chef LéIA e salvar no banco
  async sendToChefLeia(userId: string, message: string, conversationId?: string, threadId?: string): Promise<{
    userMessage: ChatMessage,
    aiMessage: ChatMessage,
    newThreadId: string,
    conversationId: string
  }> {
    try {
      let currentConversationId = conversationId;

      // Se não há conversa, criar uma nova
      if (!currentConversationId) {
        const conversation = await conversationService.createConversation(userId, message);
        currentConversationId = conversation.id;
      }

      // 1. Salvar mensagem do usuário no banco
      const userMessageData = convertToDatabase({
        userId,
        chatType: 'general',
        messageType: 'user',
        message,
        threadId: threadId || null,
        recipeId: null,
        functionType: null,
        contextData: null,
        conversationId: currentConversationId
      })

      const { data: savedUserMessage, error: userError } = await supabase
        .from('ai_chat_messages')
        .insert([userMessageData])
        .select()
        .single()

      if (userError) {
        throw new Error(`Erro ao salvar mensagem do usuário: ${userError.message}`)
      }

      // 2. Enviar para OpenAI (PARALELO COM SAVES)
      const { response: aiResponse, threadId: responseThreadId } = await aiService.chatWithChefLeia(message, threadId)

      // 3. Salvar resposta da IA no banco (PARALELO)
      const aiMessageData = convertToDatabase({
        userId,
        chatType: 'general',
        messageType: 'ai',
        message: aiResponse,
        threadId: responseThreadId,
        recipeId: null,
        functionType: null,
        contextData: null,
        conversationId: currentConversationId
      })

      const [savedAiMessage] = await Promise.all([
        supabase.from('ai_chat_messages').insert([aiMessageData]).select().single(),
        conversationService.updateConversationTimestamp(currentConversationId)
      ]);

      if (savedAiMessage.error) {
        throw new Error(`Erro ao salvar resposta da IA: ${savedAiMessage.error.message}`)
      }

      return {
        userMessage: convertFromDatabase(savedUserMessage),
        aiMessage: convertFromDatabase(savedAiMessage.data),
        newThreadId: responseThreadId,
        conversationId: currentConversationId
      };
    } catch (error) {
      console.error('🗣️ ChatService - Erro:', error)
      throw error
    }
  },

  // Carregar mensagens de uma conversa específica
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Erro ao carregar mensagens: ${error.message}`)
      }

      return (data || []).map(convertFromDatabase)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      throw error
    }
  },

  // Carregar histórico de chat do usuário (todas as conversas - LEGACY)
  async getChatHistory(userId: string, chatType: 'general' | 'recipe' = 'general', recipeId?: string): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('chat_type', chatType)
        .order('created_at', { ascending: true })

      if (recipeId) {
        query = query.eq('recipe_id', recipeId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Erro ao carregar histórico: ${error.message}`)
      }

      return (data || []).map(convertFromDatabase)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      throw error
    }
  },

  // Limpar histórico de chat
  async clearChatHistory(userId: string, chatType: 'general' | 'recipe' = 'general', recipeId?: string): Promise<void> {
    try {
      let query = supabase
        .from('ai_chat_messages')
        .delete()
        .eq('user_id', userId)
        .eq('chat_type', chatType)

      if (recipeId) {
        query = query.eq('recipe_id', recipeId)
      }

      const { error } = await query

      if (error) {
        throw new Error(`Erro ao limpar histórico: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao limpar histórico:', error)
      throw error
    }
  },

  // Salvar mensagem contextual de receita
  async saveRecipeMessage(userId: string, recipeId: string, messageType: 'user' | 'ai', message: string, contextData?: any): Promise<ChatMessage> {
    try {
      const messageData = convertToDatabase({
        userId,
        chatType: 'recipe',
        messageType,
        message,
        threadId: null,
        recipeId,
        functionType: null,
        contextData: contextData || null,
        conversationId: null
      });

      const { data: savedMessage, error } = await supabase
        .from('ai_chat_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao salvar mensagem: ${error.message}`);
      }

      return convertFromDatabase(savedMessage);
    } catch (error) {
      console.error('Erro ao salvar mensagem de receita:', error);
      throw error;
    }
  }
} 