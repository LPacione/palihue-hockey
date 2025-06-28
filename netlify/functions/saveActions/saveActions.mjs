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
        // Verificar si el cliente cacheado aún está conectado
        if (cachedClient.topology && cachedClient.topology.isConnected()) {
             console.log('El cliente cacheado está conectado.');
             return cachedClient;
        } else {
            console.log('El cliente cacheado no está conectado, intentando reconectar.');
            cachedClient = null; // Limpiar el cliente no conectado
        }
    }

    console.log('Creando nuevo cliente de MongoDB y conectando...');
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000 // Reducir timeout de conexión a 15s para fallar más rápido si hay problemas
    });

    try {
        await client.connect();
        console.log('Conexión a MongoDB exitosa.');
        cachedClient = client;
        return client;
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        // Es crucial lanzar el error para que sea capturado y retorne un 500
        throw error;
    }
}

// Handler principal de la función de Netlify
exports.handler = async function(event, context) {
    console.log('saveActions function triggered');
    // Asegúrate de que la petición sea POST
    if (event.httpMethod !== 'POST') {
        console.log(`Método no permitido: ${event.httpMethod}`);
        return {
            statusCode: 405,
            body: JSON.stringify({ status: 'error', message: 'Método no permitido' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    let postData;
    try {
        // Parsear el cuerpo de la petición (esperamos JSON)
        postData = JSON.parse(event.body);
        console.log('Cuerpo de la petición parseado exitosamente.');
        // console.log('Parsed body:', JSON.stringify(postData, null, 2)); // Log detallado del cuerpo recibido (cuidado con datos sensibles)
    } catch (error) {
        console.error('Error al parsear el cuerpo de la petición:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ status: 'error', message: 'Cuerpo de petición JSON inválido.' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    const { fecha, accionesData, titulares, suplentes, categoria, golesPropios, golesRival } = postData;

    // Validar datos obligatorios
    if (!fecha || !accionesData || !categoria || !titulares || !suplentes || golesPropios === undefined || golesRival === undefined) {
        console.error('Faltan datos obligatorios:', {
            fecha: !!fecha,
            accionesData: !!accionesData,
            categoria: !!categoria,
            titulares: !!titulares,
            suplentes: !!suplentes,
            golesPropios: golesPropios !== undefined,
            golesRival: golesRival !== undefined
        });
        return {
            statusCode: 400,
            body: JSON.stringify({ status: 'error', message: 'Faltan datos obligatorios para guardar las acciones y generar resumen.' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    console.log(`Procesando datos para Fecha: ${fecha}, Categoría: ${categoria}`);
    console.log(`Acciones recibidas: ${accionesData.length}. Goles Propios: ${golesPropios}, Goles Rival: ${golesRival}`);
    console.log(`Titulares: ${titulares.length}, Suplentes: ${suplentes.length}`);


    // --- 1. Preparar Datos de Acciones para inserción (útil para historial) ---
    // Filtra 'Gol Rival' para que no se inserte como acción individual de jugadora
    const actionsToInsert = accionesData.filter(action => action[1] !== "Gol Rival").map(action => {
        // action array structure: [jugadora_nombre, accion_tipo, valor]
        if (!action || action.length < 3) {
            console.warn('Saltando formato de acción inválido:', action);
            return null;
        }
        const jugadora_nombre = action[0]?.toString().trim() || '';
        const accion_tipo = action[1]?.toString().trim() || '';
        const valor = action[2] !== undefined && action[2] !== null ? parseFloat(action[2]) : null;
        
        // Determinar si es una acción basada en tiempo (salida/entrada)
        const isTiempoAction = accion_tipo.includes('Sale minuto') || accion_tipo.includes('Entra minuto');
        const minuto = isTiempoAction && valor !== null && !isNaN(valor) ? Math.round(valor) : null;

        if (!jugadora_nombre || !accion_tipo) {
            console.warn('Saltando acción sin jugadora o tipo de acción:', action);
            return null;
        }

        return {
            partido_fecha: fecha.toString().trim(), // Asegura que la fecha sea string y sin espacios
            categoria: categoria.toString().trim(), // Asegura que la categoría sea string y sin espacios
            jugadora_nombre,
            accion_tipo,
            valor: isNaN(valor) ? null : valor, // Guarda null si no es un número válido
            minuto // Incluye minuto solo si es una acción de tiempo
        };
    }).filter(Boolean); // Elimina los elementos 'null' resultantes de acciones inválidas
    console.log(`Acciones preparadas para inserción: ${actionsToInsert.length}.`);


    // --- 2. Cálculos para el Resumen ---
    const todasLasJugadoras = new Set([
        ...titulares.filter(j => j?.trim() !== ""), // Filtra nombres vacíos o nulos
        ...suplentes.filter(j => j?.trim() !== "")
    ]);
    const tiempoTotalPartido = 60; // Asumiendo un partido de 60 minutos

    let tiempoJugado = {};
    let tiempoEntrada = {}; // Para rastrear cuándo entró cada jugadora
    let jugadorasEnCampo = new Set(); // Para rastrear quién está actualmente en el campo

    // Inicializar tiempo jugado a 0 para todas las jugadoras
    todasLasJugadoras.forEach(j => { tiempoJugado[j] = 0; });

    // Inicializar jugadoras en campo y su tiempo de entrada (minuto 0)
    titulares.forEach(j => {
        if (j?.trim()) {
            jugadorasEnCampo.add(j);
            tiempoEntrada[j] = 0; // Asume que los titulares entran en el minuto 0
        }
    });

    // Procesar eventos de entrada y salida ordenados por minuto
    let eventosTiempo = accionesData
        .filter(a => a[1] && (a[1].includes("Sale minuto") || a[1].includes("Entra minuto"))) // Filtra solo acciones de tiempo
        .map(a => {
            const match = a[1].match(/(\d+)$/);
            const minuto = match ? parseInt(match[1], 10) : NaN;
            return {
                jugadora: a[0]?.trim() || '',
                tipo: a[1].includes("Sale") ? "salida" : "entrada",
                minuto
            };
        })
        // Filtra eventos inválidos (jugadora vacía, minuto no numérico o fuera de rango)
        .filter(e => e.jugadora && !isNaN(e.minuto) && e.minuto >= 0 && e.minuto <= tiempoTotalPartido)
        .sort((a, b) => a.minuto - b.minuto); // Ordena por minuto para procesar cronológicamente

    // Calcular tiempo jugado basado en los eventos de tiempo
    eventosTiempo.forEach(({ jugadora, tipo, minuto }) => {
        if (tipo === "salida") {
            // Si la jugadora estaba en campo y sale
            if (jugadorasEnCampo.has(jugadora)) {
                const entrada = tiempoEntrada[jugadora] ?? 0;
                const jugado = Math.max(minuto - entrada, 0);
                tiempoJugado[jugadora] += jugado;
                jugadorasEnCampo.delete(jugadora); // La jugadora ya no está en campo
                delete tiempoEntrada[jugadora]; // Elimina su tiempo de entrada
            } else {
                console.warn(`Advertencia: ${jugadora} salió en el min ${minuto} pero no estaba registrada como en campo.`);
            }
        } else { // tipo === "entrada"
            // Si la jugadora no estaba en campo y entra
            if (!jugadorasEnCampo.has(jugadora)) {
                jugadorasEnCampo.add(jugadora); // La jugadora ahora está en campo
                tiempoEntrada[jugadora] = minuto; // Registra su tiempo de entrada
            } else {
                console.warn(`Advertencia: ${jugadora} entró en el min ${minuto} pero ya estaba registrada como en campo.`);
            }
        }
    });

    // Sumar el tiempo jugado hasta el final del partido para las jugadoras que quedaron en campo
    jugadorasEnCampo.forEach(j => {
        const entrada = tiempoEntrada[j] ?? 0;
        const jugado = Math.max(tiempoTotalPartido - entrada, 0);
        tiempoJugado[j] += jugado;
    });

    // Agregar otras acciones (Goles, Gestos, Tarjetas, Quites, Recuperaciones, Faltas, Perdidas, Cortos, Tiro al arco)
    let accionesAgregadas = {}; // { "Jugadora_Accion": cantidadTotal }
    accionesData
        // Filtra acciones que no son de tiempo ni 'Gol Rival' (ya manejado por golesRival)
        .filter(a => a[1] && !a[1].includes("Sale minuto") && !a[1].includes("Entra minuto") && a[1] !== "Gol Rival")
        .forEach(a => {
            if (!a || a.length < 3 || !a[0] || !a[1]) return;
            const [jugadora, accion, valor] = a;
            const key = jugadora.trim() + "_" + accion.trim();
            // Intenta usar el valor numérico si existe, de lo contrario usa 1 para contar
            const cantidad = parseFloat(valor);
            accionesAgregadas[key] = (accionesAgregadas[key] || 0) + (isNaN(cantidad) ? 1 : cantidad);
        });

    const categoriaCorta = categoria.replace("Jugadoras ", "").trim().toLowerCase(); // Asegura minúsculas y sin "Jugadoras"
    if (!categoriaCorta) {
        console.error('Nombre de categoría inválido para resumen:', categoria);
        return {
            statusCode: 400,
            body: JSON.stringify({ status: 'error', message: 'Nombre de categoría inválido para resumen.' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // Construir el nombre de la colección de resumen
    const resumenTableName = `${resumenCollectionPrefix}${categoriaCorta}`;
    console.log(`Intentando guardar en la colección de resumen: ${resumenTableName}`);

    const resumenDataToSave = Array.from(todasLasJugadoras).map(j => {
        let r = {
            partido_fecha: fecha.toString().trim(),
            jugadora_nombre: j,
            tiempo_jugado: Math.round(tiempoJugado[j] || 0),
            goles: 0,
            gesto_bloqueo: 0,
            gesto_flick: 0,
            gesto_salida_linea: 0,
            gesto_salida_x: 0, // Nuevo campo
            gesto_salida_al_medio: 0, // Nuevo campo
            tarjeta_amarilla: 0,
            tarjeta_roja: 0,
            tarjeta_verde: 0,
            quite_positivo: 0,
            quite_negativo: 0,
            recuperacion: 0,
            falta_dentro_area: 0, // Nuevo campo
            falta_fuera_area: 0, // Nuevo campo
            falta_recibida: 0, // Nuevo campo
            perdida_antes_mitad_cancha: 0, // Nuevo campo
            perdida_antes_23: 0, // Nuevo campo
            perdida_despues_23: 0, // Nuevo campo
            corto_a_favor: 0, // Nuevo campo
            corto_en_contra: 0, // Nuevo campo
            tiro_al_arco: 0 // Nuevo campo
        };

        for (const key in accionesAgregadas) {
            if (key.startsWith(j + "_")) {
                const accion = key.substring(j.length + 1); // Extrae el nombre de la acción
                const valor = accionesAgregadas[key]; // Obtiene la cantidad agregada

                switch (accion) {
                    case 'Gol': r.goles += valor; break;
                    case 'Gesto Bloqueo': r.gesto_bloqueo += valor; break;
                    case 'Gesto Flick': r.gesto_flick += valor; break;
                    case 'Gesto Salida Linea': r.gesto_salida_linea += valor; break;
                    case 'Gesto Salida X': r.gesto_salida_x += valor; break; // Nuevo caso
                    case 'Gesto Salida al medio': r.gesto_salida_al_medio += valor; break; // Nuevo caso
                    case 'Tarjeta amarilla': r.tarjeta_amarilla += valor; break;
                    case 'Tarjeta roja': r.tarjeta_roja += valor; break;
                    case 'Tarjeta verde': r.tarjeta_verde += valor; break;
                    case 'Quite positivo': r.quite_positivo += valor; break;
                    case 'Quite negativo': r.quite_negativo += valor; break;
                    case 'Recuperación': r.recuperacion += valor; break;
                    case 'Falta dentro del area': r.falta_dentro_area += valor; break; // Nuevo caso
                    case 'Falta fuera del area': r.falta_fuera_area += valor; break; // Nuevo caso
                    case 'Falta recibida': r.falta_recibida += valor; break; // Nuevo caso
                    case 'Perdida antes de mitad de cancha': r.perdida_antes_mitad_cancha += valor; break; // Nuevo caso
                    case 'Perdida antes de 23': r.perdida_antes_23 += valor; break; // Nuevo caso
                    case 'Perdida despues de 23': r.perdida_despues_23 += valor; break; // Nuevo caso
                    case 'Corto a Favor': r.corto_a_favor += valor; break; // Nuevo caso
                    case 'Corto en Contra': r.corto_en_contra += valor; break; // Nuevo caso
                    case 'Tiro al arco': r.tiro_al_arco += valor; break; // Nuevo caso
                }
            }
        }
        return r;
    });

    // Manejar el resumen total del partido (goles propios y rivales)
    const matchSummary = {
        partido_fecha: fecha.toString().trim(),
        categoria: categoria.toString().trim(),
        goles_propios_totales: golesPropios,
        goles_rival_totales: golesRival
    };


    console.log(`Documentos de resumen preparados para guardar: ${resumenDataToSave.length}.`);
    // console.log('Summary data to save:', JSON.stringify(resumenDataToSave, null, 2)); // Log detallado de los datos de resumen


    // --- 4. Guardar Datos en MongoDB ---
    try {
        const client = await connectToDatabase();
        console.log(`Valor de dbName de la variable de entorno: ${dbName}`);
        const db = client.db(dbName); // Usando la variable dbName aquí
        console.log(`Conectado a la base de datos: ${db.databaseName}`); // Log del nombre real de la base de datos conectada


        // Opcional: Insertar las acciones crudas
        if (actionsToInsert.length > 0) {
            const actionsCollection = db.collection(actionsCollectionName);
            console.log(`Intentando insertar en la colección de acciones: ${actionsCollectionName}`);
            const insertActionsResult = await actionsCollection.insertMany(actionsToInsert);
            console.log(`Insertadas ${insertActionsResult.insertedCount} acciones crudas.`);
        } else {
            console.log('No hay acciones crudas para insertar.');
        }

        // Guardar los datos de resumen de cada jugadora
        if (resumenDataToSave.length > 0) {
            const resumenCollection = db.collection(resumenTableName);
            console.log(`Intentando bulkWrite en la colección de resumen: ${resumenTableName}`);
            const bulkOps = resumenDataToSave.map(doc => ({
                updateOne: {
                    filter: { partido_fecha: doc.partido_fecha, jugadora_nombre: doc.jugadora_nombre },
                    update: { $set: doc },
                    upsert: true // Inserta el documento si no existe, actualiza si sí
                }
            }));
            console.log(`Ejecutando bulkWrite con ${bulkOps.length} operaciones.`);
            const bulkWriteResult = await resumenCollection.bulkWrite(bulkOps);
            console.log(`Resultado del bulk write: Insertados ${bulkWriteResult.upsertedCount}, Coincidencias ${bulkWriteResult.matchedCount}, Modificados ${bulkWriteResult.modifiedCount}`);
            // Verifica si hubo errores individuales en las operaciones del bulkWrite
            if (bulkWriteResult.writeErrors && bulkWriteResult.writeErrors.length > 0) {
                console.error('Errores de bulk write:', JSON.stringify(bulkWriteResult.writeErrors, null, 2));
            }

        } else {
            console.log('No hay datos de resumen para guardar.');
        }

        // Guardar el resumen total del partido (goles propios y rivales)
        const matchSummaryCollectionName = `resumen_partidos`; // Una nueva colección para resúmenes generales de partidos
        const matchSummaryCollection = db.collection(matchSummaryCollectionName);
        // Usando upsert basado en fecha y categoría para actualizar o insertar el resumen del partido
        await matchSummaryCollection.updateOne(
            { partido_fecha: matchSummary.partido_fecha, categoria: matchSummary.categoria },
            { $set: matchSummary },
            { upsert: true }
        );
        console.log('Resumen del partido guardado/actualizado exitosamente.');


        // --- 5. Devolver Respuesta de Éxito ---
        console.log('Proceso de guardado completado exitosamente.');
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
