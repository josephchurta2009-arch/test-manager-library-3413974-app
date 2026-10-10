import { useState } from 'react';
import api from '../infrastructure/api';

export default function ReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const loadReport = async () => {
    setError('');
    try {
      const res = await api.get('/reports/most-borrowed', { params: { from, to } });
      setRows(res.data.rows || []);
      setLoaded(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte.');
    }
  };

  return (
    <div>
      <div className="page-header"><h1>📊 Reporte: Más Prestados</h1></div>

      <div className="search-bar">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={loadReport}>Generar Reporte</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loaded && (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Libro</th><th>Categoría</th><th>Veces prestado</th></tr></thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.book_title}</td>
                  <td>{r.category_name}</td>
                  <td><span className="badge badge-open">{r.times_borrowed}</span></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Sin datos en este rango.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
