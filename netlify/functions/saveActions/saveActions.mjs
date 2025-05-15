// netlify/functions/saveActions.js
// Esta función de Netlify recibe los datos de un partido, calcula el resumen
// y lo guarda en la colección de resumen_CATEGORIA en MongoDB.

const { MongoClient } = require('mongodb');

// Asegúrate de que estas variables de entorno estén configuradas en el panel de Netlify:
// MONGODB_URI (Tu cadena de conexión a MongoDB Atlas)
// MONGODB_DB_NAME (El nombre de tu base de datos)
// MONGODB_ACTIONS_COLLECTION (Opcional, nombre para la colección de acciones crudas, por defecto 'acciones')
// MONGODB_RESUMEN_COLLECTION_PREFIX (Opcional, prefijo para las colecciones de resumen, por defecto 'resumen_')

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;
// Usar variables de entorno para los nombres de las colecciones es más flexible
const actionsCollectionName = process.env.MONGODB_ACTIONS_COLLECTION || 'acciones';
const resumenCollectionPrefix = process.env.MONGODB_RESUMEN_COLLECTION_PREFIX || 'resumen_';


let cachedClient = null;

// Función para conectar a la base de datos (con cacheo para serverless)
async function connectToDatabase() {
  if (cachedClient) {
      console.log('Usando cliente de MongoDB cacheado.');
      return cachedClient;
  }
  console.log('Conectando a MongoDB...');
  // Opciones recomendadas para MongoClient
  const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout después de 5s si no puede conectar
  });
  try {
      await client.connect();
      console.log('Conexión a MongoDB exitosa.');
      cachedClient = client;
      return client;
  } catch (error) {
      console.error('Error al conectar a MongoDB:', error);
      throw error; // Relanza el error para que sea capturado más arriba
  }
}

