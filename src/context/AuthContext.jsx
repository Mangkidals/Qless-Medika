import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  verifyAdminCredentials,
  createAdminSession,
  validateAdminSession,
  getBruteForceStatus,
  recordFailedAdminLogin,
  resetBruteForceTracker
} from '../utils/security';

const AuthContext = createContext(null);

export const ADMIN_CREDENTIALS = {
  email: 'adminganz123@gmail.com',
  name: 'Petugas Administrator Loket',
  role: 'admin',
  department: 'Loket Pendaftaran & Pelayanan Antrean RS'
};

export function AuthProvider({ children }) {
  // 1. Separate Patient User State (Persisted in localStorage)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('qless_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Separate Secure Admin State (Stored in sessionStorage with Cryptographic Signature & TTL)
  const [admin, setAdmin] = useState(() => {
    try {
      // Purge any legacy unencrypted/insecure localStorage admin session
      localStorage.removeItem('qless_admin');

      const savedAdminRaw = sessionStorage.getItem('qless_admin_session');
      if (!savedAdminRaw) return null;

      const parsed = JSON.parse(savedAdminRaw);
      const validated = validateAdminSession(parsed);
      if (!validated) {
        sessionStorage.removeItem('qless_admin_session');
        return null;
      }
      return validated;
    } catch {
      sessionStorage.removeItem('qless_admin_session');
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

  // Sync Admin to sessionStorage (Never localStorage to prevent persistent session hijacking)
  useEffect(() => {
    if (admin) {
      sessionStorage.setItem('qless_admin_session', JSON.stringify(admin));
    } else {
      sessionStorage.removeItem('qless_admin_session');
      localStorage.removeItem('qless_admin');
    }
  }, [admin]);

  // Periodic Session TTL Check (Every 15 seconds) - Auto logout on expiration or DevTools tampering
  useEffect(() => {
    if (!admin) return;

    const interval = setInterval(() => {
      const valid = validateAdminSession(admin);
      if (!valid) {
        console.warn('[Security Guard] Admin session expired or invalidated. Logging out.');
        setAdmin(null);
        sessionStorage.removeItem('qless_admin_session');
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [admin]);

  // --- UNIFIED AUTH METHOD (Admin & Patient Single Gateway) ---
  const login = useCallback((email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Role Detection: Check if credentials match ADMINISTRATOR
    if (cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase()) {
      // Check Anti-Brute Force Lockout
      const bfStatus = getBruteForceStatus();
      if (bfStatus.isLocked) {
        return {
          success: false,
          role: 'admin',
          isLocked: true,
          error: `Akses ditolak: Akun administrator terkunci sementara karena 5x kegagalan autentikasi. Silakan coba lagi dalam ${bfStatus.remainingSeconds || 900} detik.`
        };
      }

      // Verify salted SHA-256 hash
      const isValidAdmin = verifyAdminCredentials(cleanEmail, cleanPassword);

      if (isValidAdmin) {
        resetBruteForceTracker();
        const signedSession = createAdminSession(cleanEmail);
        setAdmin(signedSession);
        setUser(null); // Clear patient user session when admin logs in
        sessionStorage.setItem('qless_admin_session', JSON.stringify(signedSession));
        localStorage.removeItem('qless_admin');

        return {
          success: true,
          role: 'admin',
          admin: signedSession,
          redirect: '/admin'
        };
      }

      // Record failed admin login attempt
      const attemptResult = recordFailedAdminLogin();
      if (attemptResult.isLocked) {
        return {
          success: false,
          role: 'admin',
          isLocked: true,
          error: 'Akun administrator telah dikunci selama 15 menit karena mencapai batas 5 kali kegagalan autentikasi (Anti-Brute Force).'
        };
      }

      return {
        success: false,
        role: 'admin',
        error: `Kata sandi administrator salah! Sisa percobaan: ${attemptResult.remainingAttempts} kali sebelum akun dikunci.`
      };
    }

    // 2. Role Detection: Regular PATIENT / USER
    const mockUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 8),
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()) || "Pasien Terdaftar",
      email: cleanEmail,
      phone: "0812-8877-6655",
      nik: "3171052408900002",
      role: "patient"
    };

    setUser(mockUser);
    setAdmin(null); // Clear admin session when patient logs in
    sessionStorage.removeItem('qless_admin_session');

    return {
      success: true,
      role: 'patient',
      user: mockUser,
      redirect: '/'
    };
  }, []);

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

  // Backwards compatibility alias for loginAdmin
  const loginAdmin = useCallback((email, password) => {
    return login(email, password);
  }, [login]);

  const logoutAdmin = useCallback(() => {
    setAdmin(null);
    sessionStorage.removeItem('qless_admin_session');
    localStorage.removeItem('qless_admin');
  }, []);

  // Strict check: Is admin actively authenticated with a valid signed token
  const isAdminAuthenticated = !!(admin && validateAdminSession(admin));

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
        isAdminAuthenticated,
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


