import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, ChevronUp } from "lucide-react";
import { categoriesService, Category } from "@/services/categoriesService";

type SortOption = "name-asc" | "name-desc" | "recipes-desc" | "recipes-asc";

const Categories = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar categorias do Supabase - COM CACHE OTIMIZADO
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // 1. TENTAR CACHE PRIMEIRO (instantâneo)
        const cachedCategories = localStorage.getItem('deliciasdobem-categories');
        
        if (cachedCategories) {
          const categories = JSON.parse(cachedCategories);
          setCategories(categories);
          setLoading(false);
        }
        
        // 2. ATUALIZAR DO BANCO EM BACKGROUND (sempre atualizar cache)
        try {
          const data = await categoriesService.getAll();
          
          // Atualizar estado e cache
          setCategories(data);
          localStorage.setItem('deliciasdobem-categories', JSON.stringify(data));
        } catch (networkError) {
          console.error('Erro na atualização em background:', networkError);
          // Se cache estava vazio e falhou, usar dados estáticos mínimos
          if (!cachedCategories) {
            throw networkError;
          }
        }
        
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Fallback estático se tudo falhar
        if (!localStorage.getItem('deliciasdobem-categories')) {
          const fallbackCategories = [
            { id: '1', name: 'Doces', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() },
            { id: '2', name: 'Salgados', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() },
            { id: '3', name: 'Sobremesas', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() },
            { id: '4', name: 'Lanches', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() },
            { id: '5', name: 'Pães', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() },
            { id: '6', name: 'Bebidas', image: '/placeholder.svg', recipeCount: 0, createdAt: new Date().toISOString() }
          ];
          setCategories(fallbackCategories);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []); // Executa apenas uma vez

  // Filtrar categorias por busca
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar categorias
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "recipes-desc":
        return b.recipeCount - a.recipeCount;
      case "recipes-asc":
        return a.recipeCount - b.recipeCount;
      default:
        return 0;
    }
  });

  const handleCategoryClick = useCallback((category: Category) => {
    // Navegar para página de receitas da categoria
    navigate(`/categories/${encodeURIComponent(category.name.toLowerCase())}`);
  }, [navigate]);

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case "name-asc": return "A - Z";
      case "name-desc": return "Z - A";
      case "recipes-desc": return "Mais receitas primeiro";
      case "recipes-asc": return "Menos receitas primeiro";
      default: return "";
    }
  };

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto mobile-header-offset">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
            <div className="flex items-center justify-between p-4">
              <SidebarTrigger className="h-9 w-9" />
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Chef LéIA
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Page Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Categorias</h1>
              <p className="text-muted-foreground">
                Explore todas as categorias de receitas
              </p>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="form-input min-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">A - Z</SelectItem>
                    <SelectItem value="name-desc">Z - A</SelectItem>
                    <SelectItem value="recipes-desc">Mais receitas primeiro</SelectItem>
                    <SelectItem value="recipes-asc">Menos receitas primeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Info */}
            {searchTerm && (
              <div className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {filteredCategories.length === 0 
                    ? "Nenhuma categoria encontrada" 
                    : `${filteredCategories.length} categoria${filteredCategories.length !== 1 ? 's' : ''} encontrada${filteredCategories.length !== 1 ? 's' : ''}`
                  }
                  {searchTerm && ` para "${searchTerm}"`}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchTerm("")}
                  className="text-xs"
                >
                  Limpar busca
                </Button>
              </div>
            )}

            {/* Categories Grid */}
            {loading && categories.length === 0 ? (
              // Só mostra skeleton se não tem cache
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden border-0">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-muted animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedCategories.map((category) => (
                <Card 
                  key={category.id}
                  className="group cursor-pointer hover:scale-105 transition-transform duration-200 overflow-hidden border-0"
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
                      
                      {/* Recipe count badge */}
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 right-2 bg-black/70 text-white hover:bg-black/70"
                      >
                        {category.recipeCount}
                      </Badge>
                      
                      {/* Overlay with category info */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-200 flex items-end">
                        <div className="w-full p-4 text-white">
                          <h3 className="font-semibold text-lg mb-1 group-hover:scale-105 transition-transform">
                            {category.name}
                          </h3>
                          <p className="text-sm opacity-90">
                            {category.recipeCount} receita{category.recipeCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredCategories.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Não encontramos categorias que correspondam à sua busca por "{searchTerm}"
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm("")}
                >
                  Limpar busca
                </Button>
              </div>
            )}

            {/* Footer Info */}
            <div className="text-center py-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Clique em uma categoria para ver todas as suas receitas
              </p>
            </div>
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

export default Categories; 