-- ============================================
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
-- ============================================

-- Eliminar tablas si existen (para poder ejecutar múltiples veces)
DROP TABLE IF EXISTS Servicios;
DROP TABLE IF EXISTS Cliente;
DROP TABLE IF EXISTS Hoteles;

-- Crear tablas
CREATE TABLE IF NOT EXISTS Hoteles(
    id_hotel INT AUTO_INCREMENT PRIMARY KEY,
    nombre_hotel VARCHAR(50),
    direccion_hotel VARCHAR(100),
    ciudad VARCHAR(20),
    telefono VARCHAR(12)
);

CREATE TABLE IF NOT EXISTS Cliente(
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30),
    edad INT,
    sexo VARCHAR(1)
);

CREATE TABLE IF NOT EXISTS Servicios(
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_hotel INT,
    fecha_entrada DATE,
    fecha_salida DATE,
    precio DECIMAL(10,2),
    FOREIGN KEY (id_hotel) REFERENCES Hoteles(id_hotel),
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
);

-- Insertar datos de ejemplo
INSERT INTO Hoteles (nombre_hotel, direccion_hotel, ciudad, telefono)
VALUES
('Hotel Paraíso', 'Av. del Sol 123', 'Monterrey', '8181234567'),
('Gran Vista', 'Calle Luna 456', 'Guadalajara', '3319876543');

INSERT INTO Cliente (nombre, edad, sexo)
VALUES
('Carlos Ramírez', 28, 'M'),
('María López', 34, 'F');

INSERT INTO Servicios (id_hotel, id_cliente, fecha_entrada, fecha_salida, precio)
VALUES
(1, 1, '2026-02-10', '2026-02-12', 2500.00),
(2, 2, '2026-03-01', '2026-03-05', 4800.00);

-- Verificar datos
SELECT * FROM Hoteles;
SELECT * FROM Cliente;
SELECT * FROM Servicios;
