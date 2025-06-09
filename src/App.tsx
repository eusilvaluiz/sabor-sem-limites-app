import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InstallPWA } from "@/components/InstallPWA";
import { usePWA } from "@/hooks/usePWA";
import { useEffect } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute, ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Categories from "./pages/Categories";
import CategoryRecipes from "./pages/CategoryRecipes";
import AdminCategories from "./pages/AdminCategories";
import AdminRecipes from "./pages/AdminRecipes";
import AdminUsers from "./pages/AdminUsers";
import AdminChefLeia from "./pages/AdminChefLeia";
import Favorites from "./pages/Favorites";
import Recipe from "./pages/Recipe";
import AINutrition from "./pages/AINutrition";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const AppContent = () => {
  const { registerServiceWorker } = usePWA();

  useEffect(() => {
    // Registrar service worker quando o app carrega
    registerServiceWorker();
  }, [registerServiceWorker]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<Index />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:categoryName" element={<CategoryRecipes />} />
          <Route path="/recipe/:recipeId" element={<Recipe />} />
          
          {/* Rotas protegidas (apenas usuários logados) */}
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/shopping-list" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/ai-nutrition" element={<ProtectedRoute><AINutrition /></ProtectedRoute>} />
          <Route path="/recipe-calculator" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          {/* Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas de admin - PROTEGIDAS */}
          <Route path="/admin" element={<AdminRoute><AdminRecipes /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/recipes" element={<AdminRoute><AdminRecipes /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/chef-leia" element={<AdminRoute><AdminChefLeia /></AdminRoute>} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <InstallPWA />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </UserProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
