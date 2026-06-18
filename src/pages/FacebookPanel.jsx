import { useState, useEffect } from 'react';
import {
  ExternalLink, RefreshCw, ThumbsUp,
  MessageCircle, Share2, Users, TrendingUp, Eye, Heart,
  AlertCircle, BarChart2, Calendar, Sparkles, Loader2
} from 'lucide-react';
import Facebook from '../components/FacebookIcon';
import { facebookService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import './FacebookPanel.css';

// URL oficial del Ayuntamiento de Hueypoxtla
const FB_PAGE_URL   = 'https://www.facebook.com/GobiernoHueypoxtla';
const FB_PAGE_NAME  = 'H. Ayuntamiento de Hueypoxtla';

const tipoColor = {
  foto:          '#d7cfbe', // Beige arena
  aviso:         '#c1b59f', // Beige-dorado
  reconocimiento:'#8fa4c7', // Azul prusiano claro
  obra:          '#5c7fa8', // Azul acero
  video:         '#a3b8cc', // Azul grisáceo
  album:         '#7a8d9f'  // Slate
};

const tipoLabel = {
  foto:          'Foto',
  aviso:         'Aviso',
  reconocimiento:'Reconocimiento',
  obra:          'Obra',
  video:         'Video',
  album:         'Álbum'
};

function StatCard({ label, value, sub, Icon, color }) {
  return (
    <div className="fb-stat">
      <div className="fb-stat-icon" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
        <Icon size={20} strokeWidth={1.8} color={color} />
      </div>
      <div>
        <span className="fb-stat-num" style={{ color: '#fafaf9' }}>{typeof value === 'number' ? value.toLocaleString('es-MX') : value}</span>
        <span className="fb-stat-label">{label}</span>
        {sub && <span className="fb-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

export default function FacebookPanel() {
  const [posts, setPosts]       = useState([]);
  const [stats, setStats]       = useState({
    seguidores: 3847,
    megusta: 3712,
    alcance: 12400,
    interaccion: 8.4,
    name: FB_PAGE_NAME,
    picture: null
  });
  const [loading, setLoading]   = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [apiNote, setApiNote]   = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // AI Analysis States
  const [activeAnalysisPost, setActiveAnalysisPost] = useState(null);
  const [customComments, setCustomComments] = useState('');
  const [analysisResults, setAnalysisResults] = useState({}); // key: postId, value: data
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const handleAnalyze = async (postId, postText, simulate = true) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const apiKey = localStorage.getItem('GEMINI_API_KEY');
      const commentsToSend = simulate ? null : customComments.split('\n').filter(c => c.trim().length > 0);
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey
        },
        body: JSON.stringify({
          action: 'sentiment',
          text: postText,
          comments: commentsToSend
        })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Error al comunicarse con la IA');
      }

      if (resJson.data) {
        setAnalysisResults(prev => ({
          ...prev,
          [postId]: resJson.data
        }));
      }
    } catch (err) {
      console.error(err);
      setAnalysisError(err.message || 'No se pudo conectar al servicio de IA.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const syncFacebookData = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const [resStats, resPosts] = await Promise.all([
        facebookService.getPageData(),
        facebookService.getRecentPosts()
      ]);

      if (resStats.data) {
        setStats(resStats.data);
      }
      if (resPosts.data) {
        setPosts(resPosts.data);
      }
      setIsDemoMode(resStats.isMock || resPosts.isMock);
      setLastSync(new Date());
    } catch (err) {
      console.error("Facebook synchronization failed:", err);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  };

  useEffect(() => {
    // Carga inicial de datos
    syncFacebookData(true);

    if (!isSupabaseConfigured()) return;

    // Suscribirse a cambios en la tabla facebook_cache en tiempo real
    const channel = supabase
      .channel('facebook-cache-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'facebook_cache'
        },
        (payload) => {
          console.log('Cambio detectado en Supabase Realtime:', payload);
          if (payload.new) {
            const updated = payload.new;
            if (updated.id === 'page_stats') {
              setStats(updated.data);
            } else if (updated.id === 'recent_posts') {
              setPosts(updated.data);
            }
            setLastSync(new Date());
            setIsDemoMode(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    syncFacebookData(true);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Facebook</h1>
          <p className="page-sub">Monitoreo de la página oficial de la presidencia y obras públicas</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={FB_PAGE_URL} target="_blank" rel="noreferrer" className="btn-fb-link">
            <Facebook size={15} strokeWidth={2} /> Ver página oficial
            <ExternalLink size={12} strokeWidth={2} />
          </a>
          <button className={`btn-refresh ${loading ? 'spinning' : ''}`} onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={15} strokeWidth={2} />
            {loading ? 'Sincronizando…' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {/* API Notice */}
      {isDemoMode && apiNote && (
        <div className="fb-api-notice">
          <AlertCircle size={16} strokeWidth={2} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div>
            <strong>Modo demostración</strong> — Para conectar con datos en tiempo real del Ayuntamiento, configura las variables <code>VITE_FACEBOOK_PAGE_ID</code> y <code>VITE_FACEBOOK_ACCESS_TOKEN</code> en tu archivo de variables <code>.env</code>.
          </div>
          <button className="notice-close" onClick={() => setApiNote(false)}><span>✕</span></button>
        </div>
      )}

      {/* Page Info */}
      <div className="fb-page-card">
        <div className="fb-page-avatar" style={stats.picture ? { background: 'none', padding: 0 } : {}}>
          {stats.picture ? (
            <img 
              src={stats.picture} 
              alt="Perfil municipal" 
              style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }} 
            />
          ) : (
            <Facebook size={28} strokeWidth={1.5} color="#fff" />
          )}
        </div>
        <div className="fb-page-info">
          <h2 className="fb-page-name">{stats.name || FB_PAGE_NAME}</h2>
          <p className="fb-page-cat">Página de Gobierno · Municipio de Hueypoxtla, Estado de México</p>
          <div className="fb-page-sync">
            <Calendar size={12} strokeWidth={2} />
            Última sincronización: {lastSync.toLocaleString('es-MX')}
          </div>
        </div>
        <div className="fb-page-badge" style={isDemoMode ? { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#f59e0b' } : {}}>
          <span className="fb-live-dot" style={isDemoMode ? { backgroundColor: '#f59e0b', boxShadow: 'none' } : {}} />
          {isDemoMode ? 'Modo Demo' : 'Conectado (En Vivo)'}
        </div>
      </div>

      <div className="fb-stats-grid">
        <StatCard label="Seguidores"     value={stats.seguidores}  sub="en la página"    Icon={Users}      color="#d7cfbe" />
        <StatCard label="Me gusta"       value={stats.megusta}     sub="total"            Icon={ThumbsUp}   color="#d7cfbe" />
        <StatCard label="Alcance semanal"value={stats.alcance}     sub="personas"         Icon={Eye}        color="#8fa4c7" />
        <StatCard label="Interacción"    value={typeof stats.interaccion === 'number' ? `${stats.interaccion}%` : stats.interaccion} sub="promedio"  Icon={TrendingUp} color="#8fa4c7" />
      </div>

      {/* Posts */}
      <div className="fb-section-title">
        <BarChart2 size={16} strokeWidth={2} color="#d7cfbe" />
        <span>Publicaciones Recientes</span>
      </div>

      <div className="fb-posts">
        {posts.length > 0 ? (
          posts.map(p => (
            <div className="fb-post" key={p.id}>
              <div className="fb-post-header">
                <div className="fb-post-avatar">
                  <Facebook size={16} strokeWidth={1.5} color="#8fa4c7" />
                </div>
                <div>
                  <span className="fb-post-page">{stats.name || FB_PAGE_NAME}</span>
                  <span className="fb-post-date">
                    <Calendar size={11} strokeWidth={2} style={{ display:'inline', verticalAlign:'middle', marginRight: 3 }} />
                    {new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })}
                  </span>
                </div>
                <span className="fb-post-tipo" style={{ background: `${tipoColor[p.tipo] || '#64748b'}15`, color: tipoColor[p.tipo] || '#94a3b8', borderColor: `${tipoColor[p.tipo] || '#64748b'}30` }}>
                  {tipoLabel[p.tipo] || p.tipo}
                </span>
              </div>

              <p className="fb-post-texto">{p.texto}</p>

              <div className="fb-post-footer">
                <div className="fb-engagement">
                  <span className="fb-eng-item">
                    <ThumbsUp size={13} strokeWidth={2} color="#d7cfbe" />
                    {p.likes.toLocaleString('es-MX')}
                  </span>
                  <span className="fb-eng-item">
                    <MessageCircle size={13} strokeWidth={2} color="#8fa4c7" />
                    {p.comentarios}
                  </span>
                  <span className="fb-eng-item">
                    <Share2 size={13} strokeWidth={2} color="#c1b59f" />
                    {p.compartidos}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="fb-post-score">
                    <Heart size={11} strokeWidth={2} color="#d7cfbe" />
                    <span>Engagement: <strong>{((p.likes + p.comentarios + p.compartidos) / (stats.seguidores || 1) * 100).toFixed(1)}%</strong></span>
                  </div>
                  
                  <button 
                    className={`btn-ai-analyze ${activeAnalysisPost === p.id ? 'active' : ''}`}
                    onClick={() => {
                      if (activeAnalysisPost === p.id) {
                        setActiveAnalysisPost(null);
                      } else {
                        setActiveAnalysisPost(p.id);
                        setCustomComments('');
                        setAnalysisError(null);
                      }
                    }}
                  >
                    <Sparkles size={12} />
                    {activeAnalysisPost === p.id ? 'Ocultar Análisis' : 'Analizar Opinión (IA)'}
                  </button>
                </div>
              </div>

              {/* Panel de Análisis IA */}
              {activeAnalysisPost === p.id && (
                <div className="ai-analysis-panel">
                  {!analysisResults[p.id] ? (
                    <div className="ai-analysis-setup">
                      <div className="setup-title">
                        <Sparkles size={14} color="#d7cfbe" />
                        <h4>Análisis de Opinión y Respuestas IA</h4>
                      </div>
                      <p className="setup-desc">Puedes pegar comentarios reales de los ciudadanos (uno por línea) o dejarlo vacío para simular comentarios realistas sobre este tema utilizando Gemini.</p>
                      
                      <textarea 
                        className="setup-textarea"
                        placeholder="Ej: Excelente iniciativa del Ayuntamiento...\n¿A qué hora empieza el curso?..."
                        value={customComments}
                        onChange={e => setCustomComments(e.target.value)}
                        rows={3}
                      />
                      
                      {analysisError && <div className="setup-error">⚠️ {analysisError}</div>}
                      
                      <div style={{ marginTop: 10 }}>
                        <button 
                          className="btn-setup-run btn-primary"
                          onClick={() => handleAnalyze(p.id, p.texto, !customComments.trim())}
                          disabled={analysisLoading}
                        >
                          {analysisLoading ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                          {analysisLoading ? 'Analizando con Gemini…' : (customComments.trim() ? 'Analizar Comentarios Pegados' : 'Simular y Analizar Comentarios')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Resultados del Análisis
                    <div className="ai-analysis-results">
                      <div className="results-header">
                        <h4>Reporte de Opinión Ciudadana</h4>
                        <button className="btn-results-reset" onClick={() => {
                          setAnalysisResults(prev => {
                            const copy = { ...prev };
                            delete copy[p.id];
                            return copy;
                          });
                        }}>Nuevo análisis</button>
                      </div>
                      
                      <div className="results-metrics">
                        <div className="metric-box">
                          <span className="mb-label">Tema Detectado</span>
                          <span className="mb-val">{analysisResults[p.id].tema || 'General'}</span>
                        </div>
                        <div className="metric-box sentiment-bars">
                          <span className="mb-label">Distribución de Sentimiento</span>
                          <div className="bar-container">
                            <div className="bar positive" style={{ width: `${analysisResults[p.id].sentimientos?.positivo || 33}%` }} title="Positivo">
                              {analysisResults[p.id].sentimientos?.positivo}%
                            </div>
                            <div className="bar neutral" style={{ width: `${analysisResults[p.id].sentimientos?.neutro || 33}%` }} title="Neutro">
                              {analysisResults[p.id].sentimientos?.neutro}%
                            </div>
                            <div className="bar negative" style={{ width: `${analysisResults[p.id].sentimientos?.negativo || 33}%` }} title="Negativo">
                              {analysisResults[p.id].sentimientos?.negativo}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="comments-qa-list">
                        <h5>Comentarios y Respuestas Sugeridas para el Copiado</h5>
                        {analysisResults[p.id].comentarios?.map((c, idx) => (
                          <div className={`qa-item ${c.sentimiento}`} key={idx}>
                            <div className="qa-comment">
                              <span className="user-icon">👤</span>
                              <div>
                                <p className="comment-text">"{c.texto}"</p>
                                <span className={`comment-sentiment-badge ${c.sentimiento}`}>{c.sentimiento}</span>
                              </div>
                            </div>
                            <div className="qa-response">
                              <span className="gov-icon">🏛️</span>
                              <div style={{ flex: 1 }}>
                                <p className="response-text">{c.respuesta}</p>
                                <button className="btn-copy-resp" onClick={() => {
                                  navigator.clipboard.writeText(c.respuesta);
                                  alert('Respuesta copiada al portapapeles.');
                                }}>
                                  Copiar Respuesta sugerida
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="db-loading">
            {loading ? (
              <>
                <RefreshCw className="spinner" size={20} />
                <span>Sincronizando publicaciones con Meta…</span>
              </>
            ) : (
              <span>No se encontraron publicaciones recientes.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
