import { LlmAgent, AgentTool, FunctionTool, InMemoryRunner, createEvent } from '@google/adk';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// 1. Inicialización de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Definición de Herramientas de Base de Datos para el Sub-agente Analista
const getMatchesTool = new FunctionTool({
  name: "get_matches",
  description: "Obtiene una lista de todos los partidos registrados (fecha, categoría, goles locales y rivales) en Supabase. Permite filtrar opcionalmente por categoría.",
  parameters: z.object({
    categoria: z.string().optional().describe("Categoría de partido para filtrar (ej. '1ra_fem', '1ra_masc', '5ta_fem', '6ta_fem', '7ma_fem')")
  }),
  execute: async ({ categoria }) => {
    try {
      let query = supabase.from('resumen_partidos').select('*');
      if (categoria) {
        query = query.eq('categoria', categoria);
      }
      const { data, error } = await query.order('partido_fecha', { ascending: false });
      if (error) throw error;
      return JSON.stringify(data);
    } catch (e) {
      return `Error al obtener partidos: ${e.message}`;
    }
  }
});

const getMatchStatsTool = new FunctionTool({
  name: "get_match_stats",
  description: "Obtiene las estadísticas detalladas de cada jugadora para un partido específico filtrado por fecha y categoría.",
  parameters: z.object({
    fecha: z.string().describe("Fecha del partido (ej. 'Fecha 1', 'Fecha 2', 'Amistoso')"),
    categoria: z.string().describe("Categoría del partido (ej. '7ma_fem', '6ta_fem', '5ta_fem', '1ra_fem', '1ra_masc')")
  }),
  execute: async ({ fecha, categoria }) => {
    try {
      const { data, error } = await supabase
        .from('resumen_jugadoras')
        .select('*')
        .eq('partido_fecha', fecha)
        .eq('categoria', categoria);
      if (error) throw error;
      return JSON.stringify(data);
    } catch (e) {
      return `Error al obtener estadísticas de jugadoras: ${e.message}`;
    }
  }
});

const getMatchActionsTool = new FunctionTool({
  name: "get_match_actions",
  description: "Obtiene el historial cronológico detallado de las acciones de juego registradas en un partido (quites, goles, pérdidas, faltas, tarjetas, cambios, etc.) filtrado por fecha y categoría.",
  parameters: z.object({
    fecha: z.string().describe("Fecha del partido (ej. 'Fecha 1', 'Fecha 2')"),
    categoria: z.string().describe("Categoría del partido (ej. '7ma_fem', '6ta_fem', '5ta_fem', '1ra_fem')")
  }),
  execute: async ({ fecha, categoria }) => {
    try {
      const { data, error } = await supabase
        .from('acciones')
        .select('*')
        .eq('partido_fecha', fecha)
        .eq('categoria', categoria)
        .order('minuto', { ascending: true });
      if (error) throw error;
      return JSON.stringify(data);
    } catch (e) {
      return `Error al obtener acciones del partido: ${e.message}`;
    }
  }
});

const getPlayerStatsTool = new FunctionTool({
  name: "get_player_stats",
  description: "Obtiene las estadísticas detalladas de juego (goles, minutos/tiempo jugado, quites, pérdidas, tarjetas, tiros, etc.) de una jugadora filtrando por su nombre (permite búsqueda exacta o parcial case-insensitive). Opcionalmente se puede filtrar por categoría o fecha del partido.",
  parameters: z.object({
    nombre: z.string().describe("Nombre o parte del nombre de la jugadora (ej. 'Manque Gimenes, Catalina', 'Manque', 'Catalina')"),
    categoria: z.string().optional().describe("Categoría opcional (ej. '1ra_fem', '5ta_fem')"),
    fecha: z.string().optional().describe("Fecha/Partido opcional (ej. 'Fecha 1', 'Fecha 2')")
  }),
  execute: async ({ nombre, categoria, fecha }) => {
    try {
      let query = supabase.from('resumen_jugadoras').select('*');
      if (nombre) {
        query = query.ilike('jugadora_nombre', `%${nombre}%`);
      }
      if (categoria) {
        query = query.eq('categoria', categoria);
      }
      if (fecha) {
        query = query.eq('partido_fecha', fecha);
      }
      const { data, error } = await query.order('partido_fecha', { ascending: true });
      if (error) throw error;
      return JSON.stringify(data);
    } catch (e) {
      return `Error al obtener estadísticas de la jugadora: ${e.message}`;
    }
  }
});

const getPlayersTool = new FunctionTool({
  name: "get_players",
  description: "Obtiene la lista de todas las jugadoras registradas en el club, con información de su categoría y categoría secundaria. Permite filtrar opcionalmente por categoría.",
  parameters: z.object({
    categoria: z.string().optional().describe("Categoría opcional para filtrar (ej. '1ra_fem', '5ta_fem', etc.)")
  }),
  execute: async ({ categoria }) => {
    try {
      let query = supabase.from('jugadoras').select('*');
      if (categoria) {
        query = query.or(`categoria.eq.${categoria},categoria_segunda.eq.${categoria}`);
      }
      const { data, error } = await query.order('nombre', { ascending: true });
      if (error) throw error;
      return JSON.stringify(data);
    } catch (e) {
      return `Error al obtener jugadoras: ${e.message}`;
    }
  }
});

