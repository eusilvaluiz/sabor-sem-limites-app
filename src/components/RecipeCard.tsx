import { Heart, Users, Sparkles, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ShareModal } from "./ShareModal";
import { favoritesService } from "@/services/favoritesService";
import { useAuth } from "@/contexts/AuthContext";

interface RecipeCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  servings: number;
  category: string;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  difficulty: "Fácil" | "Médio" | "Difícil";
  isFavorite?: boolean;
}

export function RecipeCard({
  id,
  title,
  description,
  image,
  servings,
  category,
  isGlutenFree,
  isLactoseFree,
  difficulty,
  isFavorite = false,
}: RecipeCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Carregar estado real do favorito quando o componente monta
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user?.id) {
        setFavorite(false);
        return;
      }

      try {
        const isFav = await favoritesService.isFavorite(user.id, id);
        setFavorite(isFav);
      } catch (error) {
        console.error('Erro ao verificar favorito:', error);
        // Se der erro, mantém o estado passado por props
        setFavorite(isFavorite);
      }
    };

    checkFavoriteStatus();
  }, [id, isFavorite, user?.id]);

  const handleFavorite = async () => {
    if (isToggling) return; // Evita cliques múltiplos

    if (!user?.id) {
      toast({
        title: "Login necessário",
        description: "Faça login para favoritar receitas.",
        variant: "destructive",
      });
      return;
    }

    setIsToggling(true);
    try {
      const newFavoriteStatus = await favoritesService.toggleFavorite(user.id, id);
      setFavorite(newFavoriteStatus);
      
      // Disparar evento para outras páginas invalidarem cache
      window.dispatchEvent(new CustomEvent('favoriteChanged', { 
        detail: { recipeId: id, isFavorite: newFavoriteStatus } 
      }));
      
      toast({
        title: newFavoriteStatus ? "Adicionado aos favoritos" : "Removido dos favoritos",
        description: newFavoriteStatus 
          ? `${title} foi salva nos seus favoritos.`
          : `${title} foi removida dos seus favoritos.`,
      });
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o favorito. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFavorite();
  };

  const handleCardClick = () => {
    navigate(`/recipe/${id}`);
  };

  return (
    <>
      <Card className="recipe-card group cursor-pointer hover:shadow-lg transition-all duration-200 border-0" onClick={handleCardClick}>
      <div className="flex flex-col sm:flex-row">
        {/* Imagem no lado esquerdo/topo */}
        <div className="w-full h-48 sm:w-64 sm:h-auto flex-shrink-0">
          <div className="relative overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none h-full">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{ aspectRatio: '16/9' }}
              loading="lazy"
              decoding="async"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-background/80 hover:bg-background"
                onClick={handleFavoriteClick}
                disabled={isToggling}
              >
                <Heart 
                  className={`h-4 w-4 transition-colors ${favorite ? 'fill-red-500 text-red-500' : 'hover:text-red-500'} ${isToggling ? 'opacity-50' : ''}`} 
                />
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
              <Badge variant="secondary" className="bg-background/80">
                {category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Conteúdo no lado direito/embaixo */}
        <div className="flex-1 p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2">{description}</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{servings} porções</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>{difficulty}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isGlutenFree && (
              <Badge variant="outline" className="text-xs bg-pastel-green/20 text-foreground border-pastel-green">
                Sem Glúten
              </Badge>
            )}
            {isLactoseFree && (
              <Badge variant="outline" className="text-xs bg-pastel-blue/20 text-foreground border-pastel-blue">
                Sem Lactose
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>

    <ShareModal
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
      recipe={{
        id,
        title,
        description,
        image,
      }}
    />
    </>
  );
}
