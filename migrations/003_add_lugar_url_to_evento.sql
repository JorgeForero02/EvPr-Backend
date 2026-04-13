-- B5/B6: Add lugar_id and url_virtual columns to Evento table
ALTER TABLE `Evento`
    ADD COLUMN `lugar_id` INT NULL,
    ADD COLUMN `url_virtual` VARCHAR(500) NULL,
    ADD CONSTRAINT `fk_evento_lugar`
        FOREIGN KEY (`lugar_id`) REFERENCES `Lugar` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;
