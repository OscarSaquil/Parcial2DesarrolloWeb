const { body, param } = require('express-validator');

// Validaciones para crear alumno
const validarCrearAlumno = [
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),
    
    body('apellido')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe proporcionar un email válido'),
    
    body('numeroEstudiantil')
        .matches(/^\d{8,12}$/)
        .withMessage('El número estudiantil debe tener entre 8 y 12 dígitos'),
    
    body('telefono')
        .optional()
        .matches(/^\+?[\d\s\-\(\)]{8,15}$/)
        .withMessage('Formato de teléfono inválido'),
    
    body('fechaNacimiento')
        .isISO8601()
        .toDate()
        .withMessage('Fecha de nacimiento inválida')
        .custom((value) => {
            const today = new Date();
            const birthDate = new Date(value);
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 16 || age > 80) {
                throw new Error('El alumno debe tener entre 16 y 80 años');
            }
            return true;
        }),
    
    body('direccion.calle')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La calle no puede exceder 100 caracteres'),
    
    body('direccion.ciudad')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('La ciudad no puede exceder 50 caracteres'),
    
    body('direccion.departamento')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('El departamento no puede exceder 50 caracteres'),
    
    body('direccion.codigoPostal')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('El código postal no puede exceder 10 caracteres')
];

// Validaciones para actualizar alumno
const validarActualizarAlumno = [
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),
    
    body('apellido')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios'),
    
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe proporcionar un email válido'),
    
    body('numeroEstudiantil')
        .optional()
        .matches(/^\d{8,12}$/)
        .withMessage('El número estudiantil debe tener entre 8 y 12 dígitos'),
    
    body('telefono')
        .optional()
        .matches(/^\+?[\d\s\-\(\)]{8,15}$/)
        .withMessage('Formato de teléfono inválido'),
    
    body('fechaNacimiento')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Fecha de nacimiento inválida')
        .custom((value) => {
            if (!value) return true;
            const today = new Date();
            const birthDate = new Date(value);
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 16 || age > 80) {
                throw new Error('El alumno debe tener entre 16 y 80 años');
            }
            return true;
        }),
    
    body('direccion.calle')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La calle no puede exceder 100 caracteres'),
    
    body('direccion.ciudad')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('La ciudad no puede exceder 50 caracteres'),
    
    body('direccion.departamento')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('El departamento no puede exceder 50 caracteres'),
    
    body('direccion.codigoPostal')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('El código postal no puede exceder 10 caracteres')
];

// Validación para parámetros ID
const validarId = [
    param('id')
        .isMongoId()
        .withMessage('ID inválido')
];

module.exports = {
    validarCrearAlumno,
    validarActualizarAlumno,
    validarId
};