// Handler principal de la función de Netlify
exports.handler = async function(event, context) {
  console.log('saveActions function triggered');
  // Asegúrate de que la petición sea POST
  if (event.httpMethod !== 'POST') {
    console.log(`Method Not Allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      body: JSON.stringify({ status: 'error', message: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  let postData;
  try {
    // Parsear el cuerpo de la petición (esperamos JSON)
    postData = JSON.parse(event.body);
    console.log('Request body parsed successfully.');
    // console.log('Parsed body:', JSON.stringify(postData, null, 2)); // Log detallado del cuerpo recibido (cuidado con datos sensibles)
  } catch (error) {
    console.error('Error parsing request body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ status: 'error', message: 'Cuerpo de petición JSON inválido.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const { fecha, accionesData, titulares, suplentes, categoria } = postData;

  // Validar datos obligatorios
  if (!fecha || !accionesData || !categoria || !titulares || !suplentes) {
    console.error('Missing required data:', {
        fecha: !!fecha,
        accionesData: !!accionesData,
        categoria: !!categoria,
        titulares: !!titulares,
        suplentes: !!suplentes
    });
    return {
      statusCode: 400,
      body: JSON.stringify({ status: 'error', message: 'Faltan datos obligatorios para guardar las acciones y generar resumen.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  console.log(`Processing data for Fecha: ${fecha}, Categoria: ${categoria}`);
  console.log(`Received ${accionesData.length} actions.`);
  console.log(`Titulares: ${titulares.length}, Suplentes: ${suplentes.length}`);


  // --- 1. Preparar Datos de Acciones para inserción (opcional, pero útil para historial) ---
  const actionsToInsert = accionesData.map(action => {
    if (!action || action.length < 3) {
        console.warn('Skipping invalid action format:', action);
        return null;
    }
    const jugadora_nombre = action[0]?.toString().trim() || '';
    const accion_tipo = action[1]?.toString().trim() || '';
    const valor = action[2] !== undefined && action[2] !== null ? parseFloat(action[2]) : null;
    const minuto = (accion_tipo.includes('Sale minuto') || accion_tipo.includes('Entra minuto')) && valor !== null && !isNaN(valor) ? Math.round(valor) : null;

    if (!jugadora_nombre || !accion_tipo) {
        console.warn('Skipping action with missing player or action type:', action);
        return null;
    }

    return {
      partido_fecha: fecha.toString().trim(),
      categoria: categoria.toString().trim(),
      jugadora_nombre,
      accion_tipo,
      valor: isNaN(valor) ? null : valor,
      minuto
    };
  }).filter(Boolean);
  console.log(`Prepared ${actionsToInsert.length} actions for insertion.`);


  // --- 2. Cálculos para el Resumen ---
  const todasLasJugadoras = new Set([
    ...titulares.filter(j => j?.trim() !== ""),
    ...suplentes.filter(j => j?.trim() !== "")
  ]);
  const tiempoTotalPartido = 60;

  let tiempoJugado = {};
  let tiempoEntrada = {};
  let jugadorasEnCampo = new Set();

  todasLasJugadoras.forEach(j => { tiempoJugado[j] = 0; });
  titulares.forEach(j => {
    if (j?.trim()) {
      jugadorasEnCampo.add(j);
      tiempoEntrada[j] = 0;
    }
  });

  let eventosTiempo = accionesData
    .filter(a => a[1]?.includes("Sale minuto") || a[1]?.includes("Entra minuto"))
    .map(a => {
      const match = a[1].match(/(\d+)$/);
      const minuto = match ? parseInt(match[1], 10) : NaN;
      return {
        jugadora: a[0]?.trim() || '',
        tipo: a[1].includes("Sale") ? "salida" : "entrada",
        minuto
      };
    })
    .filter(e => e.jugadora && !isNaN(e.minuto) && e.minuto >= 0 && e.minuto <= tiempoTotalPartido)
    .sort((a, b) => a.minuto - b.minuto);

   // Calcular tiempo jugado basado en los eventos de tiempo
    eventosTiempo.forEach(({ jugadora, tipo, minuto }) => {
        if (tipo === "salida") {
            // Si la jugadora estaba en campo y sale
            if (jugadorasEnCampo.has(jugadora)) {
                const entrada = tiempoEntrada[jugadora] ?? 0;
                const jugado = Math.max(minuto - entrada, 0);
                tiempoJugado[jugadora] += jugado;
                jugadorasEnCampo.delete(jugadora); // <-- CORREGIDO: Usar delete directamente con el valor
                delete tiempoEntrada[jugadora];
            } else {
                console.warn(`Advertencia: ${jugadora} salió en min ${minuto} pero no estaba registrada como en campo.`);
            }
        } else { // tipo === "entrada"
            // Si la jugadora no estaba en campo y entra
            if (!jugadorasEnCampo.has(jugadora)) {
                jugadorasEnCampo.add(jugadora);
                tiempoEntrada[jugadora] = minuto;
            } else {
                console.warn(`Advertencia: ${jugadora} entró en min ${minuto} pero ya estaba registrada como en campo.`);
            }
        }
    });


  // Sumar el tiempo jugado hasta el final del partido para las jugadoras que quedaron en campo
  jugadorasEnCampo.forEach(j => {
    const entrada = tiempoEntrada[j] ?? 0;
    const jugado = Math.max(tiempoTotalPartido - entrada, 0);
    tiempoJugado[j] += jugado;
  });

  // Agregar otras acciones (Goles, Gestos)
  let accionesAgregadas = {}; // { "Jugadora_Accion": cantidadTotal }
  accionesData
    // Filtra acciones que no son de tiempo
    .filter(a => a[1] && !a[1].includes("Sale minuto") && !a[1].includes("Entra minuto"))
    .forEach(a => {
      if (!a || a.length < 3 || !a[0] || !a[1]) return;
      const [jugadora, accion, valor] = a;
      const key = jugadora.trim() + "_" + accion.trim();
      // Intenta usar el valor numérico si existe, de lo contrario usa 1 para contar
      const cantidad = parseFloat(valor);
      accionesAgregadas[key] = (accionesAgregadas[key] || 0) + (isNaN(cantidad) ? 1 : cantidad);
    });

  const categoriaCorta = categoria.replace("Jugadoras ", "").trim().toLowerCase();
  if (!categoriaCorta) {
    console.error('Invalid category name for summary:', categoria);
    return {
      statusCode: 400,
      body: JSON.stringify({ status: 'error', message: 'Nombre de categoría inválido para resumen.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const resumenTableName = `${resumenCollectionPrefix}${categoriaCorta}`;
  console.log(`Attempting to save to summary collection: ${resumenTableName}`);

  const resumenDataToSave = Array.from(todasLasJugadoras).map(j => {
    let r = {
      partido_fecha: fecha.toString().trim(),
      jugadora_nombre: j,
      tiempo_jugado: Math.round(tiempoJugado[j] || 0),
      goles: 0,
      gesto_bloqueo: 0,
      gesto_flick: 0,
      gesto_salida_linea: 0,
      gesto_a_favor: 0,
      gesto_en_contra: 0
    };

    for (const key in accionesAgregadas) {
      if (key.startsWith(j + "_")) {
        const accion = key.substring(j.length + 1);
        const valor = accionesAgregadas[key];
        switch (accion) {
          case 'Gol': r.goles += valor; break;
          case 'Gesto Bloqueo': r.gesto_bloqueo += valor; break;
          case 'Gesto Flick': r.gesto_flick += valor; break;
          case 'Gesto Salida Línea': r.gesto_salida_linea += valor; break;
          case 'Gesto a Favor': r.gesto_a_favor += valor; break;
          case 'Gesto en Contra': r.gesto_en_contra += valor; break;
        }
      }
    }

    return r;
  });

  console.log(`Prepared ${resumenDataToSave.length} summary documents to save.`);
  // console.log('Summary data to save:', JSON.stringify(resumenDataToSave, null, 2)); // Log detallado de los datos de resumen


  // --- 4. Guardar Datos en MongoDB ---
  try {
    const client = await connectToDatabase();
    const db = client.db(dbName);
    console.log(`Connected to database: ${dbName}`);

    // Opcional: Insertar las acciones crudas
    if (actionsToInsert.length > 0) {
        const actionsCollection = db.collection(actionsCollectionName);
        console.log(`Attempting to insert into actions collection: ${actionsCollectionName}`);
        const insertActionsResult = await actionsCollection.insertMany(actionsToInsert);
        console.log(`Inserted ${insertActionsResult.insertedCount} raw actions.`);
    } else {
        console.log('No raw actions to insert.');
    }

    // Guardar los datos de resumen
    if (resumenDataToSave.length > 0) {
      const resumenCollection = db.collection(resumenTableName);
      console.log(`Attempting bulkWrite into summary collection: ${resumenTableName}`);
      const bulkOps = resumenDataToSave.map(doc => ({
        updateOne: {
          filter: { partido_fecha: doc.partido_fecha, jugadora_nombre: doc.jugadora_nombre },
          update: { $set: doc },
          upsert: true
        }
      }));
      console.log(`Executing bulkWrite with ${bulkOps.length} operations.`);
      const bulkWriteResult = await resumenCollection.bulkWrite(bulkOps);
      console.log(`Bulk write result: Upserted ${bulkWriteResult.upsertedCount}, Matched ${bulkWriteResult.matchedCount}, Modified ${bulkWriteResult.modifiedCount}`);
      // Verifica si hubo errores individuales en las operaciones del bulkWrite
       if (bulkWriteResult.writeErrors && bulkWriteResult.writeErrors.length > 0) {
           console.error('Bulk write errors:', JSON.stringify(bulkWriteResult.writeErrors, null, 2));
       }

    } else {
        console.log('No summary data to save.');
    }


    // --- 5. Devolver Respuesta de Éxito ---
    console.log('Save process completed successfully.');
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', message: 'Acciones y resumen guardados correctamente.' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Ajusta esto a tu dominio en producción
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };

  } catch (e) {
    // --- Manejo de Errores ---
    console.error("Error inesperado durante el guardado:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error', message: 'Error interno al procesar la solicitud.', error: e.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Ajusta esto a tu dominio en producción
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }
};
