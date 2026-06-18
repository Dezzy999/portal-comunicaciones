import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Lock, ChevronRight } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm]     = useState({ usuario: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    const success = await login(form.usuario, form.password);
    if (!success) setError('Usuario o contraseña incorrectos');
    setLoading(false);
  };

  return (
    <div className="login-bg">
      <div className="login-particles">
        {[...Array(12)].map((_, i) => <div key={i} className={`particle particle-${i+1}`} />)}
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-ring">
              <Building2 size={32} strokeWidth={1.5} color="#93c5fd" />
            </div>
          </div>
          <h1 className="login-title">Portal Comunicaciones</h1>
          <p className="login-subtitle">Plataforma de Automatización de Procesos</p>
          <p className="login-inst">H. Ayuntamiento de Hueypoxtla</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <div className="input-wrapper">
              <User size={16} strokeWidth={2} className="input-icon-svg" />
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={form.usuario}
                onChange={e => setForm({ ...form, usuario: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <Lock size={16} strokeWidth={2} className="input-icon-svg" />
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className={`btn-login ${loading ? 'loading' : ''}`} disabled={loading}>
            {loading
              ? <span className="spinner" />
              : <><span>Iniciar Sesión</span><ChevronRight size={18} strokeWidth={2.5} /></>}
          </button>
        </form>

        <div className="login-hint">
          <p>Cuentas demo</p>
          <div className="hint-chips">
            <span className="chip admin" onClick={() => setForm({ usuario: 'jhonny', password: 'admin123' })}>
              Admin · jhonny / admin123
            </span>
            <span className="chip redactor" onClick={() => setForm({ usuario: 'comunicaciones', password: 'red123' })}>
              Redactor · comunicaciones / red123
            </span>
          </div>
        </div>

        <div className="login-footer">
          <p>2026 · Año del Humanismo Mexicano · Área de Comunicaciones</p>
        </div>
      </div>
    </div>
  );
}
