
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
DROP TABLE IF EXISTS Radar;
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
CREATE TABLE IF NOT EXISTS Radar(
    id_usuario INT NOT NULL,
    id_radar INT AUTO_INCREMENT PRIMARY KEY,
    categoria VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    walkMin int,
    driveMin int,
    calificacion DECIMAL(2,1),
    Check (calificacion >= 0 and calificacion <= 5),
    precio Decimal (10,2) NOT NULL,
    nota text,
    favorito boolean default false,
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

-- Verificar datos
SELECT * FROM Radar;
SELECT * FROM Horarios;
SELECT * FROM Usuarios;