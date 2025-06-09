import { supabase } from '@/lib/supabase'

export interface DatabaseChefLeiaConfig {
  id: string
  title: string
  description: string
  assistant_id: string | null
  avatar_type: string
  avatar_emoji: string
  avatar_color: string
  avatar_image_url: string | null
  suggestions: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChefLeiaConfig {
  id: string
  title: string
  description: string
  assistantId: string | null
  avatarType: 'emoji' | 'image'
  avatarEmoji: string
  avatarColor: string
  avatarImageUrl: string | null
  suggestions: string[]
  isActive: boolean
  createdAt: string
}

// Converter dados do banco para interface do frontend
function convertFromDatabase(dbConfig: DatabaseChefLeiaConfig): ChefLeiaConfig {
  return {
    id: dbConfig.id,
    title: dbConfig.title,
    description: dbConfig.description,
    assistantId: dbConfig.assistant_id,
    avatarType: dbConfig.avatar_type as 'emoji' | 'image',
    avatarEmoji: dbConfig.avatar_emoji,
    avatarColor: dbConfig.avatar_color,
    avatarImageUrl: dbConfig.avatar_image_url,
    suggestions: dbConfig.suggestions,
    isActive: dbConfig.is_active,
    createdAt: dbConfig.created_at.split('T')[0] // Formato YYYY-MM-DD
  }
}

// Converter dados do frontend para interface do banco
function convertToDatabase(config: Omit<ChefLeiaConfig, 'id' | 'createdAt'>): Omit<DatabaseChefLeiaConfig, 'id' | 'created_at' | 'updated_at'> {
  return {
    title: config.title,
    description: config.description,
    assistant_id: config.assistantId,
    avatar_type: config.avatarType,
    avatar_emoji: config.avatarEmoji,
    avatar_color: config.avatarColor,
    avatar_image_url: config.avatarImageUrl,
    suggestions: config.suggestions,
    is_active: config.isActive
  }
}

export const chefLeiaService = {
  // Obter configuração ativa da Chef Leia
  async getActiveConfig(): Promise<ChefLeiaConfig | null> {
    try {
      const { data, error } = await supabase
        .from('chef_leia_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum registro encontrado
          return null
        }
        throw new Error('Erro ao carregar configuração da Chef LéIA')
      }

      return convertFromDatabase(data)
    } catch (error) {
      throw error
    }
  },

  // Criar configuração inicial da Chef Leia
  async createConfig(configData: Omit<ChefLeiaConfig, 'id' | 'createdAt'>): Promise<ChefLeiaConfig> {
    try {
      // Desativar todas as configurações existentes
      await supabase
        .from('chef_leia_config')
        .update({ is_active: false })
        .eq('is_active', true)

      const dbData = convertToDatabase(configData)
      
      const { data, error } = await supabase
        .from('chef_leia_config')
        .insert([dbData])
        .select()
        .single()

      if (error) {
        throw new Error('Erro ao criar configuração da Chef LéIA')
      }

      return convertFromDatabase(data)
    } catch (error) {
      throw error
    }
  },

  // Atualizar configuração existente
  async updateConfig(id: string, configData: Omit<ChefLeiaConfig, 'id' | 'createdAt'>): Promise<ChefLeiaConfig> {
    try {
      const dbData = convertToDatabase(configData)
      
      const { data, error } = await supabase
        .from('chef_leia_config')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error('Erro ao atualizar configuração da Chef LéIA')
      }

      return convertFromDatabase(data)
    } catch (error) {
      throw error
    }
  },

  // Obter ou criar configuração padrão
  async getOrCreateDefaultConfig(): Promise<ChefLeiaConfig> {
    try {
      const existingConfig = await this.getActiveConfig()
      
      if (existingConfig) {
        return existingConfig
      }

      // Criar configuração padrão
      const defaultConfig: Omit<ChefLeiaConfig, 'id' | 'createdAt'> = {
        title: "Chef LéIA",
        description: "Sua assistente pessoal para dúvidas sobre nutrição, dietas e alimentação saudável",
        assistantId: null,
        avatarType: 'emoji',
        avatarEmoji: "👩‍🍳",
        avatarColor: "#ec4899",
        avatarImageUrl: null,
        suggestions: [
          "Quantas calorias devo consumir por dia?",
          "Quais são as melhores fontes de proteína?",
          "Como montar um cardápio saudável?",
          "Preciso de suplementos vitamínicos?"
        ],
        isActive: true
      }

      return await this.createConfig(defaultConfig)
    } catch (error) {
      throw error
    }
  }
} 