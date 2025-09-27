-- Script para crear la base de datos del sistema de gestión de cursos y alumnos
-- Base de datos: parcial2_db

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS parcial2_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE parcial2_db;

-- Tabla de usuarios (para autenticación)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'profesor', 'estudiante') DEFAULT 'estudiante',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_activo (activo)
);

-- Tabla de alumnos
CREATE TABLE IF NOT EXISTS alumnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    numero_estudiantil VARCHAR(12) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    fecha_nacimiento DATE NOT NULL,
    direccion_calle VARCHAR(100),
    direccion_ciudad VARCHAR(50),
    direccion_departamento VARCHAR(50),
    direccion_codigo_postal VARCHAR(10),
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email_alumno (email),
    INDEX idx_numero_estudiantil (numero_estudiantil),
    INDEX idx_nombre_apellido (nombre, apellido),
    INDEX idx_activo_alumno (activo)
);

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    descripcion TEXT,
    creditos INT NOT NULL CHECK (creditos >= 1 AND creditos <= 10),
    profesor_id INT NOT NULL,
    capacidad_maxima INT NOT NULL CHECK (capacidad_maxima >= 1 AND capacidad_maxima <= 100),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_codigo_curso (codigo),
    INDEX idx_profesor (profesor_id),
    INDEX idx_activo_curso (activo),
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    
    -- Verificar que la fecha de fin sea posterior a la fecha de inicio
    CONSTRAINT chk_fechas CHECK (fecha_fin > fecha_inicio)
);

-- Tabla de asignaciones (relación entre alumnos y cursos)
CREATE TABLE IF NOT EXISTS asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    curso_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('inscrito', 'en_curso', 'completado', 'retirado', 'reprobado') DEFAULT 'inscrito',
    calificacion_final DECIMAL(5,2) CHECK (calificacion_final >= 0 AND calificacion_final <= 100),
    fecha_completado TIMESTAMP NULL,
    comentarios TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índice único compuesto para evitar asignaciones duplicadas
    UNIQUE KEY unique_alumno_curso (alumno_id, curso_id),
    
    INDEX idx_estado (estado),
    INDEX idx_fecha_asignacion (fecha_asignacion),
    INDEX idx_activo_asignacion (activo),
    INDEX idx_calificacion (calificacion_final)
);

-- Insertar usuario administrador por defecto
INSERT IGNORE INTO usuarios (username, email, password, role) 
VALUES ('admin', 'admin@parcial2.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insertar algunos datos de prueba

-- Profesores
INSERT IGNORE INTO usuarios (username, email, password, role) VALUES
('prof_martinez', 'martinez@universidad.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor'),
('prof_garcia', 'garcia@universidad.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor'),
('prof_rodriguez', 'rodriguez@universidad.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor');

-- Estudiantes
INSERT IGNORE INTO usuarios (username, email, password, role) VALUES
('estudiante1', 'estudiante1@universidad.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante'),
('estudiante2', 'estudiante2@universidad.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante');

-- Alumnos de prueba
INSERT IGNORE INTO alumnos (nombre, apellido, email, numero_estudiantil, telefono, fecha_nacimiento, direccion_ciudad) VALUES
('Juan', 'Pérez', 'juan.perez@estudiante.edu', '2024001001', '+502 1234-5678', '2000-03-15', 'Guatemala'),
('María', 'González', 'maria.gonzalez@estudiante.edu', '2024001002', '+502 8765-4321', '1999-07-22', 'Antigua Guatemala'),
('Carlos', 'López', 'carlos.lopez@estudiante.edu', '2024001003', '+502 5555-1234', '2001-11-08', 'Quetzaltenango'),
('Ana', 'Martínez', 'ana.martinez@estudiante.edu', '2024001004', '+502 9999-8888', '2000-12-03', 'Escuintla'),
('Luis', 'Hernández', 'luis.hernandez@estudiante.edu', '2024001005', '+502 7777-6666', '1998-05-18', 'Cobán');

-- Cursos de prueba
INSERT IGNORE INTO cursos (nombre, codigo, descripcion, creditos, profesor_id, capacidad_maxima, fecha_inicio, fecha_fin) VALUES
('Programación Web', 'PROGWEB01', 'Curso de desarrollo web con tecnologías modernas', 4, 2, 30, '2024-01-15', '2024-05-15'),
('Base de Datos', 'BD01', 'Fundamentos de bases de datos relacionales y NoSQL', 5, 3, 25, '2024-01-20', '2024-05-20'),
('Algoritmos y Estructuras de Datos', 'AED01', 'Estudio de algoritmos y estructuras de datos fundamentales', 6, 4, 35, '2024-02-01', '2024-06-01'),
('Ingeniería de Software', 'IS01', 'Metodologías y procesos de desarrollo de software', 4, 2, 28, '2024-02-10', '2024-06-10'),
('Redes de Computadoras', 'REDES01', 'Fundamentos de redes y protocolos de comunicación', 5, 3, 20, '2024-03-01', '2024-07-01');

-- Asignaciones de prueba
INSERT IGNORE INTO asignaciones (alumno_id, curso_id, estado, calificacion_final) VALUES
(1, 1, 'completado', 85.50),
(1, 2, 'en_curso', NULL),
(2, 1, 'completado', 92.75),
(2, 3, 'inscrito', NULL),
(3, 2, 'completado', 78.25),
(3, 4, 'en_curso', NULL),
(4, 1, 'retirado', NULL),
(4, 5, 'inscrito', NULL),
(5, 3, 'completado', 88.00),
(5, 4, 'completado', 95.50);

-- Crear vistas útiles

-- Vista de estudiantes con información completa
CREATE OR REPLACE VIEW vista_estudiantes AS
SELECT 
    a.id,
    a.nombre,
    a.apellido,
    CONCAT(a.nombre, ' ', a.apellido) as nombre_completo,
    a.email,
    a.numero_estudiantil,
    a.telefono,
    a.fecha_nacimiento,
    YEAR(CURDATE()) - YEAR(a.fecha_nacimiento) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(a.fecha_nacimiento, '%m%d')) as edad,
    a.direccion_ciudad,
    a.fecha_ingreso,
    a.activo,
    COUNT(asig.id) as total_cursos,
    COUNT(CASE WHEN asig.estado = 'completado' THEN 1 END) as cursos_completados,
    AVG(CASE WHEN asig.calificacion_final IS NOT NULL THEN asig.calificacion_final END) as promedio_general
