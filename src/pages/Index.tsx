import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Filter, Sparkles, TrendingUp, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/data/mockData";
import { categoriesService } from "@/services/categoriesService";
import { recipesService, Recipe } from "@/services/recipesService";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Interface para filtros
interface Filters {
  category: string;
  difficulty: string;
  servings: string;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    difficulty: "all",
    servings: "all",
    isGlutenFree: false,
    isLactoseFree: false,
  });

  // Carregar categorias e receitas do banco - COM CACHE OTIMIZADO
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. TENTAR CACHE PRIMEIRO (instantâneo)
        const cachedCategories = localStorage.getItem('deliciasdobem-categories');
        const cachedRecipes = localStorage.getItem('deliciasdobem-recipes');
        
        if (cachedCategories) {
          const categories = JSON.parse(cachedCategories);
          setCategories(categories);
          setLoadingCategories(false);
        }
        
        if (cachedRecipes) {
          const recipes = JSON.parse(cachedRecipes);
          setRecipes(recipes);
          setLoadingRecipes(false);
        }
        
        // 2. ATUALIZAR DO BANCO EM BACKGROUND (sempre atualizar cache)
        try {
          const [allCategories, allRecipes] = await Promise.all([
            categoriesService.getAll(),
            recipesService.getAll()
          ]);
          
          // Atualizar estados e cache
          setCategories(allCategories);
          setRecipes(allRecipes);
          localStorage.setItem('deliciasdobem-categories', JSON.stringify(allCategories));
          localStorage.setItem('deliciasdobem-recipes', JSON.stringify(allRecipes));
        } catch (networkError) {
          console.error('Erro na atualização em background:', networkError);
          // Se cache estava vazio e falhou, usar dados estáticos mínimos
          if (!cachedCategories || !cachedRecipes) {
            throw networkError;
          }
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Fallback estático se tudo falhar
        if (!localStorage.getItem('deliciasdobem-categories')) {
          const fallbackCategories: Category[] = [
            { id: '1', name: 'Doces', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() },
            { id: '2', name: 'Salgados', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() },
            { id: '3', name: 'Sobremesas', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() }
          ];
          setCategories(fallbackCategories);
        }
      } finally {
        setLoadingCategories(false);
        setLoadingRecipes(false);
      }
    };

    loadData();
  }, []); // Executa apenas uma vez

  // Filtrar receitas com base na busca e filtros
  const filteredRecipes = recipes.filter((recipe) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || 
                         recipe.title.toLowerCase().includes(searchLower) ||
                         recipe.description.toLowerCase().includes(searchLower) ||
                         recipe.ingredients.toLowerCase().includes(searchLower);
    
    const matchesCategory = filters.category === "all" || recipe.categoryName === filters.category;
    const matchesDifficulty = filters.difficulty === "all" || recipe.difficulty === filters.difficulty;

    const matchesServings = filters.servings === "all" || (() => {
      switch (filters.servings) {
        case "small": return recipe.servings <= 2;
        case "medium": return recipe.servings > 2 && recipe.servings <= 6;
        case "large": return recipe.servings > 6;
        default: return true;
      }
    })();

    const matchesGlutenFree = !filters.isGlutenFree || recipe.isGlutenFree;
    const matchesLactoseFree = !filters.isLactoseFree || recipe.isLactoseFree;

    return matchesSearch && matchesCategory && matchesDifficulty && 
           matchesServings && matchesGlutenFree && matchesLactoseFree;
  });

  // Contar filtros ativos
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (typeof value === 'boolean') return value;
    return value !== "all";
  }).length;

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setFilters({
      category: "all",
      difficulty: "all",
      servings: "all",
      isGlutenFree: false,
      isLactoseFree: false,
    });
    setSearchTerm("");
  };

  // Função para navegar para categoria específica
  const handleCategoryClick = (category: Category) => {
    navigate(`/categories/${encodeURIComponent(category.name.toLowerCase())}`);
  };
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto mobile-header-offset">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href="/ai-nutrition">
                    <Sparkles className="w-4 h-4" />
                    Chef LéIA
                  </a>
                </Button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="gradient-bg px-4 py-8">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Delícias Sem Culpa
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Receitas sem glúten e sem lactose para você cuidar da saúde 
                  sem abrir mão do prazer de comer bem
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar receitas, ingredientes..."
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
                        Refine sua busca de receitas usando os filtros abaixo
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Categoria */}
                      <div>
                        <Label>Categoria</Label>
                        <Select 
                          value={filters.category} 
                          onValueChange={(value) => setFilters({...filters, category: value})}
                          disabled={loadingCategories}
                        >
                          <SelectTrigger className="form-input">
                            <SelectValue placeholder={loadingCategories ? "Carregando..." : "Todas as categorias"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as categorias</SelectItem>
                            {loadingCategories ? (
                              <SelectItem value="" disabled>Carregando...</SelectItem>
                            ) : (
                              categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.name}>
                                  {cat.name}
                                </SelectItem>
                              ))
                            )}
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
                          onClick={clearAllFilters}
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
                    {filters.servings !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {filters.servings === "small" ? "1 - 2 porções" : 
                         filters.servings === "medium" ? "3 - 6 porções" : 
                         filters.servings === "large" ? "6+ porções" : filters.servings}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => setFilters({...filters, servings: "all"})}
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
                        onClick={clearAllFilters}
                        className="text-xs"
                      >
                        Limpar tudo
                      </Button>
                    )}
                  </div>
                </div>
              )}


            </div>
          </section>



          {/* Featured Recipes */}
          <section className="px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Receitas em Destaque</h2>
                <p className="text-muted-foreground">
                  As receitas mais amadas pelas nossas usuárias
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredRecipes.length > 0 ? (
                  filteredRecipes.map((recipe) => (
                    <RecipeCard 
                      key={recipe.id} 
                      {...recipe}
                      category={recipe.categoryName || 'Sem categoria'}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhuma receita encontrada com os filtros selecionados.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={clearAllFilters}
                      className="mt-4"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Categories Grid */}
          <section className="px-4 py-8 bg-muted/30">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Explore por Categoria</h2>
                <p className="text-muted-foreground">
                  Encontre exatamente o que você está procurando
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.slice(0, 6).map((category) => (
                  <Card 
                    key={category.id}
                    className="group cursor-pointer hover:scale-105 transition-transform duration-200 overflow-hidden"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        {/* Image */}
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        
                        {/* Overlay with category info */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-200 flex items-end">
                          <div className="w-full p-3 text-white">
                            <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                            <p className="text-xs opacity-90">{category.recipeCount} receitas</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Botão Ver Todas */}
              {categories.length > 6 && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate('/categories');
                      window.scrollTo(0, 0);
                    }}
                    className="text-xs"
                  >
                    Ver Todas
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Footer */}
          <footer className="px-4 py-8 border-t border-border/50">
            <div className="max-w-6xl mx-auto text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  DeliciasDoBem
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transformando a forma como você cozinha sem glúten e sem lactose
              </p>
              <p className="text-xs text-muted-foreground">
                © 2024 DeliciasDoBem. Todos os direitos reservados.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
