import { useState, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Image, Upload, X, Sparkles, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/Pagination";
import { categoriesService, Category } from "@/services/categoriesService";
import { useToast } from "@/hooks/use-toast";

const AdminCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", image: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Carregar categorias do banco
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.getAll();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar categorias na montagem do componente
  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos da paginação
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Reset da página quando buscar
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setFormData({ name: "", image: "" });
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview("");
    setIsCreateOpen(true);
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, image: category.image });
    setEditingCategory(category);
    setImageFile(null);
    setImagePreview(category.image);
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

  const handleDelete = async (categoryId: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await categoriesService.delete(categoryId);
        setCategories(categories.filter(cat => cat.id !== categoryId));
        toast({
          title: "Sucesso",
          description: "Categoria excluída com sucesso",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a categoria",
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const imageUrl = imagePreview || "/placeholder.svg";
      
      const categoryData = {
        name: formData.name.trim(),
        image: imageUrl,
        recipeCount: 0
      };

      if (editingCategory) {
        // Editar categoria existente
        const updatedCategory = await categoriesService.update(editingCategory.id, categoryData);
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? updatedCategory : cat
        ));
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        });
      } else {
        // Criar nova categoria
        const newCategory = await categoriesService.create(categoryData);
        setCategories([...categories, newCategory]);
        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso",
        });
      }
      
      setIsCreateOpen(false);
      setFormData({ name: "", image: "" });
      setImageFile(null);
      setImagePreview("");
      setEditingCategory(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a categoria",
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
              <h1 className="text-2xl font-bold">Gestão de Categorias</h1>
              <p className="text-muted-foreground">
                Gerencie as categorias de receitas
              </p>
            </div>

            {/* Search and Create */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="search-input pl-10"
                />
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCategory 
                        ? "Edite as informações da categoria." 
                        : "Crie uma nova categoria de receitas."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome da Categoria</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: Doces, Salgados..."
                        className="form-input"
                      />
                    </div>
                    
                    <div>
                      <Label>Imagem da Categoria</Label>
                      <div className="space-y-4">
                        {/* Preview da Imagem */}
                        {imagePreview && (
                          <div className="relative inline-block">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-32 h-20 object-cover rounded-md border"
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
                            PNG, JPEG, JPG (máx. 5MB)
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
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      onClick={handleSave}
                      disabled={!formData.name.trim() || saving}
                    >
                      {saving ? "Salvando..." : (editingCategory ? "Salvar Alterações" : "Criar Categoria")}
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

            {/* Categories Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Carregando categorias do banco...</p>
                </div>
              </div>
            ) : paginatedCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria cadastrada no banco"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {paginatedCategories.map((category) => (
                  <Card key={category.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {/* Imagem Thumbnail */}
                      <div className="w-full h-48 sm:w-48 sm:h-32 flex-shrink-0 bg-muted relative overflow-hidden">
                        {category.image && category.image !== "/placeholder.svg" ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <CardContent className="flex-1 p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div className="space-y-2 flex-1">
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                              <span>{category.recipeCount} receitas</span>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex gap-1 self-start sm:self-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(category)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(category.id)}
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

          {/* Scroll to Top Button */}
          {showScrollTop && (
            <Button
              onClick={scrollToTop}
              size="icon"
              className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 animate-in fade-in slide-in-from-bottom-2"
              title="Voltar ao topo"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminCategories; 