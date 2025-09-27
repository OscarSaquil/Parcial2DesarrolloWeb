const mysql = require('mysql2/promise');

// Configuración de la conexión
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'oscar',
    password: process.env.DB_PASSWORD || '20014757',
    database: process.env.DB_NAME || 'parcial2_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Pool de conexiones
let pool;

const initializeDatabase = async () => {
    try {
        // Crear pool de conexiones
        pool = mysql.createPool(dbConfig);
        
        console.log('✅ Pool de conexiones MySQL creado correctamente');
        
        // Probar la conexión
        const connection = await pool.getConnection();
        console.log('✅ Conectado a MySQL correctamente');
        connection.release();
        
        return pool;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        throw error;
    }
};

// Función para obtener el pool
const getPool = () => {
    if (!pool) {
        throw new Error('Base de datos no inicializada. Llama a initializeDatabase() primero.');
    }
    return pool;
};

// Función para ejecutar queries
const executeQuery = async (sql, params = []) => {
    try {
        const pool = getPool();
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Error ejecutando query:', error.message);
        throw error;
    }
};

// Función para cerrar la conexión
const closeConnection = async () => {
    if (pool) {
        await pool.end();
        console.log('Conexión a MySQL cerrada');
    }
};

module.exports = {
    initializeDatabase,
    getPool,
    executeQuery,
    closeConnection,
    dbConfig
};