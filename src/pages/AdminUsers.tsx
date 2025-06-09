import { useState, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, Eye, EyeOff, User as UserIcon, Mail, Calendar, Sparkles, ChevronUp, Shield } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { usersService, User } from "@/services/usersService";
import { useToast } from "@/hooks/use-toast";

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const itemsPerPage = 10;

  // Carregar usuários do banco
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setUsers(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na montagem do componente
  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Cálculos da paginação
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset da página quando buscar
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setFormData({
      name: "",
      email: "",
      password: ""
    });
    setEditingUser(null);
    setShowPassword(false);
    setIsCreateOpen(true);
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: ""
    });
    setEditingUser(user);
    setShowPassword(false);
    setIsCreateOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        await usersService.delete(userId);
        setUsers(users.filter(user => user.id !== userId));
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: `Erro ao excluir usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast({
        title: "Erro",
        description: "Informe uma senha para o novo usuário",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        // Atualizar usuário existente (sem senha e mantém role original)
        const updatedUser = await usersService.update(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: editingUser.role, // Manter role original
          avatarUrl: null
        });
        
        setUsers(users.map(user => 
          user.id === editingUser.id ? updatedUser : user
        ));

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        });
      } else {
        // Criar novo usuário (sempre como 'user')
        const newUser = await usersService.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "user", // Sempre criar como usuário
          avatarUrl: null
        });
        
        setUsers([newUser, ...users]);

        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso",
        });
      }

      setIsCreateOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: editingUser ? "Não foi possível atualizar o usuário" : "Não foi possível criar o usuário",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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
              <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
              <p className="text-muted-foreground">
                Gerencie os usuários do sistema
              </p>
            </div>

            {/* Search and Create */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="search-input pl-10"
                />
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? "Editar Usuário" : "Novo Usuário"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser 
                        ? "Edite as informações do usuário." 
                        : "Crie um novo usuário do sistema."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: João Silva"
                        className="form-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="joao@exemplo.com"
                        className="form-input"
                      />
                    </div>

                    {!editingUser && (
                      <div>
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="Digite a senha"
                            className="form-input pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      onClick={handleSave}
                      disabled={!formData.name.trim() || !formData.email.trim() || saving}
                    >
                      {saving ? "Salvando..." : (editingUser ? "Salvar Alterações" : "Criar Usuário")}
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

            {/* Users Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Carregando usuários do banco...</p>
                </div>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado no banco"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {paginatedUsers.map((user) => (
                  <Card key={user.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg leading-tight">{user.name}</h3>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                {user.role === 'admin' ? 'Admin' : 'Usuário'}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span>{user.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Desde {formatDate(user.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Ações */}
                        <div className="flex gap-1 self-start sm:self-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
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

export default AdminUsers; 