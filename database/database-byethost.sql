
-- SQL PARA BYETHOST - CONFIGURADO PARA TI
-- ============================================
-- Base de datos: b5_41127736_ServiHotelero
-- Usuario: b5_41127736
-- Host: sql101.byethost5.com
--
-- INSTRUCCIONES:
-- 1. Ve a phpMyAdmin en tu panel de Byethost
-- 2. Selecciona la base de datos: b5_41127736_ServiHotelero
-- 3. Ve a la pestaña "SQL"
-- 4. Copia y pega TODO este archivo
-- 5. Haz clic en "Ejecutar"

-- elimina la tabla actual por esta nueva
DROP TABLE IF EXISTS Horarios;
DROP TABLE IF EXISTS Comentarios;
DROP TABLE IF EXISTS Catalogo;
DROP TABLE IF EXISTS Transferencias;
DROP TABLE IF EXISTS promocion;
DROP TABLE IF EXISTS Radar;
DROP TABLE IF EXISTS Categorias;
DROP TABLE IF EXISTS tarjeta;
DROP TABLE IF EXISTS Usuarios;


-- Crear tablas
CREATE TABLE IF NOT EXISTS Usuarios(
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    nc VARCHAR(10) UNIQUE,
    password VARCHAR(255) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    CHECK (correo IS NOT NULL AND correo REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    CHECK (CHAR_LENGTH(password) >= 8),
    CHECK (nc IS NULL OR nc REGEXP '^[0-9]{8,9}$' OR nc REGEXP '^C[0-9]{9}$')
);

Create table IF NOT EXISTS Categorias(
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    categoria ENUM('Pasteleria','Hoteles y Rentas','Hospitales','Restaurantes','Fondas','Cafeterias','Gimnasios','Otros') NOT NULL
);

Create table IF NOT EXISTS tarjeta(
    id_tarjeta INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    numero_tarjeta VARCHAR(16) NOT NULL,
    fecha_vencimiento VARCHAR(5) NOT NULL,
    cvv VARCHAR(3) NOT NULL,
    nombre_titular VARCHAR(100) NOT NULL,
    CHECK (CHAR_LENGTH(numero_tarjeta) = 16),
    CHECK (CHAR_LENGTH(cvv) = 3),
    CHECK (CHAR_LENGTH(fecha_vencimiento) = 5),
     FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Radar(
    id_usuario INT NOT NULL,
    id_radar INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    walkMin int,
    driveMin int,
    calificacion DECIMAL(2,1),
    Check (calificacion >= 0 and calificacion <= 5),
    precio Decimal (10,2),
    nota text,
    favorito boolean default false,
     patrocinado boolean default false,
    foto VARCHAR(500),
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS Horarios(
    id_horario INT AUTO_INCREMENT PRIMARY KEY,
    id_radar INT NOT NULL,
    dia SET('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')NOT NULL,
    horarioapertura time NOT NULL,
    horariocierre time NOT NULL,
    FOREIGN KEY (id_radar) REFERENCES Radar(id_radar) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Comentarios(
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    id_radar INT NOT NULL,
    id_usuario INT,
    nombre_estudiante VARCHAR(150) NOT NULL,
    calificacion INT NOT NULL DEFAULT 5,
    opinion TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_radar) REFERENCES Radar(id_radar) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Catalogo(
    id_catalogo INT AUTO_INCREMENT PRIMARY KEY,
    id_radar INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    foto VARCHAR(500),
    FOREIGN KEY (id_radar) REFERENCES Radar(id_radar) ON DELETE CASCADE
);

Create table IF NOT EXISTS promocion(
    id_promocion INT AUTO_INCREMENT PRIMARY KEY,
     id_usuario INT NOT NULL,
    id_tarjeta INT NOT NULL,
    id_radar INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_tarjeta) REFERENCES tarjeta(id_tarjeta) ON DELETE CASCADE,
    FOREIGN KEY (id_radar) REFERENCES Radar(id_radar) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Transferencias(
    id_transferencia INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre_usuario VARCHAR(100) NOT NULL,
    id_promocion INT NOT NULL,
    nombre_lugar VARCHAR(100) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    dias INT NOT NULL,
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_promocion) REFERENCES promocion(id_promocion) ON DELETE CASCADE
);
INSERT INTO Categorias (categoria) VALUES
    ('Pasteleria'),
    ('Hoteles y Rentas'),
    ('Hospitales'),
    ('Restaurantes'),
    ('Fondas'),
    ('Cafeterias'),
    ('Gimnasios'),
    ('Otros');

-- Verificar datos
SELECT * FROM Radar;
SELECT * FROM Horarios;
SELECT * FROM Usuarios;
SELECT * FROM Categorias;
SELECT * FROM tarjeta;
SELECT * FROM promocion;
SELECT * FROM Catalogo;
SELECT * FROM Comentarios;
SELECT * FROM Transferencias;