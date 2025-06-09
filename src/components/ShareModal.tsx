import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  shareToWhatsApp,
  shareToFacebook,
  shareToInstagram,
  copyToClipboard,
  nativeShare,
} from "@/utils/shareUtils";
import {
  MessageCircle,
  Facebook,
  Instagram,
  Copy,
  Share,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: {
    id: string;
    title: string;
    description: string;
    image: string;
  };
}

export function ShareModal({ isOpen, onClose, recipe }: ShareModalProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const shareData = {
    title: recipe.title,
    description: recipe.description,
    image: recipe.image,
    url: `${window.location.origin}/recipe/${recipe.id}`,
    id: recipe.id,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      setIsSharing(true);
      try {
        await nativeShare(shareData);
        onClose();
      } catch (error) {
        // Share cancelled
      } finally {
        setIsSharing(false);
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const handleCopyToClipboard = async () => {
    setIsSharing(true);
    try {
      await copyToClipboard(shareData);
      toast({
        title: "Conteúdo copiado!",
        description: "Texto da receita + link foram copiados para a área de transferência.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o conteúdo.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleInstagramShare = () => {
    const result = shareToInstagram(shareData);
    toast({
      title: "Instagram",
      description: result.message,
    });
    onClose();
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      action: () => shareToWhatsApp(shareData),
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => shareToFacebook(shareData),
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      action: handleInstagramShare,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            Compartilhar Receita
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview da receita */}
          <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={recipe.image} 
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{recipe.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {recipe.description}
              </p>
            </div>
          </div>

          {/* Botão de compartilhamento nativo (se disponível) */}
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              disabled={isSharing}
              className="w-full gap-2 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              <Share className="w-4 h-4" />
              Compartilhar
            </Button>
          )}

          {/* Opções de redes sociais */}
          <div className="grid grid-cols-1 gap-3">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.name}
                  onClick={() => {
                    option.action();
                    onClose();
                  }}
                  variant="outline"
                  className={`h-12 gap-2 text-white border-0 ${option.color} transition-all`}
                  disabled={isSharing}
                >
                  <Icon className="w-4 h-4" />
                  {option.name}
                </Button>
              );
            })}
          </div>

          {/* Copiar link */}
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className="w-full gap-2"
            disabled={isSharing}
          >
            <Copy className="w-4 h-4" />
            Copiar Receita
          </Button>

          {/* Informação sobre o redirecionamento */}
          <div className="text-xs text-center text-muted-foreground p-2 bg-muted/20 rounded">
            💡 O link compartilhado mostra automaticamente a imagem da receita e leva para a página do DeliciasDoBem
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 