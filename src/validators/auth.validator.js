const { body } = require('express-validator');

// Validaciones para registro
const validarRegistro = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El username debe tener entre 3 y 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El username solo puede contener letras, números y guiones bajos'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe proporcionar un email válido'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
    
    body('role')
        .optional()
        .isIn(['admin', 'profesor', 'estudiante'])
        .withMessage('El rol debe ser admin, profesor o estudiante')
];

// Validaciones para login
const validarLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username o email es requerido'),
    
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
];

// Validaciones para actualizar perfil
const validarActualizarPerfil = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El username debe tener entre 3 y 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El username solo puede contener letras, números y guiones bajos'),
    
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Debe proporcionar un email válido')
];

module.exports = {
    validarRegistro,
    validarLogin,
    validarActualizarPerfil
};