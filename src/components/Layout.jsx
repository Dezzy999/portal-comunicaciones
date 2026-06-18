import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile Header (sticky on screens < 768px) */}
      <header className="mobile-header">
        <button className="btn-menu-toggle" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} color="#fafaf9" />
        </button>
        <div className="mobile-brand">
          <span className="mobile-brand-title">Portal Comunicaciones</span>
        </div>
      </header>

      {/* Backdrop for mobile navigation drawer */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
