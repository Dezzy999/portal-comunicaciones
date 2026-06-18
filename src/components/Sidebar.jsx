import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  BookOpen,
  BarChart2,
  LogOut,
  Building2,
  X, // Add X icon
} from 'lucide-react';
import Facebook from './FacebookIcon';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/boletines',  icon: FileText,         label: 'Boletines' },
  { to: '/agenda',     icon: CalendarDays,     label: 'Agenda' },
  { to: '/directorio', icon: BookOpen,          label: 'Directorio' },
  { to: '/reportes',   icon: BarChart2,         label: 'Reportes' },
  { to: '/facebook',   icon: Facebook,          label: 'Facebook' },
];

const rolColors  = { admin: '#3b82f6', supervisor: '#a855f7', redactor: '#10b981' };
const rolLabels  = { admin: 'Administrador', supervisor: 'Supervisor', redactor: 'Redactor' };

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon-wrap">
          <Building2 size={22} strokeWidth={1.5} color="#60a5fa" />
        </div>
        <div className="brand-text">
          <span className="brand-name">Portal Comunicaciones</span>
          <span className="brand-sub">Automatización</span>
        </div>
        {/* Close button on mobile */}
        <button className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">
          <X size={20} color="#fafaf9" />
        </button>
      </div>

      <div className="sidebar-user">
        <div
          className="user-avatar"
          style={{ background: `linear-gradient(135deg, ${rolColors[user?.rol]}, #1e293b)` }}
        >
          {user?.nombre?.charAt(0)}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.nombre}</span>
          <span className="user-rol" style={{ color: rolColors[user?.rol] }}>
            {rolLabels[user?.rol]}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={18} strokeWidth={1.8} className="nav-icon-svg" />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-year">
          <span>2026 · Humanismo Mexicano</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={15} strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
