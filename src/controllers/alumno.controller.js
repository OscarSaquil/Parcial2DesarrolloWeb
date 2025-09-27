const { validationResult } = require('express-validator');
const Alumno = require('../models/Alumno.model');
const Asignacion = require('../models/Asignacion.model');

// Crear alumno
const crearAlumno = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { nombre, apellido, email, numeroEstudiantil, telefono, fechaNacimiento, direccion } = req.body;

        // Verificar si el email o número estudiantil ya existen
        const alumnoExistente = await Alumno.existsByEmailOrNumber(email, numeroEstudiantil);

        if (alumnoExistente) {
            return res.status(400).json({
                message: 'Ya existe un alumno con este email o número estudiantil'
            });
        }

        const nuevoAlumno = await Alumno.create({
            nombre,
            apellido,
            email,
            numeroEstudiantil,
            telefono,
            fechaNacimiento,
            direccion
        });

        res.status(201).json({
            message: 'Alumno creado exitosamente',
            alumno: nuevoAlumno
        });

    } catch (error) {
        console.error('Error creando alumno:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todos los alumnos
const obtenerAlumnos = async (req, res) => {
    try {
        // Consulta SQL simple sin filtros complicados
        const sql = 'SELECT * FROM alumnos ORDER BY created_at DESC LIMIT 50';
        
        const { executeQuery } = require('../config/database');
        const alumnos = await executeQuery(sql, []);

        res.json({
            message: 'Alumnos obtenidos exitosamente',
            alumnos
        });

    } catch (error) {
        console.error('Error obteniendo alumnos:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener alumno por ID
const obtenerAlumnoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const alumno = await Alumno.findById(id);

        if (!alumno) {
            return res.status(404).json({
                message: 'Alumno no encontrado'
            });
        }

        res.json({
            message: 'Alumno obtenido exitosamente',
            alumno
        });

    } catch (error) {
        console.error('Error obteniendo alumno:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar alumno
const actualizarAlumno = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const actualizaciones = req.body;

        // Si se está actualizando email o número estudiantil, verificar que no existan
        if (actualizaciones.email || actualizaciones.numeroEstudiantil) {
            const filtros = { _id: { $ne: id } };
            const condiciones = [];
            
            if (actualizaciones.email) {
                condiciones.push({ email: actualizaciones.email });
            }
            if (actualizaciones.numeroEstudiantil) {
                condiciones.push({ numeroEstudiantil: actualizaciones.numeroEstudiantil });
            }
            
            filtros.$or = condiciones;

            const alumnoExistente = await Alumno.findOne(filtros);
            if (alumnoExistente) {
                return res.status(400).json({
                    message: 'Ya existe un alumno con este email o número estudiantil'
                });
            }
        }

        const alumnoActualizado = await Alumno.findByIdAndUpdate(
            id,
            actualizaciones,
            { new: true, runValidators: true }
        );

        if (!alumnoActualizado) {
            return res.status(404).json({
                message: 'Alumno no encontrado'
            });
        }

        res.json({
            message: 'Alumno actualizado exitosamente',
            alumno: alumnoActualizado
        });

    } catch (error) {
        console.error('Error actualizando alumno:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar alumno (soft delete)
const eliminarAlumno = async (req, res) => {
    try {
        const { id } = req.params;

        const alumno = await Alumno.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );

        if (!alumno) {
            return res.status(404).json({
                message: 'Alumno no encontrado'
            });
        }

        // También marcar como inactivas las asignaciones del alumno
        await Asignacion.updateMany(
            { alumno: id },
            { activo: false }
        );

        res.json({
            message: 'Alumno eliminado exitosamente',
            alumno
        });

    } catch (error) {
        console.error('Error eliminando alumno:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener cursos de un alumno
const obtenerCursosAlumno = async (req, res) => {
    try {
        const { id } = req.params;

        const asignaciones = await Asignacion.findByAlumno(id);

        res.json({
            message: 'Cursos del alumno obtenidos exitosamente',
            asignaciones
        });

    } catch (error) {
        console.error('Error obteniendo cursos del alumno:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener historial académico del alumno
const obtenerHistorialAcademico = async (req, res) => {
    try {
        const { id } = req.params;

        const alumno = await Alumno.findById(id);
        if (!alumno) {
            return res.status(404).json({
                message: 'Alumno no encontrado'
            });
        }

        const asignaciones = await Asignacion.findByAlumno(id);

        // Calcular estadísticas
        const estadisticas = {
            totalCursos: asignaciones.length,
            cursosCompletados: asignaciones.filter(a => a.estado === 'completado').length,
            cursosEnCurso: asignaciones.filter(a => a.estado === 'en_curso').length,
            cursosRetirados: asignaciones.filter(a => a.estado === 'retirado').length,
            cursosReprobados: asignaciones.filter(a => a.estado === 'reprobado').length,
            promedioGeneral: 0,
            creditosTotales: 0
        };

        const calificaciones = asignaciones.filter(a => a.calificacionFinal !== undefined);
        if (calificaciones.length > 0) {
            const suma = calificaciones.reduce((acc, a) => acc + a.calificacionFinal, 0);
            estadisticas.promedioGeneral = parseFloat((suma / calificaciones.length).toFixed(2));
            estadisticas.creditosTotales = calificaciones
                .filter(a => a.calificacionFinal >= 60)
                .reduce((acc, a) => acc + a.curso.creditos, 0);
        }

        res.json({
            message: 'Historial académico obtenido exitosamente',
            alumno: {
                id: alumno._id,
                nombreCompleto: alumno.nombreCompleto,
                numeroEstudiantil: alumno.numeroEstudiantil,
                email: alumno.email
            },
            estadisticas,
            historial: asignaciones
        });

    } catch (error) {
        console.error('Error obteniendo historial académico:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    crearAlumno,
    obtenerAlumnos,
    obtenerAlumnoPorId,
    actualizarAlumno,
    eliminarAlumno,
    obtenerCursosAlumno,
    obtenerHistorialAcademico
};