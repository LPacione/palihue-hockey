const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE; // Usamos MONGODB_DB_NAME
const collectionPrefix = process.env.MONGODB_PLAYERS_COLLECTION_PREFIX;


// Cachear el cliente de MongoDB para reutilizar la conexión en Netlify Functions
let cachedClient = null;

async function connectToDatabase() {
    console.log('Attempting to connect to MongoDB...');
    if (cachedClient) {
        console.log('Using cached MongoDB client.');
        // Verificar si el cliente cacheado aún está conectado
        if (cachedClient.topology && cachedClient.topology.isConnected()) {
             console.log('Cached client is connected.');
             return cachedClient;
        } else {
            console.log('Cached client is not connected, attempting to reconnect.');
            cachedClient = null; // Limpiar el cliente no conectado
        }
    }

    console.log('Creating new MongoDB client and connecting...');
    const client = new MongoClient(uri, {
        useNewUrlParser: true, // Deprecated but still common
        useUnifiedTopology: true, // Deprecated but still common
        serverSelectionTimeoutMS: 15000 // Reducir timeout de conexión a 15s para fallar más rápido si hay problemas
    });

    try {
        await client.connect();
        console.log('MongoDB connection successful.');
        cachedClient = client;
        return client;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // Es crucial lanzar el error para que sea capturado y retorne un 500
        throw error;
    }
}

exports.handler = async (event, context) => {
    console.log('getJugadoras function triggered');

    // Asegúrate de que sea un método GET
    if (event.httpMethod !== 'GET') {
        console.log(`Method Not Allowed: ${event.httpMethod}`);
        return {
            statusCode: 405,
            body: JSON.stringify({ status: 'error', message: 'Method Not Allowed' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // Obtener el parámetro de categoría de la query string
    const categoria = event.queryStringParameters.categoria;

    if (!categoria) {
        console.log('Missing categoria parameter.');
        return {
            statusCode: 400,
            body: JSON.stringify({ status: 'error', message: 'Falta el parámetro de categoría.' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // --- CONSTRUIR EL NOMBRE DE LA COLECCIÓN DINÁMICAMENTE ---
    // Limpiamos la categoría y la convertimos a minúsculas para el nombre de la colección
    const cleanCategoria = categoria.trim().toLowerCase();
    const collectionName = `${collectionPrefix}${cleanCategoria}`;
    // --- FIN CONSTRUCCIÓN DINÁMICA ---

    console.log(`Received request for category: ${categoria}`);
    console.log(`Attempting to access database: ${dbName}, collection: ${collectionName}`); // Log the DB and dynamic collection names


    try {
        // Conectar a la base de datos
        const client = await connectToDatabase();
        console.log('Connected client obtained.');

        // Seleccionar la base de datos
        if (!dbName) {
             console.error('MONGODB_DB_NAME environment variable is not set.');
             return {
                statusCode: 500,
                body: JSON.stringify({ status: 'error', message: 'Error de configuración del servidor: Nombre de base de datos no especificado.' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        const database = client.db(dbName);
        console.log(`Database selected: ${database.databaseName}`); // Log the actual database name

        // Seleccionar la colección de jugadoras (usando el nombre dinámico)
        const collection = database.collection(collectionName);
        console.log(`Collection selected: ${collection.collectionName}`); // Log the actual collection name

        // --- EJECUTAR LA CONSULTA SIN FILTRO DE CATEGORÍA ---
        // Si la colección ya es específica de la categoría, no necesitas filtrar por un campo 'categoria'
        const findStartTime = Date.now();
        // Eliminamos el filtro { categoria: categoria.trim() }
        const results = await collection.find({}).limit(10).toArray(); // Recupera todos los documentos de la colección
        const findEndTime = Date.now();
        console.log(`Find query executed in ${findEndTime - findStartTime} ms. Found ${results.length} results.`); // Log tiempo de consulta y resultados


        // Mapear los resultados para devolver solo el nombre (asumiendo campo 'nombre')
        const jugadorasNombres = results
            .map(doc => {
                 return doc.nombre?.toString().trim() || ''; // Usa el campo 'nombre' y asegura que sea string
            })
            .filter(name => name); // Filtra nombres vacíos

        console.log(`Prepared ${jugadorasNombres.length} player names.`);

        // Devolver la respuesta exitosa
        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'success', data: jugadorasNombres }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Ajusta esto a tu dominio en producción
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };

    } catch (error) {
        // Capturar cualquier error que ocurra durante la conexión o la consulta
        console.error('Error in getJugadoras function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ status: 'error', message: 'Error al obtener las jugadoras.', error: error.message }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Ajusta esto a tu dominio en producción
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }
};
