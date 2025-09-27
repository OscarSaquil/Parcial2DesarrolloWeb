const express = require('express');
const router = express.Router();

const {
    crearCurso,
    obtenerCursos,
    obtenerCursoPorId,
    actualizarCurso,
    eliminarCurso,
    obtenerEstudiantesCurso
} = require('../controllers/curso.controller');

const {
    validarCrearCurso,
    validarActualizarCurso,
    validarId
} = require('../validators/curso.validator');

const {
    verificarToken,
    esAdmin,
    esProfesorOAdmin
} = require('../middlewares/auth.middleware');

// Rutas públicas (para consultar cursos disponibles)
router.get('/', obtenerCursos);
router.get('/:id', validarId, obtenerCursoPorId);

// Rutas protegidas - Solo profesores y admins pueden gestionar cursos
router.post('/', verificarToken, esProfesorOAdmin, validarCrearCurso, crearCurso);
router.put('/:id', verificarToken, esProfesorOAdmin, validarId, validarActualizarCurso, actualizarCurso);
router.delete('/:id', verificarToken, esAdmin, validarId, eliminarCurso);

// Rutas para gestión de estudiantes en cursos
router.get('/:id/estudiantes', verificarToken, esProfesorOAdmin, validarId, obtenerEstudiantesCurso);

module.exports = router;