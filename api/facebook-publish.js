// Vercel Serverless Function: /api/facebook-publish
// Publica un mensaje en la página de Facebook del Ayuntamiento utilizando la API Graph de Meta.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const { message, link, bulletinId } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Falta el mensaje de la publicación.' });
  }

  // Obtener credenciales de Meta desde variables de entorno
  const pageId = process.env.VITE_FACEBOOK_PAGE_ID || process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.VITE_FACEBOOK_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;

  // Valor por defecto si no está configurado para evitar crashes en demo
  const isDemoMode = !pageId || pageId === 'TU_PAGE_ID_AQUI' || !accessToken;

  if (isDemoMode) {
    // Si estamos en modo demo / desarrollo, simulamos el éxito de la publicación
    console.log('[Meta API - Modo Demo] Simulando publicación en Facebook:');
    console.log(` - Mensaje: ${message}`);
    if (link) console.log(` - Enlace: ${link}`);
    
    // Si se pasa un bulletinId, lo marcamos en Supabase de todas formas para probar el flujo completo
    if (bulletinId) {
      await updateBulletinStatus(bulletinId);
    }

    const mockPostId = `fb_post_mock_${Date.now()}`;
    return res.status(200).json({
      success: true,
      postId: mockPostId,
      url: `https://facebook.com/${mockPostId}`,
      isDemo: true
    });
  }

  try {
    // 1. Enviar la publicación a la Graph API de Meta
    // Endpoint: POST https://graph.facebook.com/v19.0/{page-id}/feed
    const metaUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    
    const params = {
      message: message,
      access_token: accessToken
    };
    if (link) {
      params.link = link;
    }

    console.log(`[Meta API] Publicando en la página ${pageId}...`);
    const metaRes = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      throw new Error(metaData.error?.message || 'Error de comunicación con la API de Meta.');
    }

    const postId = metaData.id;
    console.log(`[Meta API] Publicación exitosa. Post ID: ${postId}`);

    // 2. Si se provee un bulletinId, actualizar el estado del boletín en Supabase
    if (bulletinId) {
      await updateBulletinStatus(bulletinId);
    }

    return res.status(200).json({
      success: true,
      postId: postId,
      url: `https://facebook.com/${postId}`
    });

  } catch (err) {
    console.error('[Meta API] Error:', err);
    return res.status(500).json({
      error: `Error al publicar en Facebook: ${err.message}`
    });
  }
}

async function updateBulletinStatus(bulletinId) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    const { error } = await supabase
      .from('boletines')
      .update({ estado: 'publicado' })
      .eq('id', bulletinId);
      
    if (error) {
      console.error(`[Supabase] Error al actualizar estado del boletín ${bulletinId}:`, error.message);
    } else {
      console.log(`[Supabase] Boletín ${bulletinId} marcado como publicado.`);
    }
  }
}
