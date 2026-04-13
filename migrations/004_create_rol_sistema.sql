CREATE TABLE IF NOT EXISTS RolSistema (
    id INT NOT NULL AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL,
    fecha_actualizacion DATETIME NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO RolSistema (tipo, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion) VALUES
('gerente', 'Gerente', 'Gestiona la empresa, ubicaciones y lugares.', 1, NOW(), NOW()),
('organizador', 'Organizador', 'Crea y gestiona eventos de la empresa.', 1, NOW(), NOW()),
('ponente', 'Ponente', 'Experto invitado asignado a actividades del evento.', 1, NOW(), NOW()),
('asistente', 'Asistente', 'Usuario final que se inscribe y participa en eventos.', 1, NOW(), NOW());

ALTER TABLE Asistencia
    ADD COLUMN IF NOT EXISTS registrado_por ENUM('asistente','organizador') NULL,
    ADD COLUMN IF NOT EXISTS estado_manual TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE Encuesta
    ADD COLUMN IF NOT EXISTS habilitada_para_ponente TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS es_encuesta_rapida TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tipo_creador ENUM('organizador','ponente') NULL DEFAULT 'organizador';

ALTER TABLE Evento
    ADD COLUMN IF NOT EXISTS fecha_limite_cancelacion DATE NULL;
