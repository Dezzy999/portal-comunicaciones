import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('xxxxxxxxx')) {
  console.warn(
    '⚠️  Portal Comunicaciones: Supabase no configurado.\n' +
    'Abre el archivo .env y pega tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.\n' +
    'La app funcionará en modo offline con datos de ejemplo.'
  );
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseKey  || 'placeholder-key',
);

/** Verifica si Supabase está correctamente configurado */
export const isSupabaseConfigured = () =>
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('xxxxxxxxx') &&
  !supabaseKey.includes('XXXXXXXXXX');
