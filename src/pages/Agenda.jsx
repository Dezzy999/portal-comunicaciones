import { useState, useEffect } from 'react';
import { Plus, X, Clock, MapPin, Trash2, Filter, Loader2, AlertCircle } from 'lucide-react';
import { eventosService } from '../services/dataService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import './Agenda.css';

const tipoConfig = {
  gobierno:{ color:'#3b82f6', label:'Gobierno', bg:'rgba(59,130,246,0.12)' },
  social:  { color:'#10b981', label:'Social',   bg:'rgba(16,185,129,0.12)' },
  obras:   { color:'#f59e0b', label:'Obras',    bg:'rgba(245,158,11,0.12)' },
  salud:   { color:'#ec4899', label:'Salud',    bg:'rgba(236,72,153,0.12)' },
  cultura: { color:'#a855f7', label:'Cultura',  bg:'rgba(168,85,247,0.12)' },
};

const tipos = ['gobierno','social','obras','salud','cultura'];
const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Agenda() {
  const [eventos, setEventos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({ titulo:'', fecha:'', hora:'09:00', lugar:'', tipo:'gobierno', descripcion:'' });

  const fetchEventos = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await eventosService.getAll(
      filtroTipo !== 'todos' ? { tipo: filtroTipo } : {}
    );
    if (err) setError('Error al cargar eventos desde Supabase.');
    else setEventos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEventos(); }, [filtroTipo]);

  const ahora = new Date();
  const proximos = eventos.filter(e => new Date(e.fecha) >= ahora).sort((a,b) => new Date(a.fecha)-new Date(b.fecha));
  const pasados  = eventos.filter(e => new Date(e.fecha) < ahora).sort((a,b) => new Date(b.fecha)-new Date(a.fecha));

  const handleCrear = async (e) => {
    e.preventDefault(); setSaving(true);
    const { data, error: err } = await eventosService.create(form);
    if (!err && data) { setEventos(prev => [...prev, data]); setModal(false); setForm({ titulo:'',fecha:'',hora:'09:00',lugar:'',tipo:'gobierno',descripcion:'' }); }
    setSaving(false);
  };

  const handleEliminar = async (id) => {
    const { error: err } = await eventosService.delete(id);
    if (!err) setEventos(prev => prev.filter(e => e.id !== id));
  };

  const formatFecha = (f) => {
    const d = new Date(f + 'T12:00:00');
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  };

  const EventoCard = ({ e, pasado }) => (
    <div className={`evento-card ${pasado?'pasado':''}`}>
      <div className="ec-date" style={{ background:tipoConfig[e.tipo]?.bg, borderColor:`${tipoConfig[e.tipo]?.color}40` }}>
        <span className="ec-day"  style={{ color:tipoConfig[e.tipo]?.color }}>{new Date(e.fecha+'T12:00:00').getDate()}</span>
        <span className="ec-month" style={{ color:tipoConfig[e.tipo]?.color }}>{meses[new Date(e.fecha+'T12:00:00').getMonth()].substring(0,3).toUpperCase()}</span>
      </div>
      <div className="ec-body">
        <div className="ec-top">
          <span className="ec-tipo" style={{ background:tipoConfig[e.tipo]?.bg, color:tipoConfig[e.tipo]?.color }}>{tipoConfig[e.tipo]?.label}</span>
        </div>
        <h3 className="ec-titulo">{e.titulo}</h3>
        <p className="ec-desc">{e.descripcion}</p>
        <div className="ec-meta">
          <span><Clock size={11} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight:3 }} />{e.hora?.substring(0,5)}</span>
          <span><MapPin size={11} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight:3 }} />{e.lugar}</span>
          <span>{formatFecha(e.fecha)}</span>
        </div>
      </div>
      <button className="ec-delete" onClick={() => handleEliminar(e.id)} title="Eliminar"><Trash2 size={14} strokeWidth={2} /></button>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda de Eventos</h1>
          <p className="page-sub">
            Calendario oficial ·{' '}
            {isSupabaseConfigured()
              ? <span style={{ color:'#10b981', fontSize:11 }}>● Conectado a Supabase</span>
              : <span style={{ color:'#f59e0b', fontSize:11 }}>● Modo offline</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} strokeWidth={2.5} /> Nuevo Evento</button>
      </div>

      {error && <div className="db-error"><AlertCircle size={16} strokeWidth={2} /><span>{error}</span><button onClick={fetchEventos}>Reintentar</button></div>}

      <div className="filter-tabs">
        <button className={`filter-tab ${filtroTipo==='todos'?'active':''}`} onClick={() => setFiltroTipo('todos')}>
          <Filter size={12} strokeWidth={2} /> Todos <span className="tab-count">{eventos.length}</span>
        </button>
        {tipos.map(t => (
          <button key={t} className={`filter-tab ${filtroTipo===t?'active':''}`} onClick={() => setFiltroTipo(t)}
            style={filtroTipo===t?{color:tipoConfig[t]?.color,borderColor:`${tipoConfig[t]?.color}50`,background:`${tipoConfig[t]?.color}10`}:{}}>
            {tipoConfig[t]?.label} <span className="tab-count">{eventos.filter(e=>e.tipo===t).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="db-loading"><Loader2 size={24} strokeWidth={2} className="spin" /><span>Cargando desde Supabase…</span></div>
      ) : (
        <>
          <div className="agenda-section">
            <h2 className="agenda-section-title">Próximos ({proximos.length})</h2>
            {proximos.length === 0
              ? <div className="agenda-empty">No hay eventos próximos.</div>
              : <div className="eventos-grid">{proximos.map(e => <EventoCard key={e.id} e={e} pasado={false} />)}</div>}
          </div>
          {pasados.length > 0 && (
            <div className="agenda-section">
              <h2 className="agenda-section-title" style={{ color:'#334155' }}>Eventos Anteriores</h2>
              <div className="eventos-grid">{pasados.map(e => <EventoCard key={e.id} e={e} pasado={true} />)}</div>
            </div>
          )}
        </>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Evento</h2>
              <button className="btn-close" onClick={() => setModal(false)}><X size={18} strokeWidth={2} /></button>
            </div>
            <form onSubmit={handleCrear} className="modal-form">
              <div className="mf-group"><label>Título</label><input value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} required /></div>
              <div className="mf-row">
                <div className="mf-group"><label>Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} required /></div>
                <div className="mf-group"><label>Hora</label><input type="time" value={form.hora} onChange={e=>setForm({...form,hora:e.target.value})} required /></div>
              </div>
              <div className="mf-row">
                <div className="mf-group"><label>Lugar</label><input value={form.lugar} onChange={e=>setForm({...form,lugar:e.target.value})} required /></div>
                <div className="mf-group"><label>Tipo</label>
                  <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
                    {tipos.map(t=><option key={t} value={t}>{tipoConfig[t]?.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="mf-group"><label>Descripción</label><textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} rows={3} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={15} strokeWidth={2} className="spin" /> : <Plus size={16} strokeWidth={2.5} />}
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
