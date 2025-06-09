import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePWA } from "@/hooks/usePWA";
import { Download, X, Smartphone, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InstallPWA() {
  const { isInstallable, isInstalled, isOnline, installPWA } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();

  // Não mostrar se já foi instalado, dismissado ou não é instalável
  if (isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const installed = await installPWA();
      
      if (installed) {
        toast({
          title: "App instalado!",
          description: "DeliciasDoBem foi adicionado à sua tela inicial.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na instalação",
        description: "Não foi possível instalar o app. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Instalar DeliciasDoBem
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Adicione à sua tela inicial para acesso rápido e use offline
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                {isOnline ? (
                  <div className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-green-500" />
                    <span>Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <WifiOff className="w-3 h-3 text-red-500" />
                    <span>Offline</span>
                  </div>
                )}
                <span>•</span>
                <span>Funciona sem internet</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  size="sm"
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="w-4 h-4" />
                  {isInstalling ? "Instalando..." : "Instalar"}
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 