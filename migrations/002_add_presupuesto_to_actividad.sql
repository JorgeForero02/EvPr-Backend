-- Migration 002: Agregar campo presupuesto a Actividad
-- RF81: Gestión de presupuesto por actividad con total del evento
-- Fecha: 2026-03-29

ALTER TABLE Actividad
    ADD COLUMN presupuesto DECIMAL(10, 2) NOT NULL DEFAULT 0.00
    COMMENT 'Presupuesto asignado a esta actividad en COP';

-- Rollback:
-- ALTER TABLE Actividad DROP COLUMN presupuesto;
