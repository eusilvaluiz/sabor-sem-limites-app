import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, Bot } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { chefLeiaService, ChefLeiaConfig } from "@/services/chefLeiaService";
import { chatService, ChatMessage } from "@/services/chatService";
import { conversationService, Conversation } from "@/services/conversationService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";


const AINutritionContent = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Estados para configurações dinâmicas
  const [chefConfig, setChefConfig] = useState<ChefLeiaConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const { open } = useSidebar();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Controla se já houve primeira interação (para mudar layout)
  const hasStartedChat = chatMessages.length > 0;

  // Carregar configurações da Chef LéIA - COM CACHE
  const loadChefConfig = async () => {
    try {
      // 1. Tentar cache primeiro (instantâneo)
      const cachedConfig = localStorage.getItem('chef-leia-config');
      if (cachedConfig) {
        const config = JSON.parse(cachedConfig);
        setChefConfig(config);
        setConfigLoading(false);
        // Não retornar aqui - continuar para validar cache em background
      }

      // 2. Buscar do banco (só se necessário)
      const config = await chefLeiaService.getOrCreateDefaultConfig();
      setChefConfig(config);
      
      // 3. Atualizar cache
      localStorage.setItem('chef-leia-config', JSON.stringify(config));
    } catch (error) {
      console.error('Erro ao carregar configurações da Chef LéIA:', error);
      // Usar configuração padrão estática
      const defaultConfig = {
        id: 'default',
        title: "Chef LéIA",
        description: "Sua assistente pessoal para dúvidas sobre nutrição, dietas e alimentação saudável",
        assistantId: null,
        avatarType: 'emoji' as const,
        avatarEmoji: "👩‍🍳",
        avatarColor: "#ec4899",
        avatarImageUrl: null,
        suggestions: [
          "Quantas calorias devo consumir por dia?",
          "Quais são as melhores fontes de proteína?",
          "Como montar um cardápio saudável?",
          "Preciso de suplementos vitamínicos?"
        ],
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setChefConfig(defaultConfig);
    } finally {
      setConfigLoading(false);
    }
  };

  // Carregar configurações na montagem - APENAS UMA VEZ
  useEffect(() => {
    loadChefConfig();
  }, []); // Sem dependências = executa só uma vez

  // Detectar conversa pela URL - OTIMIZADO
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    
    if (conversationId && conversationId !== currentConversationId) {
      // Carregar conversa específica
      loadConversation(conversationId);
    } else if (!conversationId && currentConversationId) {
      // Limpar estado apenas se havia conversa anterior
      startNewConversation();
    }
  }, [searchParams.get('conversation')]); // Só observa mudança na URL

  // Carregar histórico apenas quando necessário
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (user && conversationId && conversationId !== currentConversationId) {
      loadChatHistory();
    }
  }, [user?.id, searchParams.get('conversation')]); // Só quando user ou URL mudam

  const loadChatHistory = async () => {
    if (!user) return;
    
    const conversationId = searchParams.get('conversation');
    if (!conversationId) return; // Não carregar histórico para nova conversa
    
    try {
      const messages = await chatService.getConversationMessages(conversationId);
      setChatMessages(messages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      // Não mostrar toast aqui para não incomodar o usuário
    }
  };

  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-scroll para bottom quando novas mensagens são adicionadas
  useEffect(() => {
    if (hasStartedChat) {
      const timer = setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatMessages, hasStartedChat]);

  // Auto-scroll durante digitação da IA
  useEffect(() => {
    if (isTyping) {
      window.scrollTo({ 
        top: document.documentElement.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [typingMessage, isTyping]);

  // Função de efeito typewriter - ULTRA RÁPIDO
  const typeMessage = (message: string, callback: () => void) => {
    setIsTyping(true);
    setTypingMessage("");
    
    let currentIndex = 0;
    const typingSpeed = 3; // ULTRA RÁPIDO - 3ms por caractere
    
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
  };

  // Função para renderizar markdown básico
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
      .replace(/^• /gm, '• ') // bullets
      .replace(/^(🔥|🥩|🍞|🥑|💊|⚖️|🤖|👨‍🍳|📊|🍽️|⚖️) \*\*(.*?)\*\*/gm, '$1 <strong>$2</strong>') // emoji headers
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('<br/>');
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim() || isChatLoading || !user) return;

    const question = currentQuestion.trim();
    setCurrentQuestion("");
    setIsChatLoading(true);

    // Adicionar mensagem do usuário imediatamente
    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}-${Math.random()}`,
      userId: user.id,
      chatType: 'general',
      messageType: 'user',
      message: question,
      threadId: null,
      recipeId: null,
      functionType: null,
      contextData: null,
      conversationId: currentConversationId,
      createdAt: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, tempUserMessage]);

    try {
      // Usar o chatService para enviar mensagem real
      const { userMessage, aiMessage, newThreadId, conversationId } = await chatService.sendToChefLeia(
        user.id, 
        question, 
        currentConversationId || undefined,
        currentThreadId || undefined
      );

      // PARAR LOADING IMEDIATAMENTE
      setIsChatLoading(false);

      // Atualizar IDs
      setCurrentThreadId(newThreadId);
      setCurrentConversationId(conversationId);

      // Se é uma nova conversa, atualizar URL e notificar sidebar
      if (!currentConversationId) {
        navigate(`/ai-nutrition?conversation=${conversationId}`, { replace: true });
        window.dispatchEvent(new CustomEvent('conversationCreated'));
      }

      // Remover mensagem temporária e adicionar APENAS mensagem real do usuário
      setChatMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      setChatMessages(prev => [...prev, userMessage]);

      // INICIAR TYPEWRITER DO ZERO (sem adicionar aiMessage antes)
      typeMessage(aiMessage.message, () => {
        // APENAS AGORA adicionar a mensagem completa da IA
        setChatMessages(prev => [...prev, aiMessage]);
      });

    } catch (error) {
      console.error('Erro no chat:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
      
      // Remover mensagem temporária em caso de erro
      setChatMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      setIsChatLoading(false);
    }
  };

  // Função para iniciar nova conversa - OTIMIZADA
  const startNewConversation = useCallback(() => {
    setChatMessages([]);
    setCurrentConversationId(null);
    setCurrentThreadId(null);
    setCurrentQuestion("");
    setIsTyping(false);
    setTypingMessage("");
  }, []);

  // Função para carregar conversa específica - OTIMIZADA
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const messages = await chatService.getConversationMessages(conversationId);
      setChatMessages(messages);
      setCurrentConversationId(conversationId);
      // Reset thread - será recriado na próxima mensagem
      setCurrentThreadId(null);
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a conversa.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const generateAIResponse = (question: string) => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('calorias') || lowerQuestion.includes('caloria')) {
      return `🔥 **Sobre Calorias:**

Para um plano nutricional saudável, recomendo:
• **Mulheres**: 1.800-2.200 kcal/dia
• **Homens**: 2.200-2.800 kcal/dia

**Dicas importantes:**
✨ Distribua as calorias em 5-6 refeições
✨ 50% carboidratos, 30% gorduras, 20% proteínas
✨ Priorize alimentos naturais e integrais

Quer que eu calcule suas necessidades específicas?`;
    }

    if (lowerQuestion.includes('proteína') || lowerQuestion.includes('proteinas')) {
      return `🥩 **Sobre Proteínas:**

**Necessidade diária:**
• Sedentário: 0,8g por kg de peso
• Ativo: 1,2-1,6g por kg de peso
• Atleta: 1,6-2,2g por kg de peso

**Melhores fontes:**
🐟 Peixes e frutos do mar
🥩 Carnes magras
🥚 Ovos e laticínios
🌱 Leguminosas e quinoa
🥜 Castanhas e sementes

Precisa de um plano personalizado de proteínas?`;
    }

    if (lowerQuestion.includes('carboidrato') || lowerQuestion.includes('carboidratos')) {
      return `🍞 **Sobre Carboidratos:**

**Tipos recomendados:**
✅ **Complexos**: Aveia, quinoa, batata doce
✅ **Naturais**: Frutas e vegetais
❌ **Evitar**: Açúcares refinados e processados

**Timing ideal:**
🌅 Manhã: Carboidratos para energia
🏃‍♀️ Pré-treino: Carboidratos simples
🌙 Noite: Menor quantidade, foco em fibras

**Quantidade**: 45-65% das calorias totais do dia.

Quer sugestões de receitas com carboidratos saudáveis?`;
    }

    if (lowerQuestion.includes('gordura') || lowerQuestion.includes('gorduras') || lowerQuestion.includes('lipídios')) {
      return `🥑 **Sobre Gorduras Saudáveis:**

**Gorduras boas (80% do consumo):**
✅ Abacate, azeite extra virgem
✅ Castanhas, amêndoas, nozes  
✅ Peixes gordos (salmão, sardinha)
✅ Sementes (chia, linhaça)

**Gorduras ruins (evitar):**
❌ Gorduras trans
❌ Frituras em óleo reutilizado
❌ Margarina e produtos processados

**Quantidade ideal**: 20-35% das calorias diárias.

Posso ajudar com receitas ricas em gorduras boas?`;
    }

    if (lowerQuestion.includes('vitamina') || lowerQuestion.includes('vitaminas')) {
      return `💊 **Sobre Vitaminas:**

**Vitaminas essenciais diárias:**
🌞 **Vitamina D**: Sol + peixes gordos
🍊 **Vitamina C**: Frutas cítricas e vegetais
🥬 **Ácido Fólico**: Folhas verdes
🥩 **B12**: Carnes e derivados animais
👁️ **Vitamina A**: Cenoura, abóbora

**Dica importante**: Prefira sempre fontes naturais aos suplementos!

**Sinal de deficiência:**
• Cansaço excessivo
• Queda de cabelo
• Baixa imunidade

Quer um cardápio rico em vitaminas específicas?`;
    }

    if (lowerQuestion.includes('dieta') || lowerQuestion.includes('emagrecer') || lowerQuestion.includes('perder peso')) {
      return `⚖️ **Para Emagrecimento Saudável:**

**Princípios fundamentais:**
📉 Déficit calórico de 300-500 kcal/dia
💧 2-3L de água por dia
🥗 Pratos coloridos e variados
⏰ Comer de 3 em 3 horas

**Alimentos termogênicos:**
🌶️ Pimenta, gengibre, canela
🍵 Chá verde, hibisco
☕ Café sem açúcar

**Meta saudável**: 0,5-1kg por semana

**Lembre-se**: Não existem fórmulas mágicas, apenas consistência!

Posso criar um plano alimentar personalizado?`;
    }

    if (lowerQuestion.includes('receita') || lowerQuestion.includes('cardápio') || lowerQuestion.includes('menu')) {
      return `👨‍🍳 **Sugestões Nutricionais:**

**Café da manhã energético:**
🥣 Aveia + frutas + castanhas
🥚 Ovos mexidos com vegetais
🥤 Smoothie verde com espinafre

**Almoço balanceado:**
🍗 Proteína magra (150-200g)
🍠 Carboidrato complexo
🥗 Salada colorida variada
🥑 Gordura boa (azeite/abacate)

**Jantar leve:**
🐟 Peixe grelhado
🥒 Vegetais refogados
🍠 Batata doce pequena

Quer receitas específicas para alguma refeição?`;
    }

    // Resposta padrão para outras perguntas
    return `🤖 **Assistente Nutricional:**

Sou especialista em nutrição e posso ajudar com:

📊 **Análise Nutricional**
• Cálculo de necessidades calóricas
• Distribuição de macronutrientes
• Deficiências vitamínicas

🍽️ **Planejamento Alimentar**
• Cardápios personalizados
• Receitas saudáveis
• Substituições inteligentes

⚖️ **Objetivos Específicos**
• Emagrecimento saudável
• Ganho de massa muscular
• Melhora da performance

Faça uma pergunta mais específica sobre nutrição e eu te darei uma resposta detalhada!`;
  };

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 overflow-auto mobile-header-offset">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
            <div className="flex items-center justify-between p-4">
              <SidebarTrigger className="h-9 w-9" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">
                  {chefConfig?.title || "Chef LéIA"}
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {!hasStartedChat ? (
              /* Layout inicial - ChatGPT style (centralizado) */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl space-y-8">
                  {/* Header centralizado */}
                  <div className="text-center space-y-4">
                    {/* Avatar da Chef LéIA */}
                    <div className="mx-auto">
                      {chefConfig?.avatarType === 'image' && chefConfig?.avatarImageUrl ? (
                        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-2 border-4 border-white shadow-lg">
                          <img 
                            src={chefConfig.avatarImageUrl} 
                            alt={chefConfig.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-white shadow-lg"
                          style={{ backgroundColor: chefConfig?.avatarColor || '#ec4899' }}
                        >
                          <div className="text-white text-2xl font-bold">
                            {chefConfig?.avatarEmoji || '👩‍🍳'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold">
                        {configLoading ? "Carregando..." : (chefConfig?.title || "Chef LéIA")}
                      </h1>
                      <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        {configLoading 
                          ? "Carregando configurações..." 
                          : (chefConfig?.description || "Sua assistente pessoal para dúvidas sobre nutrição, dietas e alimentação saudável")
                        }
                      </p>
                    </div>
                  </div>

                  {/* Input centralizado */}
                  <form onSubmit={handleChatSubmit} className="space-y-4">
                    <div className="relative">
                      <Bot className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="Pergunte aqui..."
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        disabled={isChatLoading}
                        className="search-input pl-12 pr-16 h-14 bg-background/80 backdrop-blur-sm placeholder:text-muted-foreground/50 text-base"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!currentQuestion.trim() || isChatLoading}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                      >
                        {isChatLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Sugestões */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">Sugestões para começar:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(chefConfig?.suggestions || [
                        "Quantas calorias devo consumir por dia?",
                        "Quais são as melhores fontes de proteína?",
                        "Como montar um cardápio saudável?",
                        "Preciso de suplementos vitamínicos?"
                      ]).map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-auto p-3 text-left text-sm"
                          onClick={() => setCurrentQuestion(suggestion)}
                          disabled={configLoading}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="mt-8 p-4 bg-muted/30 rounded-lg border">
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      <strong>NOTA:</strong> As respostas geradas pela {chefConfig?.title || "Chef LéIA"} ou qualquer outra IA não substituem a opinião de um profissional da área de saúde e não devem ser tratadas como prescrição.{" "}
                      <br />
                      Consulte sempre um profissional.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Layout com chat (após primeira pergunta) */
              <>
                {/* Chat Area - scrollable */}
                <div className="flex-1 overflow-auto p-4 pb-24">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.messageType === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-lg text-sm ${
                            msg.messageType === 'user'
                              ? 'bg-green-500 text-white dark:bg-green-600 dark:text-white'
                              : 'bg-background'
                          }`}
                        >
                          {msg.messageType === 'ai' ? (
                            <div 
                              className="whitespace-pre-line"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.message) }}
                            />
                          ) : (
                            <p className="whitespace-pre-line">{msg.message}</p>
                          )}
                          <div className="text-xs opacity-70 mt-2">
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { 
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
                        <div className="bg-background p-4 rounded-lg text-sm max-w-[80%]">
                          <div 
                            className="whitespace-pre-line min-h-[20px]"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(typingMessage) + '<span class="animate-pulse">|</span>' }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-background border p-4 rounded-lg text-sm max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analisando sua pergunta...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input fixo no rodapé - SEMPRE FIXO NA TELA */}
                <div className={`fixed bottom-0 border-t bg-background/95 backdrop-blur-sm p-4 z-50 right-0 left-0 ${open ? 'md:left-64' : ''}`}>
                  <div className="max-w-2xl mx-auto flex gap-3 items-center">
                    <div className="relative flex-1">
                      <Bot className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Pergunte aqui..."
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        disabled={isChatLoading}
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
                      disabled={!currentQuestion.trim() || isChatLoading}
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
              </>
            )}
          </div>
        </main>
      </div>
    );
};

const AINutrition = () => {
  return (
    <SidebarProvider>
      <AINutritionContent />
    </SidebarProvider>
  );
};

export default AINutrition;