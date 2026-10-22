import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('qless_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('qless_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qless_user');
    }
  }, [user]);

  const login = (email, password) => {
    // Demo login handler
    const mockUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 8),
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()) || "Pasien Terdaftar",
      email,
      phone: "0812-8877-6655",
      nik: "3171052408900002",
      role: "patient"
    };
    setUser(mockUser);
    return { success: true, user: mockUser };
  };

  const register = (formData) => {
    const newUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 8),
      name: formData.name,
      email: formData.email,
      phone: formData.phone || "0812-3344-5566",
      nik: formData.nik || "3171052408900001",
      role: "patient"
    };
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
