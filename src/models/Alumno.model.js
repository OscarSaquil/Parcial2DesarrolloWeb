const { executeQuery } = require('../config/database');

class Alumno {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.apellido = data.apellido;
        this.email = data.email;
        this.numero_estudiantil = data.numero_estudiantil;
        this.telefono = data.telefono;
        this.fecha_nacimiento = data.fecha_nacimiento;
        this.direccion_calle = data.direccion_calle;
        this.direccion_ciudad = data.direccion_ciudad;
        this.direccion_departamento = data.direccion_departamento;
        this.direccion_codigo_postal = data.direccion_codigo_postal;
        this.fecha_ingreso = data.fecha_ingreso;
        this.activo = data.activo !== undefined ? data.activo : true;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Crear un nuevo alumno
    static async create(alumnoData) {
        const { 
            nombre, apellido, email, numeroEstudiantil, telefono, 
            fechaNacimiento, direccion 
        } = alumnoData;

        const sql = `
            INSERT INTO alumnos (
                nombre, apellido, email, numero_estudiantil, telefono, 
                fecha_nacimiento, direccion_calle, direccion_ciudad, 
                direccion_departamento, direccion_codigo_postal
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            nombre, apellido, email, numeroEstudiantil, telefono, fechaNacimiento,
            direccion?.calle || null,
            direccion?.ciudad || null,
            direccion?.departamento || null,
            direccion?.codigoPostal || null
        ];
        
        const result = await executeQuery(sql, params);
        return await this.findById(result.insertId);
    }

    // Buscar alumno por ID
    static async findById(id) {
        const sql = 'SELECT * FROM alumnos WHERE id = ? AND activo = TRUE';
        const result = await executeQuery(sql, [id]);
        
        if (result.length === 0) return null;
        return new Alumno(result[0]);
    }

    // Buscar por email o número estudiantil
    static async findByEmailOrNumber(email, numeroEstudiantil) {
        const sql = `
            SELECT * FROM alumnos 
            WHERE (email = ? OR numero_estudiantil = ?) AND activo = TRUE
        `;
        const result = await executeQuery(sql, [email, numeroEstudiantil]);
        
        if (result.length === 0) return null;
        return new Alumno(result[0]);
    }

    // Verificar si email o número estudiantil ya existen
    static async existsByEmailOrNumber(email, numeroEstudiantil, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM alumnos WHERE (email = ? OR numero_estudiantil = ?)';
        const params = [email, numeroEstudiantil];
        
        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }
        
        const result = await executeQuery(sql, params);
        return result[0].count > 0;
    }

    // Obtener todos los alumnos
    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM alumnos WHERE 1=1';
        const params = [];
        
        if (filters.activo !== undefined) {
            sql += ' AND activo = ?';
            params.push(filters.activo);
        }
        
        if (filters.search) {
            sql += ' AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR numero_estudiantil LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
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
        return result.map(alumno => new Alumno(alumno));
    }

    // Actualizar alumno
    static async updateById(id, updateData) {
        const allowedFields = [
            'nombre', 'apellido', 'email', 'numero_estudiantil', 'telefono', 
            'fecha_nacimiento', 'direccion_calle', 'direccion_ciudad', 
            'direccion_departamento', 'direccion_codigo_postal', 'activo'
        ];
        const updates = [];
        const params = [];
        
        // Manejar campos de dirección
        if (updateData.direccion) {
            if (updateData.direccion.calle !== undefined) {
                updateData.direccion_calle = updateData.direccion.calle;
            }
            if (updateData.direccion.ciudad !== undefined) {
                updateData.direccion_ciudad = updateData.direccion.ciudad;
            }
            if (updateData.direccion.departamento !== undefined) {
                updateData.direccion_departamento = updateData.direccion.departamento;
            }
            if (updateData.direccion.codigoPostal !== undefined) {
                updateData.direccion_codigo_postal = updateData.direccion.codigoPostal;
            }
        }

        // Mapear numeroEstudiantil a numero_estudiantil
        if (updateData.numeroEstudiantil !== undefined) {
            updateData.numero_estudiantil = updateData.numeroEstudiantil;
        }
        if (updateData.fechaNacimiento !== undefined) {
            updateData.fecha_nacimiento = updateData.fechaNacimiento;
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
            UPDATE alumnos 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        await executeQuery(sql, params);
        return await this.findById(id);
    }

    // Eliminar alumno (soft delete)
    static async deleteById(id) {
        const sql = 'UPDATE alumnos SET activo = FALSE WHERE id = ?';
        await executeQuery(sql, [id]);
        return true;
    }

    // Contar alumnos
    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as count FROM alumnos WHERE 1=1';
        const params = [];
        
        if (filters.activo !== undefined) {
            sql += ' AND activo = ?';
            params.push(filters.activo);
        }
        
        if (filters.search) {
            sql += ' AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR numero_estudiantil LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        const result = await executeQuery(sql, params);
        return result[0].count;
    }

    // Métodos virtuales
    get nombreCompleto() {
        return `${this.nombre} ${this.apellido}`;
    }

    get edad() {
        if (!this.fecha_nacimiento) return null;
        const today = new Date();
        const birthDate = new Date(this.fecha_nacimiento);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    get direccion() {
        return {
            calle: this.direccion_calle,
            ciudad: this.direccion_ciudad,
            departamento: this.direccion_departamento,
            codigoPostal: this.direccion_codigo_postal
        };
    }

    // Convertir a JSON
    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            apellido: this.apellido,
            nombreCompleto: this.nombreCompleto,
            email: this.email,
            numeroEstudiantil: this.numero_estudiantil,
            telefono: this.telefono,
            fechaNacimiento: this.fecha_nacimiento,
            edad: this.edad,
            direccion: this.direccion,
            fechaIngreso: this.fecha_ingreso,
            activo: this.activo,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Alumno;