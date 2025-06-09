import { supabase } from '@/lib/supabase'

export interface DatabaseRecipe {
  id: string
  title: string
  description: string
  image_url: string | null
  category_id: string | null
  servings: number
  difficulty: string
  is_gluten_free: boolean
  is_lactose_free: boolean
  ingredients: string
  instructions: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  image: string
  categoryId: string | null
  categoryName?: string
  servings: number
  difficulty: "Fácil" | "Médio" | "Difícil"
  isGlutenFree: boolean
  isLactoseFree: boolean
  ingredients: string
  instructions: string
  createdBy: string | null
  createdAt: string
}

// Converter dados do banco para interface do frontend
function convertFromDatabase(dbRecipe: DatabaseRecipe, categoryName?: string): Recipe {
  return {
    id: dbRecipe.id,
    title: dbRecipe.title,
    description: dbRecipe.description,
    image: dbRecipe.image_url || '/placeholder.svg',
    categoryId: dbRecipe.category_id,
    categoryName: categoryName,
    servings: dbRecipe.servings,
    difficulty: dbRecipe.difficulty as "Fácil" | "Médio" | "Difícil",
    isGlutenFree: dbRecipe.is_gluten_free,
    isLactoseFree: dbRecipe.is_lactose_free,
    ingredients: dbRecipe.ingredients,
    instructions: dbRecipe.instructions,
    createdBy: dbRecipe.created_by,
    createdAt: dbRecipe.created_at.split('T')[0] // Formato YYYY-MM-DD
  }
}

// Converter dados do frontend para interface do banco
function convertToDatabase(recipe: Omit<Recipe, 'id' | 'createdAt' | 'categoryName'>): Omit<DatabaseRecipe, 'id' | 'created_at' | 'updated_at'> {
  return {
    title: recipe.title,
    description: recipe.description,
    image_url: recipe.image === '/placeholder.svg' ? null : recipe.image,
    category_id: recipe.categoryId,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    is_gluten_free: recipe.isGlutenFree,
    is_lactose_free: recipe.isLactoseFree,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    created_by: recipe.createdBy
  }
}

export const recipesService = {
  // Listar todas as receitas com nome da categoria
  async getAll(): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          categories!recipes_category_id_fkey(name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Erro ao carregar receitas')
      }

      return (data || []).map(recipe => 
        convertFromDatabase(recipe, recipe.categories?.name)
      )
    } catch (error) {
      throw error
    }
  },

  // Criar nova receita
  async create(recipeData: Omit<Recipe, 'id' | 'createdAt' | 'categoryName'>): Promise<Recipe> {
    try {
      const dbData = convertToDatabase(recipeData)
      
      const { data, error } = await supabase
        .from('recipes')
        .insert([dbData])
        .select(`
          *,
          categories!recipes_category_id_fkey(name)
        `)
        .single()

      if (error) {
        throw new Error('Erro ao criar receita')
      }

      return convertFromDatabase(data, data.categories?.name)
    } catch (error) {
      throw error
    }
  },

  // Atualizar receita existente
  async update(id: string, recipeData: Omit<Recipe, 'id' | 'createdAt' | 'categoryName'>): Promise<Recipe> {
    try {
      const dbData = convertToDatabase(recipeData)
      
      const { data, error } = await supabase
        .from('recipes')
        .update(dbData)
        .eq('id', id)
        .select(`
          *,
          categories!recipes_category_id_fkey(name)
        `)
        .single()

      if (error) {
        throw new Error('Erro ao atualizar receita')
      }

      return convertFromDatabase(data, data.categories?.name)
    } catch (error) {
      throw error
    }
  },

  // Deletar receita
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error('Erro ao deletar receita')
      }
    } catch (error) {
      throw error
    }
  },

  // Buscar receitas por termo
  async search(searchTerm: string): Promise<Recipe[]> {
    try {
      if (!searchTerm.trim()) {
        return this.getAll()
      }

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          categories!recipes_category_id_fkey(name)
        `)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,ingredients.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Erro ao buscar receitas')
      }

      return (data || []).map(recipe => 
        convertFromDatabase(recipe, recipe.categories?.name)
      )
    } catch (error) {
      throw error
    }
  },

  // Buscar receitas por categoria
  async getByCategory(categoryId: string): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          categories!recipes_category_id_fkey(name)
        `)
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Erro ao buscar receitas por categoria')
      }

      return (data || []).map(recipe => 
        convertFromDatabase(recipe, recipe.categories?.name)
      )
    } catch (error) {
      throw error
    }
  },

  // Buscar receita específica por ID
  async getById(id: string): Promise<Recipe | null> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          categories!recipes_category_id_fkey(name)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Receita não encontrada
          return null
        }
        throw new Error('Erro ao buscar receita')
      }

      return convertFromDatabase(data, data.categories?.name)
    } catch (error) {
      throw error
    }
  }
} 