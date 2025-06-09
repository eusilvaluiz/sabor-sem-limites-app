import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, ArrowLeft, ChevronUp } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { categoriesService, Category } from "@/services/categoriesService";
import { recipesService, Recipe } from "@/services/recipesService";

const CategoryRecipes = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;

  // Carregar categoria e receitas do Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carregar todas as categorias
        const categories = await categoriesService.getAll();
        const foundCategory = categories.find(cat => 
          cat.name.toLowerCase() === categoryName?.toLowerCase()
        );
        setCategory(foundCategory || null);

        if (foundCategory) {
          // Carregar receitas da categoria
          const allRecipes = await recipesService.getAll();
          const categoryRecipes = allRecipes.filter(recipe => 
            recipe.categoryName?.toLowerCase() === categoryName?.toLowerCase()
          );
          setRecipes(categoryRecipes);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryName]);

  // Filtrar receitas por termo de busca
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Paginação
  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecipes = filteredRecipes.slice(startIndex, startIndex + itemsPerPage);

  // Scroll para o topo sempre que a categoria mudar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryName]);

  // Reset da página quando buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Controlar botão "voltar ao topo" baseado no scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Verificar estado inicial
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Função para voltar ao topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Auto scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Verificar se categoria existe
  if (!loading && !category) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto mobile-header-offset">
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



            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Categoria não encontrada</h1>
              </div>
              
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">A categoria "{categoryName}" não foi encontrada.</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/categories')}
                >
                  Voltar às Categorias
                </Button>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

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
              <h1 className="text-2xl font-bold">Receitas de {category?.name}</h1>
              <p className="text-muted-foreground">
                {filteredRecipes.length} receita{filteredRecipes.length !== 1 ? 's' : ''} encontrada{filteredRecipes.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Search with Back Button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Buscar receitas de ${category?.name?.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input pl-10"
                />
              </div>
            </div>

            {/* Results Info */}
            {searchTerm && (
              <div className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {filteredRecipes.length === 0 
                    ? "Nenhuma receita encontrada" 
                    : `${filteredRecipes.length} receita${filteredRecipes.length !== 1 ? 's' : ''} encontrada${filteredRecipes.length !== 1 ? 's' : ''}`
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

                        {/* Recipes Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-muted animate-pulse rounded-lg h-32" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {currentRecipes.length > 0 ? (
                  currentRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} {...recipe} category={recipe.categoryName || ""} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? "Nenhuma receita encontrada" : `Nenhuma receita em ${category?.name}`}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? `Não encontramos receitas de ${category?.name?.toLowerCase()} que correspondam à sua busca por "${searchTerm}"`
                        : `Ainda não temos receitas cadastradas na categoria ${category?.name}.`
                      }
                    </p>
                    {searchTerm && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchTerm("")}
                      >
                        Limpar busca
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}

            {/* Footer Info */}
            <div className="text-center py-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Explore mais receitas navegando pelas outras categorias
              </p>
            </div>
          </div>

          {/* Scroll to Top Button - Only visible when scrolled */}
          {showScrollToTop && (
            <Button
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-black hover:bg-black/90 dark:bg-white dark:hover:bg-white/90 animate-in fade-in slide-in-from-bottom-2"
              size="icon"
              title="Voltar ao topo"
            >
              <ChevronUp className="w-4 h-4 text-white dark:text-black" />
            </Button>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CategoryRecipes; 