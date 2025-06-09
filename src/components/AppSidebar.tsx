import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from "@/components/ui/sidebar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ChefHat, 
  Home, 
  Heart, 
  FolderOpen, 
  Users, 
  Sparkles,
  LogOut,
  User,
  MessageSquare,
  Trash2,
  BookOpen,
  Settings
} from "lucide-react";
import { conversationService, Conversation } from "@/services/conversationService";

const mainMenuItems = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Categorias",
    url: "/categories",
    icon: BookOpen,
  },
  {
    title: "Favoritos",
    url: "/favorites",
    icon: Heart,
  },
];

const aiMenuItems = [
  {
    title: "Chef LéIA",
    url: "/ai-nutrition",
    icon: Sparkles,
  },
];

const adminMenuItems = [
  {
    title: "Categorias",
    url: "/admin/categories",
    icon: FolderOpen,
  },
  {
    title: "Receitas",
    url: "/admin/recipes",
    icon: ChefHat,
  },
  {
    title: "Usuários",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Chef LéIA",
    url: "/admin/chef-leia",
    icon: Sparkles,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: isLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    const cacheKey = `deliciasdobem-conversations-${user.id}`;
    
    try {
      // 1. TENTAR CACHE PRIMEIRO (instantâneo)
      const cachedConversations = localStorage.getItem(cacheKey);
      if (cachedConversations) {
        const conversations = JSON.parse(cachedConversations);
        setConversations(conversations);
        setLoadingConversations(false);
      }
      
      // 2. ATUALIZAR DO BANCO EM BACKGROUND
      try {
        const userConversations = await conversationService.getUserConversations(user.id);
        setConversations(userConversations);
        localStorage.setItem(cacheKey, JSON.stringify(userConversations));
      } catch (networkError) {
        console.error('Erro ao atualizar conversas:', networkError);
        // Se cache estava vazio e falhou, manter vazio
        if (!cachedConversations) {
          setConversations([]);
        }
      }
      
    } catch (error) {
      console.error('Erro geral ao carregar conversas:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id]);

  // Carregar conversas quando usuário estiver logado
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Escutar evento personalizado para recarregar conversas
  useEffect(() => {
    const handleConversationUpdate = (event: Event) => {
      console.log('🗣️ Evento de conversa recebido:', event.type);
      // Invalidar cache e recarregar
      if (user) {
        const cacheKey = `deliciasdobem-conversations-${user.id}`;
        localStorage.removeItem(cacheKey);
        loadConversations();
      }
    };

    window.addEventListener('conversationCreated', handleConversationUpdate);
    window.addEventListener('conversationDeleted', handleConversationUpdate);

    return () => {
      window.removeEventListener('conversationCreated', handleConversationUpdate);
      window.removeEventListener('conversationDeleted', handleConversationUpdate);
    };
  }, [user?.id, loadConversations]); // Adicionar loadConversations como dependência

  // Função para invalidar cache de conversas
  const invalidateConversationsCache = useCallback(() => {
    if (user) {
      const cacheKey = `deliciasdobem-conversations-${user.id}`;
      localStorage.removeItem(cacheKey);
      loadConversations();
    }
  }, [user, loadConversations]);

  // Função para atualizar conversas (chamada externamente)
  const refreshConversations = useCallback(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  const handleNewChefLeiaChat = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Sempre navegar para Chef LéIA sem parâmetros = nova conversa FORÇADA
    console.log('🗣️ Forçando nova conversa - limpando estado atual');
    
    // Se já estamos na página, forçar reload para limpar estado
    if (location.pathname === '/ai-nutrition') {
      // Navegar para outra rota temporariamente e depois voltar para forçar remount
      navigate('/');
      setTimeout(() => {
        navigate('/ai-nutrition');
      }, 50);
    } else {
      navigate('/ai-nutrition');
    }
  }, [location.pathname, navigate]);

  const handleDeleteConversation = useCallback(async (conversationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Abrir modal de confirmação ao invés de deletar diretamente
    setConversationToDelete(conversationId);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteConversation = useCallback(async () => {
    if (!conversationToDelete || !user) return;

    try {
      await conversationService.deleteConversation(conversationToDelete);
      
      // Atualizar estado e cache imediatamente
      const updatedConversations = conversations.filter(conv => conv.id !== conversationToDelete);
      setConversations(updatedConversations);
      
      // Atualizar cache
      const cacheKey = `deliciasdobem-conversations-${user.id}`;
      localStorage.setItem(cacheKey, JSON.stringify(updatedConversations));
      
      // Disparar evento para notificar outros componentes
      console.log('🗣️ Disparando evento conversationDeleted');
      window.dispatchEvent(new CustomEvent('conversationDeleted'));
      
      toast({
        title: "Conversa excluída",
        description: "A conversa foi removida com sucesso.",
      });

      // Se estamos na conversa que foi deletada, redirecionar para nova
      if (location.search.includes(`conversation=${conversationToDelete}`)) {
        navigate('/ai-nutrition');
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setConversationToDelete(null);
    }
  }, [conversationToDelete, user, conversations, location.search, navigate, toast]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }, [signOut, navigate]);

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              DeliciasDoBem
            </h1>
            <p className="text-xs text-muted-foreground">
              Receitas sem culpa
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className={`transition-colors duration-200 hover:bg-accent hover:text-accent-foreground ${
                      location.pathname === item.url ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Funcionalidades IA</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNewChefLeiaChat}
                  isActive={location.pathname === '/ai-nutrition'}
                  className={`transition-colors duration-200 hover:bg-accent hover:text-accent-foreground ${
                    location.pathname === '/ai-nutrition' ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4" />
                    <span>Chef LéIA</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CONVERSAS DA CHEF LÉIA */}
        {user && (conversations.length > 0 || (loadingConversations && conversations.length === 0)) && (
          <SidebarGroup>
            <SidebarGroupLabel>Conversas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loadingConversations && conversations.length === 0 ? (
                  // Só mostra loading se não tem cache
                  <SidebarMenuItem>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
                      <span className="text-sm text-muted-foreground">Carregando...</span>
                    </div>
                  </SidebarMenuItem>
                ) : (
                  conversations.map((conversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <div className="flex items-center group">
                        <SidebarMenuButton 
                          asChild 
                          className="flex-1 text-left transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
                        >
                          <a 
                            href={`/ai-nutrition?conversation=${conversation.id}`} 
                            className="flex items-center gap-3 min-w-0"
                          >
                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate text-sm">{conversation.title}</span>
                          </a>
                        </SidebarMenuButton>
                        <button
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-destructive hover:text-destructive-foreground rounded-md mr-2"
                          title="Excluir conversa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ADMINISTRAÇÃO - APENAS PARA ADMINS */}
        {user?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.url}
                      className={`transition-colors duration-200 hover:bg-accent hover:text-accent-foreground ${
                        location.pathname === item.url ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button 
            onClick={handleLogout}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
          {user?.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user?.name || "Avatar do usuário"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="flex-1">
            {isLoading ? (
              <>
                <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </>
            ) : user ? (
              <>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Usuário</p>
                <p className="text-xs text-muted-foreground">Não logado</p>
              </>
            )}
          </div>
          <a 
            href="/settings" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
            title="Configurações"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </SidebarFooter>

      {/* Modal de confirmação para excluir conversa */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
