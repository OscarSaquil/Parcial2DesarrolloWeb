const { body, param } = require('express-validator');

// Validaciones para crear asignación
const validarCrearAsignacion = [
    body('alumno')
        .isMongoId()
        .withMessage('ID de alumno inválido'),
    
    body('curso')
        .isMongoId()
        .withMessage('ID de curso inválido')
];

// Validaciones para actualizar asignación
const validarActualizarAsignacion = [
    body('estado')
        .optional()
        .isIn(['inscrito', 'en_curso', 'completado', 'retirado', 'reprobado'])
        .withMessage('Estado inválido'),
    
    body('calificacionFinal')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('La calificación debe ser un número entre 0 y 100'),
    
    body('comentarios')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Los comentarios no pueden exceder 500 caracteres'),
    
    body('fechaCompletado')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Fecha de completado inválida')
];

// Validaciones para calificar estudiante
const validarCalificarEstudiante = [
    body('calificacionFinal')
        .isFloat({ min: 0, max: 100 })
        .withMessage('La calificación debe ser un número entre 0 y 100'),
    
    body('comentarios')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Los comentarios no pueden exceder 500 caracteres')
];

// Validación para parámetros ID
const validarId = [
    param('id')
        .isMongoId()
        .withMessage('ID inválido')
];

module.exports = {
    validarCrearAsignacion,
    validarActualizarAsignacion,
    validarCalificarEstudiante,
    validarId
};