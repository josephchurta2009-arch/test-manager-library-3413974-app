import { useState, type FormEvent } from 'react';
import api from '../infrastructure/api';

export default function UsersPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/users', {
        username,
        password,
        role: 'librarian',
      });
      setSuccess(`¡Operador «${res.data.username}» creado exitosamente con rol «librarian»!`);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al crear el operador.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>👤 Dar de Alta Bibliotecarios (HU-02)</h1>
      </div>

      <div className="card" style={{ maxWidth: '540px' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Como administrador, puedes registrar nuevos usuarios operadores con rol <strong>librarian</strong> para gestionar préstamos y socios.
        </p>

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label htmlFor="librarian-username">Nombre de usuario</label>
            <input
              id="librarian-username"
              placeholder="Ej: carmen.rodriguez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="librarian-password">Contraseña</label>
            <input
              id="librarian-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Rol asignado</label>
            <input
              value="librarian (Bibliotecario)"
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creando...' : '➕ Registrar Bibliotecario'}
          </button>
        </form>
      </div>
    </div>
  );
}
