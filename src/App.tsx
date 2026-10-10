import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './features/LoginPage';
import BooksPage from './features/BooksPage';
import MembersPage from './features/MembersPage';
import LoansPage from './features/LoansPage';
import OverduePage from './features/OverduePage';
import ReportPage from './features/ReportPage';
import UsersPage from './features/UsersPage';
import './index.css';

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');

  const links = [
    { path: '/books', label: '📖 Catálogo' },
    { path: '/members', label: '👥 Socios' },
    { path: '/loans', label: '📋 Préstamos' },
    { path: '/overdue', label: '⚠️ Vencidos' },
    ...(role === 'admin'
      ? [
          { path: '/report', label: '📊 Reporte' },
          { path: '/users', label: '👤 Operadores' },
        ]
      : []),
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">📚 Manager Library</div>
      <div className="sidebar-nav">
        {links.map((link) => (
          <button
            key={link.path}
            className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
          Rol: <strong style={{ color: 'var(--accent)' }}>{role}</strong>
        </div>
        <button className="sidebar-link" onClick={onLogout} style={{ color: 'var(--danger)' }}>
          🚪 Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

function AppLayout({ onLogout }: { onLogout: () => void }) {
  const role = localStorage.getItem('role');

  return (
    <div className="app-layout">
      <Sidebar onLogout={onLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/books" element={<BooksPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/overdue" element={<OverduePage />} />
          {role === 'admin' && <Route path="/report" element={<ReportPage />} />}
          {role === 'admin' && <Route path="/users" element={<UsersPage />} />}
          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/books" replace /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/*"
          element={isLoggedIn ? <AppLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
