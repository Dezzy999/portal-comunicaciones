import { useState, useEffect } from 'react';
import {
  BarChart2, FileText, CheckCircle, CalendarDays, Radio,
  Clock, MapPin, TrendingUp, Loader2, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { boletinesService, eventosService, directorioService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const estadoColors = {
  publicado: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Publicado' },
  aprobado:  { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', label: 'Aprobado' },
  borrador:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Borrador' },
};

const tipoColors = {
  gobierno: '#3b82f6', social: '#10b981', obras: '#f59e0b',
  salud: '#ec4899', cultura: '#a855f7',
};

export default function Dashboard() {
  const { user } = useAuth();
  const hoy = new Date();
  const todayStr = hoy.toISOString().split('T')[0];

  const [boletines, setBoletines] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [directorioCount, setDirectorioCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [resB, resE, resD] = await Promise.all([
          boletinesService.getAll(),
          eventosService.getAll(),
          directorioService.getAll()
        ]);

        if (resB.error) throw resB.error;
        if (resE.error) throw resE.error;
        if (resD.error) throw resD.error;

        setBoletines(resB.data || []);
        setEventos(resE.data || []);
        setDirectorioCount((resD.data || []).length);
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
        setError("No se pudo conectar a la base de datos para cargar las estadísticas.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dash-page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="db-loading">
          <Loader2 className="spinner" size={28} />
          <span>Cargando estadísticas municipales de Portal Comunicaciones…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-page" style={{ padding: '20px' }}>
        <div className="db-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // ── Estadísticas superiores ──
  const stats = [
    {
      label: 'Total Boletines',
      value: boletines.length,
      Icon: FileText,
      color: '#3b82f6',
      sub: 'registrados'
    },
    {
      label: 'Publicados',
      value: boletines.filter(b => b.estado === 'publicado').length,
      Icon: CheckCircle,
      color: '#10b981',
      sub: 'en prensa / redes'
    },
    {
      label: 'Eventos Agendados',
      value: eventos.length,
      Icon: CalendarDays,
      color: '#a855f7',
      sub: 'próximos eventos'
    },
    {
      label: 'Medios en Directorio',
      value: directorioCount,
      Icon: Radio,
      color: '#f59e0b',
      sub: 'contactos prensa'
    },
  ];

  // ── Filtrado de próximos eventos ──
  const proximos = eventos
    .filter(e => e.fecha >= todayStr)
    .slice(0, 3);

  // ── Generación dinámica de barData por mes para el 2026 ──
  const countsByMonth = { Ene: 0, Feb: 0, Mar: 0, Abr: 0, May: 0, Jun: 0 };
  boletines.forEach(b => {
    if (!b.fecha) return;
    const parts = b.fecha.split('-');
    if (parts.length === 3) {
      const mesVal = parseInt(parts[1], 10);
      const mesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const label = mesLabels[mesVal - 1];
      if (countsByMonth[label] !== undefined) {
        countsByMonth[label]++;
      }
    }
  });
  const barData = Object.keys(countsByMonth).map(mes => ({ mes, boletines: countsByMonth[mes] }));

  // ── Generación dinámica de pieData por tema ──
  const temaCounts = {};
  boletines.forEach(b => {
    const t = b.tema || 'General';
    temaCounts[t] = (temaCounts[t] || 0) + 1;
  });
  const colorsMap = {
    'Obras Públicas': '#3b82f6',
    'Salud':          '#10b981',
    'Cultura':        '#a855f7',
    'Gobierno':       '#f59e0b',
    'Social':         '#ec4899',
    'General':        '#64748b'
  };
  const pieData = Object.keys(temaCounts).map(name => ({
    name,
    value: temaCounts[name],
    color: colorsMap[name] || '#64748b'
  }));

  // Helper para mostrar la fecha formateada de manera segura
  const formatEventDate = (fechaStr) => {
    try {
      const parts = fechaStr.split('-');
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase();
      }
    } catch (e) {}
    return fechaStr;
  };

  // Últimos 4 boletines para la lista lateral
  const ultimosBoletines = [...boletines].slice(0, 4);

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">
            Bienvenido, <span className="dash-name">{user?.nombre}</span> ·{' '}
            {hoy.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="dash-badge">
          <TrendingUp size={14} strokeWidth={2} />
          <span>H. Ayuntamiento de Hueypoxtla</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map(({ label, value, Icon, color, sub }, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: `${color}18` }}>
              <Icon size={22} strokeWidth={1.8} color={color} />
            </div>
            <div className="stat-body">
              <span className="stat-value" style={{ color }}>{value}</span>
              <span className="stat-label">{label}</span>
              <span className="stat-sub">{sub}</span>
            </div>
            <div className="stat-glow" style={{ background: color }} />
          </div>
        ))}
      </div>

      <div className="dash-grid-2">
        <div className="dash-card">
          <h3 className="card-title">
            <BarChart2 size={16} strokeWidth={2} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: '#60a5fa' }} />
            Boletines por Mes (2026)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, color: '#e2e8f0' }} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="boletines" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-card">
          <h3 className="card-title">
            <FileText size={16} strokeWidth={2} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: '#60a5fa' }} />
            Boletines por Tema
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            {pieData.length > 0 ? (
              <PieChart>
                <Pie data={pieData} cx="45%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, color: '#e2e8f0' }} />
              </PieChart>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '13px' }}>
                Sin datos de temas registrados
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dash-grid-2">
        <div className="dash-card">
          <h3 className="card-title">
            <FileText size={16} strokeWidth={2} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: '#60a5fa' }} />
            Últimos Boletines
          </h3>
          <div className="boletin-list">
            {ultimosBoletines.length > 0 ? (
              ultimosBoletines.map(b => (
                <div className="boletin-item" key={b.id}>
                  <div className="boletin-dot" style={{ background: estadoColors[b.estado]?.color || '#cbd5e1' }} />
                  <div className="boletin-info">
                    <span className="boletin-titulo">{b.titulo}</span>
                    <span className="boletin-meta">{b.fecha} · {b.autor}</span>
                  </div>
                  <span className="boletin-badge" style={{ background: estadoColors[b.estado]?.bg || 'rgba(255,255,255,0.05)', color: estadoColors[b.estado]?.color || '#cbd5e1' }}>
                    {estadoColors[b.estado]?.label || b.estado}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', padding: '10px 0', fontSize: '13px' }}>
                No hay boletines de prensa registrados.
              </div>
            )}
          </div>
        </div>

        <div className="dash-card">
          <h3 className="card-title">
            <CalendarDays size={16} strokeWidth={2} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: '#60a5fa' }} />
            Próximos Eventos
          </h3>
          <div className="evento-list">
            {proximos.length > 0 ? (
              proximos.map(e => (
                <div className="evento-item" key={e.id}>
                  <div className="evento-date" style={{ background: `${tipoColors[e.tipo] || '#64748b'}18`, borderColor: `${tipoColors[e.tipo] || '#64748b'}40` }}>
                    <span style={{ color: tipoColors[e.tipo] || '#94a3b8', fontSize: 13, fontWeight: 700 }}>
                      {formatEventDate(e.fecha)}
                    </span>
                  </div>
                  <div className="evento-info">
                    <span className="evento-titulo">{e.titulo}</span>
                    <span className="evento-meta">
                      <Clock size={11} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                      {e.hora} ·{' '}
                      <MapPin size={11} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                      {e.lugar}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', padding: '10px 0', fontSize: '13px' }}>
                No hay eventos próximos en la agenda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
