const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const cursoRoutes = require('./routes/curso.routes');
const alumnoRoutes = require('./routes/alumno.routes');
const asignacionRoutes = require('./routes/asignacion.routes');

// Configurar variables de entorno
dotenv.config({ path: './.env/.env' });

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos
const startServer = async () => {
    try {
        // Conectar a MySQL
        await initializeDatabase();
        
        // Rutas
        app.use('/api/auth', authRoutes);
        app.use('/api/cursos', cursoRoutes);
        app.use('/api/alumnos', alumnoRoutes);
        app.use('/api/asignaciones', asignacionRoutes);

        // Ruta base
        app.get('/', (req, res) => {
            res.json({ 
                message: 'API Parcial 2 - Sistema de Gestión de Cursos y Alumnos',
                version: '1.0.0',
                database: 'MySQL',
                endpoints: {
                    auth: '/api/auth',
                    cursos: '/api/cursos',
                    alumnos: '/api/alumnos',
                    asignaciones: '/api/asignaciones'
                }
            });
        });

        // Middleware de manejo de errores
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ message: 'Error interno del servidor' });
        });

        // Middleware para rutas no encontradas
        app.use('*', (req, res) => {
            res.status(404).json({ message: 'Ruta no encontrada' });
        });

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🗄️  Base de datos: MySQL`);
        });

    } catch (error) {
        console.error('❌ Error iniciando el servidor:', error);
        process.exit(1);
    }
};

// Iniciar servidor
startServer();

module.exports = app;