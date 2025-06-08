
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Sparkles, TrendingUp, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Sample recipe data
const featuredRecipes = [
  {
    id: "1",
    title: "Brownie de Chocolate Sem Glúten",
    description: "Um brownie ultra cremoso feito com farinha de amêndoas e chocolate 70% cacau. Perfeito para satisfazer aquela vontade de doce!",
    image: "/placeholder.svg",
    prepTime: 45,
    servings: 8,
    category: "Doces",
    isGlutenFree: true,
    isLactoseFree: true,
    difficulty: "Fácil" as const,
  },
  {
    id: "2",
    title: "Pão de Queijo Sem Lactose",
    description: "O tradicional pão de queijo mineiro adaptado para quem não pode consumir lactose. Fica igualmente delicioso!",
    image: "/placeholder.svg",
    prepTime: 30,
    servings: 12,
    category: "Salgados",
    isGlutenFree: true,
    isLactoseFree: true,
    difficulty: "Médio" as const,
  },
  {
    id: "3",
    title: "Cookies de Aveia com Chocolate",
    description: "Cookies crocantes por fora e macios por dentro, feitos com aveia e gotas de chocolate amargo.",
    image: "/placeholder.svg",
    prepTime: 25,
    servings: 16,
    category: "Doces",
    isGlutenFree: true,
    isLactoseFree: false,
    difficulty: "Fácil" as const,
  },
  {
    id: "4",
    title: "Quiche de Legumes Sem Glúten",
    description: "Uma deliciosa quiche com massa de farinha de arroz recheada com legumes frescos e temperos especiais.",
    image: "/placeholder.svg",
    prepTime: 60,
    servings: 6,
    category: "Salgados",
    isGlutenFree: true,
    isLactoseFree: true,
    difficulty: "Difícil" as const,
  },
];

const categories = [
  { name: "Doces", count: 124, color: "bg-pastel-pink" },
  { name: "Salgados", count: 89, color: "bg-pastel-purple" },
  { name: "Lanches", count: 56, color: "bg-pastel-blue" },
  { name: "Sobremesas", count: 78, color: "bg-pastel-green" },
  { name: "Pães", count: 45, color: "bg-pastel-coral" },
  { name: "Bebidas", count: 34, color: "bg-pastel-lavender" },
];

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9" />
                <div>
                  <h1 className="text-xl font-semibold">Bem-vinda de volta!</h1>
                  <p className="text-sm text-muted-foreground">
                    Descubra receitas deliciosas para hoje
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  IA Nutricional
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
                  className="pl-10 pr-12 h-11 bg-background/80 backdrop-blur-sm"
                />
                <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-9 w-9">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Categories */}
              <div className="flex flex-wrap justify-center gap-2">
                {categories.slice(0, 4).map((category) => (
                  <Badge 
                    key={category.name}
                    variant="secondary" 
                    className={`${category.color}/20 text-foreground border-0 hover:${category.color}/40 cursor-pointer transition-colors`}
                  >
                    {category.name} ({category.count})
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="px-4 py-6 border-b border-border/50">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-pastel-pink/20 to-pastel-purple/20 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">426</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Receitas Aprovadas</p>
                </div>
                <div className="bg-gradient-to-r from-pastel-blue/20 to-pastel-green/20 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">12.5k</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Usuárias Ativas</p>
                </div>
                <div className="bg-gradient-to-r from-pastel-coral/20 to-pastel-lavender/20 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">89%</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Satisfação</p>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Recipes */}
          <section className="px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Receitas em Destaque</h2>
                  <p className="text-muted-foreground">
                    As receitas mais amadas pelas nossas usuárias
                  </p>
                </div>
                <Button variant="outline">Ver Todas</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} {...recipe} />
                ))}
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
                {categories.map((category) => (
                  <div 
                    key={category.name}
                    className={`${category.color}/20 rounded-lg p-4 text-center cursor-pointer hover:scale-105 transition-transform duration-200 border border-border/20`}
                  >
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} receitas</p>
                  </div>
                ))}
              </div>
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
