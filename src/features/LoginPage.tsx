import { useState, type FormEvent } from 'react';
import api from '../infrastructure/api';

interface LoginProps {
  onLogin: (token: string, role: string) => void;
}

export default function LoginPage({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      onLogin(res.data.access_token, res.data.role);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas. Verifica tu usuario y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-badge">SISTEMA BIBLIOTECARIO</div>
          <h1 className="login-title">📚 Manager Library</h1>
          <p className="login-subtitle">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        {error && (
          <div className="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-username">Usuario</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: admin o bibliotecario"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button id="login-submit" type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Validando...' : 'Iniciar Sesión ➔'}
          </button>
        </form>

        <div className="login-demo-helper">
          <p className="demo-label">⚡ Acceso rápido de prueba:</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn"
              onClick={() => fillCredentials('admin', 'Admin123!')}
            >
              👑 Admin (Total)
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => fillCredentials('bibliotecario', 'Librarian123!')}
            >
              📖 Bibliotecario (Operativo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
