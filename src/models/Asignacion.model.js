const { executeQuery } = require('../config/database');

class Asignacion {
    constructor(data) {
        this.id = data.id;
        this.alumno_id = data.alumno_id;
        this.curso_id = data.curso_id;
        this.fecha_asignacion = data.fecha_asignacion;
        this.estado = data.estado || 'inscrito';
        this.calificacion_final = data.calificacion_final;
        this.fecha_completado = data.fecha_completado;
        this.comentarios = data.comentarios;
        this.activo = data.activo !== undefined ? data.activo : true;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Datos relacionados si están incluidos
        this.alumno = data.alumno;
        this.curso = data.curso;
    }

    // Crear una nueva asignación
    static async create(asignacionData) {
        const { alumno, curso, estado = 'inscrito' } = asignacionData;

        const sql = `
            INSERT INTO asignaciones (alumno_id, curso_id, estado) 
            VALUES (?, ?, ?)
        `;
        
        const result = await executeQuery(sql, [alumno, curso, estado]);
        return await this.findById(result.insertId);
    }

    // Buscar asignación por ID
    static async findById(id, includeRelations = false) {
        let sql = 'SELECT * FROM asignaciones WHERE id = ?';
        
        if (includeRelations) {
            sql = `
                SELECT 
                    asig.*,
                    a.nombre as alumno_nombre, a.apellido as alumno_apellido, 
                    a.email as alumno_email, a.numero_estudiantil,
                    c.nombre as curso_nombre, c.codigo as curso_codigo,
                    u.username as profesor_username, u.email as profesor_email
                FROM asignaciones asig
                LEFT JOIN alumnos a ON asig.alumno_id = a.id
                LEFT JOIN cursos c ON asig.curso_id = c.id
                LEFT JOIN usuarios u ON c.profesor_id = u.id
                WHERE asig.id = ?
            `;
        }
        
        const result = await executeQuery(sql, [id]);
        
        if (result.length === 0) return null;
        
        const asignacion = new Asignacion(result[0]);
        
        if (includeRelations) {
            if (result[0].alumno_nombre) {
                asignacion.alumno = {
                    id: asignacion.alumno_id,
                    nombre: result[0].alumno_nombre,
                    apellido: result[0].alumno_apellido,
                    email: result[0].alumno_email,
                    numeroEstudiantil: result[0].numero_estudiantil
                };
            }
            
            if (result[0].curso_nombre) {
                asignacion.curso = {
                    id: asignacion.curso_id,
                    nombre: result[0].curso_nombre,
                    codigo: result[0].curso_codigo,
                    profesor: {
                        username: result[0].profesor_username,
                        email: result[0].profesor_email
                    }
                };
            }
        }
        
        return asignacion;
    }

    // Buscar asignación por alumno y curso
    static async findByAlumnoAndCurso(alumnoId, cursoId) {
        const sql = `
            SELECT * FROM asignaciones 
            WHERE alumno_id = ? AND curso_id = ? AND activo = TRUE
        `;
        const result = await executeQuery(sql, [alumnoId, cursoId]);
        
        if (result.length === 0) return null;
        return new Asignacion(result[0]);
    }