// 3. Creación de Sub-agentes
const dataAnalyzer = new LlmAgent({
  name: "data_analyzer",
  description: "Agente especializado en consultar estadísticas, partidos y acciones en la base de datos de Supabase.",
  instruction: `Eres el Analista de Datos de Palihue Hockey. Tu tarea es responder preguntas cuantitativas sobre partidos, goles, quites, pérdidas, tiempos jugados y nóminas de jugadoras utilizando tus herramientas. Extrae la información de Supabase y resume los datos de forma concisa, limpia y estructurada (usa listas o tablas markdown de manera obligatoria cuando reportes listas de partidos, estadísticas de jugadoras o nóminas) para el Coach principal o el usuario.

Reglas críticas de negocio y datos:
1. MAPEADO DE CATEGORÍAS: En la base de datos (Supabase), las categorías se almacenan ESTRICTAMENTE como:
   - '1ra_fem' (Primera Femenina / 1ra Femenina)
   - '5ta_fem' (Quinta Femenina / 5ta Femenina)
   - '6ta_fem' (Sexta Femenina / 6ta Femenina)
   - '7ma_fem' (Séptima Femenina / 7ma Femenina)
   - '1ra_masc' (Primera Masculina / Primera Caballeros)
   Cualquier término coloquial usado por el usuario o el coach principal debe ser traducido a uno de estos valores exactos al llamar a las herramientas de base de datos.
   
2. CÁLCULO DE RESULTADOS DE PARTIDOS: En la tabla 'resumen_partidos', cada registro tiene 'goles_propios_totales' (goles de Palihue) y 'goles_rival_totales' (goles del rival).
   - Si goles_propios_totales > goles_rival_totales: Palihue ganó (Victoria).
   - Si goles_propios_totales < goles_rival_totales: Palihue perdió (Derrota).
   - Si goles_propios_totales == goles_rival_totales: Empate.
   Calcula y reporta siempre el resultado en el formato "Victoria/Derrota/Empate (goles_propios_totales - goles_rival_totales)".
   
3. BÚSQUEDA DE JUGADORAS: Para buscar estadísticas globales de una jugadora (goles, tiempo jugado, tarjetas, quites, pérdidas, etc.) de todos los partidos, utiliza 'get_player_stats' pasando su nombre o parte de él. No exijas fecha ni categoría a menos que el usuario lo haya indicado explícitamente.`,
  model: "gemini-3.1-flash-lite",
  tools: [getMatchesTool, getMatchStatsTool, getMatchActionsTool, getPlayerStatsTool, getPlayersTool]
});

const tacticalExpert = new LlmAgent({
  name: "tactical_expert",
  description: "Agente especializado en táctica de hockey, diagnóstico de rendimiento y consejos estratégicos.",
  instruction: `Eres el Experto Táctico en Hockey de Palihue Hockey. Tu tarea es analizar el rendimiento técnico y táctico de los partidos y proveer recomendaciones estratégicas. Aporta consejos detallados de hockey sobre cómo mejorar salidas (salida de línea, salida en X, salida al medio), cómo disminuir pérdidas, mejorar la eficiencia en cortos (a favor y en contra) y la eficacia de los quites. Sé motivador, constructivo y usa lenguaje técnico apropiado de hockey sobre césped.`,
  model: "gemini-3.1-flash-lite",
  tools: []
});

// 4. Creación del Agente Root (Orquestador)
const coachAgent = new LlmAgent({
  name: "coach_principal",
  description: "Coach principal de Palihue Hockey que ayuda al usuario con el análisis del rendimiento y táctica de los partidos.",
  instruction: `Eres el Coach Principal de Palihue Hockey. Tu rol es conversar amigablemente con el usuario (entrenadores, jugadoras o analistas del club) y ayudarles a comprender las estadísticas de los partidos y mejorar tácticamente.
  
  Tienes dos sub-agentes especializados que puedes consultar o delegarles la tarea:
  1. "data_analyzer": Utilízalo para consultar estadísticas, datos cuantitativos, nóminas de jugadoras o partidos en la base de datos (Supabase). Delegale cualquier pregunta sobre estadísticas, números, goles, minutos, quites, pérdidas, tarjetas, etc., tanto de jugadoras específicas como de partidos o categorías.
  2. "tactical_expert": Utilízalo para pedir análisis tácticos avanzados de hockey, planes de entrenamiento personalizados, diagnóstico de debilidades (como pérdidas en defensa o baja efectividad de cortos) y consejos estratégicos.
  
  Reglas de interacción:
  - Al inicio de la conversación (cuando te saluden o sea el primer turno), preséntate brevemente como el Coach IA de Palihue Hockey. En los siguientes mensajes de la conversación, NUNCA repitas la presentación ni des la bienvenida de nuevo; ve directo al grano respondiendo la pregunta del usuario.
  - Cuando te hagan preguntas estadísticas o cuantitativas (ej. "¿cuántos partidos jugamos?", "rendimiento de una jugadora", "goles y minutos de juego", "quién metió más goles" o "cuántas pérdidas tuvimos"), delega SIEMPRE la consulta al sub-agente "data_analyzer" usando el request correspondiente. No respondas con un saludo genérico ni pidas datos adicionales (como fecha o categoría) si el sub-agente "data_analyzer" puede resolverlo directamente buscando con filtros flexibles.
  - Recuerda traducir términos coloquiales de categorías a sus códigos de base de datos antes de delegar o guiar al analista:
    * "1ra Femenina", "Primera Femenina", "1ra fem" -> '1ra_fem'
    * "5ta Femenina", "Quinta" -> '5ta_fem'
    * "6ta Femenina", "Sexta" -> '6ta_fem'
    * "7ma Femenina", "Séptima" -> '7ma_fem'
    * "1ra Masculina", "Caballeros" -> '1ra_masc'
  - Cuando te hagan preguntas tácticas, de entrenamiento o de mejora, delega al sub-agente "tactical_expert".
  - Responde siempre en español, con un tono profesional, motivador y deportivo.`,
  model: "gemini-3.1-flash-lite",
  tools: [
    new AgentTool({ agent: dataAnalyzer }),
    new AgentTool({ agent: tacticalExpert })
  ]
});

