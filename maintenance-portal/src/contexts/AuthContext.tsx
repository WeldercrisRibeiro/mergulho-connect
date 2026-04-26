import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface MaintenanceUser {
  id: string;
  email: string;
  role: string;
  profile?: {
    fullName?: string;
    username?: string;
  };
}

interface AuthContextType {
  user: MaintenanceUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MaintenanceUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('maintenance_auth_token');
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        const restoredUser: MaintenanceUser = {
          id: data.id,
          email: data.email,
          role: data.role,
          profile: data.profile,
        };
        localStorage.setItem('maintenance_user', JSON.stringify(restoredUser));
        setUser(restoredUser);
      } catch {
        localStorage.removeItem('maintenance_auth_token');
        localStorage.removeItem('maintenance_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      const allowedRoles = ['admin_ccm', 'admin'];
      if (!allowedRoles.includes(userData.role)) {
        throw new Error('Acesso negado. Apenas administradores podem acessar este portal.');
      }

      localStorage.setItem('maintenance_auth_token', access_token);
      localStorage.setItem('maintenance_user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { status?: number } };
      const status = err.response?.status;
      if (status === 401) {
        throw new Error('Credenciais inválidas. Verifique usuário e senha.');
      }
      if (status === 404) {
        throw new Error('API de autenticação não encontrada. Verifique VITE_API_URL.');
      }
      throw new Error(err.message || 'Falha na autenticação. Tente novamente.');
    }
  };

  const logout = () => {
    localStorage.removeItem('maintenance_auth_token');
    localStorage.removeItem('maintenance_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
