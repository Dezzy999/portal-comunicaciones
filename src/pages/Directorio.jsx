import { useState, useEffect } from 'react';
import { Plus, X, Search, Mail, Phone, Trash2, Newspaper, Radio, Tv2, Globe, Loader2, AlertCircle } from 'lucide-react';
import { directorioService } from '../services/dataService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import './Directorio.css';

const tipoConfig = {
  prensa:     { color:'#3b82f6', Icon:Newspaper, label:'Prensa'    },
  radio:      { color:'#f59e0b', Icon:Radio,     label:'Radio'     },
  television: { color:'#ec4899', Icon:Tv2,       label:'Televisión'},
  digital:    { color:'#10b981', Icon:Globe,     label:'Digital'   },
};

export default function Directorio() {
  const [directorio, setDirectorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [busqueda, setBusqueda]   = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [form, setForm] = useState({ nombre:'', tipo:'prensa', contacto:'', telefono:'', cobertura:'Municipal' });

  const fetchDirectorio = async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await directorioService.getAll(
      filtroTipo !== 'todos' ? { tipo: filtroTipo } : {}
    );
    if (err) setError('Error al cargar el directorio desde Supabase.');
    else setDirectorio(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDirectorio(); }, [filtroTipo]);

  const filtrados = directorio.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.contacto.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleCrear = async (e) => {
    e.preventDefault(); setSaving(true);
    const { data, error: err } = await directorioService.create(form);
    if (!err && data) { setDirectorio(prev => [...prev, data]); setModal(false); setForm({ nombre:'',tipo:'prensa',contacto:'',telefono:'',cobertura:'Municipal' }); }
    setSaving(false);
  };

  const handleEliminar = async (id) => {
    const { error: err } = await directorioService.delete(id);
    if (!err) setDirectorio(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Directorio de Medios</h1>
          <p className="page-sub">
            Gestión de contactos de prensa ·{' '}
            {isSupabaseConfigured()
              ? <span style={{ color:'#10b981', fontSize:11 }}>● Conectado a Supabase</span>
              : <span style={{ color:'#f59e0b', fontSize:11 }}>● Modo offline</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} strokeWidth={2.5} /> Agregar Medio</button>
      </div>

      {error && <div className="db-error"><AlertCircle size={16} strokeWidth={2} /><span>{error}</span><button onClick={fetchDirectorio}>Reintentar</button></div>}

      <div className="dir-controls">
        <div className="search-wrapper">
          <Search size={16} strokeWidth={2} className="search-icon-svg" />
          <input className="search-input" placeholder="Buscar por nombre o correo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="filter-tabs">
          <button className={`filter-tab ${filtroTipo==='todos'?'active':''}`} onClick={() => setFiltroTipo('todos')}>
            Todos <span className="tab-count">{directorio.length}</span>
          </button>
          {Object.entries(tipoConfig).map(([t, cfg]) => (
            <button key={t} className={`filter-tab ${filtroTipo===t?'active':''}`} onClick={() => setFiltroTipo(t)}>
              <cfg.Icon size={12} strokeWidth={2} /> {cfg.label}
              <span className="tab-count">{directorio.filter(d=>d.tipo===t).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="dir-table-wrap">
        {loading ? (
          <div className="db-loading"><Loader2 size={24} strokeWidth={2} className="spin" /><span>Cargando desde Supabase…</span></div>
        ) : (
          <table className="dir-table">
            <thead>
              <tr><th>Medio</th><th>Tipo</th><th>Contacto</th><th>Teléfono</th><th>Cobertura</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtrados.length === 0
                ? <tr><td colSpan={6} className="table-empty">No se encontraron resultados</td></tr>
                : filtrados.map(d => {
                    const cfg = tipoConfig[d.tipo];
                    return (
                      <tr key={d.id}>
                        <td>
                          <div className="dir-nombre">
                            <div className="dir-avatar" style={{ background:`${cfg.color}15`, color:cfg.color }}>
                              <cfg.Icon size={16} strokeWidth={1.8} />
                            </div>
                            <span>{d.nombre}</span>
                          </div>
                        </td>
                        <td><span className="dir-badge" style={{ background:`${cfg.color}15`, color:cfg.color }}>{cfg.label}</span></td>
                        <td><span className="dir-email">{d.contacto}</span></td>
                        <td><span className="dir-tel">{d.telefono}</span></td>
                        <td><span className="dir-cob">{d.cobertura}</span></td>
                        <td>
                          <div className="dir-actions">
                            <a href={`mailto:${d.contacto}`} className="btn-contact" title="Enviar correo"><Mail size={14} strokeWidth={2} /></a>
                            <a href={`tel:${d.telefono}`}    className="btn-contact" title="Llamar"><Phone size={14} strokeWidth={2} /></a>
                            <button className="btn-del-small" onClick={() => handleEliminar(d.id)}><Trash2 size={14} strokeWidth={2} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        )}
      </div>

      <div className="dir-stats">
        {Object.entries(tipoConfig).map(([tipo, cfg]) => (
          <div className="dir-stat" key={tipo} style={{ borderColor:`${cfg.color}25`, background:`${cfg.color}06` }}>
            <cfg.Icon size={24} strokeWidth={1.5} color={cfg.color} />
            <div>
              <span className="dir-stat-num" style={{ color:cfg.color }}>{directorio.filter(d=>d.tipo===tipo).length}</span>
              <span className="dir-stat-label">{cfg.label}</span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Contacto</h2>
              <button className="btn-close" onClick={() => setModal(false)}><X size={18} strokeWidth={2} /></button>
            </div>
            <form onSubmit={handleCrear} className="modal-form">
              <div className="mf-group"><label>Nombre del medio</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Periódico El Sol" required /></div>
              <div className="mf-row">
                <div className="mf-group"><label>Tipo de medio</label>
                  <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
                    {Object.entries(tipoConfig).map(([t,c]) => <option key={t} value={t}>{c.label}</option>)}
                  </select>
                </div>
                <div className="mf-group"><label>Cobertura</label>
                  <select value={form.cobertura} onChange={e=>setForm({...form,cobertura:e.target.value})}>
                    {['Municipal','Regional','Estatal','Nacional'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="mf-row">
                <div className="mf-group"><label>Correo</label><input type="email" value={form.contacto} onChange={e=>setForm({...form,contacto:e.target.value})} required /></div>
                <div className="mf-group"><label>Teléfono</label><input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} required /></div>
              </div>
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
