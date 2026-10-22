import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Activity, 
  ArrowRight,
  Eye, 
  EyeOff,
  AlertTriangle,
  UserCheck,
  Volume2,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth, ADMIN_CREDENTIALS } from '../context/AuthContext';
import FormField from '../components/common/FormField';
import Button from '../components/common/Button';
import './AdminLoginPage.css';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginAdmin, isAdminAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, redirect to dashboard immediately
  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAdminAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Alamat email admin wajib diisi.');
      return;
    }
    if (!password) {
      setErrorMessage('Kata sandi admin wajib diisi.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = loginAdmin(email, password);
      setLoading(false);

      if (res.success) {
        navigate('/admin', { replace: true });
      } else {
        setErrorMessage(res.error || 'Autentikasi admin gagal.');
      }
    }, 450);
  };

  return (
    <div className="admin-login-layout">
      {/* 1. Left Form Side: Administrative Authentication */}
      <div className="admin-login-form-side">
        <div className="admin-login-form-card">
          <div className="admin-login-brand">
            <Link to="/" className="admin-login-logo">
              <div className="admin-brand-icon">
                <Activity size={22} />
              </div>
              <div className="admin-brand-text">
                <span className="brand-name">Qless Medika</span>
                <span className="brand-portal-tag">PORTAL ADMINISTRATOR</span>
              </div>
            </Link>
          </div>

          <div className="admin-login-title-box">
            <div className="admin-badge-pill">
              <ShieldCheck size={14} />
              <span>AKSES OPERASIONAL LOKET & POLI</span>
            </div>
            <h1 className="admin-login-heading">Masuk Dashboard Admin</h1>
            <p className="admin-login-subtext">
              Portal terbatas khusus petugas loket pendaftaran, perawat poliklinik, dan administrator antrean RS Qless Medika.
            </p>
          </div>

          {errorMessage && (
            <div className="admin-login-error-alert" role="alert">
              <AlertTriangle size={18} className="error-icon" />
              <div className="error-text">
                <strong>Autentikasi Gagal</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
            <FormField
              label="Email Administrator"
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="adminganz123@gmail.com"
              required
              iconLeft={<Mail size={16} />}
            />

            <div className="password-input-wrapper">
              <FormField
                label="Kata Sandi Admin"
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="••••••••"
                required
                iconLeft={<Lock size={16} />}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full btn-admin-submit"
              iconRight={<ArrowRight size={18} />}
            >
              Masuk ke Dashboard Loket
            </Button>
          </form>

          {user && (
            <div className="admin-login-warning-alert" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: 'var(--danger)',
              fontSize: '13px',
              lineHeight: '1.4'
            }}>
              <strong>Peringatan Akses: Anda sedang login sebagai Pasien ({user.name})</strong>
              <p style={{ margin: '4px 0 8px 0', fontSize: '12.5px' }}>
                Akun pasien umum tidak memiliki akses ke fungsi administrator rumah sakit.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => logout()}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                Keluar dari Akun Pasien
              </button>
            </div>
          )}

          <div className="admin-login-footer">
            <p>
              Bukan petugas loket rumah sakit?{' '}
              <Link to="/login" className="patient-portal-link">
                Masuk ke Portal Pasien
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Right Side: Visual & Feature Highlights */}
      <div className="admin-login-visual-side">
        <div className="visual-decor-glow glow-1"></div>
        <div className="visual-decor-glow glow-2"></div>

        <div className="admin-login-visual-content">
          <div className="visual-kicker-badge">
            <ShieldCheck size={14} />
            <span>SISTEM KENDALI ANTREAN MEDIS</span>
          </div>

          <h2 className="admin-visual-title">
            Kendali Penuh Antrean Poliklinik & Alur Pelayanan Pasien
          </h2>

          <p className="admin-visual-desc">
            Satu layar terintegrasi untuk verifikasi kehadiran, pemanggilan nomor tiket otomatis, dan pengelolaan antrean dokter spesialis secara real-time.
          </p>

          <div className="admin-feature-cards">
            <div className="admin-feature-card">
              <div className="card-icon-box">
                <UserCheck size={20} />
              </div>
              <div>
                <strong>Verifikasi & Terima Antrean (Pending)</strong>
                <p>Konfirmasi pasien reservasi online setibanya di loket sebelum dimasukkan ke antrean panggil dokter.</p>
              </div>
            </div>

            <div className="admin-feature-card">
              <div className="card-icon-box">
                <Volume2 size={20} />
              </div>
              <div>
                <strong>Pemanggilan Suara & Monitor Publik</strong>
                <p>Sinkronisasi nomor panggil secara real-time ke monitor televisi ruang tunggu dan audio counter.</p>
              </div>
            </div>

            <div className="admin-feature-card">
              <div className="card-icon-box">
                <Clock size={20} />
              </div>
              <div>
                <strong>Pengawasan Waktu Tunggu & SLA</strong>
                <p>Pantau durasi konsultasi dokter spesialis demi kenyamanan dan efisiensi ruang tunggu rumah sakit.</p>
              </div>
            </div>
          </div>

          <div className="admin-security-banner">
            <div className="security-icon">🔒</div>
            <div className="security-text">
              <strong>Zona Keamanan Rekam Medis</strong>
              <span>Setiap tindakan operasional dan perubahan antrean tercatat dalam sistem audit rumah sakit.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
