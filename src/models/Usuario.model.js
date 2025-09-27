const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class Usuario {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.role = data.role || 'estudiante';
        this.activo = data.activo !== undefined ? data.activo : true;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Crear un nuevo usuario
    static async create(userData) {
        const { username, email, password, role } = userData;
        
        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = `
            INSERT INTO usuarios (username, email, password, role) 
            VALUES (?, ?, ?, ?)
        `;
        
        const result = await executeQuery(sql, [username, email, hashedPassword, role || 'estudiante']);
        
        // Obtener el usuario creado
        return await this.findById(result.insertId);
    }

    // Buscar usuario por ID
    static async findById(id) {
        const sql = 'SELECT * FROM usuarios WHERE id = ? AND activo = TRUE';
        const result = await executeQuery(sql, [id]);
        
        if (result.length === 0) return null;
        return new Usuario(result[0]);
    }

    // Buscar usuario por username o email
    static async findByUsernameOrEmail(identifier) {
        const sql = `
            SELECT * FROM usuarios 
            WHERE (username = ? OR email = ?) AND activo = TRUE
        `;
        const result = await executeQuery(sql, [identifier, identifier]);
        
        if (result.length === 0) return null;
        return new Usuario(result[0]);
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        const sql = 'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE';
        const result = await executeQuery(sql, [email]);
        
        if (result.length === 0) return null;
        return new Usuario(result[0]);
    }

    // Buscar usuario por username
    static async findByUsername(username) {
        const sql = 'SELECT * FROM usuarios WHERE username = ? AND activo = TRUE';
        const result = await executeQuery(sql, [username]);
        
        if (result.length === 0) return null;
        return new Usuario(result[0]);
    }

    // Verificar si username o email ya existen
    static async existsByUsernameOrEmail(username, email, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM usuarios WHERE (username = ? OR email = ?)';
        const params = [username, email];
        
        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }
        
        const result = await executeQuery(sql, params);
        return result[0].count > 0;
    }

    // Obtener todos los usuarios con filtros
    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM usuarios WHERE 1=1';
        const params = [];
        
        if (filters.activo !== undefined) {
            sql += ' AND activo = ?';
            params.push(filters.activo);
        }
        
        if (filters.role) {
            sql += ' AND role = ?';
            params.push(filters.role);
        }
        
        sql += ' ORDER BY created_at DESC';
        
        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
            
            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }
        }
        
        const result = await executeQuery(sql, params);
        return result.map(user => new Usuario(user));
    }

    // Actualizar usuario
    static async updateById(id, updateData) {
        const allowedFields = ['username', 'email', 'role', 'activo'];
        const updates = [];
        const params = [];
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(updateData[field]);
            }
        }
        
        if (updates.length === 0) {
            throw new Error('No hay campos para actualizar');
        }
        
        params.push(id);
        
        const sql = `
            UPDATE usuarios 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        await executeQuery(sql, params);
        return await this.findById(id);
    }

    // Eliminar usuario (soft delete)
    static async deleteById(id) {
        const sql = 'UPDATE usuarios SET activo = FALSE WHERE id = ?';
        await executeQuery(sql, [id]);
        return true;
    }

    // Comparar contraseña
    async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    }

    // Convertir a JSON (sin contraseña)
    toJSON() {
        const obj = { ...this };
        delete obj.password;
        return obj;
    }

    // Contar usuarios
    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as count FROM usuarios WHERE 1=1';
        const params = [];
        
        if (filters.activo !== undefined) {
            sql += ' AND activo = ?';
            params.push(filters.activo);
        }
        
        if (filters.role) {
            sql += ' AND role = ?';
            params.push(filters.role);
        }
        
        const result = await executeQuery(sql, params);
        return result[0].count;
    }
}

module.exports = Usuario;