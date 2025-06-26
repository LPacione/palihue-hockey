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

    const { fecha, accionesData, titulares, suplentes, categoria, golesPropios, golesRival } = postData; // Added golesPropios and golesRival

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
    // MODIFICACIÓN: Filtrar 'Gol Rival' para que no se inserte como acción individual
    const actionsToInsert = accionesData.filter(action => action[1] !== "Gol Rival").map(action => {
        // action array structure: [jugadora_nombre, accion_tipo, valor, (descripcionGolRival), (minutoGolRival)]
        if (!action || action.length < 3) {
            console.warn('Skipping invalid action format:', action);
            return null;
        }
        const jugadora_nombre = action[0]?.toString().trim() || '';
        const accion_tipo = action[1]?.toString().trim() || '';
        const valor = action[2] !== undefined && action[2] !== null ? parseFloat(action[2]) : null;
        
        // Determine if it's a time-based action based on action type
        const isTiempoAction = accion_tipo.includes('Sale minuto') || accion_tipo.includes('Entra minuto');
        const minuto = isTiempoAction && valor !== null && !isNaN(valor) ? Math.round(valor) : null;

        // Extract description and minute for 'Gol Rival' specifically (though it's filtered out above)
        // This part of the logic remains in case 'Gol Rival' is needed in 'actions' collection in future.
        const descripcionGolRival = (accion_tipo === "Gol Rival" && action.length > 3) ? action[3]?.toString().trim() : null;
        const minutoGolRival = (accion_tipo === "Gol Rival" && action.length > 4) ? parseFloat(action[4]) : null;


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
            minuto, // Include minute only if it's a time action
            descripcion_gol_rival: descripcionGolRival, // Include for Gol Rival
            minuto_gol_rival: minutoGolRival // Include for Gol Rival
        };
    }).filter(Boolean);
    console.log(`Prepared ${actionsToInsert.length} actions for insertion.`);


    // --- 2. Cálculos para el Resumen ---
    const todasLasJugadoras = new Set([
        ...titulares.filter(j => j?.trim() !== ""),
        ...suplentes.filter(j => j?.trim() !== "")
    ]);
    const tiempoTotalPartido = 60; // Assuming a 60-minute match

    let tiempoJugado = {};
    let tiempoEntrada = {};
    let jugadorasEnCampo = new Set();

    todasLasJugadoras.forEach(j => { tiempoJugado[j] = 0; });
    titulares.forEach(j => {
        if (j?.trim()) {
            jugadorasEnCampo.add(j);
            tiempoEntrada[j] = 0; // Starters enter at minute 0
        }
    });

    // Filter only time-based events (exit/entry) to calculate playing time
    let eventosTiempo = accionesData
        .filter(a => a[1] && (a[1].includes("Sale minuto") || a[1].includes("Entra minuto")))
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
        .sort((a, b) => a.minuto - b.minuto); // Sort by minute to process chronologically

    // Calculate playing time based on time events
    eventosTiempo.forEach(({ jugadora, tipo, minuto }) => {
        if (tipo === "salida") {
            // If the player was on the field and exits
            if (jugadorasEnCampo.has(jugadora)) {
                const entrada = tiempoEntrada[jugadora] ?? 0;
                const jugado = Math.max(minuto - entrada, 0);
                tiempoJugado[jugadora] += jugado;
                jugadorasEnCampo.delete(jugadora);
                delete tiempoEntrada[jugadora]; // Remove entry time as they exited
            } else {
                console.warn(`Advertencia: ${jugadora} salió en min ${minuto} pero no estaba registrada como en campo.`);
            }
        } else { // tipo === "entrada"
            // If the player was not on the field and enters
            if (!jugadorasEnCampo.has(jugadora)) {
                jugadorasEnCampo.add(jugadora);
                tiempoEntrada[jugadora] = minuto; // Register entry minute
            } else {
                 console.warn(`Advertencia: ${jugadora} entró en min ${minuto} pero ya estaba registrada como en campo.`);
            }
        }
    });


    // Sum playing time until the end of the match for players who remained on the field
    jugadorasEnCampo.forEach(j => {
        const entrada = tiempoEntrada[j] ?? 0;
        const jugado = Math.max(tiempoTotalPartido - entrada, 0);
        tiempoJugado[j] += jugado;
    });

    // Add other actions (Goals, Gestures, Cards, Quites, Recuperaciones)
    let accionesAgregadas = {}; // { "Jugadora_Accion": cantidadTotal }
    accionesData
        // Filter actions that are not time-based or 'Gol Rival' (handled separately for total goals)
        .filter(a => a[1] && !a[1].includes("Sale minuto") && !a[1].includes("Entra minuto") && a[1] !== "Gol Rival")
        .forEach(a => {
            if (!a || a.length < 3 || !a[0] || !a[1]) return;
            const [jugadora, accion, valor] = a;
            const key = jugadora.trim() + "_" + accion.trim();
            // Try to use the numeric value if it exists, otherwise use 1 for counting
            const cantidad = parseFloat(valor);
            accionesAgregadas[key] = (accionesAgregadas[key] || 0) + (isNaN(cantidad) ? 1 : cantidad);
        });

    const categoriaCorta = categoria.replace("Jugadoras ", "").trim().toLowerCase(); // Ensure lowercase and without "Jugadoras"
    if (!categoriaCorta) {
        console.error('Invalid category name for summary:', categoria);
        return {
            statusCode: 400,
            body: JSON.stringify({ status: 'error', message: 'Nombre de categoría inválido para resumen.' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // Build the summary collection name
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
            gesto_en_contra: 0,
            tarjeta_amarilla: 0,
            tarjeta_roja: 0,
            tarjeta_verde: 0,
            // --- Nuevos campos para quite y recuperación ---
            quite_positivo: 0,
            quite_negativo: 0,
            recuperacion: 0
            // --- Fin nuevos campos ---
        };

        for (const key in accionesAgregadas) {
            if (key.startsWith(j + "_")) {
                const accion = key.substring(j.length + 1);
                const valor = accionesAgregadas[key];
                switch (accion) {
                    case 'Gol': r.goles += valor; break;
                    case 'Gesto Bloqueo': r.gesto_bloqueo += valor; break;
                    case 'Gesto Flick': r.gesto_flick += valor; break;
                    case 'Gesto Salida Linea': r.gesto_salida_linea += valor; break;
                    case 'Gesto a Favor': r.gesto_a_favor += valor; break;
                    case 'Gesto en Contra': r.gesto_en_contra += valor; break;
                    case 'Tarjeta amarilla': r.tarjeta_amarilla += valor; break;
                    case 'Tarjeta roja': r.tarjeta_roja += valor; break;
                    case 'Tarjeta verde': r.tarjeta_verde += valor; break;
                    // --- Casos para las nuevas acciones ---
                    case 'Quite positivo': r.quite_positivo += valor; break;
                    case 'Quite negativo': r.quite_negativo += valor; break;
                    case 'Recuperación': r.recuperacion += valor; break;
                    // --- Fin casos para nuevas acciones ---
                }
            }
        }

        return r;
    });

    // Handle 'Gol Rival' separately as it's not tied to a specific player's summary
    // You might want to store total goals in a separate match summary document if needed,
    // but for player summaries, it's not directly applicable.
    // The `golesRival` and `golesPropios` received from frontend can be stored in a separate match summary document.
    const matchSummary = {
        partido_fecha: fecha.toString().trim(),
        categoria: categoria.toString().trim(),
        goles_propios_totales: golesPropios,
        goles_rival_totales: golesRival
    };


    console.log(`Prepared ${resumenDataToSave.length} summary documents to save.`);
    // console.log('Summary data to save:', JSON.stringify(resumenDataToSave, null, 2)); // Detailed log of summary data


    // --- 4. Guardar Datos en MongoDB ---
    try {
        const client = await connectToDatabase();
        const db = client.db(dbName);
        console.log(`Connected to database: ${dbName}`);

        // Optional: Insert raw actions
        if (actionsToInsert.length > 0) {
            const actionsCollection = db.collection(actionsCollectionName);
            console.log(`Attempting to insert into actions collection: ${actionsCollectionName}`);
            const insertActionsResult = await actionsCollection.insertMany(actionsToInsert);
            console.log(`Inserted ${insertActionsResult.insertedCount} raw actions.`);
        } else {
            console.log('No raw actions to insert.');
        }

        // Save summary data for each player
        if (resumenDataToSave.length > 0) {
            const resumenCollection = db.collection(resumenTableName);
            console.log(`Attempting bulkWrite into summary collection: ${resumenTableName}`);
            const bulkOps = resumenDataToSave.map(doc => ({
                updateOne: {
                    filter: { partido_fecha: doc.partido_fecha, jugadora_nombre: doc.jugadora_nombre },
                    update: { $set: doc },
                    upsert: true // Insert the document if it doesn't exist, update if it does
                }
            }));
            console.log(`Executing bulkWrite with ${bulkOps.length} operations.`);
            const bulkWriteResult = await resumenCollection.bulkWrite(bulkOps);
            console.log(`Bulk write result: Upserted ${bulkWriteResult.upsertedCount}, Matched ${bulkWriteResult.matchedCount}, Modified ${bulkWriteResult.modifiedCount}`);
            // Check for individual errors in bulkWrite operations
            if (bulkWriteResult.writeErrors && bulkWriteResult.writeErrors.length > 0) {
                console.error('Bulk write errors:', JSON.stringify(bulkWriteResult.writeErrors, null, 2));
            }

        } else {
            console.log('No summary data to save.');
        }

        // Optional: Save match summary with total goals
        const matchSummaryCollectionName = `resumen_partidos`; // A new collection for overall match summaries
        const matchSummaryCollection = db.collection(matchSummaryCollectionName);
        // Using upsert based on fecha and categoria to update or insert the match summary
        await matchSummaryCollection.updateOne(
            { partido_fecha: matchSummary.partido_fecha, categoria: matchSummary.categoria },
            { $set: matchSummary },
            { upsert: true }
        );
        console.log('Match summary saved/updated successfully.');


        // --- 5. Return Success Response ---
        console.log('Save process completed successfully.');
        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'success', message: 'Acciones y resumen guardados correctamente.' }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Adjust this to your domain in production
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };

    } catch (e) {
        // --- Error Handling ---
        console.error("Error inesperado durante el guardado:", e);
        return {
            statusCode: 500,
            body: JSON.stringify({ status: 'error', message: 'Error interno al procesar la solicitud.', error: e.message }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Adjust this to your domain in production
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }
};
