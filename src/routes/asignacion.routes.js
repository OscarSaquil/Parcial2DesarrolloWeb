const express = require('express');
const router = express.Router();

const {
    asignarEstudianteACurso,
    desasignarEstudianteDeCurso,
    obtenerAsignaciones,
    obtenerAsignacionPorId,
    actualizarAsignacion,
    calificarEstudiante,
    obtenerReporteAsignaciones
} = require('../controllers/asignacion.controller');

const {
    validarCrearAsignacion,
    validarActualizarAsignacion,
    validarCalificarEstudiante,
    validarId
} = require('../validators/asignacion.validator');

const {
    verificarToken,
    esAdmin,
    esProfesorOAdmin
} = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas principales
router.get('/', esProfesorOAdmin, obtenerAsignaciones);
router.post('/', esProfesorOAdmin, validarCrearAsignacion, asignarEstudianteACurso);
router.get('/reporte', esAdmin, obtenerReporteAsignaciones);

// Rutas por ID
router.get('/:id', validarId, obtenerAsignacionPorId);
router.put('/:id', esProfesorOAdmin, validarId, validarActualizarAsignacion, actualizarAsignacion);
router.delete('/:id', esAdmin, validarId, desasignarEstudianteDeCurso);

// Ruta específica para calificar
router.put('/:id/calificar', esProfesorOAdmin, validarId, validarCalificarEstudiante, calificarEstudiante);

module.exports = router;