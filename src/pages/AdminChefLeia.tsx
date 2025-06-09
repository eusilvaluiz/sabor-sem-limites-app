import { useState, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Save, 
  RotateCcw, 
  Eye, 
  Upload,
  Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { chefLeiaService, ChefLeiaConfig } from "@/services/chefLeiaService";

const AdminChefLeia = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados principais
  const [config, setConfig] = useState<ChefLeiaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    title: "Chef LéIA",
    description: "Sua assistente pessoal para dúvidas sobre nutrição, dietas e alimentação saudável",
    suggestions: [
      "Quantas calorias devo consumir por dia?",
      "Quais são as melhores fontes de proteína?",
      "Como montar um cardápio saudável?",
      "Preciso de suplementos vitamínicos?"
    ]
  });

  // Estados do avatar
  const [avatarType, setAvatarType] = useState<'emoji' | 'image'>('emoji');
  const [avatarEmoji, setAvatarEmoji] = useState("👩‍🍳");
  const [avatarColor, setAvatarColor] = useState("#ec4899"); // pink-500
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  // Carregar configuração do banco
  const loadConfig = async () => {
    try {
      setLoading(true);
      const configData = await chefLeiaService.getOrCreateDefaultConfig();
      
      setConfig(configData);
      setFormData({
        title: configData.title,
        description: configData.description,
        suggestions: configData.suggestions
      });
      setAvatarType(configData.avatarType);
      setAvatarEmoji(configData.avatarEmoji);
      setAvatarColor(configData.avatarColor);
      setAvatarImage(configData.avatarImageUrl);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações da Chef LéIA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na montagem do componente
  useEffect(() => {
    loadConfig();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSuggestionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      suggestions: prev.suggestions.map((suggestion, i) => 
        i === index ? value : suggestion
      )
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 2MB.",
          variant: "destructive",
        });
        return;
      }

      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarImage(e.target?.result as string);
        setAvatarType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Validações
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    // Verificar se todas as sugestões estão preenchidas
    const emptySuggestions = formData.suggestions.filter(s => !s.trim());
    if (emptySuggestions.length > 0) {
      toast({
        title: "Erro",
        description: "Todas as sugestões devem ser preenchidas.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    try {
      if (!config) {
        toast({
          title: "Erro",
          description: "Configuração não foi carregada.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const updatedConfig = await chefLeiaService.updateConfig(config.id, {
        title: formData.title,
        description: formData.description,
        suggestions: formData.suggestions,
        avatarType: avatarType,
        avatarEmoji: avatarEmoji,
        avatarColor: avatarColor,
        avatarImageUrl: avatarImage,
        assistantId: config.assistantId,
        isActive: true
      });

      setConfig(updatedConfig);

      toast({
        title: "Sucesso",
        description: "Configurações da Chef LéIA atualizadas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: "Chef LéIA",
      description: "Sua assistente pessoal para dúvidas sobre nutrição, dietas e alimentação saudável",
      suggestions: [
        "Quantas calorias devo consumir por dia?",
        "Quais são as melhores fontes de proteína?",
        "Como montar um cardápio saudável?",
        "Preciso de suplementos vitamínicos?"
      ]
    });
    setAvatarType('emoji');
    setAvatarEmoji("👩‍🍳");
    setAvatarColor("#ec4899");
    setAvatarImage(null);
    
    toast({
      title: "Reset realizado",
      description: "Todas as configurações foram restauradas para o padrão.",
    });
  };

  const presetColors = [
    "#ec4899", // pink-500
    "#8b5cf6", // violet-500  
    "#06b6d4", // cyan-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#6366f1", // indigo-500
    "#84cc16", // lime-500
  ];

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
          <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Page Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Configurações da Chef LéIA</h1>
              <p className="text-muted-foreground">
                Personalize a aparência e conteúdo da assistente de IA
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Carregando configurações da Chef LéIA...</p>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 p-8 rounded-lg">
                      <div className="text-center space-y-4">
                        {/* Avatar Preview */}
                        <div className="mx-auto">
                          {avatarType === 'image' && avatarImage ? (
                            <div className="w-24 h-24 rounded-full mx-auto mb-2 border-4 border-white shadow-lg overflow-hidden">
                              <img 
                                src={avatarImage} 
                                alt="Chef LéIA" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div 
                              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-white shadow-lg"
                              style={{ backgroundColor: avatarColor }}
                            >
                              <div className="text-white text-2xl font-bold">{avatarEmoji}</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h1 className="text-2xl font-bold">{formData.title}</h1>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            {formData.description}
                          </p>
                        </div>

                        {/* Sugestões Preview */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Sugestões:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {formData.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="h-auto p-2 text-xs text-left"
                                disabled
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Configurações */}
                <div className="space-y-6">
                  {/* Avatar */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Avatar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-4">
                        <Button
                          variant={avatarType === 'emoji' ? 'default' : 'outline'}
                          onClick={() => setAvatarType('emoji')}
                          className="flex-1 gap-2"
                        >
                          <Palette className="w-4 h-4" />
                          Emoji + Cor
                        </Button>
                        <Button
                          variant={avatarType === 'image' ? 'default' : 'outline'}
                          onClick={() => {
                            setAvatarType('image');
                            fileInputRef.current?.click();
                          }}
                          className="flex-1 gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Imagem
                        </Button>
                      </div>

                      {avatarType === 'emoji' && (
                        <div className="space-y-4">
                          <div>
                            <Label>Emoji</Label>
                            <Input
                              value={avatarEmoji}
                              onChange={(e) => setAvatarEmoji(e.target.value)}
                              placeholder="👩‍🍳"
                              className="text-center text-2xl h-12"
                            />
                          </div>

                          <div>
                            <Label>Cor de Fundo</Label>
                            <div className="flex gap-2 mt-2">
                              {presetColors.map((color) => (
                                <button
                                  key={color}
                                  className={`w-8 h-8 rounded-full border-2 ${
                                    avatarColor === color ? 'border-foreground' : 'border-muted'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setAvatarColor(color)}
                                />
                              ))}
                            </div>
                            <Input
                              type="color"
                              value={avatarColor}
                              onChange={(e) => setAvatarColor(e.target.value)}
                              className="w-full h-8 mt-2"
                            />
                          </div>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </CardContent>
                  </Card>

                  {/* Textos */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title">Título</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Chef LéIA"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Sua assistente pessoal para..."
                          className="form-input min-h-[80px]"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sugestões */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sugestões Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.suggestions.map((suggestion, index) => (
                        <div key={index}>
                          <Label htmlFor={`suggestion-${index}`}>Sugestão {index + 1}</Label>
                          <Input
                            id={`suggestion-${index}`}
                            value={suggestion}
                            onChange={(e) => handleSuggestionChange(index, e.target.value)}
                            placeholder={`Sugestão ${index + 1}`}
                            className="form-input"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 gap-2 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Salvando..." : "Salvar Configurações"}
                    </Button>
                    
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      disabled={saving}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Info */}
            <div className="text-center py-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                As alterações serão aplicadas imediatamente na tela da Chef LéIA
              </p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminChefLeia; 