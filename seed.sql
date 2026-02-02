-- Seed users
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@repvtas.com', '$2a$10$KterRhjlbf.CclMTlh3.GOzN1POHA5uFNL3Dr.BsxXyb5p4nbFVaC', 'Administrador', 'Administrador')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, name, role) 
VALUES ('gerente.estacion@repvtas.com', '$2a$10$KterRhjlbf.CclMTlh3.GOzN1POHA5uFNL3Dr.BsxXyb5p4nbFVaC', 'Gerente Estación', 'GerenteEstacion')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, name, role) 
VALUES ('gerente.zona@repvtas.com', '$2a$10$KterRhjlbf.CclMTlh3.GOzN1POHA5uFNL3Dr.BsxXyb5p4nbFVaC', 'Gerente Zona', 'GerenteZona')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, name, role) 
VALUES ('director@repvtas.com', '$2a$10$KterRhjlbf.CclMTlh3.GOzN1POHA5uFNL3Dr.BsxXyb5p4nbFVaC', 'Director', 'Direccion')
ON CONFLICT (email) DO NOTHING;

-- Seed zones and stations
INSERT INTO zonas (nombre) VALUES ('Zona Norte'), ('Zona Sur') ON CONFLICT DO NOTHING;

-- Get zone IDs and insert stations (simplified for manual seed)
INSERT INTO estaciones (nombre, zona_id) 
SELECT 'Estación Centro', id FROM zonas WHERE nombre = 'Zona Norte' LIMIT 1;
INSERT INTO estaciones (nombre, zona_id) 
SELECT 'Estación Norte', id FROM zonas WHERE nombre = 'Zona Norte' LIMIT 1;
INSERT INTO estaciones (nombre, zona_id) 
SELECT 'Estación Sur', id FROM zonas WHERE nombre = 'Zona Sur' LIMIT 1;
