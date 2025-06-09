import { useState, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Upload, X, Users, Sparkles, ChevronUp, Image } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { Switch } from "@/components/ui/switch";
import { recipesService, Recipe } from "@/services/recipesService";
import { categoriesService, Category } from "@/services/categoriesService";
import { useToast } from "@/hooks/use-toast";

const AdminRecipes = () => {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    servings: "",
    difficulty: "" as "Fácil" | "Médio" | "Difícil" | "",
    isGlutenFree: false,
    isLactoseFree: false,
    ingredients: "",
    instructions: ""
  });

  const itemsPerPage = 10;

  // Carregar receitas do banco
  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await recipesService.getAll();
      setRecipes(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as receitas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar categorias para o select
  const loadCategories = async () => {
    try {
      const data = await categoriesService.getAll();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  // Carregar dados na montagem do componente
  useEffect(() => {
    loadRecipes();
    loadCategories();
  }, []);

  // Filtrar receitas
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = searchTerm === "" || 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.categoryName && recipe.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || 
      recipe.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Cálculos da paginação
  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex);

  // Reset da página quando buscar
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setFormData({
      title: "",
      description: "",
      categoryId: "",
      servings: "",
      difficulty: "",
      isGlutenFree: false,
      isLactoseFree: false,
      ingredients: "",
      instructions: ""
    });
    setEditingRecipe(null);
    setImageFile(null);
    setImagePreview("");
    setIsCreateOpen(true);
  };

  const handleEdit = (recipe: Recipe) => {
    setFormData({
      title: recipe.title,
      description: recipe.description,
      categoryId: recipe.categoryId || "",
      servings: recipe.servings.toString(),
      difficulty: recipe.difficulty,
      isGlutenFree: recipe.isGlutenFree,
      isLactoseFree: recipe.isLactoseFree,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions
    });
    setEditingRecipe(recipe);
    setImageFile(null);
    setImagePreview(recipe.image);
    setIsCreateOpen(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (recipeId: string) => {
    if (confirm("Tem certeza que deseja excluir esta receita?")) {
      try {
        await recipesService.delete(recipeId);
        setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
        toast({
          title: "Sucesso",
          description: "Receita excluída com sucesso",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a receita",
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.categoryId || !formData.servings || !formData.difficulty) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const imageUrl = imagePreview || "/placeholder.svg";
      
      const recipeData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        image: imageUrl,
        categoryId: formData.categoryId,
        servings: parseInt(formData.servings),
        difficulty: formData.difficulty as "Fácil" | "Médio" | "Difícil",
        isGlutenFree: formData.isGlutenFree,
        isLactoseFree: formData.isLactoseFree,
        ingredients: formData.ingredients.trim(),
        instructions: formData.instructions.trim(),
        createdBy: null // TODO: Pegar do contexto de auth quando implementar
      };

      if (editingRecipe) {
        // Editar receita existente
        const updatedRecipe = await recipesService.update(editingRecipe.id, recipeData);
        setRecipes(recipes.map(recipe => 
          recipe.id === editingRecipe.id ? updatedRecipe : recipe
        ));
        toast({
          title: "Sucesso",
          description: "Receita atualizada com sucesso",
        });
      } else {
        // Criar nova receita
        const newRecipe = await recipesService.create(recipeData);
        setRecipes([newRecipe, ...recipes]);
        toast({
          title: "Sucesso",
          description: "Receita criada com sucesso",
        });
      }
      
      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        categoryId: "",
        servings: "",
        difficulty: "",
        isGlutenFree: false,
        isLactoseFree: false,
        ingredients: "",
        instructions: ""
      });
      setImageFile(null);
      setImagePreview("");
      setEditingRecipe(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a receita",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto mobile-header-offset">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
            <div className="flex items-center justify-between p-4">
              <SidebarTrigger className="h-9 w-9" />
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Chef LéIA
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Page Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Gestão de Receitas</h1>
              <p className="text-muted-foreground">
                Gerencie as receitas do DeliciasDoBem
              </p>
            </div>

            {/* Filters and Create */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar receitas..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="search-input pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Receita
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRecipe ? "Editar Receita" : "Nova Receita"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingRecipe 
                        ? "Edite as informações da receita." 
                        : "Crie uma nova receita para o DeliciasDoBem."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Coluna 1: Informações básicas */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Título da Receita *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="Ex: Brownie de Chocolate Sem Glúten"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Descrição *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Descreva a receita de forma atrativa..."
                          className="form-input"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Categoria *</Label>
                          <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="servings">Porções *</Label>
                          <Input
                            id="servings"
                            type="number"
                            min="1"
                            value={formData.servings}
                            onChange={(e) => setFormData({...formData, servings: e.target.value})}
                            placeholder="Ex: 8"
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="difficulty">Dificuldade *</Label>
                        <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value as "Fácil" | "Médio" | "Difícil"})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fácil">Fácil</SelectItem>
                            <SelectItem value="Médio">Médio</SelectItem>
                            <SelectItem value="Difícil">Difícil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Restrições Alimentares</Label>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="gluten-free"
                            checked={formData.isGlutenFree}
                            onCheckedChange={(checked) => setFormData({...formData, isGlutenFree: checked})}
                          />
                          <Label htmlFor="gluten-free">Sem Glúten</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="lactose-free"
                            checked={formData.isLactoseFree}
                            onCheckedChange={(checked) => setFormData({...formData, isLactoseFree: checked})}
                          />
                          <Label htmlFor="lactose-free">Sem Lactose</Label>
                        </div>
                      </div>
                    </div>

                    {/* Coluna 2: Imagem, ingredientes e modo de preparo */}
                    <div className="space-y-4">
                      <div>
                        <Label>Imagem da Receita</Label>
                        <div className="space-y-4">
                          {/* Preview da Imagem */}
                          {imagePreview && (
                            <div className="relative inline-block">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-md border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={removeImage}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          
                          {/* Upload Button */}
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              className="gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              {imagePreview ? "Trocar Imagem" : "Carregar Imagem"}
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              PNG, JPEG, JPG
                            </span>
                          </div>
                          
                          {/* Input de Arquivo Oculto */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="ingredients">Ingredientes *</Label>
                        <Textarea
                          id="ingredients"
                          value={formData.ingredients}
                          onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                          placeholder="Liste os ingredientes (um por linha)..."
                          className="form-input"
                          rows={6}
                        />
                      </div>

                      <div>
                        <Label htmlFor="instructions">Modo de Preparo *</Label>
                        <Textarea
                          id="instructions"
                          value={formData.instructions}
                          onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                          placeholder="Descreva o passo a passo do preparo..."
                          className="form-input"
                          rows={6}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      onClick={handleSave}
                      disabled={!formData.title.trim() || !formData.description.trim() || !formData.categoryId || !formData.servings || !formData.difficulty || saving}
                    >
                      {saving ? "Salvando..." : (editingRecipe ? "Salvar Alterações" : "Criar Receita")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Top Pagination */}
            {totalPages > 1 && currentPage > 1 && (
              <div className="flex justify-end py-4 border-b border-border/30">
                <div className="scale-75 origin-right min-w-fit">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            )}

            {/* Recipes Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Carregando receitas do banco...</p>
                </div>
              </div>
            ) : paginatedRecipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory !== "all" ? "Nenhuma receita encontrada" : "Nenhuma receita cadastrada no banco"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {paginatedRecipes.map((recipe) => (
                  <Card key={recipe.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {/* Imagem no lado esquerdo/topo */}
                      <div className="w-full h-48 sm:w-64 sm:h-auto flex-shrink-0">
                        <div className="relative overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none h-full">
                          {recipe.image && recipe.image !== "/placeholder.svg" ? (
                            <img
                              src={recipe.image}
                              alt={recipe.title}
                              className="w-full h-full object-cover"
                              style={{ aspectRatio: '16/9' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Image className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* Badge da categoria no canto superior esquerdo da imagem */}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-background/80">
                              {recipe.categoryName || "Sem categoria"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo no lado direito/embaixo */}
                      <CardContent className="flex-1 p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div className="space-y-3 flex-1">
                            <div>
                              <h3 className="font-semibold text-lg leading-tight mb-2">{recipe.title}</h3>
                              <p className="text-muted-foreground text-sm line-clamp-2">{recipe.description}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-sm text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{recipe.servings} porções</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Sparkles className="w-4 h-4" />
                                <span>{recipe.difficulty}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {recipe.isGlutenFree && (
                                <Badge variant="outline" className="text-xs bg-pastel-green/20 text-foreground border-pastel-green">
                                  Sem Glúten
                                </Badge>
                              )}
                              {recipe.isLactoseFree && (
                                <Badge variant="outline" className="text-xs bg-pastel-blue/20 text-foreground border-pastel-blue">
                                  Sem Lactose
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Botões de Editar/Excluir no canto superior direito do card */}
                          <div className="flex gap-1 self-start sm:self-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(recipe)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(recipe.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>

          {/* Scroll to Top */}
          {showScrollTop && (
            <Button
              className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg"
              onClick={scrollToTop}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminRecipes;