const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario.model');

// Middleware para verificar JWT
const verificarToken = async (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ 
                message: 'Acceso denegado. No se proporcionó token de autenticación.' 
            });
        }

        // Verificar formato del token (Bearer <token>)
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({ 
                message: 'Acceso denegado. Token inválido.' 
            });
        }

        // Verificar y decodificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el decoded contiene el ID
        if (!decoded.id) {
            return res.status(401).json({ 
                message: 'Token inválido. ID de usuario no encontrado.' 
            });
        }
        
        // Buscar usuario en la base de datos
        const usuario = await Usuario.findById(decoded.id);
        
        if (!usuario) {
            return res.status(401).json({ 
                message: 'Token inválido. Usuario no encontrado o inactivo.' 
            });
        }
        
        // Remover password del objeto usuario antes de agregarlo al request
        delete usuario.password;

        // Agregar usuario a la request
        req.usuario = usuario;
        next();

    } catch (error) {
        console.error('Error en verificación de token:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido.' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado.' });
        }

        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Middleware para verificar roles específicos
const verificarRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        try {
            if (!req.usuario) {
                return res.status(401).json({ 
                    message: 'Acceso denegado. Usuario no autenticado.' 
                });
            }

            if (!rolesPermitidos.includes(req.usuario.role)) {
                return res.status(403).json({ 
                    message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}` 
                });
            }

            next();
        } catch (error) {
            console.error('Error en verificación de roles:', error);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
    };
};

// Middleware para verificar si es admin
const esAdmin = verificarRoles('admin');

// Middleware para verificar si es profesor o admin
const esProfesorOAdmin = verificarRoles('profesor', 'admin');

// Middleware para verificar si es el mismo usuario o admin
const esPropietarioOAdmin = (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (req.usuario.role === 'admin' || req.usuario._id.toString() === id) {
            return next();
        }

        return res.status(403).json({ 
            message: 'Acceso denegado. Solo puedes acceder a tu propia información.' 
        });
    } catch (error) {
        console.error('Error en verificación de propietario:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = {
    verificarToken,
    verificarRoles,
    esAdmin,
    esProfesorOAdmin,
    esPropietarioOAdmin
};