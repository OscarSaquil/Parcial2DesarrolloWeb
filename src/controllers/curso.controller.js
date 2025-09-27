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
        
        // Query SQL básica con JOIN para obtener datos del profesor
        let sql = `
            SELECT c.*, u.username as profesor_username, u.email as profesor_email
            FROM cursos c
            LEFT JOIN usuarios u ON c.profesor_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (activo !== undefined) {
            sql += ' AND c.activo = ?';
            params.push(activo === 'true');
        }
        
        if (profesor) {
            sql += ' AND c.profesor_id = ?';
            params.push(parseInt(profesor));
        }
        
        if (search) {
            sql += ' AND (c.nombre LIKE ? OR c.codigo LIKE ? OR c.descripcion LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        const offset = (page - 1) * limit;
        params.push(parseInt(limit), parseInt(offset));

        // Ejecutar consulta
        const { executeQuery } = require('../config/database');
        const cursos = await executeQuery(sql, params);
        
        // Contar total
        let countSql = 'SELECT COUNT(*) as total FROM cursos c WHERE 1=1';
        const countParams = [];
        
        if (activo !== undefined) {
            countSql += ' AND c.activo = ?';
            countParams.push(activo === 'true');
        }
        
        if (profesor) {
            countSql += ' AND c.profesor_id = ?';
            countParams.push(parseInt(profesor));
        }
        
        if (search) {
            countSql += ' AND (c.nombre LIKE ? OR c.codigo LIKE ? OR c.descripcion LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        
        const countResult = await executeQuery(countSql, countParams);
        const total = countResult[0].total;

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

        const sql = `
            SELECT c.*, u.username as profesor_username, u.email as profesor_email
            FROM cursos c
            LEFT JOIN usuarios u ON c.profesor_id = u.id
            WHERE c.id = ? AND c.activo = TRUE
        `;
        
        const { executeQuery } = require('../config/database');
        const result = await executeQuery(sql, [id]);
        
        if (result.length === 0) {
            return res.status(404).json({
                message: 'Curso no encontrado'
            });
        }

        const curso = result[0];

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
            const { executeQuery } = require('../config/database');
            const existeResult = await executeQuery(
                'SELECT COUNT(*) as count FROM cursos WHERE codigo = ? AND id != ? AND activo = TRUE', 
                [actualizaciones.codigo, id]
            );
            
            if (existeResult[0].count > 0) {
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

        const cursoActualizado = await Curso.updateById(id, actualizaciones);

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

        const curso = await Curso.updateById(id, { activo: false });

        if (!curso) {
            return res.status(404).json({
                message: 'Curso no encontrado'
            });
        }

        // También marcar como inactivas las asignaciones del curso
        const { executeQuery } = require('../config/database');
        await executeQuery('UPDATE asignaciones SET activo = FALSE WHERE curso_id = ?', [id]);

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

        const asignaciones = await Asignacion.findByCurso(id);

        res.json({
            message: 'Estudiantes del curso obtenidos exitosamente',
            asignaciones
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