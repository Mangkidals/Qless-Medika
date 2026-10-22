import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ADMIN_CREDENTIALS = {
  email: 'adminganz123@gmail.com',
  password: 'ladeshgimank',
  name: 'Petugas Administrator Loket',
  role: 'admin',
  department: 'Loket Pendaftaran & Pelayanan Antrean RS'
};

export function AuthProvider({ children }) {
  // 1. Separate Patient User State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('qless_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Separate Admin State
  const [admin, setAdmin] = useState(() => {
    try {
      const savedAdmin = localStorage.getItem('qless_admin');
      return savedAdmin ? JSON.parse(savedAdmin) : null;
    } catch {
      return null;
    }
  });

  // Sync Patient to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('qless_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qless_user');
    }
  }, [user]);

  // Sync Admin to localStorage
  useEffect(() => {
    if (admin) {
      localStorage.setItem('qless_admin', JSON.stringify(admin));
    } else {
      localStorage.removeItem('qless_admin');
    }
  }, [admin]);

  // --- PATIENT AUTH METHODS ---
  const login = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user accidentally entered admin email in patient login
    if (cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase()) {
      return {
        success: false,
        isAdminAccount: true,
        error: 'Email ini terdaftar sebagai Administrator Rumah Sakit. Silakan login melalui Portal Khusus Admin.'
      };
    }

    const mockUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 8),
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()) || "Pasien Terdaftar",
      email: cleanEmail,
      phone: "0812-8877-6655",
      nik: "3171052408900002",
      role: "patient"
    };
    setUser(mockUser);
    return { success: true, user: mockUser };
  };

  const register = (formData) => {
    const cleanEmail = formData.email.trim().toLowerCase();

    // Prevent registering with admin email
    if (cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase()) {
      return {
        success: false,
        error: 'Email ini diproteksi khusus untuk Administrator Rumah Sakit.'
      };
    }

    const newUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 8),
      name: formData.name,
      email: cleanEmail,
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

  // --- ADMIN AUTH METHODS ---
  const loginAdmin = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() && cleanPassword === ADMIN_CREDENTIALS.password) {
      const adminProfile = {
        id: "adm-001",
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        role: "admin",
        department: ADMIN_CREDENTIALS.department,
        lastLogin: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setAdmin(adminProfile);
      return { success: true, admin: adminProfile };
    }

    return {
      success: false,
      error: 'Email atau kata sandi admin salah! Pastikan menggunakan kredensial resmi administrator.'
    };
  };

  const logoutAdmin = () => {
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        // Patient Auth
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,

        // Admin Auth
        admin,
        loginAdmin,
        logoutAdmin,
        isAdminAuthenticated: !!admin,
        ADMIN_CREDENTIALS
      }}
    >
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

