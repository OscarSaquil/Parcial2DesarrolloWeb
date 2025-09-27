# 🚀 Pruebas de la API - Sistema de Gestión de Cursos y Alumnos

## URL Base: http://localhost:3000

## 📋 **Datos de prueba disponibles:**

### Usuarios por defecto:
- **Admin**: `admin` / `password` (rol: admin)
- **Profesor 1**: `prof_martinez` / `password` (rol: profesor)
- **Profesor 2**: `prof_garcia` / `password` (rol: profesor)
- **Estudiante 1**: `estudiante1` / `password` (rol: estudiante)

---

## 🔐 **1. AUTENTICACIÓN (HU-login)**

### Registrar usuario
```http
POST http://localhost:3000/api/auth/registro
Content-Type: application/json

{
    "username": "nuevo_profesor",
    "email": "profesor@universidad.edu",
    "password": "Password123",
    "role": "profesor"
}
```

### Iniciar sesión
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "password"
}
```

**Respuesta esperada:**
```json
{
    "message": "Inicio de sesión exitoso",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
        "id": 1,
        "username": "admin",
        "email": "admin@parcial2.com",
        "role": "admin"
    }
}
```

### Obtener perfil (requiere token)
```http
GET http://localhost:3000/api/auth/perfil
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 👨‍🎓 **2. GESTIÓN DE ALUMNOS (HU-crud)**

### Crear alumno (solo admin)
```http
POST http://localhost:3000/api/alumnos
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
    "nombre": "Roberto",
    "apellido": "García",
    "email": "roberto.garcia@estudiante.edu",
    "numeroEstudiantil": "2024001006",
    "telefono": "+502 1111-2222",
    "fechaNacimiento": "1999-08-15",
    "direccion": {
        "calle": "5ta Avenida 12-34",
        "ciudad": "Guatemala",
        "departamento": "Guatemala",
        "codigoPostal": "01001"
    }
}
```

### Obtener todos los alumnos (profesor/admin)
```http
GET http://localhost:3000/api/alumnos
Authorization: Bearer YOUR_TOKEN
```

### Obtener alumno por ID
```http
GET http://localhost:3000/api/alumnos/1
Authorization: Bearer YOUR_TOKEN
```

### Actualizar alumno (solo admin)
```http
PUT http://localhost:3000/api/alumnos/1
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
    "telefono": "+502 9999-8888",
    "direccion": {
        "ciudad": "Antigua Guatemala"
    }
}
```

### Obtener historial académico de un alumno
```http
GET http://localhost:3000/api/alumnos/1/historial
Authorization: Bearer YOUR_TOKEN
```

---

## 📚 **3. GESTIÓN DE CURSOS (HU-crud)**

### Obtener todos los cursos (público)
```http
GET http://localhost:3000/api/cursos
```

### Crear curso (profesor/admin)
```http
POST http://localhost:3000/api/cursos
Authorization: Bearer YOUR_PROFESSOR_TOKEN
Content-Type: application/json

{
    "nombre": "Desarrollo Móvil",
    "codigo": "MOVIL01",
    "descripcion": "Curso de desarrollo de aplicaciones móviles",
    "creditos": 4,
    "profesor": 2,
    "capacidadMaxima": 25,
    "fechaInicio": "2024-08-15",
    "fechaFin": "2024-12-15"
}
```

### Obtener curso por ID
```http
GET http://localhost:3000/api/cursos/1
```

### Actualizar curso (profesor/admin)
```http
PUT http://localhost:3000/api/cursos/1
Authorization: Bearer YOUR_PROFESSOR_TOKEN
Content-Type: application/json

{
    "capacidadMaxima": 35,
    "descripcion": "Curso actualizado de desarrollo web con las últimas tecnologías"
}
```

### Obtener estudiantes de un curso
```http
GET http://localhost:3000/api/cursos/1/estudiantes
Authorization: Bearer YOUR_PROFESSOR_TOKEN
```

---

## 📝 **4. GESTIÓN DE ASIGNACIONES (HU-crud)**

### Asignar estudiante a curso (profesor/admin)
```http
POST http://localhost:3000/api/asignaciones
Authorization: Bearer YOUR_PROFESSOR_TOKEN
Content-Type: application/json

{
    "alumno": 1,
    "curso": 1
}
```

### Obtener todas las asignaciones (profesor/admin)
```http
GET http://localhost:3000/api/asignaciones
Authorization: Bearer YOUR_PROFESSOR_TOKEN
```

### Obtener asignación por ID
```http
GET http://localhost:3000/api/asignaciones/1
Authorization: Bearer YOUR_TOKEN
```

### Calificar estudiante (profesor/admin)
```http
PUT http://localhost:3000/api/asignaciones/1/calificar
Authorization: Bearer YOUR_PROFESSOR_TOKEN
Content-Type: application/json

{
    "calificacionFinal": 85.5,
    "comentarios": "Excelente trabajo durante el curso"
}
```

### Desasignar estudiante (solo admin)
```http
DELETE http://localhost:3000/api/asignaciones/1
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Obtener reporte de asignaciones (solo admin)
```http
GET http://localhost:3000/api/asignaciones/reporte?fechaInicio=2024-01-01&fechaFin=2024-12-31
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## 🧪 **5. PRUEBAS PASO A PASO**

### Paso 1: Autenticarse como admin
1. Haz login con `admin` / `password`
2. Copia el token de la respuesta

### Paso 2: Crear un nuevo alumno
1. Usa el token del admin para crear un alumno
2. Anota el ID del alumno creado

### Paso 3: Autenticarse como profesor
1. Haz login con `prof_martinez` / `password`
2. Copia el token del profesor

### Paso 4: Crear un curso
1. Usa el token del profesor para crear un curso
2. Anota el ID del curso creado

### Paso 5: Asignar estudiante al curso
1. Usa el token del profesor para asignar el alumno al curso

### Paso 6: Calificar estudiante
1. Usa el token del profesor para calificar al estudiante

---

## 📊 **6. CONSULTAS ÚTILES**

### Filtrar cursos por profesor
```http
GET http://localhost:3000/api/cursos?profesor=2
```

### Buscar alumnos
```http
GET http://localhost:3000/api/alumnos?search=Juan
```

### Filtrar asignaciones por estado
```http
GET http://localhost:3000/api/asignaciones?estado=completado
Authorization: Bearer YOUR_TOKEN
```

### Paginación
```http
GET http://localhost:3000/api/cursos?page=1&limit=5
```

---

## 🚨 **Códigos de Error Comunes:**

- **400**: Datos inválidos o faltantes
- **401**: No autenticado (falta token o token inválido)
- **403**: No autorizado (permisos insuficientes)
- **404**: Recurso no encontrado
- **500**: Error interno del servidor

---

## 💡 **Notas Importantes:**

1. **Tokens JWT**: Todos los endpoints protegidos requieren el header:
   `Authorization: Bearer YOUR_TOKEN_HERE`

2. **Roles**:
   - `admin`: Acceso completo
   - `profesor`: Gestión de cursos y asignaciones
   - `estudiante`: Solo lectura de su información

3. **Contraseñas por defecto**: Todos los usuarios de prueba tienen la contraseña `password`

4. **Base de datos**: Los datos están en MySQL con datos de prueba precargados