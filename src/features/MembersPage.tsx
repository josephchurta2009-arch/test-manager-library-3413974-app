import { useEffect, useState, type FormEvent } from 'react';
import api from '../infrastructure/api';

interface Member {
  id: string;
  full_name: string;
  document_number: string;
  active_loans?: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadMembers();
  }, [page, query]);

  const loadMembers = async () => {
    try {
      const params: any = { page, size: 20 };
      if (query) params.q = query;
      const res = await api.get('/members', { params });
      setMembers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      await api.post('/members', {
        full_name: fullName.trim(),
        document_number: docNumber.trim(),
      });
      setMsg({ text: `Socio «${fullName}» registrado exitosamente.`, type: 'success' });
      setShowModal(false);
      setFullName('');
      setDocNumber('');
      loadMembers();
    } catch (err: any) {
      const errorText = err.response?.data?.message || 'Error al crear socio.';
      setMsg({ text: errorText, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const viewMemberDetail = async (m: Member) => {
    try {
      const res = await api.get(`/members/${m.id}`);
      setSelectedMember(res.data);
    } catch {
      setSelectedMember(m);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>👥 Gestión de Socios</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Registro y consulta de socios de la biblioteca. Los socios no se eliminan (CA-05.3).
          </p>
        </div>
        <button id="add-member-btn" className="btn-primary" onClick={() => setShowModal(true)}>
          ➕ Nuevo Socio
        </button>
      </div>

      {msg && (
        <div
          style={{
            background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${msg.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}
        >
          {msg.text}
        </div>
      )}

      <div className="search-bar">
        <input
          id="members-search"
          placeholder="Buscar por nombre o número de documento..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Documento</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.full_name}</td>
                <td style={{ fontFamily: 'monospace' }}>{m.document_number}</td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn-outline"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    onClick={() => viewMemberDetail(m)}
                  >
                    👁️ Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No se encontraron socios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          ← Anterior
        </button>
        <span style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>
          Página {page} — {total} resultado(s)
        </span>
        <button disabled={members.length < 20} onClick={() => setPage((p) => p + 1)}>
          Siguiente →
        </button>
      </div>

      {/* Modal Nuevo Socio */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h2>➕ Registrar Nuevo Socio (HU-05)</h2>
            <form onSubmit={handleCreate} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  required
                  placeholder="Ej: Ana María Morales"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Número de Documento (Único)</label>
                <input
                  required
                  placeholder="Ej: 1045678901"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Guardando...' : 'Crear Socio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle de Socio */}
      {selectedMember && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h2>👤 Detalle del Socio</h2>
            <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Nombre: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedMember.full_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Documento: </span>
                <strong style={{ fontFamily: 'monospace' }}>{selectedMember.document_number}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Préstamos activos: </span>
                <span className="badge badge-open">
                  {selectedMember.active_loans ?? 0} libro(s) pendiente(s) de devolver
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => setSelectedMember(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
