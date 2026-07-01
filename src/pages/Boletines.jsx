import { useState, useEffect } from 'react';
import {
  Plus, X, FileText, CheckCircle, FileDown, Trash2,
  Tag, User, Calendar, Filter, Loader2, AlertCircle, Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import { boletinesService, facebookService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import Facebook from '../components/FacebookIcon';
import './Boletines.css';

const estadoConfig = {
  publicado: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Publicado' },
  aprobado:  { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', label: 'Aprobado'  },
  borrador:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Borrador'  },
};

const temas = ['Obras Públicas','Salud','Cultura','Gobierno','Social','Educación','Seguridad'];
const filterLabels = { todos:'Todos', borrador:'Borrador', aprobado:'Aprobado', publicado:'Publicado' };

export default function Boletines() {
  const { user } = useAuth();
  const [boletines, setBoletines] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modal, setModal]       = useState(false);
  const [filtro, setFiltro]     = useState('todos');
  const [detalle, setDetalle]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [publishingFb, setPublishingFb] = useState(false);
  const [form, setForm] = useState({ titulo:'', cuerpo:'', tema:'Gobierno', estado:'borrador' });

  // AI Copilot States
  const [aiNotes, setAiNotes] = useState('');
  const [aiTone, setAiTone] = useState('Institucional');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const handleAiAction = async (action) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const apiKey = localStorage.getItem('GEMINI_API_KEY');
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey
        },
        body: JSON.stringify({
          action: 'copilot',
          notes: action === 'copilot' ? aiNotes : `Título actual: ${form.titulo}\nCuerpo actual: ${form.cuerpo}\nAcción: ${action}`,
          tone: aiTone
        })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Error al comunicarse con la IA');
      }

      if (resJson.data) {
        const { titulo, cuerpo } = resJson.data;
        if (titulo && cuerpo) {
          setForm(prev => ({ ...prev, titulo, cuerpo }));
        } else if (resJson.data.rawText) {
          setForm(prev => ({ ...prev, cuerpo: resJson.data.rawText }));
        }
      }
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'No se pudo conectar al servicio de IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublishToFacebook = async (b) => {
    if (!window.confirm("¿Estás seguro de que deseas publicar este boletín directamente en la página de Facebook del Ayuntamiento?")) {
      return;
    }
    setPublishingFb(true);
    try {
      const textToPublish = `${b.titulo}\n\n${b.cuerpo}`;
      const res = await facebookService.publishPost(textToPublish, null, b.id);
      if (res.error) {
        alert(`No se pudo publicar en Facebook: ${res.error}`);
      } else {
        alert('¡Boletín publicado con éxito en Facebook!');
        setBoletines(prev => prev.map(x => x.id === b.id ? { ...x, estado: 'publicado' } : x));
        if (detalle?.id === b.id) setDetalle(prev => ({ ...prev, estado: 'publicado' }));
      }
    } catch (err) {
      console.error(err);
      alert('Error al intentar publicar en Facebook.');
    } finally {
      setPublishingFb(false);
    }
  };

  // ── Cargar boletines ──────────────────────────────────────
  const fetchBoletines = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await boletinesService.getAll(
      filtro !== 'todos' ? { estado: filtro } : {}
    );
    if (err) setError('Error al cargar los boletines. Verifica tu conexión a Supabase.');
    else setBoletines(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBoletines(); }, [filtro]);

  // ── Crear ─────────────────────────────────────────────────
  const handleCrear = async (e) => {
    e.preventDefault(); setSaving(true);
    const nuevo = { ...form, fecha: new Date().toISOString().split('T')[0], autor: user?.nombre };
    const { data, error: err } = await boletinesService.create(nuevo);
    if (!err && data) {
      setBoletines(prev => [data, ...prev]);
      setModal(false);
      setForm({ titulo:'', cuerpo:'', tema:'Gobierno', estado:'borrador' });
    }
    setSaving(false);
  };

  // ── Aprobar/Publicar ──────────────────────────────────────
  const handleAprobar = async (b) => {
    const nuevoEstado = b.estado === 'borrador' ? 'aprobado' : 'publicado';
    const { data, error: err } = await boletinesService.update(b.id, { estado: nuevoEstado });
    if (!err) {
      setBoletines(prev => prev.map(x => x.id === b.id ? { ...x, estado: nuevoEstado } : x));
      if (detalle?.id === b.id) setDetalle({ ...detalle, estado: nuevoEstado });
    }
  };

  // ── Eliminar ──────────────────────────────────────────────
  const handleEliminar = async (id) => {
    const { error: err } = await boletinesService.delete(id);
    if (!err) {
      setBoletines(prev => prev.filter(b => b.id !== id));
      if (detalle?.id === id) setDetalle(null);
    }
  };

  // ── Exportar PDF ──────────────────────────────────────────
  const exportarPDF = (b) => {
    const doc = new jsPDF();
    doc.setFillColor(10,14,26); doc.rect(0,0,210,297,'F');
    doc.setFillColor(29,78,216); doc.rect(0,0,210,40,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold');
    doc.text('H. AYUNTAMIENTO DE HUEYPOXTLA',105,16,{align:'center'});
    doc.setFontSize(11); doc.setFont('helvetica','normal');
    doc.text('Área de Comunicaciones — Boletín Oficial',105,27,{align:'center'});
    doc.setFontSize(9);
    doc.text('2026 · Año del Humanismo Mexicano · Estado de México',105,36,{align:'center'});
    doc.setTextColor(200,220,255); doc.setFontSize(18); doc.setFont('helvetica','bold');
    const tl = doc.splitTextToSize(b.titulo,170);
    doc.text(tl,20,58);
    doc.setTextColor(100,116,139); doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text(`Tema: ${b.tema}   |   Fecha: ${b.fecha}   |   Autor: ${b.autor}`,20,58+tl.length*8+6);
    doc.setDrawColor(59,130,246); doc.setLineWidth(0.5);
    doc.line(20,58+tl.length*8+14,190,58+tl.length*8+14);
    doc.setTextColor(226,232,240); doc.setFontSize(12);
    doc.text(doc.splitTextToSize(b.cuerpo,170),20,58+tl.length*8+24);
    doc.setFillColor(15,23,42); doc.rect(0,275,210,22,'F');
    doc.setTextColor(71,85,105); doc.setFontSize(8);
    doc.text('Calle Plaza Principal SN, Centro, 55670 Hueypoxtla, Méx.  |  Área de Comunicaciones',105,284,{align:'center'});
    doc.text(`Generado automáticamente · ${new Date().toLocaleDateString('es-MX')}`,105,291,{align:'center'});
    doc.save(`boletin_${b.fecha}_${b.titulo.substring(0,20).replace(/\s/g,'_')}.pdf`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Boletines de Prensa</h1>
          <p className="page-sub">
            Redacción, aprobación y exportación · {isSupabaseConfigured() ? (
              <span style={{ color:'#10b981', fontSize:11 }}>● Conectado a Supabase</span>
            ) : (
              <span style={{ color:'#f59e0b', fontSize:11 }}>● Modo offline (datos de ejemplo)</span>
            )}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} strokeWidth={2.5} /> Nuevo Boletín
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="db-error">
          <AlertCircle size={16} strokeWidth={2} />
          <span>{error}</span>
          <button onClick={fetchBoletines}>Reintentar</button>
        </div>
      )}

      {/* Filters */}
      <div className="filter-tabs">
        {Object.entries(filterLabels).map(([key, lbl]) => (
          <button key={key} className={`filter-tab ${filtro===key?'active':''}`} onClick={() => setFiltro(key)}>
            <Filter size={12} strokeWidth={2} /> {lbl}
            <span className="tab-count">{key==='todos' ? boletines.length : boletines.filter(b=>b.estado===key).length}</span>
          </button>
        ))}
      </div>

      <div className="boletines-layout">
        {/* List */}
        <div className="boletines-list">
          {loading ? (
            <div className="db-loading"><Loader2 size={24} strokeWidth={2} className="spin" /><span>Cargando desde Supabase…</span></div>
          ) : boletines.length === 0 ? (
            <div className="detail-empty" style={{ minHeight:200 }}>
              <FileText size={40} strokeWidth={1} color="#1e3a5f" />
              <p>No hay boletines{filtro !== 'todos' ? ` con estado "${filtro}"` : ''}.</p>
            </div>
          ) : boletines.map(b => (
            <div className={`boletin-card ${detalle?.id===b.id?'selected':''}`} key={b.id} onClick={() => setDetalle(b)}>
              <div className="boletin-card-header">
                <span className="bc-tema"><Tag size={10} strokeWidth={2.5} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }} />{b.tema}</span>
                <span className="bc-badge" style={{ background: estadoConfig[b.estado]?.bg, color: estadoConfig[b.estado]?.color }}>
                  {estadoConfig[b.estado]?.label}
                </span>
              </div>
              <h3 className="bc-titulo">{b.titulo}</h3>
              <p className="bc-preview">{b.cuerpo?.substring(0,90)}…</p>
              <div className="bc-footer">
                <span className="bc-meta">
                  <Calendar size={11} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight:3 }} />{b.fecha} ·
                  <User size={11} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginLeft:6, marginRight:3 }} />{b.autor}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        {detalle ? (
          <div className="boletin-detail">
            <div className="detail-header">
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                <span className="bc-tema"><Tag size={10} strokeWidth={2.5} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }} />{detalle.tema}</span>
                <span className="bc-badge" style={{ background:estadoConfig[detalle.estado]?.bg, color:estadoConfig[detalle.estado]?.color }}>
                  {estadoConfig[detalle.estado]?.label}
                </span>
              </div>
              <button className="btn-close" onClick={() => setDetalle(null)}><X size={16} strokeWidth={2} /></button>
            </div>
            <h2 className="detail-titulo">{detalle.titulo}</h2>
            <p className="detail-meta">
              <Calendar size={12} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }} />{detalle.fecha} ·
              <User size={12} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginLeft:8, marginRight:4 }} />{detalle.autor}
            </p>
            <div className="detail-divider" />
            <p className="detail-cuerpo">{detalle.cuerpo}</p>
            <div className="detail-actions">
              {detalle.estado !== 'publicado' && (
                <button className="btn-aprobar" onClick={() => handleAprobar(detalle)}>
                  <CheckCircle size={15} strokeWidth={2} />
                  {detalle.estado === 'borrador' ? 'Aprobar' : 'Publicar'}
                </button>
              )}
              {detalle.estado !== 'borrador' && (
                <button className="btn-facebook" onClick={() => handlePublishToFacebook(detalle)} disabled={publishingFb}>
                  {publishingFb ? <Loader2 size={15} className="spin" /> : <Facebook size={15} />}
                  {publishingFb ? 'Publicando…' : 'Enviar a Facebook'}
                </button>
              )}
              <button className="btn-pdf" onClick={() => exportarPDF(detalle)}>
                <FileDown size={15} strokeWidth={2} /> Exportar PDF
              </button>
              <button className="btn-eliminar" onClick={() => handleEliminar(detalle.id)}>
                <Trash2 size={15} strokeWidth={2} /> Eliminar
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-empty">
            <FileText size={48} strokeWidth={1} color="#1e3a5f" />
            <p>Selecciona un boletín para ver los detalles</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal modal-split-view" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Boletín</h2>
              <button className="btn-close" onClick={() => setModal(false)}><X size={18} strokeWidth={2} /></button>
            </div>
            
            <div className="modal-body-split">
              {/* Formulario Izquierda */}
              <form onSubmit={handleCrear} className="modal-form-main">
                <div className="mf-group">
                  <label>Título del boletín</label>
                  <input value={form.titulo} onChange={e => setForm({...form,titulo:e.target.value})} placeholder="Ingresa el título..." required />
                </div>
                <div className="mf-row">
                  <div className="mf-group"><label>Tema</label>
                    <select value={form.tema} onChange={e => setForm({...form,tema:e.target.value})}>
                      {temas.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="mf-group"><label>Estado inicial</label>
                    <select value={form.estado} onChange={e => setForm({...form,estado:e.target.value})}>
                      <option value="borrador">Borrador</option>
                      <option value="aprobado">Aprobado</option>
                    </select>
                  </div>
                </div>
                <div className="mf-group">
                  <label>Contenido del boletín</label>
                  <textarea value={form.cuerpo} onChange={e => setForm({...form,cuerpo:e.target.value})} placeholder="Redacta el contenido del comunicado..." rows={7} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? <Loader2 size={15} strokeWidth={2} className="spin" /> : <Plus size={16} strokeWidth={2.5} />}
                    {saving ? 'Guardando…' : 'Guardar Boletín'}
                  </button>
                </div>
              </form>

              {/* Copilot IA Derecha */}
              <div className="ai-copilot-panel">
                <div className="ai-panel-header">
                  <Sparkles size={16} color="#d7cfbe" />
                  <h3>Asistente IA (Copilot)</h3>
                </div>
                <p className="ai-panel-desc">Usa la IA de Gemini para redactar o perfeccionar tu boletín de prensa.</p>
                
                <div className="ai-panel-body">
                  <div className="ai-form-group">
                    <label>Notas clave del evento</label>
                    <textarea 
                      value={aiNotes} 
                      onChange={e => setAiNotes(e.target.value)} 
                      placeholder="Ej: Inauguración de jornada de vacunación por el DIF Hueypoxtla a 300 familias este domingo en la explanada..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="ai-form-row">
                    <div className="ai-form-group">
                      <label>Tono del boletín</label>
                      <select value={aiTone} onChange={e => setAiTone(e.target.value)}>
                        <option value="Institucional">Institucional (Formal)</option>
                        <option value="Comunitario">Comunitario (Cercano)</option>
                        <option value="Urgente">Urgente (Alerta/Aviso)</option>
                      </select>
                    </div>
                  </div>

                  {aiError && (
                    <div className="ai-panel-error">
                      <span>{aiError}</span>
                    </div>
                  )}

                  <div className="ai-panel-buttons">
                    <button 
                      type="button" 
                      className="btn-ai-action btn-ai-primary" 
                      onClick={() => handleAiAction('copilot')}
                      disabled={aiLoading || !aiNotes.trim()}
                    >
                      {aiLoading ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                      {aiLoading ? 'Generando borrador…' : 'Redactar Borrador'}
                    </button>
                    
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button 
                        type="button" 
                        className="btn-ai-action btn-ai-secondary" 
                        onClick={() => handleAiAction('improve')}
                        disabled={aiLoading || !form.cuerpo.trim()}
                      >
                        Optimizar redacción
                      </button>
                      <button 
                        type="button" 
                        className="btn-ai-action btn-ai-secondary" 
                        onClick={() => handleAiAction('grammar')}
                        disabled={aiLoading || !form.cuerpo.trim()}
                      >
                        Corregir ortografía
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
