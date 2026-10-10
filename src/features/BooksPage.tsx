import { useEffect, useState, type FormEvent } from 'react';
import api from '../infrastructure/api';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: { id: string; name?: string };
  total_copies: number;
  available_copies: number;
  cover_key: string | null;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [totalCopies, setTotalCopies] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const role = localStorage.getItem('role');

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data);
      if (res.data.length > 0) setSelectedCat(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    loadBooks();
  }, [page, query, categoryId]);

  const loadBooks = async () => {
    const params: any = { page, size: 20 };
    if (query) params.q = query;
    if (categoryId) params.category_id = categoryId;
    try {
      const res = await api.get('/books', { params });
      setBooks(res.data.items);
      setTotal(res.data.total);
    } catch {
      // ignore
    }
  };

  const openCreateModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setIsbn('');
    if (categories.length > 0) setSelectedCat(categories[0].id);
    setTotalCopies(1);
    setMsg(null);
    setShowModal(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setSelectedCat(book.category?.id || (categories[0]?.id ?? ''));
    setTotalCopies(book.total_copies);
    setMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      if (editingBook) {
        // PUT /books/{id}
        await api.put(`/books/${editingBook.id}`, {
          title,
          author,
          category_id: selectedCat,
          total_copies: Number(totalCopies),
        });
        setMsg({ text: `Libro «${title}» actualizado con éxito.`, type: 'success' });
      } else {
        // POST /books
        await api.post('/books', {
          title,
          author,
          isbn: isbn.replace(/[^0-9]/g, ''),
          category_id: selectedCat,
          total_copies: Number(totalCopies),
        });
        setMsg({ text: `Libro «${title}» creado con éxito.`, type: 'success' });
      }
      setShowModal(false);
      loadBooks();
    } catch (err: any) {
      const errorText = err.response?.data?.message || 'Error al procesar el libro.';
      setMsg({ text: errorText, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`¿Estás seguro de dar de baja el libro «${book.title}»?`)) return;
    setMsg(null);
    try {
      await api.delete(`/books/${book.id}`);
      setMsg({ text: `Libro «${book.title}» dado de baja exitosamente.`, type: 'success' });
      loadBooks();
    } catch (err: any) {
      const errorText =
        err.response?.data?.message ||
        (err.response?.status === 409
          ? 'No se puede dar de baja el libro porque tiene préstamos abiertos activos.'
          : 'Error al dar de baja el libro.');
      setMsg({ text: errorText, type: 'error' });
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>📖 Catálogo de Libros</h1>
        {role === 'admin' && (
          <button className="btn-primary" onClick={openCreateModal}>
            ➕ Nuevo Libro
          </button>
        )}
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
          id="books-search"
          placeholder="Buscar por título o autor..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <select
          id="books-category-filter"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>ISBN</th>
              <th>Categoría</th>
              <th>Disponibles</th>
              <th>Total</th>
              {role === 'admin' && <th style={{ textAlign: 'center' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{book.title}</td>
                <td>{book.author}</td>
                <td style={{ fontFamily: 'monospace' }}>{book.isbn}</td>
                <td>{book.category?.name || '—'}</td>
                <td>
                  <span className={`badge ${book.available_copies > 0 ? 'badge-open' : 'badge-overdue'}`}>
                    {book.available_copies}
                  </span>
                </td>
                <td>{book.total_copies}</td>
                {role === 'admin' && (
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      className="btn-outline"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: '6px' }}
                      onClick={() => openEditModal(book)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn-outline"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => handleDelete(book)}
                    >
                      🗑️ Baja
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan={role === 'admin' ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No se encontraron libros.
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
        <button disabled={books.length < 20} onClick={() => setPage((p) => p + 1)}>
          Siguiente →
        </button>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h2>{editingBook ? '✏️ Editar Libro' : '➕ Crear Nuevo Libro'}</h2>
            <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Título</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título del libro"
                />
              </div>

              <div className="form-group">
                <label>Autor</label>
                <input
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Autor del libro"
                />
              </div>

              {!editingBook && (
                <div className="form-group">
                  <label>ISBN (13 dígitos numéricos)</label>
                  <input
                    required
                    value={isbn}
                    maxLength={13}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="9780123456789"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Categoría</label>
                <select
                  required
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Total de ejemplares (≥ 1)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(Math.max(1, parseInt(e.target.value) || 1))}
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
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : editingBook ? 'Guardar Cambios' : 'Crear Libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
