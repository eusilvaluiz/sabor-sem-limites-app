
import { 
  Home, 
  Search, 
  Bookmark, 
  User, 
  Settings, 
  ChefHat,
  Heart,
  ShoppingCart,
  Sparkles,
  BookOpen,
  Shield
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";

const mainMenuItems = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Buscar Receitas",
    url: "/search",
    icon: Search,
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
  {
    title: "Lista de Compras",
    url: "/shopping-list",
    icon: ShoppingCart,
  },
];

const aiMenuItems = [
  {
    title: "IA Nutricional",
    url: "/ai-nutrition",
    icon: Sparkles,
  },
  {
    title: "Calculadora de Receitas",
    url: "/recipe-calculator",
    icon: ChefHat,
  },
];

const adminMenuItems = [
  {
    title: "Painel Admin",
    url: "/admin",
    icon: Shield,
  },
];

export function AppSidebar() {
  const location = useLocation();

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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="transition-colors duration-200"
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
              {aiMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="transition-colors duration-200"
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
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="transition-colors duration-200"
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
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Usuária</p>
            <p className="text-xs text-muted-foreground">Modo Gourmet</p>
          </div>
          <Settings className="w-4 h-4 text-muted-foreground" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
