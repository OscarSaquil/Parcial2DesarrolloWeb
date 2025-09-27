const { executeQuery } = require('../config/database');

class Curso {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.codigo = data.codigo;
        this.descripcion = data.descripcion;
        this.creditos = data.creditos;
        this.profesor_id = data.profesor_id;
        this.capacidad_maxima = data.capacidad_maxima;
        this.fecha_inicio = data.fecha_inicio;
        this.fecha_fin = data.fecha_fin;
        this.activo = data.activo !== undefined ? data.activo : true;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Datos del profesor si están incluidos
        this.profesor = data.profesor;
    }

    // Crear un nuevo curso
    static async create(cursoData) {
        const { 
            nombre, codigo, descripcion, creditos, profesor, 
            capacidadMaxima, fechaInicio, fechaFin 
        } = cursoData;

        const sql = `
            INSERT INTO cursos (
                nombre, codigo, descripcion, creditos, profesor_id, 
                capacidad_maxima, fecha_inicio, fecha_fin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(sql, [
            nombre, codigo, descripcion, creditos, profesor, 
            capacidadMaxima, fechaInicio, fechaFin
        ]);
        
        return await this.findById(result.insertId);
    }

    // Buscar curso por ID
    static async findById(id, includeProfesor = false) {
        let sql = 'SELECT * FROM cursos WHERE id = ? AND activo = TRUE';
        
        if (includeProfesor) {
            sql = `
                SELECT c.*, u.username as profesor_username, u.email as profesor_email
                FROM cursos c
                LEFT JOIN usuarios u ON c.profesor_id = u.id
                WHERE c.id = ? AND c.activo = TRUE
            `;
        }
        
        const result = await executeQuery(sql, [id]);
        
        if (result.length === 0) return null;
        
        const curso = new Curso(result[0]);
        
        if (includeProfesor && result[0].profesor_username) {
            curso.profesor = {
                id: curso.profesor_id,
                username: result[0].profesor_username,
                email: result[0].profesor_email
            };
        }
        
        return curso;
    }

    // Buscar por código
    static async findByCode(codigo, excludeId = null) {
        let sql = 'SELECT * FROM cursos WHERE codigo = ? AND activo = TRUE';
        const params = [codigo];
        
        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }
        
        const result = await executeQuery(sql, params);
        
        if (result.length === 0) return null;
        return new Curso(result[0]);
    }

    // Obtener todos los cursos
    static async findAll(filters = {}) {
        let sql = `
            SELECT c.*, u.username as profesor_username, u.email as profesor_email
            FROM cursos c
            LEFT JOIN usuarios u ON c.profesor_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (filters.activo !== undefined) {
            sql += ' AND c.activo = ?';
            params.push(filters.activo);
        }
        
        if (filters.profesor) {
            sql += ' AND c.profesor_id = ?';
            params.push(filters.profesor);
        }
        
        if (filters.search) {
            sql += ' AND (c.nombre LIKE ? OR c.codigo LIKE ? OR c.descripcion LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        sql += ' ORDER BY c.created_at DESC';
        
        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
            
            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }
        }
        
        const result = await executeQuery(sql, params);
        
        return result.map(row => {
            const curso = new Curso(row);
            if (row.profesor_username) {
                curso.profesor = {
                    id: curso.profesor_id,
                    username: row.profesor_username,
                    email: row.profesor_email
                };
            }
            return curso;
        });
    }

    // Actualizar curso
    static async updateById(id, updateData) {
        const allowedFields = [
            'nombre', 'codigo', 'descripcion', 'creditos', 'profesor_id', 
            'capacidad_maxima', 'fecha_inicio', 'fecha_fin', 'activo'
        ];
        const updates = [];
        const params = [];
        
        // Mapear campos del frontend
        if (updateData.profesor !== undefined) {
            updateData.profesor_id = updateData.profesor;
        }
        if (updateData.capacidadMaxima !== undefined) {
            updateData.capacidad_maxima = updateData.capacidadMaxima;
        }
        if (updateData.fechaInicio !== undefined) {
            updateData.fecha_inicio = updateData.fechaInicio;
        }
        if (updateData.fechaFin !== undefined) {
            updateData.fecha_fin = updateData.fechaFin;
        }
        
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
            UPDATE cursos 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        await executeQuery(sql, params);
        return await this.findById(id, true);
    }

    // Eliminar curso (soft delete)
    static async deleteById(id) {
        const sql = 'UPDATE cursos SET activo = FALSE WHERE id = ?';
        await executeQuery(sql, [id]);
        return true;
    }

    // Contar cursos
    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as count FROM cursos WHERE 1=1';
        const params = [];
        
        if (filters.activo !== undefined) {
            sql += ' AND activo = ?';
            params.push(filters.activo);
        }
        
        if (filters.profesor) {
            sql += ' AND profesor_id = ?';
            params.push(filters.profesor);
        }
        
        if (filters.search) {
            sql += ' AND (nombre LIKE ? OR codigo LIKE ? OR descripcion LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        const result = await executeQuery(sql, params);
        return result[0].count;
    }

    // Obtener estudiantes del curso
    static async getStudents(cursoId) {
        const sql = `
            SELECT a.*, asig.id as asignacion_id, asig.fecha_asignacion, 
                   asig.estado, asig.calificacion_final
            FROM asignaciones asig
            INNER JOIN alumnos a ON asig.alumno_id = a.id
            WHERE asig.curso_id = ? AND asig.activo = TRUE
            ORDER BY asig.fecha_asignacion DESC
        `;
        
        const result = await executeQuery(sql, [cursoId]);
        return result;
    }

    // Convertir a JSON
    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            codigo: this.codigo,
            descripcion: this.descripcion,
            creditos: this.creditos,
            profesor: this.profesor_id,
            profesorInfo: this.profesor,
            capacidadMaxima: this.capacidad_maxima,
            fechaInicio: this.fecha_inicio,
            fechaFin: this.fecha_fin,
            activo: this.activo,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Curso;