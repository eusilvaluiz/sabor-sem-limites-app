
import { Heart, Clock, Users, Sparkles, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface RecipeCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  prepTime: number;
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
  prepTime,
  servings,
  category,
  isGlutenFree,
  isLactoseFree,
  difficulty,
  isFavorite = false,
}: RecipeCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const { toast } = useToast();

  const handleFavorite = () => {
    setFavorite(!favorite);
    toast({
      title: favorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: favorite 
        ? `${title} foi removida dos seus favoritos.` 
        : `${title} foi salva nos seus favoritos.`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${title} - DeliciasDoBem`,
        text: `Confira esta receita deliciosa: ${description}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link da receita foi copiado para a área de transferência.",
      });
    }
  };

  return (
    <Card className="recipe-card group">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-background/80 hover:bg-background"
              onClick={handleFavorite}
            >
              <Heart 
                className={`h-4 w-4 ${favorite ? 'fill-primary text-primary' : ''}`} 
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
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg leading-tight mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{description}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{prepTime}min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{servings} porções</span>
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
      </CardContent>
    </Card>
  );
}
