import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      api.getProfile()
        .then((profile) => {
          const merged = { ...JSON.parse(storedUser), ...profile };
          setUser(merged);
          localStorage.setItem('user', JSON.stringify(merged));
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const data = await api.register(formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const setSessionUser = (profile) => {
    let merged;
    setUser((prev) => {
      merged = { ...prev, ...profile };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
    return merged;
  };

  const updateProfile = async (body) => {
    const profile = await api.updateProfile(body);
    return setSessionUser(profile);
  };

  const isAdmin = user?.role === ROLES.ADMIN;
  const isCustomer = user?.role === ROLES.CUSTOMER;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
