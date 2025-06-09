import { useState, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, ChevronUp, Filter, Heart } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { categoriesService } from "@/services/categoriesService";
import { favoritesService, type FavoriteRecipe } from "@/services/favoritesService";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface Filters {
  category: string;
  difficulty: string;
  servings: string;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
}

const Favorites = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    difficulty: "all",
    servings: "all",
    isGlutenFree: false,
    isLactoseFree: false,
  });
  
  // States para dados do Supabase
  const [favoriteRecipes, setFavoriteRecipes] = useState<FavoriteRecipe[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const itemsPerPage = 10;

  // Carregar favoritos e categorias do Supabase - COM CACHE OTIMIZADO
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);

        // 1. TENTAR CACHE DE CATEGORIAS PRIMEIRO (instantâneo)
        const cachedCategories = localStorage.getItem('deliciasdobem-categories');
        if (cachedCategories) {
          const categories = JSON.parse(cachedCategories);
          setCategories(categories);
        }

        // 2. CARREGAR FAVORITOS (cache por usuário)
        let favoritesData: FavoriteRecipe[] = [];
        if (user?.id) {
          // Cache específico por usuário
          const cacheKey = `deliciasdobem-favorites-${user.id}`;
          const cachedFavorites = localStorage.getItem(cacheKey);
          
          if (cachedFavorites) {
            favoritesData = JSON.parse(cachedFavorites);
            setFavoriteRecipes(favoritesData);
            setIsLoading(false);
          }

          // Atualizar favoritos em background
          try {
            const freshFavorites = await favoritesService.getUserFavorites(user.id);
            setFavoriteRecipes(freshFavorites);
            localStorage.setItem(cacheKey, JSON.stringify(freshFavorites));
          } catch (favErr) {
            console.log('Usuário ainda não tem favoritos:', favErr);
            // Se tinha cache e falhou request, manter cache
            if (!cachedFavorites) {
              setFavoriteRecipes([]);
            }
          }
        } else {
          setFavoriteRecipes([]);
        }

        // 3. ATUALIZAR CATEGORIAS EM BACKGROUND (se necessário)
        try {
          const categoriesData = await categoriesService.getAll();
          setCategories(categoriesData);
          localStorage.setItem('deliciasdobem-categories', JSON.stringify(categoriesData));
        } catch (catErr) {
          console.error('Erro ao atualizar categorias:', catErr);
          // Se não tinha cache de categorias, usar fallback
          if (!cachedCategories) {
            const fallbackCategories = [
              { id: '1', name: 'Doces', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() },
              { id: '2', name: 'Salgados', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() },
              { id: '3', name: 'Sobremesas', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() }
            ];
            setCategories(fallbackCategories);
          }
        }

      } catch (err) {
        setError("Erro ao carregar dados");
        console.error('Erro geral:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]); // Executa quando user muda

  // Filtrar receitas favoritas
  const filteredRecipes = favoriteRecipes.filter(recipe => {
    // Filtro de busca
    const matchesSearch = searchTerm === "" || 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtros avançados
    const matchesCategory = filters.category === "all" || recipe.categoryName === filters.category;
    const matchesDifficulty = filters.difficulty === "all" || recipe.difficulty === filters.difficulty;
    
    // Lógica de porções igual à home
    let matchesServings = true;
    if (filters.servings !== "all") {
      if (filters.servings === "small") {
        matchesServings = recipe.servings <= 2;
      } else if (filters.servings === "medium") {
        matchesServings = recipe.servings >= 3 && recipe.servings <= 6;
      } else if (filters.servings === "large") {
        matchesServings = recipe.servings > 6;
      }
    }
    
    const matchesGlutenFree = !filters.isGlutenFree || recipe.isGlutenFree;
    const matchesLactoseFree = !filters.isLactoseFree || recipe.isLactoseFree;

    return matchesSearch && matchesCategory && matchesDifficulty && 
           matchesServings && matchesGlutenFree && matchesLactoseFree;
  });

  // Ordenar por data de favorito (mais recente primeiro)
  const sortedRecipes = filteredRecipes.sort((a, b) => 
    new Date(b.favoritedAt).getTime() - new Date(a.favoritedAt).getTime()
  );

  // Paginação
  const totalPages = Math.ceil(sortedRecipes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecipes = sortedRecipes.slice(startIndex, startIndex + itemsPerPage);

  // Reset da página quando buscar ou filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Auto scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Contar filtros ativos
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'isGlutenFree' || key === 'isLactoseFree') return value === true;
    return value !== "all";
  }).length;

  const clearFilters = useCallback(() => {
    setFilters({
      category: "all",
      difficulty: "all", 
      servings: "all",
      isGlutenFree: false,
      isLactoseFree: false,
    });
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Hoje";
    if (diffInDays === 1) return "Ontem";
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  }, []);

  // Função para invalidar cache quando favorito muda
  const refreshFavorites = useCallback(async () => {
    if (user?.id) {
      const cacheKey = `deliciasdobem-favorites-${user.id}`;
      localStorage.removeItem(cacheKey); // Limpar cache
      
      try {
        const freshFavorites = await favoritesService.getUserFavorites(user.id);
        setFavoriteRecipes(freshFavorites);
        localStorage.setItem(cacheKey, JSON.stringify(freshFavorites));
      } catch (error) {
        console.error('Erro ao atualizar favoritos:', error);
      }
    }
  }, [user?.id]);

  // Listener para mudanças nos favoritos (quando usuário favorita/desfavorita)
  useEffect(() => {
    const handleFavoriteChange = async () => {
      console.log('🗣️ Favorito mudou - atualizando lista');
      await refreshFavorites();
    };

    // Escutar eventos customizados de mudança de favoritos
    window.addEventListener('favoriteChanged', handleFavoriteChange);

    return () => {
      window.removeEventListener('favoriteChanged', handleFavoriteChange);
    };
  }, [refreshFavorites]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto mobile-header-offset">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
            <div className="flex items-center justify-between p-4">
              <SidebarTrigger className="h-9 w-9" />
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href="/ai-nutrition">
                  <Sparkles className="w-4 h-4" />
                  Chef LéIA
                </a>
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Page Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                <h1 className="text-2xl font-bold">Receitas Favoritas</h1>
              </div>
              <p className="text-muted-foreground">
                {sortedRecipes.length} receita{sortedRecipes.length !== 1 ? 's' : ''} favorita{sortedRecipes.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar receitas favoritas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input pl-10 pr-12 h-11 bg-background/80 backdrop-blur-sm"
              />
              
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-1 top-1 h-9 w-9"
                  >
                    <Filter className="w-4 h-4" />
                    {activeFiltersCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                      >
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtros de Busca</DialogTitle>
                    <DialogDescription>
                      Refine sua busca de receitas favoritas usando os filtros abaixo
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Categoria */}
                    <div>
                      <Label>Categoria</Label>
                      <Select 
                        value={filters.category} 
                        onValueChange={(value) => setFilters({...filters, category: value})}
                      >
                        <SelectTrigger className="form-input">
                          <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as categorias</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dificuldade */}
                    <div>
                      <Label>Dificuldade</Label>
                      <Select 
                        value={filters.difficulty} 
                        onValueChange={(value) => setFilters({...filters, difficulty: value})}
                      >
                        <SelectTrigger className="form-input">
                          <SelectValue placeholder="Qualquer dificuldade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Qualquer dificuldade</SelectItem>
                          <SelectItem value="Fácil">Fácil</SelectItem>
                          <SelectItem value="Médio">Médio</SelectItem>
                          <SelectItem value="Difícil">Difícil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Porções */}
                    <div>
                      <Label>Número de Porções</Label>
                      <Select 
                        value={filters.servings} 
                        onValueChange={(value) => setFilters({...filters, servings: value})}
                      >
                        <SelectTrigger className="form-input">
                          <SelectValue placeholder="Qualquer quantidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Qualquer quantidade</SelectItem>
                          <SelectItem value="small">1 - 2 porções</SelectItem>
                          <SelectItem value="medium">3 - 6 porções</SelectItem>
                          <SelectItem value="large">6+ porções</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Restrições Dietéticas */}
                    <div className="space-y-4">
                      <Label>Restrições Dietéticas</Label>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gluten-free" className="text-sm">Sem Glúten</Label>
                        <Switch
                          id="gluten-free"
                          checked={filters.isGlutenFree}
                          onCheckedChange={(checked) => setFilters({...filters, isGlutenFree: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="lactose-free" className="text-sm">Sem Lactose</Label>
                        <Switch
                          id="lactose-free"
                          checked={filters.isLactoseFree}
                          onCheckedChange={(checked) => setFilters({...filters, isLactoseFree: checked})}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="flex-1"
                      >
                        Limpar Tudo
                      </Button>
                      <Button 
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-1"
                      >
                        Aplicar Filtros
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Active Filters Display */}
            {(activeFiltersCount > 0 || searchTerm) && (
              <div className="max-w-2xl mx-auto">
                <div className="flex flex-wrap gap-2 items-center justify-center">
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Busca: "{searchTerm}"
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSearchTerm("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.category !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.category}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setFilters({...filters, category: "all"})}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.difficulty !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.difficulty}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setFilters({...filters, difficulty: "all"})}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.isGlutenFree && (
                    <Badge variant="secondary" className="gap-1">
                      Sem Glúten
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setFilters({...filters, isGlutenFree: false})}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.isLactoseFree && (
                    <Badge variant="secondary" className="gap-1">
                      Sem Lactose
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setFilters({...filters, isLactoseFree: false})}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      Limpar tudo
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Results Info */}
            {(searchTerm || activeFiltersCount > 0) && (
              <div className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {sortedRecipes.length === 0 
                    ? "Nenhuma receita encontrada" 
                    : `${sortedRecipes.length} receita${sortedRecipes.length !== 1 ? 's' : ''} encontrada${sortedRecipes.length !== 1 ? 's' : ''}`
                  }
                  {searchTerm && ` para "${searchTerm}"`}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm("");
                    clearFilters();
                  }}
                  className="text-xs"
                >
                  Limpar busca e filtros
                </Button>
              </div>
            )}

            {/* Top Pagination */}
            {totalPages > 1 && currentPage > 1 && (
              <div className="flex justify-end py-4 border-b border-border/30">
                <div className="scale-75 origin-right min-w-fit">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 gap-6">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <div className="flex flex-col sm:flex-row border rounded-lg overflow-hidden">
                      <Skeleton className="w-full h-48 sm:w-64 sm:h-auto" />
                      <div className="flex-1 p-4 space-y-3">
                        <div>
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-24" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Erro ao carregar favoritos</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Recipes Grid */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 gap-6">
                {currentRecipes.length > 0 ? (
                currentRecipes.map((recipe) => (
                  <div key={recipe.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Favoritado {formatDate(recipe.favoritedAt)}
                      </p>
                    </div>
                    <RecipeCard 
                      {...recipe} 
                      category={recipe.categoryName || "Sem categoria"}
                      isFavorite={true}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm || activeFiltersCount > 0 
                      ? "Nenhuma receita encontrada" 
                      : "Nenhuma receita favorita ainda"
                    }
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || activeFiltersCount > 0
                      ? "Tente ajustar sua busca ou filtros para encontrar suas receitas favoritas."
                      : "Explore nossas receitas e adicione suas favoritas aqui!"
                    }
                  </p>
                  {(searchTerm || activeFiltersCount > 0) && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        clearFilters();
                      }}
                    >
                      Limpar busca e filtros
                    </Button>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>

          {/* Scroll to Top Button */}
          {showScrollTop && (
            <Button
              onClick={scrollToTop}
              size="icon"
              className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 animate-in fade-in slide-in-from-bottom-2"
              title="Voltar ao topo"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Favorites; 