    // Obtener todas las asignaciones
    static async findAll(filters = {}) {
        let sql = `
            SELECT 
                asig.*,
                a.nombre as alumno_nombre, a.apellido as alumno_apellido, 
                a.email as alumno_email, a.numero_estudiantil,
                c.nombre as curso_nombre, c.codigo as curso_codigo
            FROM asignaciones asig
            LEFT JOIN alumnos a ON asig.alumno_id = a.id
            LEFT JOIN cursos c ON asig.curso_id = c.id
            WHERE 1=1
        `;
        const params = [];
        
        if (filters.alumno) {
            sql += ' AND asig.alumno_id = ?';
            params.push(filters.alumno);
        }
        
        if (filters.curso) {
            sql += ' AND asig.curso_id = ?';
            params.push(filters.curso);
        }
        
        if (filters.estado) {
            sql += ' AND asig.estado = ?';
            params.push(filters.estado);
        }
        
        if (filters.activo !== undefined) {
            sql += ' AND asig.activo = ?';
            params.push(filters.activo);
        }
        
        sql += ' ORDER BY asig.created_at DESC';
        
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
            const asignacion = new Asignacion(row);
            
            if (row.alumno_nombre) {
                asignacion.alumno = {
                    id: asignacion.alumno_id,
                    nombre: row.alumno_nombre,
                    apellido: row.alumno_apellido,
                    email: row.alumno_email,
                    numeroEstudiantil: row.numero_estudiantil
                };
            }
            
            if (row.curso_nombre) {
                asignacion.curso = {
                    id: asignacion.curso_id,
                    nombre: row.curso_nombre,
                    codigo: row.curso_codigo
                };
            }
            
            return asignacion;
        });
    }

    // Actualizar asignación
    static async updateById(id, updateData) {
        const allowedFields = [
            'estado', 'calificacion_final', 'fecha_completado', 
            'comentarios', 'activo'
        ];
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
            UPDATE asignaciones 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        await executeQuery(sql, params);
        return await this.findById(id, true);
    }

    // Eliminar asignación (soft delete)
    static async deleteById(id) {
        const sql = 'UPDATE asignaciones SET activo = FALSE WHERE id = ?';
        await executeQuery(sql, [id]);
        return true;
    }

    // Contar asignaciones
    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as count FROM asignaciones WHERE 1=1';
        const params = [];
        
        if (filters.alumno) {
            sql += ' AND alumno_id = ?';
            params.push(filters.alumno);
        }
        
        if (filters.curso) {
            sql += ' AND curso_id = ?';
            params.push(filters.curso);
        }
        
        if (filters.estado) {
            sql += ' AND estado = ?';
            params.push(filters.estado);
        }
        
        if (filters.activo !== undefined) {
            sql += ' AND activo = ?';
            params.push(filters.activo);
        }
        
        const result = await executeQuery(sql, params);
        return result[0].count;
    }

    // Contar estudiantes inscritos en un curso
    static async countStudentsInCourse(cursoId, estados = ['inscrito', 'en_curso']) {
        const placeholders = estados.map(() => '?').join(', ');
        const sql = `
            SELECT COUNT(*) as count 
            FROM asignaciones 
            WHERE curso_id = ? AND activo = TRUE AND estado IN (${placeholders})
        `;
        
        const result = await executeQuery(sql, [cursoId, ...estados]);
        return result[0].count;
    }

    // Obtener asignaciones por alumno
    static async findByAlumno(alumnoId) {
        const sql = `
            SELECT 
                asig.*,
                c.nombre as curso_nombre, c.codigo as curso_codigo, c.creditos,
                u.username as profesor_username
            FROM asignaciones asig
            LEFT JOIN cursos c ON asig.curso_id = c.id
            LEFT JOIN usuarios u ON c.profesor_id = u.id
            WHERE asig.alumno_id = ? AND asig.activo = TRUE
            ORDER BY asig.fecha_asignacion DESC
        `;
        
        const result = await executeQuery(sql, [alumnoId]);
        
        return result.map(row => {
            const asignacion = new Asignacion(row);
            asignacion.curso = {
                id: asignacion.curso_id,
                nombre: row.curso_nombre,
                codigo: row.curso_codigo,
                creditos: row.creditos,
                profesor: { username: row.profesor_username }
            };
            return asignacion;
        });
    }

    // Obtener asignaciones por curso
    static async findByCurso(cursoId) {
        const sql = `
            SELECT 
                asig.*,
                a.nombre as alumno_nombre, a.apellido as alumno_apellido, 
                a.email as alumno_email, a.numero_estudiantil
            FROM asignaciones asig
            LEFT JOIN alumnos a ON asig.alumno_id = a.id
            WHERE asig.curso_id = ? AND asig.activo = TRUE
            ORDER BY asig.fecha_asignacion DESC
        `;
        
        const result = await executeQuery(sql, [cursoId]);
        
        return result.map(row => {
            const asignacion = new Asignacion(row);
            asignacion.alumno = {
                id: asignacion.alumno_id,
                nombre: row.alumno_nombre,
                apellido: row.alumno_apellido,
                email: row.alumno_email,
                numeroEstudiantil: row.numero_estudiantil
            };
            return asignacion;
        });
    }

    // Virtual para determinar si aprobó
    get aprobo() {
        return this.calificacion_final !== null && this.calificacion_final >= 60;
    }

    // Convertir a JSON
    toJSON() {
        return {
            id: this.id,
            alumno: this.alumno_id,
            curso: this.curso_id,
            alumnoInfo: this.alumno,
            cursoInfo: this.curso,
            fechaAsignacion: this.fecha_asignacion,
            estado: this.estado,
            calificacionFinal: this.calificacion_final,
            fechaCompletado: this.fecha_completado,
            comentarios: this.comentarios,
            aprobo: this.aprobo,
            activo: this.activo,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Asignacion;