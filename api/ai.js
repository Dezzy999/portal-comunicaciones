// Vercel Serverless Function: /api/ai
// Interactúa con Google Gemini API (gemini-1.5-flash)

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-key, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  // Obtener la API Key de Gemini
  let apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'null' || apiKey === 'undefined') {
    return res.status(400).json({
      error: 'Clave API de Gemini faltante. Por favor configúrala en Ajustes (Sidebar) o en las variables de entorno de Vercel.'
    });
  }

  const { action, notes, tone, text, comments, bulletins, month } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'Acción faltante en la solicitud.' });
  }

  try {
    let systemInstruction = '';
    let userPrompt = '';

    if (action === 'copilot') {
      systemInstruction = `Eres un redactor de prensa oficial del H. Ayuntamiento de Hueypoxtla. Tu objetivo es redactar un comunicado de prensa institucional y profesional en base a las notas que te proporcione el usuario. 
Debes generar SIEMPRE un objeto JSON válido con exactamente dos campos: 
1. "titulo" (el título oficial del boletín en mayúsculas/minúsculas institucional).
2. "cuerpo" (el texto de prensa formal redactado profesionalmente, que conste de varios párrafos bien estructurados).
Adapta el tono de acuerdo a lo seleccionado por el usuario (los tonos son: "Institucional", "Comunitario" o "Urgente").
No agregues comentarios fuera del JSON. Devuelve únicamente el JSON válido.`;

      userPrompt = `Notas clave del evento: "${notes || ''}"\nTono seleccionado: "${tone || 'Institucional'}"`;
    } 
    else if (action === 'sentiment') {
      systemInstruction = `Eres un analista de comunicación ciudadana y redes sociales para el H. Ayuntamiento de Hueypoxtla. 
Debes analizar la opinión pública sobre la publicación oficial adjunta.
Si el usuario NO provee comentarios, simula 4 comentarios realistas de ciudadanos de Hueypoxtla (algunos positivos, alguna queja sobre servicios públicos y alguna pregunta constructiva) basados en el tema de la publicación.
Si el usuario PROVEE comentarios, utilízalos para realizar el análisis.
Analiza todos los comentarios y devuelve SIEMPRE un objeto JSON válido con la siguiente estructura:
{
  "sentimientos": {
    "positivo": 40,
    "neutro": 30,
    "negativo": 30
  },
  "tema": "Detección del tema (ej. Obras Públicas, Salud, DIF, Seguridad, Servicios)",
  "comentarios": [
    {
      "texto": "Comentario ciudadano analizado",
      "sentimiento": "positivo, neutro o negativo",
      "respuesta": "La respuesta institucional formal, atenta y útil que el Ayuntamiento de Hueypoxtla debe dar públicamente."
    }
  ]
}
No agregues comentarios fuera del JSON. Devuelve únicamente el JSON válido.`;

      userPrompt = `Publicación oficial: "${text || ''}"\nComentarios provistos: ${comments ? JSON.stringify(comments) : 'Ninguno (Simula comentarios ciudadanos realistas)'}`;
    } 
    else if (action === 'summarize') {
      systemInstruction = `Eres un director de comunicación institucional del H. Ayuntamiento de Hueypoxtla. 
Debes analizar la lista de boletines de prensa publicados durante el mes especificado y generar un reporte ejecutivo consolidado de actividades mensuales para rendición de cuentas.
Analiza los boletines y devuelve SIEMPRE un objeto JSON válido con la siguiente estructura:
{
  "introduccion": "Un párrafo de resumen formal dirigido al cabildo y a la ciudadanía de Hueypoxtla.",
  "logros": [
    {
      "titulo": "Título corto del logro clave",
      "descripcion": "Descripción del avance o actividad basándote en los boletines.",
      "tema": "Tema (ej. Salud, Obras Públicas, Social)"
    }
  ],
  "conclusion": "Un breve párrafo de cierre que reafirme el compromiso de la administración municipal con el bienestar de las familias."
}
No agregues comentarios fuera del JSON. Devuelve únicamente el JSON válido.`;

      userPrompt = `Boletines oficiales publicados: ${JSON.stringify(bulletins || [])}\nMes a sintetizar: "${month || 'Junio 2026'}"`;
    } 
    else {
      return res.status(400).json({ error: 'Acción no soportada.' });
    }

    // Armamos la petición a Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Combinamos las instrucciones del sistema y el prompt del usuario
    const promptContent = `${systemInstruction}\n\n[Petición del Usuario]:\n${userPrompt}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptContent }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Error de la API de Gemini: Código ${geminiRes.status} - ${errText}`);
    }

    const resultData = await geminiRes.json();
    const candidateText = resultData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('La API de Gemini devolvió una respuesta vacía o sin candidatos.');
    }

    // Parsear la respuesta JSON del modelo
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(candidateText.trim());
    } catch (e) {
      console.warn("Gemini didn't return perfect JSON, raw text:", candidateText);
      // Fallback si no regresó JSON perfecto a pesar del responseMimeType
      parsedResponse = { rawText: candidateText };
    }

    return res.status(200).json({ data: parsedResponse });

  } catch (err) {
    console.error("Error in serverless /api/ai handler:", err);
    return res.status(500).json({ error: err.message || 'Error interno del servidor en endpoint de IA.' });
  }
}
