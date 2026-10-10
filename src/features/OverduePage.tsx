import { useEffect, useState } from 'react';
import api from '../infrastructure/api';

export default function OverduePage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get('/loans/overdue').then(res => setItems(res.data.items || []));
  }, []);

  return (
    <div>
      <div className="page-header"><h1>⚠️ Libros Vencidos</h1></div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>Libro</th><th>Socio</th><th>Vencimiento</th><th>Días de retraso</th></tr></thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.book_title}</td>
                <td>{item.member_name}</td>
                <td>{item.due_at?.slice(0, 10)}</td>
                <td><span className="badge badge-overdue">{item.days_late} días</span></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay libros vencidos. ¡Excelente!</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
