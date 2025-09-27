const express = require('express');
const router = express.Router();

const {
    crearAlumno,
    obtenerAlumnos,
    obtenerAlumnoPorId,
    actualizarAlumno,
    eliminarAlumno,
    obtenerCursosAlumno,
    obtenerHistorialAcademico
} = require('../controllers/alumno.controller');

const {
    validarCrearAlumno,
    validarActualizarAlumno,
    validarId
} = require('../validators/alumno.validator');

const {
    verificarToken,
    esAdmin,
    esProfesorOAdmin,
    esPropietarioOAdmin
} = require('../middlewares/auth.middleware');

// Rutas protegidas - Administradores pueden gestionar todos los alumnos
router.get('/', verificarToken, esProfesorOAdmin, obtenerAlumnos);
router.post('/', verificarToken, esAdmin, validarCrearAlumno, crearAlumno);
router.get('/:id', verificarToken, validarId, obtenerAlumnoPorId);
router.put('/:id', verificarToken, esAdmin, validarId, validarActualizarAlumno, actualizarAlumno);
router.delete('/:id', verificarToken, esAdmin, validarId, eliminarAlumno);

// Rutas específicas para información académica
router.get('/:id/cursos', verificarToken, esProfesorOAdmin, validarId, obtenerCursosAlumno);
router.get('/:id/historial', verificarToken, esProfesorOAdmin, validarId, obtenerHistorialAcademico);

module.exports = router;