// 5. Instanciación del Runner
const runner = new InMemoryRunner({
  agent: coachAgent,
  appName: "PalihueCoachIA"
});

// Handler Principal para Vercel Serverless Functions
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder a OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  // Verificar la API key de Gemini
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
    console.error("Falta GEMINI_API_KEY en las variables de entorno.");
    return res.status(500).json({
      status: 'error',
      message: 'Falta configurar la variable de entorno GEMINI_API_KEY en tu panel de Vercel o en tu archivo .env local.'
    });
  }

  try {
    const { chatId, message, history } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({ status: 'error', message: 'Faltan parámetros obligatorios (chatId, message).' });
    }

    console.log(`[Vercel Function] Procesando chat: ${chatId}, Mensaje: "${message}"`);
    console.log(`[Vercel Function] Historial recibido (cantidad: ${history ? history.length : 0}):`, JSON.stringify(history));

    // Borrar la sesión previa si existe para evitar duplicar/scrambler el historial en memoria
    try {
      await runner.sessionService.deleteSession({
        appName: runner.appName,
        userId: 'user',
        sessionId: chatId
      });
    } catch (e) {
      // Ignorar si no existe
    }

    // Crear sesión limpia
    const session = await runner.sessionService.createSession({
      appName: runner.appName,
      userId: 'user',
      sessionId: chatId
    });

    // Re-popular el historial acumulado enviado por el cliente con timestamps únicos y crecientes
    if (history && history.length > 0) {
      const baseTime = Date.now() - (history.length * 1000);
      for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        const event = createEvent({
          invocationId: 'historical',
          author: msg.role === 'user' ? 'user' : coachAgent.name,
          content: {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }
        });
        event.timestamp = baseTime + (i * 10);
        await runner.sessionService.appendEvent({ session, event });
      }
    }

    // Ejecutar el agente
    const generator = runner.runAsync({
      userId: 'user',
      sessionId: chatId,
      newMessage: { parts: [{ text: message }] }
    });

    // Consolidar la respuesta y detectar errores
    let responseText = '';
    let apiError = null;

    for await (const ev of generator) {
      console.log('[Vercel Function] Event yielded by runner:', JSON.stringify(ev));
      
      // Capturar errores del runner (ej. cuota excedida 429 u otros fallos)
      if (ev.errorCode) {
        apiError = {
          code: ev.errorCode,
          message: ev.errorMessage || 'Error en la ejecución del agente.'
        };
      }

      if (ev.content && ev.content.parts) {
        for (const part of ev.content.parts) {
          if (part.text && !part.thought) {
            responseText += part.text;
          }
        }
      }
    }

    if (apiError) {
      console.error('[Vercel Function] Error devuelto por el runner:', apiError);
      
      // Si es un error de cuota excedida (429)
      if (apiError.code === '429' || apiError.message.includes('Quota exceeded')) {
        return res.status(429).json({
          status: 'error',
          message: 'Se ha excedido la cuota de la API de Gemini. Por favor, aguarda unos segundos e intenta nuevamente.'
        });
      }

      return res.status(500).json({
        status: 'error',
        message: `Error del asistente: ${apiError.message}`
      });
    }

    console.log('[Vercel Function] Respuesta del Coach obtenida exitosamente.');

    return res.status(200).json({
      status: 'success',
      reply: responseText
    });

  } catch (error) {
    console.error('[Vercel Function] Error procesando la solicitud:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno al procesar la conversación.',
      error: error.message
    });
  }
}

// Exportar herramientas y sub-agentes para testing unitario
export {
  getMatchesTool,
  getMatchStatsTool,
  getMatchActionsTool,
  getPlayerStatsTool,
  getPlayersTool,
  dataAnalyzer,
  tacticalExpert,
  coachAgent
};