FROM alumnos a
LEFT JOIN asignaciones asig ON a.id = asig.alumno_id AND asig.activo = TRUE
GROUP BY a.id;

-- Vista de cursos con información del profesor
CREATE OR REPLACE VIEW vista_cursos AS
SELECT 
    c.id,
    c.nombre,
    c.codigo,
    c.descripcion,
    c.creditos,
    c.capacidad_maxima,
    c.fecha_inicio,
    c.fecha_fin,
    c.activo,
    u.username as profesor_username,
    u.email as profesor_email,
    COUNT(asig.id) as estudiantes_inscritos,
    AVG(CASE WHEN asig.calificacion_final IS NOT NULL THEN asig.calificacion_final END) as promedio_curso
FROM cursos c
LEFT JOIN usuarios u ON c.profesor_id = u.id
LEFT JOIN asignaciones asig ON c.id = asig.curso_id AND asig.activo = TRUE AND asig.estado IN ('inscrito', 'en_curso', 'completado')
GROUP BY c.id;

-- Procedimientos almacenados útiles

DELIMITER //

-- Procedimiento para inscribir un estudiante a un curso
CREATE PROCEDURE IF NOT EXISTS InscribirEstudiante(
    IN p_alumno_id INT,
    IN p_curso_id INT,
    OUT p_resultado VARCHAR(255)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_capacidad INT DEFAULT 0;
    DECLARE v_inscritos INT DEFAULT 0;
    DECLARE v_fecha_fin DATE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = 'Error: No se pudo completar la inscripción';
    END;
    
    START TRANSACTION;
    
    -- Verificar si ya está inscrito
    SELECT COUNT(*) INTO v_count 
    FROM asignaciones 
    WHERE alumno_id = p_alumno_id AND curso_id = p_curso_id AND activo = TRUE;
    
    IF v_count > 0 THEN
        SET p_resultado = 'Error: El estudiante ya está inscrito en este curso';
        ROLLBACK;
    ELSE
        -- Verificar capacidad del curso
        SELECT capacidad_maxima, fecha_fin INTO v_capacidad, v_fecha_fin
        FROM cursos 
        WHERE id = p_curso_id AND activo = TRUE;
        
        -- Contar estudiantes inscritos
        SELECT COUNT(*) INTO v_inscritos
        FROM asignaciones
        WHERE curso_id = p_curso_id AND activo = TRUE AND estado IN ('inscrito', 'en_curso');
        
        -- Verificar si el curso ya terminó
        IF v_fecha_fin < CURDATE() THEN
            SET p_resultado = 'Error: No se puede inscribir a un curso que ya terminó';
            ROLLBACK;
        ELSEIF v_inscritos >= v_capacidad THEN
            SET p_resultado = 'Error: El curso ha alcanzado su capacidad máxima';
            ROLLBACK;
        ELSE
            -- Realizar la inscripción
            INSERT INTO asignaciones (alumno_id, curso_id, estado) 
            VALUES (p_alumno_id, p_curso_id, 'inscrito');
            
            SET p_resultado = 'Éxito: Estudiante inscrito correctamente';
            COMMIT;
        END IF;
    END IF;
END //

DELIMITER ;

SHOW TABLES;

SELECT 'Base de datos creada exitosamente!' as mensaje;