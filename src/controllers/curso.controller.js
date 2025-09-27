const { validationResult } = require('express-validator');
const Curso = require('../models/Curso.model');
const Usuario = require('../models/Usuario.model');
const Asignacion = require('../models/Asignacion.model');

// Crear curso
const crearCurso = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { nombre, codigo, descripcion, creditos, profesor, capacidadMaxima, fechaInicio, fechaFin } = req.body;

        // Verificar si el código ya existe
        const cursoExistente = await Curso.findByCode(codigo);
        if (cursoExistente) {
            return res.status(400).json({
                message: 'Ya existe un curso con este código'
            });
        }

        // Verificar que el profesor existe y tiene el rol correcto
        const profesorUsuario = await Usuario.findById(profesor);
        if (!profesorUsuario || !['profesor', 'admin'].includes(profesorUsuario.role)) {
            return res.status(400).json({
                message: 'El profesor especificado no existe o no tiene permisos'
            });
        }

        const nuevoCurso = await Curso.create({
            nombre,
            codigo,
            descripcion,
            creditos,
            profesor,
            capacidadMaxima,
            fechaInicio,
            fechaFin
        });

        res.status(201).json({
            message: 'Curso creado exitosamente',
            curso: nuevoCurso
        });

    } catch (error) {
        console.error('Error creando curso:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener todos los cursos
const obtenerCursos = async (req, res) => {
    try {
        const { page = 1, limit = 10, activo, profesor, search } = req.query;
        
        // Construir filtros
        const filtros = {};
        if (activo !== undefined) filtros.activo = activo === 'true';
        if (profesor) filtros.profesor = profesor;
        if (search) {
            filtros.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { codigo: { $regex: search, $options: 'i' } },
                { descripcion: { $regex: search, $options: 'i' } }
            ];
        }

        // Paginación
        const skip = (page - 1) * limit;

        const cursos = await Curso.find(filtros)
            .populate('profesor', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Curso.countDocuments(filtros);

        res.json({
            message: 'Cursos obtenidos exitosamente',
            cursos,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error obteniendo cursos:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener curso por ID
const obtenerCursoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const curso = await Curso.findById(id)
            .populate('profesor', 'username email')
            .populate('estudiantesInscritos');

        if (!curso) {
            return res.status(404).json({
                message: 'Curso no encontrado'
            });
        }

        res.json({
            message: 'Curso obtenido exitosamente',
            curso
        });

    } catch (error) {
        console.error('Error obteniendo curso:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar curso
const actualizarCurso = async (req, res) => {
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

        // Si se está actualizando el código, verificar que no exista
        if (actualizaciones.codigo) {
            const cursoExistente = await Curso.findOne({ 
                codigo: actualizaciones.codigo, 
                _id: { $ne: id } 
            });
            if (cursoExistente) {
                return res.status(400).json({
                    message: 'Ya existe un curso con este código'
                });
            }
        }

        // Si se está actualizando el profesor, verificar que existe
        if (actualizaciones.profesor) {
            const profesorUsuario = await Usuario.findById(actualizaciones.profesor);
            if (!profesorUsuario || !['profesor', 'admin'].includes(profesorUsuario.role)) {
                return res.status(400).json({
                    message: 'El profesor especificado no existe o no tiene permisos'
                });
            }
        }

        const cursoActualizado = await Curso.findByIdAndUpdate(
            id,
            actualizaciones,
            { new: true, runValidators: true }
        ).populate('profesor', 'username email');

        if (!cursoActualizado) {
            return res.status(404).json({
                message: 'Curso no encontrado'
            });
        }

        res.json({
            message: 'Curso actualizado exitosamente',
            curso: cursoActualizado
        });

    } catch (error) {
        console.error('Error actualizando curso:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar curso (soft delete)
const eliminarCurso = async (req, res) => {
    try {
        const { id } = req.params;

        const curso = await Curso.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );

        if (!curso) {
            return res.status(404).json({
                message: 'Curso no encontrado'
            });
        }

        // También marcar como inactivas las asignaciones del curso
        await Asignacion.updateMany(
            { curso: id },
            { activo: false }
        );

        res.json({
            message: 'Curso eliminado exitosamente',
            curso
        });

    } catch (error) {
        console.error('Error eliminando curso:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener estudiantes de un curso
const obtenerEstudiantesCurso = async (req, res) => {
    try {
        const { id } = req.params;

        const asignaciones = await Asignacion.find({ curso: id, activo: true })
            .populate('alumno')
            .sort({ fechaAsignacion: -1 });

        res.json({
            message: 'Estudiantes del curso obtenidos exitosamente',
            estudiantes: asignaciones.map(asignacion => ({
                ...asignacion.alumno.toObject(),
                asignacion: {
                    id: asignacion._id,
                    fechaAsignacion: asignacion.fechaAsignacion,
                    estado: asignacion.estado,
                    calificacionFinal: asignacion.calificacionFinal
                }
            }))
        });

    } catch (error) {
        console.error('Error obteniendo estudiantes del curso:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    crearCurso,
    obtenerCursos,
    obtenerCursoPorId,
    actualizarCurso,
    eliminarCurso,
    obtenerEstudiantesCurso
};