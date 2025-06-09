import { supabase } from '@/lib/supabase'

export interface DatabaseCategory {
  id: string
  name: string
  image_url: string | null
  recipe_count: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  image: string
  recipeCount: number
  createdAt: string
}

// Converter dados do banco para interface do frontend
function convertFromDatabase(dbCategory: DatabaseCategory): Category {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    image: dbCategory.image_url || '/placeholder.svg',
    recipeCount: dbCategory.recipe_count,
    createdAt: dbCategory.created_at.split('T')[0] // Formato YYYY-MM-DD
  }
}

// Converter dados do frontend para interface do banco
function convertToDatabase(category: Omit<Category, 'id' | 'createdAt'>): Omit<DatabaseCategory, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: category.name,
    image_url: category.image === '/placeholder.svg' ? null : category.image,
    recipe_count: category.recipeCount
  }
}

export const categoriesService = {
  // Listar todas as categorias
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        throw new Error('Erro ao carregar categorias')
      }

      return (data || []).map(convertFromDatabase)
    } catch (error) {
      throw error
    }
  },

  // Criar nova categoria
  async create(categoryData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    try {
      const dbData = convertToDatabase(categoryData)
      
      const { data, error } = await supabase
        .from('categories')
        .insert([dbData])
        .select()
        .single()

      if (error) {
        throw new Error('Erro ao criar categoria')
      }

      return convertFromDatabase(data)
    } catch (error) {
      throw error
    }
  },

  // Atualizar categoria existente
  async update(id: string, categoryData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    try {
      const dbData = convertToDatabase(categoryData)
      
      const { data, error } = await supabase
        .from('categories')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error('Erro ao atualizar categoria')
      }

      return convertFromDatabase(data)
    } catch (error) {
      throw error
    }
  },

  // Deletar categoria
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error('Erro ao deletar categoria')
      }
    } catch (error) {
      throw error
    }
  },

  // Buscar categorias por nome
  async searchByName(searchTerm: string): Promise<Category[]> {
    try {
      if (!searchTerm.trim()) {
        return this.getAll()
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name')

      if (error) {
        throw new Error('Erro ao buscar categorias')
      }

      return (data || []).map(convertFromDatabase)
    } catch (error) {
      throw error
    }
  }
} 