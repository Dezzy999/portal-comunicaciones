/**
 * CommsHub · Servicios de Base de Datos Supabase
 * Cada función intenta usar Supabase; si no está configurado,
 * regresa a los datos de ejemplo (mock) automáticamente.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  boletinesIniciales,
  eventosIniciales,
  directorioIniciales,
} from '../data/mockData';

// ════════════════════════════════════════════
// BOLETINES
// ════════════════════════════════════════════

export const boletinesService = {
  async getAll(filtros = {}) {
    if (!isSupabaseConfigured()) return { data: boletinesIniciales, error: null };
    let query = supabase.from('boletines').select('*').order('fecha', { ascending: false });
    if (filtros.estado) query = query.eq('estado', filtros.estado);
    if (filtros.tema)   query = query.eq('tema',   filtros.tema);
    return await query;
  },

  async getById(id) {
    if (!isSupabaseConfigured()) return { data: boletinesIniciales.find(b => b.id === id), error: null };
    return await supabase.from('boletines').select('*').eq('id', id).single();
  },

  async create(boletin) {
    if (!isSupabaseConfigured()) {
      const nuevo = { id: Date.now(), ...boletin };
      boletinesIniciales.unshift(nuevo);
      return { data: nuevo, error: null };
    }
    return await supabase.from('boletines').insert([boletin]).select().single();
  },

  async update(id, cambios) {
    if (!isSupabaseConfigured()) {
      const idx = boletinesIniciales.findIndex(b => b.id === id);
      if (idx !== -1) boletinesIniciales[idx] = { ...boletinesIniciales[idx], ...cambios };
      return { data: boletinesIniciales[idx], error: null };
    }
    return await supabase.from('boletines').update(cambios).eq('id', id).select().single();
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const idx = boletinesIniciales.findIndex(b => b.id === id);
      if (idx !== -1) boletinesIniciales.splice(idx, 1);
      return { error: null };
    }
    return await supabase.from('boletines').delete().eq('id', id);
  },
};

// ════════════════════════════════════════════
// EVENTOS
// ════════════════════════════════════════════

export const eventosService = {
  async getAll(filtros = {}) {
    if (!isSupabaseConfigured()) return { data: eventosIniciales, error: null };
    let query = supabase.from('eventos').select('*').order('fecha', { ascending: true });
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    return await query;
  },

  async create(evento) {
    if (!isSupabaseConfigured()) {
      const nuevo = { id: Date.now(), ...evento };
      eventosIniciales.push(nuevo);
      return { data: nuevo, error: null };
    }
    return await supabase.from('eventos').insert([evento]).select().single();
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const idx = eventosIniciales.findIndex(e => e.id === id);
      if (idx !== -1) eventosIniciales.splice(idx, 1);
      return { error: null };
    }
    return await supabase.from('eventos').delete().eq('id', id);
  },
};

// ════════════════════════════════════════════
// DIRECTORIO
// ════════════════════════════════════════════

export const directorioService = {
  async getAll(filtros = {}) {
    if (!isSupabaseConfigured()) return { data: directorioIniciales, error: null };
    let query = supabase.from('directorio').select('*').order('nombre', { ascending: true });
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.q)    query = query.or(`nombre.ilike.%${filtros.q}%,contacto.ilike.%${filtros.q}%`);
    return await query;
  },

  async create(contacto) {
    if (!isSupabaseConfigured()) {
      const nuevo = { id: Date.now(), ...contacto };
      directorioIniciales.push(nuevo);
      return { data: nuevo, error: null };
    }
    return await supabase.from('directorio').insert([contacto]).select().single();
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const idx = directorioIniciales.findIndex(d => d.id === id);
      if (idx !== -1) directorioIniciales.splice(idx, 1);
      return { error: null };
    }
    return await supabase.from('directorio').delete().eq('id', id);
  },
};

// ════════════════════════════════════════════
// USUARIOS (Auth simple sin Supabase Auth)
// ════════════════════════════════════════════

import { usuarios } from '../data/mockData';

export const usuariosService = {
  async login(usuario, password) {
    if (!isSupabaseConfigured()) {
      const found = usuarios.find(u => u.usuario === usuario && u.password === password);
      return { data: found || null, error: found ? null : 'Credenciales incorrectas' };
    }
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuario)
      .eq('password', password)
      .single();
    return { data, error };
  },
};

// ════════════════════════════════════════════
// FACEBOOK SERVICE (Graph API)
// ════════════════════════════════════════════

export const facebookService = {
  async getPageData() {
    const defaultData = {
      seguidores: 3847,
      megusta: 3712,
      alcance: 12400,
      interaccion: 8.4,
      name: 'H. Ayuntamiento de Hueypoxtla',
      picture: null
    };

    if (!isSupabaseConfigured()) {
      return { data: defaultData, isMock: true, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('facebook_cache')
        .select('*')
        .eq('id', 'page_stats')
        .single();
        
      if (error || !data) {
        return { data: defaultData, isMock: true, error: null };
      }
      
      return { data: data.data, isMock: false, error: null };
    } catch (err) {
      console.error("Error reading facebook page stats cache from Supabase:", err);
      return { data: defaultData, isMock: true, error: err.message };
    }
  },

  async getRecentPosts() {
    const defaultPosts = [
      {
        id: 'mock_1',
        texto: 'La presidenta municipal Rosa Elva Barrera Flores supervisó las obras de mejoramiento urbano en el centro histórico de Hueypoxtla. ¡Seguimos trabajando por ti! 🏛️',
        fecha: '2026-06-15',
        likes: 142,
        comentarios: 23,
        compartidos: 18,
        tipo: 'foto',
      },
      {
        id: 'mock_2',
        texto: '📢 AVISO IMPORTANTE | Este sábado realizaremos una Jornada de Salud gratuita en el DIF Municipal. Consulta general, odontología y más. ¡No faltes!',
        fecha: '2026-06-12',
        likes: 287,
        comentarios: 41,
        compartidos: 95,
        tipo: 'aviso',
      },
      {
        id: 'mock_3',
        texto: 'Felicitamos a los alumnos del CBT Dr. Efraín Hernández Xolocotzi por sus logros académicos. ¡El futuro de Hueypoxtla está en sus manos! 🎓',
        fecha: '2026-06-10',
        likes: 312,
        comentarios: 57,
        compartidos: 44,
        tipo: 'reconocimiento',
      },
      {
        id: 'mock_4',
        texto: '🏗️ Avance de obra | Pavimentación de la calle Insurgentes al 65% de avance. Gracias a todos por su paciencia durante los trabajos.',
        fecha: '2026-06-08',
        likes: 98,
        comentarios: 34,
        compartidos: 12,
        tipo: 'obra',
      }
    ];

    if (!isSupabaseConfigured()) {
      return { data: defaultPosts, isMock: true, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('facebook_cache')
        .select('*')
        .eq('id', 'recent_posts')
        .single();
        
      if (error || !data) {
        return { data: defaultPosts, isMock: true, error: null };
      }
      
      return { data: data.data, isMock: false, error: null };
    } catch (err) {
      console.error("Error reading facebook recent posts cache from Supabase:", err);
      return { data: defaultPosts, isMock: true, error: err.message };
    }
  },

  async syncRealtime() {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase no está configurado.' };
    }
    try {
      const res = await fetch('/api/facebook-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al sincronizar con Facebook.');
      }
      return { data, error: null };
    } catch (err) {
      console.error("Error running real-time sync API:", err);
      return { data: null, error: err.message };
    }
  },

  async publishPost(message, link = null, bulletinId = null) {
    try {
      const res = await fetch('/api/facebook-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, link, bulletinId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al publicar en Facebook.');
      }
      return { data, error: null };
    } catch (err) {
      console.error("Meta API publish failed:", err);
      return { data: null, error: err.message };
    }
  }
};

