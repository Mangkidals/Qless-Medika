import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Activity, 
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/common/FormField';
import Button from '../components/common/Button';
import './AuthPages.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email wajib diisi';
    if (!password) newErrors.password = 'Kata sandi wajib diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = login(email, password);
      setLoading(false);

      if (!res.success) {
        setErrors({ general: res.error || 'Gagal masuk akun pasien.' });
        return;
      }

      navigate('/');
    }, 400);
  };

  return (
    <div className="auth-split-layout">
      {/* 1. Left Side: Form Container */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-brand-header">
            <Link to="/" className="auth-brand-logo">
              <div className="brand-icon-box">
                <Activity size={20} />
              </div>
              <span className="brand-title">Qless Medika</span>
            </Link>
          </div>

          <div className="auth-title-group">
            <h1 className="auth-heading">Selamat Datang Kembali</h1>
            <p className="auth-subheading">
              Masuk ke akun pasien Anda untuk melihat riwayat antrean dan jadwal konsultasi dokter.
            </p>
          </div>

          {errors.general && (
            <div className="auth-general-error-box" role="alert" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              color: 'var(--danger)',
              fontSize: '13px',
              lineHeight: '1.4'
            }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-actual-form" noValidate>
            <FormField
              label="Alamat Email Terdaftar"
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email || errors.general) setErrors(prev => ({ ...prev, email: '', general: '' }));
              }}
              placeholder="nama@email.com"
              required
              error={errors.email}
              iconLeft={<Mail size={16} />}
            />

            <FormField
              label="Kata Sandi"
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password || errors.general) setErrors(prev => ({ ...prev, password: '', general: '' }));
              }}
              placeholder="••••••••"
              required
              error={errors.password}
              iconLeft={<Lock size={16} />}
            />

            <div className="auth-options-row">
              <label className="remember-me-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ingat saya di perangkat ini</span>
              </label>

              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Tautan reset kata sandi telah dikirim ke email terdaftar.'); }} className="forgot-link">
                Lupa kata sandi?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
              iconRight={<LogIn size={18} />}
            >
              Masuk ke Akun Pasien
            </Button>
          </form>

          <div className="auth-switch-footer">
            <p>
              Belum memiliki akun rekam medis digital?{' '}
              <Link to="/register" className="auth-switch-link">
                Daftar Pasien Baru
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Right Side: Supporting Visual & Message (UX Requirement: Split Layout) */}
      <div className="auth-visual-side">
        <div className="auth-visual-content">
          <div className="visual-badge">
            <Sparkles size={14} />
            <span>PORTAL PASIEN TERINTEGRASI</span>
          </div>

          <h2 className="visual-heading">
            Antre Lebih Cerdas, Pantau dari Rumah, Hadir Tepat Waktu
          </h2>

          <p className="visual-description">
            Sistem Qless Medika menghubungkan pendaftaran poliklinik, konfirmasi WhatsApp, hingga nomor panggilan counter secara sinkron.
          </p>

          <div className="visual-features-list">
            <div className="visual-feature-item">
              <div className="feature-icon-circle">
                <Clock size={16} />
              </div>
              <div>
                <strong>Hemat Waktu Tunggu 70%</strong>
                <p>Estimasi presisi berbasis AI menghindarkan Anda dari penumpukan ruang tunggu.</p>
              </div>
            </div>

            <div className="visual-feature-item">
              <div className="feature-icon-circle">
                <Activity size={16} />
              </div>
              <div>
                <strong>Rekam Medis Elektronik Terpadu</strong>
                <p>Seluruh riwayat konsultasi, resep dokter, dan hasil laboratorium tersimpan aman.</p>
              </div>
            </div>

            <div className="visual-feature-item">
              <div className="feature-icon-circle">
                <ShieldCheck size={16} />
              </div>
              <div>
                <strong>Keamanan Data Terenkripsi</strong>
                <p>Kepatuhan privasi standar kesehatan nasional dan UU Perlindungan Data Pribadi.</p>
              </div>
            </div>
          </div>

          <div className="visual-quote-box">
            <p className="quote-text">
              "Pelayanan berobat di RS Qless Medika sangat efisien. Tidak ada lagi stres menunggu panggilan anak."
            </p>
            <span className="quote-author">— Dr. Siti Rahmawati, Pasien Poli Anak</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
