import { useState, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings as SettingsIcon, 
  Camera, 
  User, 
  Mail, 
  Lock, 
  Save,
  Eye,
  EyeOff,
  Upload
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, updateUser, isLoading: userLoading } = useUser();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [avatar, setAvatar] = useState<string>("/placeholder.svg");

  // Carregar dados do usuário no formulário
  useEffect(() => {
    if (!userLoading) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
      if (user.avatar) {
        setAvatar(user.avatar);
      }
    }
  }, [user, userLoading]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se as condições da senha são válidas
  const isPasswordFormValid = 
    formData.currentPassword.trim() !== "" &&
    formData.newPassword.length >= 6 &&
    formData.newPassword === formData.confirmPassword &&
    formData.newPassword !== "";

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    // Validações
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Atualizar dados no contexto global
    updateUser({
      name: formData.name,
      avatar: avatar !== "/placeholder.svg" ? avatar : undefined,
    });

    toast({
      title: "Sucesso",
      description: "Perfil atualizado com sucesso!",
    });
    
    setIsLoading(false);
  };

  const handleChangePassword = async () => {
    setIsLoading(true);

    // Como o botão só fica habilitado quando as validações passam,
    // só precisamos simular a mudança de senha
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Sucesso",
      description: "Senha alterada com sucesso!",
    });

    // Limpar campos de senha
    setFormData(prev => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    
    setIsLoading(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto mobile-header-offset">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9" />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Page Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Configurações do Perfil</h1>
              <p className="text-muted-foreground">
                Gerencie suas informações pessoais e preferências de conta
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Perfil e Avatar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações do Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={avatar} alt="Avatar do usuário" />
                        <AvatarFallback className="text-lg">
                          {formData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background"
                        onClick={handleAvatarClick}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium">{formData.name}</p>
                      <p className="text-xs text-muted-foreground">{formData.email}</p>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAvatarClick}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Alterar Foto
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />

                  <Separator />

                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Seu nome completo"
                      className="form-input"
                    />
                  </div>

                  {/* Email (não editável) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="form-input bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado. Entre em contato com o administrador se necessário.
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="w-full gap-2 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? "Salvando..." : "Salvar Perfil"}
                  </Button>
                </CardContent>
              </Card>

              {/* Segurança */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Senha Atual */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        placeholder="Digite sua senha atual"
                        className="form-input pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Nova Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        placeholder="Digite sua nova senha"
                        className="form-input pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A senha deve ter pelo menos 6 caracteres.
                    </p>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirme sua nova senha"
                        className="form-input pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleChangePassword}
                    disabled={isLoading || !isPasswordFormValid}
                    variant={isPasswordFormValid ? undefined : "outline"}
                    className={`w-full gap-2 ${
                      isPasswordFormValid 
                        ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90" 
                        : ""
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    {isLoading ? "Alterando..." : "Alterar Senha"}
                  </Button>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">Dicas de Segurança</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use uma senha forte com pelo menos 6 caracteres</li>
                      <li>• Combine letras, números e símbolos</li>
                      <li>• Não compartilhe sua senha com ninguém</li>
                      <li>• Altere sua senha regularmente</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer Info */}
            <div className="text-center py-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Suas informações estão seguras e protegidas por criptografia
              </p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings; 