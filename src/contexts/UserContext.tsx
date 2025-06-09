import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

interface UserContextType {
  user: UserData;
  updateUser: (userData: Partial<UserData>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData>({
    name: '',
    email: '',
    avatar: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Simular carregamento inicial dos dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Aqui você faria a chamada para a API/banco de dados
        // const response = await api.getCurrentUser();
        
        // Por enquanto, dados mockados (buscar do localStorage se existir)
        const savedUser = localStorage.getItem('userData');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          // Dados padrão - limpar localStorage conflitante
          localStorage.removeItem('userData');
          const defaultUser = {
            name: 'Maria Silva',
            email: 'maria@email.com',
          };
          setUser(defaultUser);
          localStorage.setItem('userData', JSON.stringify(defaultUser));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        // Fallback para dados padrão
        setUser({
          name: 'Usuário',
          email: 'usuario@email.com',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const updateUser = (userData: Partial<UserData>) => {
    setUser(prev => {
      const newUser = { ...prev, ...userData };
      
      // Salvar no localStorage (temporário até ter backend)
      localStorage.setItem('userData', JSON.stringify(newUser));
      
      // Aqui você faria a chamada para atualizar no backend
      // api.updateUser(newUser);
      
      return newUser;
    });
  };

  const value = {
    user,
    updateUser,
    isLoading,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 