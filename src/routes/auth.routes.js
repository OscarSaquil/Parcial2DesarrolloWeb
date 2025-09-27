const express = require('express');
const router = express.Router();

const {
    registrar,
    login,
    obtenerPerfil,
    actualizarPerfil,
    verificarToken
} = require('../controllers/auth.controller');

const {
    validarRegistro,
    validarLogin,
    validarActualizarPerfil
} = require('../validators/auth.validator');

const { verificarToken: authMiddleware } = require('../middlewares/auth.middleware');

// Rutas públicas
router.post('/registro', validarRegistro, registrar);
router.post('/login', validarLogin, login);

// Rutas protegidas
router.get('/perfil', authMiddleware, obtenerPerfil);
router.put('/perfil', authMiddleware, validarActualizarPerfil, actualizarPerfil);
router.get('/verificar-token', authMiddleware, verificarToken);

module.exports = router;