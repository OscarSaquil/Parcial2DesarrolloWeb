const { validationResult } = require('express-validator');
const Asignacion = require('../models/Asignacion.model');
const Alumno = require('../models/Alumno.model');
const Curso = require('../models/Curso.model');

// Asignar estudiante a un curso
const asignarEstudianteACurso = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { alumno, curso } = req.body;

        // Verificar que el alumno existe y está activo
        const alumnoExiste = await Alumno.findById(alumno);
        if (!alumnoExiste || !alumnoExiste.activo) {
            return res.status(404).json({
                message: 'Alumno no encontrado o inactivo'
            });
        }

        // Verificar que el curso existe y está activo
        const cursoExiste = await Curso.findById(curso);
        if (!cursoExiste || !cursoExiste.activo) {
            return res.status(404).json({
                message: 'Curso no encontrado o inactivo'
            });
        }

        // Verificar que el curso no haya terminado
        if (new Date() > cursoExiste.fechaFin) {
            return res.status(400).json({
                message: 'No se puede inscribir a un curso que ya ha terminado'
            });
        }

        // Verificar si ya existe una asignación activa
        const asignacionExistente = await Asignacion.findByAlumnoAndCurso(alumno, curso);

        if (asignacionExistente && asignacionExistente.activo) {
            return res.status(400).json({
                message: 'El estudiante ya está inscrito en este curso'
            });
        }

        // Verificar capacidad del curso
        const estudiantesInscritos = await Asignacion.countStudentsInCourse(curso);

        if (estudiantesInscritos >= cursoExiste.capacidadMaxima) {
            return res.status(400).json({
                message: 'El curso ha alcanzado su capacidad máxima'
            });
        }

        // Crear nueva asignación
        const nuevaAsignacion = await Asignacion.create({
            alumno,
            curso,
            estado: new Date() >= new Date(cursoExiste.fechaInicio) ? 'en_curso' : 'inscrito'
        });

        res.status(201).json({
            message: 'Estudiante asignado al curso exitosamente',
            asignacion: nuevaAsignacion
        });

    } catch (error) {
        console.error('Error asignando estudiante a curso:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Desasignar estudiante de un curso
const desasignarEstudianteDeCurso = async (req, res) => {
    try {
        const { id } = req.params;

        const asignacion = await Asignacion.findById(id)
            .populate('alumno', 'nombre apellido email')
            .populate('curso', 'nombre codigo');

        if (!asignacion || !asignacion.activo) {
            return res.status(404).json({
                message: 'Asignación no encontrada'
            });
        }

        // Cambiar estado a retirado en lugar de eliminar
        const asignacionActualizada = await Asignacion.updateById(asignacion.id, {
            estado: 'retirado',
            activo: false
        });

        res.json({
            message: 'Estudiante desasignado del curso exitosamente',
            asignacion: asignacionActualizada
        });

    } catch (error) {
        console.error('Error desasignando estudiante de curso:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todas las asignaciones
const obtenerAsignaciones = async (req, res) => {
    try {
        const { page = 1, limit = 10, alumno, curso, estado, activo } = req.query;
        
        // Construir filtros para MySQL
        const filtros = {};
        if (alumno) filtros.alumno = alumno;
        if (curso) filtros.curso = curso;
        if (estado) filtros.estado = estado;
        if (activo !== undefined) filtros.activo = activo === 'true';

        // Paginación
        const offset = (page - 1) * limit;
        filtros.limit = parseInt(limit);
        filtros.offset = offset;

        const asignaciones = await Asignacion.findAll(filtros);
        const total = await Asignacion.count(filtros);

        res.json({
            message: 'Asignaciones obtenidas exitosamente',
            asignaciones,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error obteniendo asignaciones:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener asignación por ID
const obtenerAsignacionPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const asignacion = await Asignacion.findById(id)
            .populate('alumno')
            .populate('curso');

        if (!asignacion) {
            return res.status(404).json({
                message: 'Asignación no encontrada'
            });
        }

        res.json({
            message: 'Asignación obtenida exitosamente',
            asignacion
        });

    } catch (error) {
        console.error('Error obteniendo asignación:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar asignación (cambiar estado, calificación, etc.)
const actualizarAsignacion = async (req, res) => {
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

        const asignacion = await Asignacion.findById(id);
        if (!asignacion) {
            return res.status(404).json({
                message: 'Asignación no encontrada'
            });
        }

        // Validaciones específicas según el estado
        if (actualizaciones.estado === 'completado' && !actualizaciones.calificacionFinal && !asignacion.calificacionFinal) {
            return res.status(400).json({
                message: 'Se requiere una calificación final para marcar el curso como completado'
            });
        }

        // Si se proporciona calificación final, determinar automáticamente el estado
        if (actualizaciones.calificacionFinal !== undefined) {
            if (actualizaciones.calificacionFinal >= 60) {
                actualizaciones.estado = 'completado';
                actualizaciones.fechaCompletado = new Date();
            } else {
                actualizaciones.estado = 'reprobado';
            }
        }

        const asignacionActualizada = await Asignacion.findByIdAndUpdate(
            id,
            actualizaciones,
            { new: true, runValidators: true }
        ).populate([
            { path: 'alumno', select: 'nombre apellido email numeroEstudiantil' },
            { path: 'curso', select: 'nombre codigo profesor' }
        ]);

        res.json({
            message: 'Asignación actualizada exitosamente',
            asignacion: asignacionActualizada
        });

    } catch (error) {
        console.error('Error actualizando asignación:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Calificar estudiante
const calificarEstudiante = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { calificacionFinal, comentarios } = req.body;

        const asignacion = await Asignacion.findById(id)
            .populate('alumno', 'nombre apellido email')
            .populate('curso', 'nombre codigo');

        if (!asignacion) {
            return res.status(404).json({
                message: 'Asignación no encontrada'
            });
        }

        // Determinar estado basado en la calificación
        const nuevoEstado = calificacionFinal >= 60 ? 'completado' : 'reprobado';
        const fechaCompletado = nuevoEstado === 'completado' ? new Date() : null;

        const datosActualizacion = {
            calificacionFinal,
            estado: nuevoEstado,
            fechaCompletado
        };
        
        if (comentarios) datosActualizacion.comentarios = comentarios;

        const asignacionActualizada = await Asignacion.updateById(asignacion.id, datosActualizacion);

        res.json({
            message: `Estudiante ${nuevoEstado === 'completado' ? 'aprobado' : 'reprobado'} exitosamente`,
            asignacion: asignacionActualizada
        });

    } catch (error) {
        console.error('Error calificando estudiante:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener reporte de asignaciones
const obtenerReporteAsignaciones = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, curso, estado } = req.query;

        // Construir filtros
        const filtros = {};
        if (fechaInicio || fechaFin) {
            filtros.fechaAsignacion = {};
            if (fechaInicio) filtros.fechaAsignacion.$gte = new Date(fechaInicio);
            if (fechaFin) filtros.fechaAsignacion.$lte = new Date(fechaFin);
        }
        if (curso) filtros.curso = curso;
        if (estado) filtros.estado = estado;

        const asignaciones = await Asignacion.findAll(filtros);

        // Calcular estadísticas
        const estadisticas = {
            totalAsignaciones: asignaciones.length,
            porEstado: {},
            promedioCalificaciones: 0,
            estudiantesUnicos: new Set(asignaciones.map(a => a.alumno_id)).size,
            cursosUnicos: new Set(asignaciones.map(a => a.curso_id)).size
        };

        // Contar por estado
        asignaciones.forEach(asignacion => {
            const estado = asignacion.estado;
            estadisticas.porEstado[estado] = (estadisticas.porEstado[estado] || 0) + 1;
        });

        // Calcular promedio de calificaciones
        const asignacionesConCalificacion = asignaciones.filter(a => a.calificacionFinal !== undefined);
        if (asignacionesConCalificacion.length > 0) {
            const suma = asignacionesConCalificacion.reduce((acc, a) => acc + a.calificacionFinal, 0);
            estadisticas.promedioCalificaciones = parseFloat((suma / asignacionesConCalificacion.length).toFixed(2));
        }

        res.json({
            message: 'Reporte de asignaciones generado exitosamente',
            estadisticas,
            asignaciones
        });

    } catch (error) {
        console.error('Error generando reporte de asignaciones:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    asignarEstudianteACurso,
    desasignarEstudianteDeCurso,
    obtenerAsignaciones,
    obtenerAsignacionPorId,
    actualizarAsignacion,
    calificarEstudiante,
    obtenerReporteAsignaciones
};