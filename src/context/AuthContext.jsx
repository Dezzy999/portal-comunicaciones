import { createContext, useContext, useState } from 'react';
import { usuariosService } from '../services/dataService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (usuario, password) => {
    try {
      const { data, error } = await usuariosService.login(usuario, password);
      if (data && !error) {
        setUser(data);
        return true;
      }
    } catch (err) {
      console.error("Auth login error:", err);
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
