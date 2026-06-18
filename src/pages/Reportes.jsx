import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, CheckCircle, Clock, Radio, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { boletinesService, directorioService } from '../services/dataService';
import './Reportes.css';

const tt = {
  contentStyle: { background: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, color: '#e2e8f0', fontSize: 12 },
  cursor: { fill: 'rgba(59,130,246,0.06)' }
};

const estadoConf = {
  publicado: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Publicado' },
  aprobado:  { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', label: 'Aprobado'  },
  borrador:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Borrador'  },
};

const colorsMap = {
  'Obras Públicas': '#3b82f6',
  'Salud':          '#10b981',
  'Cultura':        '#a855f7',
  'Gobierno':       '#f59e0b',
  'Social':         '#ec4899',
  'General':        '#64748b'
};

const tendenciaEstadistica = [
  { sem: 'S1', alcance: 1200 }, { sem: 'S2', alcance: 1900 }, { sem: 'S3', alcance: 1500 },
  { sem: 'S4', alcance: 2800 }, { sem: 'S5', alcance: 2200 }, { sem: 'S6', alcance: 3100 },
  { sem: 'S7', alcance: 2700 }, { sem: 'S8', alcance: 3800 },
];

export default function Reportes() {
  const [boletines, setBoletines] = useState([]);
  const [directorioCount, setDirectorioCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        const [resB, resD] = await Promise.all([
          boletinesService.getAll(),
          directorioService.getAll()
        ]);

        if (resB.error) throw resB.error;
        if (resD.error) throw resD.error;

        setBoletines(resB.data || []);
        setDirectorioCount((resD.data || []).length);
      } catch (err) {
        console.error("Error al cargar datos para reportes:", err);
        setError("Error al obtener la información estadística de la base de datos.");
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, []);

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="db-loading">
          <Loader2 className="spinner" size={28} />
          <span>Generando reportes del área de comunicaciones…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page" style={{ padding: '20px' }}>
        <div className="db-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // ── Cálculo dinámico de totales ──
  const totales = {
    total:     boletines.length,
    publicado: boletines.filter(b => b.estado === 'publicado').length,
    aprobado:  boletines.filter(b => b.estado === 'aprobado').length,
    borrador:  boletines.filter(b => b.estado === 'borrador').length,
  };

  const summaryItems = [
    { label: 'Total Boletines',  value: totales.total,     Icon: FileText,     color: '#3b82f6' },
    { label: 'Publicados',       value: totales.publicado, Icon: CheckCircle,  color: '#10b981' },
    { label: 'Aprobados',        value: totales.aprobado,  Icon: TrendingUp,   color: '#60a5fa' },
    { label: 'Borradores',       value: totales.borrador,  Icon: Clock,        color: '#f59e0b' },
    { label: 'Medios de prensa', value: directorioCount,   Icon: Radio,        color: '#a855f7' },
  ];

  // ── Cálculo dinámico de boletines mensuales ──
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const mensualDataMap = meses.map(m => ({ mes: m, publicados: 0, borradores: 0 }));
  
  boletines.forEach(b => {
    if (!b.fecha) return;
    const parts = b.fecha.split('-');
    if (parts.length === 3) {
      const mesVal = parseInt(parts[1], 10);
      const mesLabel = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][mesVal - 1];
      const monthObj = mensualDataMap.find(m => m.mes === mesLabel);
      if (monthObj) {
        if (b.estado === 'publicado') {
          monthObj.publicados++;
        } else if (b.estado === 'borrador') {
          monthObj.borradores++;
        }
      }
    }
  });

  // ── Cálculo dinámico de distribución por temas ──
  const temaCounts = {};
  boletines.forEach(b => {
    const t = b.tema || 'General';
    temaCounts[t] = (temaCounts[t] || 0) + 1;
  });
  const temaData = Object.keys(temaCounts).map(name => ({
    name,
    value: temaCounts[name],
    color: colorsMap[name] || '#64748b'
  }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes y Estadísticas</h1>
          <p className="page-sub">Panel de análisis del área de Comunicaciones · {new Date().getFullYear()}</p>
        </div>
        <div className="reporte-fecha">
          <Clock size={13} strokeWidth={2} />
          <span>Generado: {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="rep-summary">
        {summaryItems.map(({ label, value, Icon, color }, i) => (
          <div className="rep-sum-card" key={i}>
            <div style={{ background: `${color}15`, padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} strokeWidth={1.8} color={color} />
            </div>
            <div>
              <span className="sum-num" style={{ color }}>{value}</span>
              <span className="sum-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid-2">
        <div className="dash-card">
          <h3 className="card-title">Boletines Mensuales 2026</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mensualDataMap} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip {...tt} />
              <Bar dataKey="publicados" fill="#3b82f6" name="Publicados" radius={[5, 5, 0, 0]} />
              <Bar dataKey="borradores" fill="#334155" name="Borradores" radius={[5, 5, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-card">
          <h3 className="card-title">Distribución por Tema</h3>
          <ResponsiveContainer width="100%" height={240}>
            {temaData.length > 0 ? (
              <PieChart>
                <Pie data={temaData} cx="45%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {temaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Tooltip {...tt} />
              </PieChart>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '13px' }}>
                Sin datos de temas registrados
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Línea de Tendencia de Alcance */}
      <div className="dash-card">
        <h3 className="card-title">
          <TrendingUp size={15} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#60a5fa' }} />
          Tendencia de Alcance Ciudadano (semanal estimado)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={tendenciaEstadistica} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.07)" />
            <XAxis dataKey="sem" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip {...tt} />
            <Line type="monotone" dataKey="alcance" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} name="Alcance estimado" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla completa de registro */}
      <div className="dash-card">
        <h3 className="card-title">Registro de Boletines</h3>
        <div style={{ overflowX: 'auto' }}>
          {boletines.length > 0 ? (
            <table className="dir-table" style={{ minWidth: 600 }}>
              <thead>
                <tr><th>#</th><th>Título</th><th>Tema</th><th>Autor</th><th>Fecha</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {boletines.map((b, i) => {
                  const esc = estadoConf[b.estado] || { bg: 'rgba(255,255,255,0.05)', color: '#cbd5e1', label: b.estado };
                  return (
                    <tr key={b.id}>
                      <td style={{ color: '#475569' }}>{i + 1}</td>
                      <td style={{ color: '#e2e8f0', fontWeight: 500, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.titulo}</td>
                      <td><span className="bc-tema">{b.tema}</span></td>
                      <td style={{ color: '#94a3b8' }}>{b.autor}</td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>{b.fecha}</td>
                      <td><span className="bc-badge" style={{ background: esc.bg, color: esc.color }}>{esc.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlignment: 'center', color: '#64748b', padding: '20px' }}>
              No hay boletines de prensa registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
