import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, CheckCircle, Clock, Radio, TrendingUp, Loader2, AlertCircle, Sparkles, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
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

const MESES_COMPLETOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Reportes() {
  const [boletines, setBoletines] = useState([]);
  const [directorioCount, setDirectorioCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for AI Press Synthesis
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summaryResult, setSummaryResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

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

  // ── Generar Síntesis Mensual con IA ──
  const handleGenerateSummary = async () => {
    setAiLoading(true);
    setAiError(null);
    setSummaryResult(null);

    // Filtrar boletines del mes y año seleccionados
    const filtered = boletines.filter(b => {
      if (!b.fecha) return false;
      const parts = b.fecha.split('-');
      if (parts.length !== 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return y === selectedYear && m === selectedMonth;
    });

    if (filtered.length === 0) {
      setAiError(`No se encontraron boletines publicados para ${MESES_COMPLETOS[selectedMonth - 1]} de ${selectedYear}. Por favor, selecciona otro período.`);
      setAiLoading(false);
      return;
    }

    try {
      const apiKey = localStorage.getItem('GEMINI_API_KEY');
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey
        },
        body: JSON.stringify({
          action: 'summarize',
          bulletins: filtered.map(b => ({
            titulo: b.titulo,
            cuerpo: b.cuerpo,
            tema: b.tema,
            fecha: b.fecha,
            autor: b.autor
          })),
          month: `${MESES_COMPLETOS[selectedMonth - 1]} de ${selectedYear}`
        })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Error al comunicarse con la IA');
      }

      if (resJson.data) {
        setSummaryResult(resJson.data);
      } else {
        throw new Error('La respuesta de Gemini no contiene datos válidos.');
      }
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'No se pudo conectar al servicio de IA.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Exportar Síntesis en un PDF Elegante ──
  const exportSummaryPDF = (monthLabel, data) => {
    const doc = new jsPDF();
    let y = 20;

    // Header banner
    doc.setFillColor(16, 28, 51); // Prussian Blue #101c33
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('H. AYUNTAMIENTO DE HUEYPOXTLA', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('SÍNTESIS DE PRENSA Y RENDICIÓN DE CUENTAS', 105, 23, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(215, 207, 190); // Sand Beige #d7cfbe
    doc.text(`Reporte Consolidado Mensual · ${monthLabel}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(150, 160, 180);
    doc.text('Generado por el Sistema de IA · Dirección de Comunicación Social', 105, 37, { align: 'center' });

    // Main body
    y = 55;
    doc.setTextColor(16, 28, 51);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('I. INTRODUCCIÓN', 20, y);
    y += 6;
    
    doc.setTextColor(51, 65, 85); // Slate 700
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    
    const introLines = doc.splitTextToSize(data.introduccion || '', 170);
    doc.text(introLines, 20, y);
    y += introLines.length * 5.5 + 8;

    // Logros Section
    doc.setTextColor(16, 28, 51);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('II. PRINCIPALES LOGROS Y ACTIVIDADES', 20, y);
    y += 8;

    if (data.logros && data.logros.length > 0) {
      data.logros.forEach((l, idx) => {
        // Check page overflow
        if (y > 250) {
          doc.addPage();
          doc.setFillColor(16, 28, 51);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.text(`Síntesis de Prensa de Hueypoxtla · ${monthLabel}`, 105, 10, { align: 'center' });
          y = 30;
        }

        // Title and Theme
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(16, 28, 51);
        doc.text(`${idx + 1}. ${l.titulo}`, 20, y);
        
        const themeLabel = l.tema ? `[Tema: ${l.tema}]` : '';
        if (themeLabel) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(90, 110, 140);
          doc.text(themeLabel, 190, y, { align: 'right' });
        }
        y += 5;

        // Description
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(l.descripcion || '', 170);
        doc.text(descLines, 20, y);
        y += descLines.length * 5 + 6;
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(120, 130, 140);
      doc.text('No se registraron logros específicos en los boletines analizados.', 20, y);
      y += 10;
    }

    // Conclusion Section
    if (y > 240) {
      doc.addPage();
      doc.setFillColor(16, 28, 51);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`Síntesis de Prensa de Hueypoxtla · ${monthLabel}`, 105, 10, { align: 'center' });
      y = 30;
    }

    doc.setTextColor(16, 28, 51);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('III. CONCLUSIÓN Y PERSPECTIVAS', 20, y);
    y += 6;

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    const conclusionLines = doc.splitTextToSize(data.conclusion || '', 170);
    doc.text(conclusionLines, 20, y);
    y += conclusionLines.length * 5.5 + 15;

    // Signature Block
    if (y > 230) {
      doc.addPage();
      doc.setFillColor(16, 28, 51);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`Síntesis de Prensa de Hueypoxtla · ${monthLabel}`, 105, 10, { align: 'center' });
      y = 40;
    }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(65, y, 145, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 28, 51);
    doc.text('DIRECCIÓN DE COMUNICACIÓN SOCIAL', 105, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('H. Ayuntamiento de Hueypoxtla', 105, y, { align: 'center' });

    // Add page footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(15, 23, 42); // Off-Black #0f172a
      doc.rect(0, 282, 210, 15, 'F');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${pageCount}`, 190, 291, { align: 'right' });
      doc.text('Hueypoxtla · Transparencia y Comunicación Institucional', 20, 291);
    }

    doc.save(`Sintesis_Prensa_${monthLabel.replace(/\s+/g, '_')}.pdf`);
  };

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

      {/* Síntesis de Prensa con IA */}
      <div className="dash-card ai-summary-card">
        <div className="ai-summary-header">
          <div className="title-area">
            <Sparkles className="sparkle-icon" size={20} color="#d7cfbe" />
            <h3 className="card-title">Síntesis de Prensa Mensual con IA</h3>
          </div>
          <p className="card-subtitle">
            Genera un resumen ejecutivo consolidado de rendición de cuentas basado en todos los boletines oficiales publicados en el mes seleccionado.
          </p>
        </div>
        
        <div className="ai-summary-controls">
          <div className="control-group">
            <label className="control-label">Seleccionar Período:</label>
            <div className="select-row">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="summary-select"
              >
                {MESES_COMPLETOS.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="summary-select"
              >
                {[2026, 2025, 2024].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button 
            onClick={handleGenerateSummary} 
            className="btn-ai-summary"
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="spinner spin" size={16} /> : <Sparkles size={16} />}
            <span>{aiLoading ? 'Generando Síntesis…' : 'Generar Síntesis con Gemini'}</span>
          </button>
        </div>

        {aiError && (
          <div className="ai-error-box">
            <AlertCircle size={16} />
            <span>{aiError}</span>
          </div>
        )}

        {summaryResult && (
          <div className="ai-summary-result-box">
            <div className="result-header-row">
              <h4>Resumen Ejecutivo: {MESES_COMPLETOS[selectedMonth - 1]} {selectedYear}</h4>
              <button 
                onClick={() => exportSummaryPDF(`${MESES_COMPLETOS[selectedMonth - 1]} de ${selectedYear}`, summaryResult)}
                className="btn-pdf-export btn-primary"
              >
                <FileDown size={14} />
                <span>Exportar a PDF</span>
              </button>
            </div>
            
            <div className="result-body-content">
              <div className="result-section">
                <h5>Introducción</h5>
                <p>{summaryResult.introduccion}</p>
              </div>
              
              <div className="result-section">
                <h5>Logros del Período</h5>
                <div className="result-logros-list">
                  {summaryResult.logros && summaryResult.logros.map((l, idx) => (
                    <div className="result-logro-item" key={idx}>
                      <span className="logro-theme-tag">{l.tema || 'General'}</span>
                      <h6>{l.titulo}</h6>
                      <p>{l.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="result-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h5>Conclusión</h5>
                <p>{summaryResult.conclusion}</p>
              </div>
            </div>
          </div>
        )}
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
