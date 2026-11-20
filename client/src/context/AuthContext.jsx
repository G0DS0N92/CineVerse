import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cineverse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cineverse_token') || null);
  const [loading, setLoading] = useState(true);

  // Check token validity on app launch
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('cineverse_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await API.get('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('cineverse_user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out.');
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  // Register user
  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password });
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('cineverse_token', data.token);
      localStorage.setItem('cineverse_user', JSON.stringify(data.user));
    }
    return data;
  };

  // Login user
  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('cineverse_token', data.token);
      localStorage.setItem('cineverse_user', JSON.stringify(data.user));
    }
    return data;
  };

  // Logout user
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cineverse_token');
    localStorage.removeItem('cineverse_user');
  };

  // Update profile name
  const updateProfile = async (name) => {
    const { data } = await API.patch('/auth/profile', { name });
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('cineverse_user', JSON.stringify(data.user));
    }
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
