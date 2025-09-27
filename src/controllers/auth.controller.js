const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario.model');

// Generar JWT
const generarToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Registrar usuario
const registrar = async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { username, email, password, role } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.existsByUsernameOrEmail(username, email);

        if (usuarioExistente) {
            return res.status(400).json({
                message: 'El usuario o email ya existe'
            });
        }

        // Crear nuevo usuario
        const nuevoUsuario = await Usuario.create({
            username,
            email,
            password,
            role: role || 'estudiante'
        });

        // Generar token
        const token = generarToken(nuevoUsuario.id);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id: nuevoUsuario.id,
                username: nuevoUsuario.username,
                email: nuevoUsuario.email,
                role: nuevoUsuario.role
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Iniciar sesión
const login = async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Buscar usuario por username o email
        const usuario = await Usuario.findByUsernameOrEmail(username);

        if (!usuario || !usuario.activo) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const passwordValido = await usuario.comparePassword(password);
        if (!passwordValido) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = generarToken(usuario.id);

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                username: usuario.username,
                email: usuario.email,
                role: usuario.role
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener perfil del usuario actual
const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        res.json({
            message: 'Perfil obtenido exitosamente',
            usuario
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar perfil
const actualizarPerfil = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { username, email } = req.body;
        const userId = req.usuario.id;

        // Verificar si username o email ya existen (excluyendo el usuario actual)
        const usuarioExistente = await Usuario.existsByUsernameOrEmail(username, email, userId);

        if (usuarioExistente) {
            return res.status(400).json({
                message: 'El username o email ya está en uso'
            });
        }

        // Actualizar usuario
        const usuarioActualizado = await Usuario.updateById(
            userId,
            { username, email }
        );

        res.json({
            message: 'Perfil actualizado exitosamente',
            usuario: usuarioActualizado
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Verificar token
const verificarToken = async (req, res) => {
    try {
        res.json({
            message: 'Token válido',
            usuario: req.usuario
        });
    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    registrar,
    login,
    obtenerPerfil,
    actualizarPerfil,
    verificarToken
};