-- Migration 001: Agregar campo activo a Ubicacion y Lugar
-- Ejecutar en la BD de producción (Aiven Cloud MySQL)
-- Fecha: 2026-03-29

-- RF24/RF27: Deshabilitar sin borrar histórico
ALTER TABLE Ubicacion
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1
    COMMENT '1 = habilitada, 0 = deshabilitada';

ALTER TABLE Lugar
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1
    COMMENT '1 = habilitado, 0 = deshabilitado';

-- Rollback:
-- ALTER TABLE Ubicacion DROP COLUMN activo;
-- ALTER TABLE Lugar DROP COLUMN activo;
