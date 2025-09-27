const { body, param } = require('express-validator');

// Validaciones para crear curso
const validarCrearCurso = [
    body('nombre')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    
    body('codigo')
        .trim()
        .matches(/^[A-Z0-9]{3,10}$/)
        .withMessage('El código debe contener solo letras mayúsculas y números (3-10 caracteres)'),
    
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('creditos')
        .isInt({ min: 1, max: 10 })
        .withMessage('Los créditos deben ser un número entero entre 1 y 10'),
    
    body('profesor')
        .isMongoId()
        .withMessage('ID de profesor inválido'),
    
    body('capacidadMaxima')
        .isInt({ min: 1, max: 100 })
        .withMessage('La capacidad máxima debe ser un número entero entre 1 y 100'),
    
    body('fechaInicio')
        .isISO8601()
        .toDate()
        .withMessage('Fecha de inicio inválida'),
    
    body('fechaFin')
        .isISO8601()
        .toDate()
        .withMessage('Fecha de fin inválida')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.fechaInicio)) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
            return true;
        })
];

// Validaciones para actualizar curso
const validarActualizarCurso = [
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    
    body('codigo')
        .optional()
        .trim()
        .matches(/^[A-Z0-9]{3,10}$/)
        .withMessage('El código debe contener solo letras mayúsculas y números (3-10 caracteres)'),
    
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    
    body('creditos')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Los créditos deben ser un número entero entre 1 y 10'),
    
    body('profesor')
        .optional()
        .isMongoId()
        .withMessage('ID de profesor inválido'),
    
    body('capacidadMaxima')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('La capacidad máxima debe ser un número entero entre 1 y 100'),
    
    body('fechaInicio')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Fecha de inicio inválida'),
    
    body('fechaFin')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Fecha de fin inválida')
];

// Validación para parámetros ID
const validarId = [
    param('id')
        .isMongoId()
        .withMessage('ID inválido')
];

module.exports = {
    validarCrearCurso,
    validarActualizarCurso,
    validarId
};