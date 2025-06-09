import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Users, 
  Sparkles, 
  Heart,
  Share,
  ChevronDown,
  ChevronUp,
  Calculator,
  Scale,
  PieChart,
  RefreshCw,
  Loader2,
  Send,
  Bot,
  User
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recipesService, Recipe as RecipeType } from "@/services/recipesService";
import { chatService, ChatMessage } from "@/services/chatService";
import { favoritesService } from "@/services/favoritesService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RECIPE_PROMPTS } from "@/config/recipePrompts";
import { aiService } from "@/services/openai";

// Tipo local para mensagens da interface
interface LocalChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

// Dados nutricionais padrão (em produção viria da tabela nutrition_data)
const defaultNutrition = {
  calories: 285,
  protein: 6.2,
  carbs: 28.5,
  fat: 18.3,
  fiber: 4.1
};

// Parser functions
const parseIngredients = (text: string) => {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.trim());
};

const parseInstructions = (text: string) => {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.trim());
};

const Recipe = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [recipe, setRecipe] = useState<RecipeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  
  // Estados para funcionalidades IA
  const [activeAIFeature, setActiveAIFeature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para inputs de IA
  const [newServings, setNewServings] = useState(8);
  const [ingredientAmount, setIngredientAmount] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [ingredientsToReplace, setIngredientsToReplace] = useState<string[]>([]);

  // Estados para chat contextual REAL (persistente)
  const [chatMessages, setChatMessages] = useState<LocalChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);



  // Carregar receita do Supabase
  useEffect(() => {
    const loadRecipe = async () => {
      if (!recipeId) return;
      
      const cacheKey = `deliciasdobem-recipe-${recipeId}`;
      
      try {
        // 1. TENTAR CACHE PRIMEIRO (instantâneo)
        const cachedRecipe = localStorage.getItem(cacheKey);
        if (cachedRecipe) {
          const recipe = JSON.parse(cachedRecipe);
          setRecipe(recipe);
          setNewServings(recipe.servings);
          setLoading(false);
        }
        
        // 2. ATUALIZAR DO BANCO EM BACKGROUND
        try {
          const foundRecipe = await recipesService.getById(recipeId);
          setRecipe(foundRecipe);
          
          if (foundRecipe) {
            setNewServings(foundRecipe.servings);
            // Atualizar cache
            localStorage.setItem(cacheKey, JSON.stringify(foundRecipe));
          } else {
            // Receita não encontrada - remover cache inválido
            localStorage.removeItem(cacheKey);
          }
        } catch (networkError) {
          console.error('Erro ao atualizar receita:', networkError);
          // Se cache estava vazio e falhou, manter null
          if (!cachedRecipe) {
            setRecipe(null);
          }
        }
        
      } catch (error) {
        console.error('Erro geral ao carregar receita:', error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
    window.scrollTo(0, 0);
  }, [recipeId]);

  // Verificar status do favorito quando receita carrega
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user?.id || !recipeId) {
        setIsFavorite(false);
        return;
      }

      try {
        const isFav = await favoritesService.isFavorite(user.id, recipeId);
        setIsFavorite(isFav);
      } catch (error) {
        console.error('Erro ao verificar favorito:', error);
        setIsFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [user?.id, recipeId]);

  // Carregar histórico do chat contextual da receita
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user || !recipeId) return;
      
      try {
        const history = await chatService.getChatHistory(user.id, 'recipe', recipeId);
        const localMessages = history.map(msg => ({
          id: msg.id,
          type: msg.messageType,
          message: msg.message,
          timestamp: new Date(msg.createdAt)
        }));
        setChatMessages(localMessages);
      } catch (error) {
        console.error('Erro ao carregar histórico do chat:', error);
      }
    };

    loadChatHistory();
  }, [user, recipeId]);

  // Função para limpar conversa da receita
  const clearRecipeChat = useCallback(async () => {
    if (!user || !recipeId) return;
    
    try {
      await chatService.clearChatHistory(user.id, 'recipe', recipeId);
      setChatMessages([]);
    } catch (error) {
      console.error('Erro ao limpar chat:', error);
    }
  }, [user, recipeId]);

  // Auto-scroll para bottom quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatMessages.length > 0) {
      const timer = setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatMessages]);

  // Auto-scroll durante digitação da IA
  useEffect(() => {
    if (isTyping) {
      window.scrollTo({ 
        top: document.documentElement.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [typingMessage, isTyping]);

  // Função de efeito typewriter
  const typeMessage = useCallback((message: string, callback: () => void) => {
    setIsTyping(true);
    setTypingMessage("");
    
    let currentIndex = 0;
    const typingSpeed = 3; // 🚀 OTIMIZADO: velocidade reduzida de 20ms para 3ms
    
    const timer = setInterval(() => {
      if (currentIndex < message.length) {
        setTypingMessage(message.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        setTypingMessage("");
        callback();
      }
    }, typingSpeed);
  }, []);

  // Função para renderizar markdown básico
  const renderMarkdown = useCallback((text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
      .replace(/^• /gm, '• ') // bullets
      .replace(/^(✨|🔥|🍖|🍞|🥑|🌿|🌾|🍫|🍯) /gm, '$1 ') // emoji headers
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('<br/>');
  }, []);



  const handleFavorite = useCallback(async () => {
    if (isTogglingFavorite) return; // Evita cliques múltiplos

    if (!user?.id) {
      toast({
        title: "Login necessário",
        description: "Faça login para favoritar receitas.",
        variant: "destructive",
      });
      return;
    }

    if (!recipeId || !recipe) return;

    setIsTogglingFavorite(true);
    try {
      const newFavoriteStatus = await favoritesService.toggleFavorite(user.id, recipeId);
      setIsFavorite(newFavoriteStatus);
      
      // Disparar evento para outras páginas invalidarem cache
      window.dispatchEvent(new CustomEvent('favoriteChanged', { 
        detail: { recipeId, isFavorite: newFavoriteStatus } 
      }));
      
      toast({
        title: newFavoriteStatus ? "Adicionado aos favoritos" : "Removido dos favoritos",
        description: newFavoriteStatus 
          ? `${recipe.title} foi salva nos seus favoritos.`
          : `${recipe.title} foi removida dos seus favoritos.`,
      });
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o favorito. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [isTogglingFavorite, user?.id, recipeId, recipe, toast]);

  const handleShare = useCallback(() => {
    if (!recipe) return;
    
    if (navigator.share) {
      navigator.share({
        title: `${recipe.title} - Sabor Sem Limites`,
        text: recipe.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [recipe]);

  const toggleAIFeature = useCallback((feature: string) => {
    setActiveAIFeature(activeAIFeature === feature ? null : feature);
  }, [activeAIFeature]);

  const handleAICalculation = async (feature: string) => {
    if (!recipe) return;
    
    setIsLoading(true);
    
    try {
      let prompt = "";
      let responseMessage = "";
      
      // Converter para o formato esperado pelo aiService
      const recipeForAI = {
        ...recipe,
        image_url: recipe.image,
        is_gluten_free: recipe.isGlutenFree,
        is_lactose_free: recipe.isLactoseFree
      };
      
      switch (feature) {
        case "portions":
          prompt = RECIPE_PROMPTS.portions(recipe, recipe.servings, newServings);
          responseMessage = await aiService.adjustServings(recipeForAI, newServings);
          break;
          
        case "ingredient":
          if (!selectedIngredient || !ingredientAmount) {
            responseMessage = "Por favor, selecione um ingrediente e informe a quantidade disponível.";
            break;
          }
          prompt = RECIPE_PROMPTS.ingredient(recipe, selectedIngredient, ingredientAmount);
          // Usar função genérica do OpenAI para este caso específico
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.3,
              max_tokens: 1000
            })
          });
          const data = await response.json();
          responseMessage = data.choices[0].message.content;
          break;
          
        case "nutrition":
          responseMessage = await aiService.calculateNutrition(recipeForAI);
          break;
          
        case "substitutes":
          if (ingredientsToReplace.length === 0) {
            responseMessage = "Por favor, selecione pelo menos um ingrediente para substituir.";
            break;
          }
          responseMessage = await aiService.substituteIngredients(recipeForAI, ingredientsToReplace);
          break;
      }
      
      setIsLoading(false);
      setActiveAIFeature(null);
      
      // Usar efeito typewriter para a resposta dos boxes de IA
      typeMessage(responseMessage, () => {
        const aiMessage: LocalChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          message: responseMessage,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      });
      
    } catch (error) {
      console.error('Erro na IA:', error);
      setIsLoading(false);
      setActiveAIFeature(null);
      
      const errorMessage = "Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.";
      typeMessage(errorMessage, () => {
        const aiMessage: LocalChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          message: errorMessage,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      });
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim() || isChatLoading || isTyping || !user || !recipeId) return;

    // Adicionar mensagem do usuário imediatamente na interface
    const userMessage: LocalChatMessage = {
      id: `temp-${Date.now()}`,
      type: 'user',
      message: currentQuestion,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const questionToProcess = currentQuestion;
    setCurrentQuestion("");
    setIsChatLoading(true);

    try {
      // 💾 SALVAR MENSAGEM DO USUÁRIO NO BANCO (REAL)
      await chatService.saveRecipeMessage(
        user.id, 
        recipeId, 
        'user', 
        questionToProcess, 
        { recipeTitle: recipe?.title }
      );
      
      // Gerar resposta contextual usando IA REAL
      const recipeForAI = {
        ...recipe!,
        image_url: recipe!.image,
        is_gluten_free: recipe!.isGlutenFree,
        is_lactose_free: recipe!.isLactoseFree
      };
      const aiResponse = await aiService.askAboutRecipe(recipeForAI, questionToProcess);
      
      setIsChatLoading(false);
      
      // Usar efeito typewriter para a resposta da IA
      typeMessage(aiResponse, async () => {
        const aiMessage: LocalChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          message: aiResponse,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
        
        // 💾 SALVAR RESPOSTA DA IA NO BANCO (REAL)
        await chatService.saveRecipeMessage(
          user.id, 
          recipeId, 
          'ai', 
          aiResponse, 
          { recipeTitle: recipe?.title }
        );
      });
      
    } catch (error) {
      console.error('Erro no chat:', error);
      setIsChatLoading(false);
    }
  };

  const generateAIResponse = (question: string, currentRecipe: RecipeType) => {
    const lowerQuestion = question.toLowerCase();
    
    // Respostas contextuais baseadas na receita
    if (lowerQuestion.includes('caloria') || lowerQuestion.includes('kcal')) {
      return `Este ${currentRecipe.title} tem aproximadamente ${defaultNutrition.calories} calorias por porção. Com ${currentRecipe.servings} porções no total, cada porção é bem equilibrada nutricionalmente.`;
    }
    
    if (lowerQuestion.includes('substitui') || lowerQuestion.includes('trocar')) {
      return `Para esta receita de ${currentRecipe.title}, você pode fazer algumas substituições: farinha de amêndoas por farinha de aveia, açúcar demerara por xilitol, ou chocolate 70% por cacau em pó + óleo de coco. Qual ingrediente específico você gostaria de substituir?`;
    }
    
    if (lowerQuestion.includes('tempo') || lowerQuestion.includes('quanto tempo') || lowerQuestion.includes('demora')) {
      return `O preparo desta receita leva cerca de 15 minutos para preparar a massa e 25-30 minutos no forno. Total: aproximadamente 45 minutos do início ao fim.`;
    }
    
    if (lowerQuestion.includes('sem glúten') || lowerQuestion.includes('gluten')) {
      return `Sim! Esta receita é naturalmente sem glúten, usando farinha de amêndoas em vez de farinha de trigo. É segura para pessoas com doença celíaca ou sensibilidade ao glúten.`;
    }
    
    if (lowerQuestion.includes('lactose') || lowerQuestion.includes('sem lactose')) {
      return `Esta receita usa manteiga, então contém lactose. Para torná-la sem lactose, substitua a manteiga por óleo de coco ou margarina vegana (mesma quantidade).`;
    }
    
    if (lowerQuestion.includes('armazen') || lowerQuestion.includes('conserv')) {
      return `Você pode armazenar este ${currentRecipe.title} em recipiente hermético por até 5 dias em temperatura ambiente, ou congelar por até 3 meses. Para descongelar, deixe em temperatura ambiente por algumas horas.`;
    }
    
    if (lowerQuestion.includes('dica') || lowerQuestion.includes('segredo')) {
      return `Dica especial para o ${currentRecipe.title}: não asse demais! O centro deve ficar ligeiramente macio para ter a textura fudgy perfeita. Teste com um palito - deve sair com algumas migalhas úmidas, não limpo.`;
    }
    
    // Resposta genérica contextual
    return `Sobre a receita "${currentRecipe.title}": Esta é uma receita ${currentRecipe.difficulty.toLowerCase()} que serve ${currentRecipe.servings} pessoas. É ${currentRecipe.isGlutenFree ? 'sem glúten' : 'com glúten'} e ${currentRecipe.isLactoseFree ? 'sem lactose' : 'com lactose'}. Posso ajudar com mais detalhes específicos sobre ingredientes, preparo ou substituições!`;
  };

  const aiFeatures = [
    {
      id: "portions",
      title: "Recalcular Porções",
      description: "Adapte para mais ou menos pessoas",
      icon: <Calculator className="w-5 h-5" />,
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      id: "ingredient", 
      title: "Ajustar por Ingrediente",
      description: "Recalcule baseado na quantidade disponível",
      icon: <Scale className="w-5 h-5" />,
      color: "bg-green-500/10 text-green-600"
    },
    {
      id: "nutrition",
      title: "Análise Nutricional", 
      description: "Calcule macros e micronutrientes",
      icon: <PieChart className="w-5 h-5" />,
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      id: "substitutes",
      title: "Substituir Ingredientes",
      description: "Encontre alternativas saudáveis",
      icon: <RefreshCw className="w-5 h-5" />,
      color: "bg-orange-500/10 text-orange-600"
    }
  ];

  // Loading state
  if (loading) {
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
            <div className="max-w-4xl mx-auto p-4 space-y-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="aspect-video w-full max-w-md bg-muted rounded-xl"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Recipe not found state
  if (!recipe) {
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
            <div className="max-w-4xl mx-auto p-4 space-y-8">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Receita não encontrada</h1>
                <p className="text-muted-foreground mb-6">
                  A receita que você está procurando não existe ou foi removida.
                </p>
                <Button onClick={() => navigate('/')}>
                  Voltar ao início
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

          {/* Recipe Content */}
          <div className="max-w-4xl mx-auto p-4 space-y-8">
            {/* Back Button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Recipe Header */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{recipe?.title}</h1>
              
              {/* Recipe Image - Formato YouTube Thumb */}
              <div className="relative rounded-xl overflow-hidden aspect-video w-full max-w-md">
                <img
                  src={recipe?.image}
                  alt={recipe?.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={handleFavorite}
                    disabled={isTogglingFavorite}
                  >
                    <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'hover:text-red-500'} ${isTogglingFavorite ? 'opacity-50' : ''}`} />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"  
                    className="h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={handleShare}
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-background/80 text-xs">
                    {recipe?.categoryName}
                  </Badge>
                </div>
              </div>

              <p className="text-muted-foreground">
                {recipe?.description}
              </p>
              
              {/* Recipe Info */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span>{recipe?.servings} porções</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  <span>{recipe?.difficulty}</span>
                </div>
              </div>

              {/* Diet Badges */}
              <div className="flex gap-2">
                {recipe?.isGlutenFree && (
                  <Badge variant="outline" className="bg-pastel-green/20 text-foreground border-pastel-green">
                    Sem Glúten
                  </Badge>
                )}
                {recipe?.isLactoseFree && (
                  <Badge variant="outline" className="bg-pastel-blue/20 text-foreground border-pastel-blue">
                    Sem Lactose
                  </Badge>
                )}
              </div>
            </div>

            {/* Recipe Content Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Ingredientes</h2>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recipe && parseIngredients(recipe.ingredients).map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-black dark:bg-white rounded-full mt-2 flex-shrink-0" />
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Modo de Preparo</h2>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {recipe && parseInstructions(recipe.instructions).map((instruction, index) => (
                      <li key={index} className="flex items-center gap-4">
                        <div className="w-6 h-6 bg-black text-white dark:bg-white dark:text-black rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <p>{instruction}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* AI Features Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Assistente IA
                </h2>
                <p className="text-muted-foreground">
                  Personalize esta receita com inteligência artificial
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {aiFeatures.map((feature) => (
                  <Card 
                    key={feature.id}
                    className={`transition-all hover:shadow-md ${
                      activeAIFeature === feature.id ? 'border-primary/50 shadow-sm' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleAIFeature(feature.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.color}`}>
                            {feature.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        {activeAIFeature === feature.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>

                    {activeAIFeature === feature.id && (
                      <CardContent className="space-y-4">
                        {/* Inputs específicos para cada feature */}
                        {feature.id === "portions" && (
                          <div className="space-y-3">
                            <Label>Nova quantidade de porções</Label>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">De {recipe?.servings} para:</span>
                              <Input
                                type="number"
                                min="1"
                                max="50"
                                value={newServings}
                                onChange={(e) => setNewServings(parseInt(e.target.value) || 1)}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">porções</span>
                            </div>
                          </div>
                        )}

                        {feature.id === "ingredient" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Quantidade disponível</Label>
                                <Input
                                  placeholder="ex: 250g"
                                  value={ingredientAmount}
                                  onChange={(e) => setIngredientAmount(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Ingrediente</Label>
                                <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {recipe && parseIngredients(recipe.ingredients).slice(0, 5).map((ingredient, index) => (
                                      <SelectItem key={index} value={ingredient}>
                                        {ingredient.split(' ').slice(1).join(' ')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )}

                        {feature.id === "substitutes" && (
                          <div className="space-y-3">
                            <Label>Ingredientes para substituir</Label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {recipe && parseIngredients(recipe.ingredients).slice(0, 6).map((ingredient, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`ingredient-${index}`}
                                    checked={ingredientsToReplace.includes(ingredient)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setIngredientsToReplace([...ingredientsToReplace, ingredient]);
                                      } else {
                                        setIngredientsToReplace(ingredientsToReplace.filter(i => i !== ingredient));
                                      }
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`ingredient-${index}`}
                                    className="text-sm font-normal"
                                  >
                                    {ingredient.split(' ').slice(1).join(' ')}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Botão de cálculo */}
                        <Button
                          onClick={() => handleAICalculation(feature.id)}
                          disabled={isLoading}
                          className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Calculando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Calcular com IA
                            </>
                          )}
                        </Button>


                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              {/* Título do Chat */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-muted-foreground">
                  Ou pergunte o que quiser sobre a receita para a Chef LéIA
                </h3>
              </div>

              {/* Chat com IA - Histórico */}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.type === 'user'
                        ? 'bg-green-500 text-white dark:bg-green-600 dark:text-white'
                        : 'bg-background'
                    }`}
                  >
                    {msg.type === 'ai' ? (
                      <div 
                        className="whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.message) }}
                      />
                    ) : (
                      <p>{msg.message}</p>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Mensagem sendo digitada pela IA */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-background p-3 rounded-lg text-sm max-w-[80%]">
                    <div 
                      className="whitespace-pre-line min-h-[20px]"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(typingMessage) + '<span class="animate-pulse">|</span>' }}
                    />
                  </div>
                </div>
              )}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-background p-3 rounded-lg text-sm max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analisando sua pergunta...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão Limpar Conversa - só aparece quando não há ação */}
              {chatMessages.length > 0 && !isChatLoading && !isTyping && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearRecipeChat}
                    className="text-xs"
                  >
                    Limpar Conversa
                  </Button>
                </div>
              )}

              {/* Chat com IA - Input */}
              <div className="max-w-2xl mx-auto flex gap-3 items-center">
                <div className="relative flex-1">
                  <Bot className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Pergunte aqui..."
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    disabled={isChatLoading || isTyping}
                    className="search-input pl-10 h-14 bg-background/80 backdrop-blur-sm placeholder:text-muted-foreground/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSubmit(e);
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleChatSubmit}
                  size="icon"
                  disabled={!currentQuestion.trim() || isChatLoading || isTyping}
                  className="h-14 w-14 rounded-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 flex-shrink-0"
                >
                  {isChatLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>


        </main>
      </div>
    </SidebarProvider>
  );
};

export default Recipe;