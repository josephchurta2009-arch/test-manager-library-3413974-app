import { useEffect, useState } from 'react';
import api from '../infrastructure/api';

interface LoanItem {
  id: string;
  book_id: string;
  book_title: string;
  isbn: string;
  category_name?: string;
  due_at: string;
  returned_at: string | null;
}

interface Loan {
  id: string;
  member_id: string;
  loaned_at: string;
  status: 'open' | 'overdue' | 'closed';
  items: LoanItem[];
}

interface MemberOption {
  id: string;
  full_name: string;
  document_number: string;
}

interface BookOption {
  id: string;
  title: string;
  available_copies: number;
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Selector data for modal
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>(['']);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadLoans();
  }, [page, statusFilter]);

  const loadLoans = async () => {
    try {
      const params: any = { page, size: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/loans', { params });
      setLoans(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      // ignore
    }
  };

  const openCreateModal = async () => {
    setMsg(null);
    setSelectedMember('');
    setSelectedBookIds(['']);
    setShowModal(true);

    try {
      const [membersRes, booksRes] = await Promise.all([
        api.get('/members', { params: { size: 50 } }),
        api.get('/books', { params: { size: 50 } }),
      ]);
      setMembers(membersRes.data.items || []);
      setBooks(booksRes.data.items || []);
      if (membersRes.data.items?.length > 0) setSelectedMember(membersRes.data.items[0].id);
      if (booksRes.data.items?.length > 0) setSelectedBookIds([booksRes.data.items[0].id]);
    } catch {
      // ignore
    }
  };

  const handleLend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const validItems = selectedBookIds.filter((b) => b.trim() !== '').map((b) => ({ book_id: b }));
    if (validItems.length === 0) {
      setMsg({ text: 'Debes seleccionar al menos un libro.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      await api.post('/loans', {
        member_id: selectedMember,
        items: validItems,
      });
      setMsg({ text: '¡Préstamo registrado exitosamente (plazo 14 días)!', type: 'success' });
      setShowModal(false);
      loadLoans();
    } catch (err: any) {
      const errorText = err.response?.data?.message || 'Error al registrar el préstamo.';
      setMsg({ text: errorText, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId: string, itemId: string, bookTitle: string) => {
    if (!confirm(`¿Confirmar devolución del libro «${bookTitle}»?`)) return;
    setMsg(null);
    try {
      await api.post(`/loans/${loanId}/items/${itemId}/return`);
      setMsg({ text: `Ejemplar «${bookTitle}» devuelto exitosamente.`, type: 'success' });
      loadLoans();
    } catch (err: any) {
      const errorText = err.response?.data?.message || 'Error al devolver el ejemplar.';
      setMsg({ text: errorText, type: 'error' });
    }
  };

  const addBookSlot = () => {
    if (selectedBookIds.length < 3) {
      const defaultBook = books[0]?.id || '';
      setSelectedBookIds([...selectedBookIds, defaultBook]);
    }
  };

  const removeBookSlot = (idx: number) => {
    if (selectedBookIds.length > 1) {
      setSelectedBookIds(selectedBookIds.filter((_, i) => i !== idx));
    }
  };

  const updateBookSlot = (idx: number, val: string) => {
    const copy = [...selectedBookIds];
    copy[idx] = val;
    setSelectedBookIds(copy);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>📋 Gestión de Préstamos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Préstamos activos, devoluciones por línea e histórico cerrado.
          </p>
        </div>
        <button id="new-loan-btn" className="btn-primary" onClick={openCreateModal}>
          ➕ Registrar Préstamo
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

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { key: '', label: 'Todos' },
          { key: 'open', label: '🟢 Abiertos' },
          { key: 'overdue', label: '🔴 Vencidos' },
          { key: 'closed', label: '⚪ Cerrados' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`btn-outline ${statusFilter === tab.key ? 'active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              backgroundColor: statusFilter === tab.key ? 'var(--accent)' : 'transparent',
              color: statusFilter === tab.key ? '#fff' : 'var(--text-secondary)',
            }}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID Préstamo</th>
              <th>Fecha Préstamo</th>
              <th>Estado</th>
              <th>Líneas / Libros Prestados</th>
              <th style={{ textAlign: 'center' }}>Acciones de Devolución</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{loan.id.slice(0, 8)}…</td>
                <td>{loan.loaned_at?.slice(0, 10)}</td>
                <td>
                  <span className={`badge badge-${loan.status}`}>
                    {loan.status === 'open' ? 'Abierto' : loan.status === 'overdue' ? 'Vencido' : 'Cerrado'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {loan.items?.map((item) => (
                      <div key={item.id} style={{ fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.book_title}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                          (Vence: {item.due_at?.slice(0, 10)})
                        </span>
                        {item.returned_at ? (
                          <span style={{ color: 'var(--success)', marginLeft: '6px', fontSize: '0.8rem' }}>
                            ✓ Devuelto ({item.returned_at.slice(0, 10)})
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                    {loan.items
                      ?.filter((i) => !i.returned_at)
                      .map((item) => (
                        <button
                          key={item.id}
                          className="btn-outline"
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderColor: 'var(--accent)',
                            color: 'var(--accent)',
                          }}
                          onClick={() => handleReturn(loan.id, item.id, item.book_title)}
                        >
                          🔄 Devolver: {item.book_title.slice(0, 16)}…
                        </button>
                      ))}
                    {loan.status === 'closed' && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Completo</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No se encontraron préstamos registrados.
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
        <button disabled={loans.length < 20} onClick={() => setPage((p) => p + 1)}>
          Siguiente →
        </button>
      </div>

      {/* Modal Crear Préstamo */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <h2>➕ Registrar Nuevo Préstamo (HU-06)</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '6px 0 16px' }}>
              Máximo 3 líneas por préstamo. El socio no debe tener préstamos vencidos ni superar el límite de 3 libros sin devolver.
            </p>

            <form onSubmit={handleLend}>
              <div className="form-group">
                <label>Socio que solicita el préstamo</label>
                <select
                  required
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} (Doc: {m.document_number})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '1rem', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                Libros a prestar ({selectedBookIds.length} de 3):
              </div>

              {selectedBookIds.map((selectedId, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <select
                    style={{ flex: 1 }}
                    required
                    value={selectedId}
                    onChange={(e) => updateBookSlot(idx, e.target.value)}
                  >
                    {books.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.available_copies <= 0}>
                        {b.title} (Disponibles: {b.available_copies})
                      </option>
                    ))}
                  </select>
                  {selectedBookIds.length > 1 && (
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '6px 10px' }}
                      onClick={() => removeBookSlot(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {selectedBookIds.length < 3 && (
                <button
                  type="button"
                  className="btn-outline"
                  style={{ fontSize: '0.8rem', padding: '4px 10px', marginTop: '4px' }}
                  onClick={addBookSlot}
                >
                  + Agregar otra línea (máx 3)
                </button>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Registrando...' : 'Confirmar Préstamo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
