import { supabase } from '@/lib/supabase'
import { Recipe } from './recipesService'

export interface DatabaseFavorite {
  id: string
  user_id: string
  recipe_id: string
  created_at: string
}

export interface FavoriteRecipe extends Recipe {
  favoritedAt: string
  favoriteId: string
}

// Converter dados do banco para interface do frontend
function convertFromDatabase(dbFavorite: DatabaseFavorite, recipe: Recipe): FavoriteRecipe {
  return {
    ...recipe,
    favoritedAt: dbFavorite.created_at,
    favoriteId: dbFavorite.id
  }
}

export const favoritesService = {
  // Listar todas as receitas favoritas do usuário
  async getUserFavorites(userId: string): Promise<FavoriteRecipe[]> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          recipes!favorites_recipe_id_fkey(
            *,
            categories!recipes_category_id_fkey(name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Se não há dados (usuário não tem favoritos ou não existe), retorna array vazio
      if (error || !data) {
        console.log('Usuário ainda não tem favoritos ou não existe:', error?.message)
        return []
      }

      return (data || []).map(favorite => {
        const recipe: Recipe = {
          id: favorite.recipes.id,
          title: favorite.recipes.title,
          description: favorite.recipes.description,
          image: favorite.recipes.image_url || '/placeholder.svg',
          categoryId: favorite.recipes.category_id,
          categoryName: favorite.recipes.categories?.name,
          servings: favorite.recipes.servings,
          difficulty: favorite.recipes.difficulty as "Fácil" | "Médio" | "Difícil",
          isGlutenFree: favorite.recipes.is_gluten_free,
          isLactoseFree: favorite.recipes.is_lactose_free,
          ingredients: favorite.recipes.ingredients,
          instructions: favorite.recipes.instructions,
          createdBy: favorite.recipes.created_by,
          createdAt: favorite.recipes.created_at.split('T')[0]
        }
        
        return convertFromDatabase(favorite, recipe)
      })
    } catch (error) {
      throw error
    }
  },

  // Adicionar receita aos favoritos
  async addFavorite(userId: string, recipeId: string): Promise<DatabaseFavorite> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert([{
          user_id: userId,
          recipe_id: recipeId
        }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Receita já está nos favoritos')
        }
        throw new Error('Erro ao adicionar aos favoritos')
      }

      return data
    } catch (error) {
      throw error
    }
  },

  // Remover receita dos favoritos
  async removeFavorite(userId: string, recipeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)

      if (error) {
        throw new Error('Erro ao remover dos favoritos')
      }
    } catch (error) {
      throw error
    }
  },

  // Verificar se receita está nos favoritos
  async isFavorite(userId: string, recipeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .limit(1)

      if (error) {
        console.error('Erro ao verificar favorito:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Exception ao verificar favorito:', error)
      return false
    }
  },

  // Alternar status de favorito
  async toggleFavorite(userId: string, recipeId: string): Promise<boolean> {
    try {
      const isFav = await this.isFavorite(userId, recipeId)
      
      if (isFav) {
        await this.removeFavorite(userId, recipeId)
        return false
      } else {
        await this.addFavorite(userId, recipeId)
        return true
      }
    } catch (error) {
      throw error
    }
  }
} 