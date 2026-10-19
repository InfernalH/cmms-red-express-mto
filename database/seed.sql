-- ============================================================================
-- SEED INICIAL: RED DE 528 LOCALES ARGENTINA - SISTEMA CMMS / GMAO (HVAC FASE 1)
-- ============================================================================

-- 1. USUARIOS BASE
INSERT INTO users (id, full_name, email, phone, role, company_name, is_active) VALUES
(1, 'Ing. Martín Echeverría', 'mecheverria@redretail.com.ar', '+54 11 4500-1001', 'admin', 'Red Retail Argentina S.A.', TRUE),
(2, 'Ing. Laura Gómez', 'lgomez@redretail.com.ar', '+54 11 4500-1002', 'jefe_mantenimiento', 'Red Retail Argentina S.A.', TRUE),
(3, 'Carlos Rodríguez', 'crodriguez@clima-service.com.ar', '+54 11 5890-2211', 'tecnico', 'ClimaService SRL (CABA/GBA)', TRUE),
(4, 'Diego Fernández', 'dfernandez@termomecanica-sur.com.ar', '+54 11 6120-3344', 'tecnico', 'Termomecánica Sur SA', TRUE),
(5, 'Matías Sosa', 'msosa@friocordoba.com.ar', '+54 351 511-8899', 'tecnico', 'Frío y Clima Interior SRL', TRUE),
(6, 'Sofía Peralta', 'encargado.001@redretail.com.ar', '+54 11 4321-0001', 'encargado_local', 'Red Retail Argentina S.A.', TRUE),
(7, 'Javier Morales', 'encargado.014@redretail.com.ar', '+54 11 4788-0014', 'encargado_local', 'Red Retail Argentina S.A.', TRUE),
(8, 'Luciana Quiroga', 'encargado.105@redretail.com.ar', '+54 351 422-0105', 'encargado_local', 'Red Retail Argentina S.A.', TRUE);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. ZONAS OPERATIVAS (AGRUPANDO LOS 528 LOCALES)
INSERT INTO zones (id, name, region, supervisor_user_id) VALUES
(1, 'CABA Centro y Corredor Norte', 'CABA', 2),
(2, 'CABA Sur y Oeste', 'CABA', 2),
(3, 'GBA Norte (Vicente López a Pilar)', 'GBA', 2),
(4, 'GBA Oeste (Morón a Luján)', 'GBA', 2),
(5, 'GBA Sur (Avellaneda a La Plata)', 'GBA', 2),
(6, 'Región Centro (Córdoba y Santa Fe)', 'Interior', 2),
(7, 'Región Cuyo y NOA (Mendoza, Tucumán, Salta)', 'Interior', 2),
(8, 'Región Patagonia y Costa Atlántica', 'Interior', 2);

SELECT setval('zones_id_seq', (SELECT MAX(id) FROM zones));

-- 3. LOCALES CABECERA + GENERACIÓN AUTOMÁTICA DE LOS 528 LOCALES DE LA RED
INSERT INTO stores (id, code, name, zone_id, address, city, province, latitude, longitude, surface_sqm, phone, is_active) VALUES
(1, 'LOC-001', 'Sucursal Palermo Soho', 1, 'Av. Santa Fe 4250', 'CABA', 'CABA', -34.58150000, -58.42100000, 185.50, '011-4831-1001', TRUE),
(2, 'LOC-002', 'Sucursal Belgrano Cabildo', 1, 'Av. Cabildo 2140', 'CABA', 'CABA', -34.56120000, -58.45670000, 220.00, '011-4784-1002', TRUE),
(3, 'LOC-003', 'Sucursal Microcentro Florida', 1, 'Florida 540', 'CABA', 'CABA', -34.60110000, -58.37520000, 160.00, '011-4322-1003', TRUE),
(4, 'LOC-004', 'Sucursal Caballito Acoyte', 2, 'Av. Rivadavia 5120', 'CABA', 'CABA', -34.61850000, -58.43620000, 195.00, '011-4901-1004', TRUE),
(5, 'LOC-005', 'Sucursal San Isidro Centro', 3, 'Av. Centenario 650', 'San Isidro', 'Buenos Aires', -34.47210000, -58.51420000, 210.00, '011-4743-1005', TRUE),
(6, 'LOC-006', 'Sucursal Vicente López Maipú', 3, 'Av. Maipú 1420', 'Vicente López', 'Buenos Aires', -34.52650000, -58.47890000, 175.00, '011-4795-1006', TRUE),
(7, 'LOC-007', 'Sucursal Ramos Mejía', 4, 'Av. de Mayo 340', 'Ramos Mejía', 'Buenos Aires', -34.64320000, -58.56410000, 240.00, '011-4658-1007', TRUE),
(8, 'LOC-008', 'Sucursal Quilmes Peatonal', 5, 'Rivadavia 215', 'Quilmes', 'Buenos Aires', -34.72150000, -58.25460000, 205.00, '011-4253-1008', TRUE),
(9, 'LOC-009', 'Sucursal La Plata Calle 8', 5, 'Calle 8 N° 845', 'La Plata', 'Buenos Aires', -34.91870000, -57.95120000, 230.00, '0221-421-1009', TRUE),
(10, 'LOC-010', 'Sucursal Córdoba Nueva Córdoba', 6, 'Bv. Chacabuco 620', 'Córdoba', 'Córdoba', -31.42450000, -64.18420000, 260.00, '0351-425-1010', TRUE),
(11, 'LOC-011', 'Sucursal Rosario Pellegrini', 6, 'Av. Pellegrini 1580', 'Rosario', 'Santa Fe', -32.95620000, -60.64810000, 215.00, '0341-448-1011', TRUE),
(12, 'LOC-012', 'Sucursal Mendoza Centro', 7, 'Av. San Martín 1290', 'Mendoza', 'Mendoza', -32.88950000, -68.84120000, 225.00, '0261-423-1012', TRUE),
(13, 'LOC-013', 'Sucursal Mar del Plata Güemes', 8, 'Güemes 2850', 'Mar del Plata', 'Buenos Aires', -38.01240000, -57.54110000, 190.00, '0223-451-1013', TRUE),
(14, 'LOC-014', 'Sucursal Neuquén Capital', 8, 'Av. Argentina 410', 'Neuquén', 'Neuquén', -38.95160000, -68.05910000, 250.00, '0299-442-1014', TRUE);

-- Completar hasta los 528 locales de la red distribuida en las 8 zonas
INSERT INTO stores (id, code, name, zone_id, address, city, province, latitude, longitude, surface_sqm, phone, is_active)
SELECT
    n,
    'LOC-' || LPAD(n::text, 3, '0'),
    'Sucursal Red N° ' || LPAD(n::text, 3, '0'),
    ((n - 1) % 8) + 1,
    'Av. Comercial ' || (n * 15),
    CASE ((n - 1) % 8) + 1
        WHEN 1 THEN 'CABA'
        WHEN 2 THEN 'CABA'
        WHEN 3 THEN 'Tigre / Pilar'
        WHEN 4 THEN 'Morón / Ituzaingó'
        WHEN 5 THEN 'Lomas de Zamora / Adrogué'
        WHEN 6 THEN 'Córdoba / Rosario'
        WHEN 7 THEN 'Mendoza / Tucumán'
        ELSE 'Mar del Plata / Bahía Blanca'
    END,
    CASE ((n - 1) % 8) + 1
        WHEN 1 THEN 'CABA'
        WHEN 2 THEN 'CABA'
        WHEN 3 THEN 'Buenos Aires'
        WHEN 4 THEN 'Buenos Aires'
        WHEN 5 THEN 'Buenos Aires'
        WHEN 6 THEN 'Córdoba'
        WHEN 7 THEN 'Mendoza'
        ELSE 'Buenos Aires'
    END,
    -34.60000000 - ((n % 50) * 0.015),
    -58.40000000 - ((n % 40) * 0.020),
    150.00 + ((n * 7) % 140),
    '0800-555-' || LPAD(n::text, 4, '0'),
    TRUE
FROM generate_series(15, 528) AS n;

SELECT setval('stores_id_seq', (SELECT MAX(id) FROM stores));

-- Asignación de locales a usuarios
INSERT INTO user_store_assignments (user_id, store_id) VALUES
(6, 1), (6, 2), (6, 3),
(7, 5), (7, 6),
(8, 10), (8, 11);

-- 4. CATEGORÍAS Y TIPOS DE ACTIVOS (FASE 1 HVAC ACTIVO + FASE 2 REFRIG PREPARADO)
INSERT INTO asset_categories (id, code, name) VALUES
(1, 'HVAC', 'Climatización y Aire Acondicionado (Fase 1 Activa)'),
(2, 'REFRIG', 'Frío Alimentario y Comercial (Fase 2 Preparado en BD)');

SELECT setval('asset_categories_id_seq', (SELECT MAX(id) FROM asset_categories));

INSERT INTO asset_types (id, category_id, name) VALUES
-- Fase 1: HVAC
(1, 1, 'Split Muro'),
(2, 1, 'Piso-Techo'),
(3, 1, 'Rooftop'),
(4, 1, 'Cortina de Aire'),
-- Fase 2: Frío Alimentario / Comercial (Preparado en BD)
(5, 2, 'Heladera Mural Lácteos/Fiambres'),
(6, 2, 'Pozo de Frío Congelados'),
(7, 2, 'Cámara Frigorífica Media/Baja Temp'),
(8, 2, 'Central de Frío / Rack Compresores');

SELECT setval('asset_types_id_seq', (SELECT MAX(id) FROM asset_types));

-- 5. ACTIVOS HVAC CON FICHA TÉCNICA JSONB Y CRITICIDAD ISO 55000
INSERT INTO assets (
    id, store_id, asset_type_id, tag_code, qr_code_uuid, brand, model, serial_number,
    location_in_store, criticality, status, capacity_kcal_fg, refrigerant_type,
    power_supply, is_inverter, installation_date, warranty_expiration, technical_specs
) VALUES
(
    1, 1, 3, 'HVAC-LOC001-RT01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Carrier', '50TC-D12', 'SN-CAR-2023-8812', 'Azotea Técnica - Salón Principal',
    'critica', 'operativo', 30000, 'R410A', '380V Trifásico', TRUE,
    '2023-02-15', '2026-02-15',
    '{"caudal_m3h": 6800, "consumo_nominal_amp": 18.4, "compresores": 2, "filtros_medida": "600x600x50mm G4", "presion_alta_psi": 380, "presion_baja_psi": 118, "norma_iso55000_impacto": "Confort térmico total salón y cajas"}'::jsonb
),
(
    2, 1, 2, 'HVAC-LOC001-PT01', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'Surrey', '651QFB060', 'SN-SUR-2022-4410', 'Salón de Ventas Sector Cajas',
    'alta', 'con_falla', 15000, 'R410A', '380V Trifásico', TRUE,
    '2022-11-10', '2025-11-10',
    '{"caudal_m3h": 2100, "consumo_nominal_amp": 9.2, "bomba_condensado": true, "presion_alta_psi": 365, "presion_baja_psi": 115}'::jsonb
),
(
    3, 1, 4, 'HVAC-LOC001-CA01', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'BGH', 'CA-1200-PRO', 'SN-BGH-2023-1092', 'Acceso Peatonal Principal',
    'media', 'operativo', 0, 'N/A', '220V Monofásico', FALSE,
    '2023-03-01', '2025-03-01',
    '{"ancho_mm": 1200, "velocidad_aire_ms": 11.5, "consumo_watts": 320, "sensor_puerta_magnetico": true}'::jsonb
),
(
    4, 2, 2, 'HVAC-LOC002-PT01', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'Daikin', 'FHQ125BVV', 'SN-DAI-2024-0091', 'Salón Central Belgrano',
    'critica', 'operativo', 18000, 'R32', '380V Trifásico', TRUE,
    '2024-01-20', '2027-01-20',
    '{"caudal_m3h": 2400, "consumo_nominal_amp": 8.1, "control_centralizado": "Modbus RTU"}'::jsonb
),
(
    5, 2, 1, 'HVAC-LOC002-SM01', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'Midea', 'MSAG-6000', 'SN-MID-2023-7721', 'Oficina Gerencia y Rack IT',
    'critica', 'en_reparacion', 6000, 'R410A', '220V Monofásico', TRUE,
    '2023-06-12', '2025-06-12',
    '{"caudal_m3h": 950, "consumo_nominal_amp": 7.5, "uso_24x7": true, "setpoint_recomendado_c": 21}'::jsonb
),
(
    6, 3, 3, 'HVAC-LOC003-RT01', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    'Trane', 'Voyager YSC092', 'SN-TRA-2021-3319', 'Terraza Microcentro',
    'critica', 'operativo', 24000, 'R410A', '380V Trifásico', FALSE,
    '2021-09-05', '2024-09-05',
    '{"caudal_m3h": 5400, "consumo_nominal_amp": 15.8, "economizador_entalpico": true}'::jsonb
),
(
    7, 5, 2, 'HVAC-LOC005-PT01', '16eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    'Surrey', '651QFB060', 'SN-SUR-2023-9012', 'Salón Principal San Isidro',
    'alta', 'operativo', 15000, 'R410A', '380V Trifásico', TRUE,
    '2023-04-18', '2026-04-18',
    '{"caudal_m3h": 2100, "consumo_nominal_amp": 9.0, "bomba_condensado": false}'::jsonb
),
(
    8, 10, 3, 'HVAC-LOC010-RT01', '27eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    'Carrier', '50TC-D08', 'SN-CAR-2022-5501', 'Azotea Nueva Córdoba',
    'critica', 'con_falla', 22500, 'R410A', '380V Trifásico', TRUE,
    '2022-10-14', '2025-10-14',
    '{"caudal_m3h": 5100, "consumo_nominal_amp": 14.2, "compresores": 1, "filtros_medida": "500x500x50mm G4"}'::jsonb
);

SELECT setval('assets_id_seq', (SELECT MAX(id) FROM assets));

-- 6. SOLICITUDES DE MANTENIMIENTO / TICKETS (CON DATOS REALES PARA MTTR, MTBF Y SLA)
INSERT INTO maintenance_requests (
    id, ticket_number, store_id, asset_id, created_by_user_id, failure_symptom,
    priority, description, status, assigned_technician_id,
    reported_at, attended_at, resolved_at, resolution_comment
) VALUES
(
    1, 'TCK-2026-0001', 1, 2, 6, 'Pérdida de agua / Goteo interior',
    'alta', 'El equipo Piso-Techo sobre la línea de cajas N° 2 y 3 gotea de forma continua sobre el mostrador.',
    'en_visita', 3,
    CURRENT_TIMESTAMP - INTERVAL '5 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    NULL, NULL
),
(
    2, 'TCK-2026-0002', 2, 5, 6, 'No enfría / Compresor no acopla',
    'critica', 'El Split del cuarto de Rack IT / Gerencia marca error E4 y la temperatura subió a 29°C.',
    'asignado', 3,
    CURRENT_TIMESTAMP - INTERVAL '3 hours',
    NULL, NULL, NULL
),
(
    3, 'TCK-2026-0003', 10, 8, 8, 'Salta térmica / Disyuntor en tablero',
    'critica', 'Al encender el Rooftop principal de salón a las 08:30 hs salta el guardamotor en el tablero seccional.',
    'abierto', NULL,
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    NULL, NULL, NULL
),
(
    4, 'TCK-2026-0004', 1, 1, 6, 'Bajo rendimiento / Filtros saturados',
    'media', 'Poca salida de caudal de aire en difusores centrales del salón.',
    'resuelto', 3,
    CURRENT_TIMESTAMP - INTERVAL '12 days',
    CURRENT_TIMESTAMP - INTERVAL '12 days' + INTERVAL '2 hours',
    CURRENT_TIMESTAMP - INTERVAL '12 days' + INTERVAL '4 hours 30 minutes',
    'Se reemplazaron 4 filtros G4 colmatados, se limpió serpentina evaporadora y se verificaron presiones (118 PSI baja / 375 PSI alta). Queda operativo.'
),
(
    5, 'TCK-2026-0005', 3, 6, 6, 'Ruido anormal en turbina',
    'alta', 'Vibración fuerte en el gabinete del Rooftop al pasar a segunda velocidad.',
    'resuelto', 4,
    CURRENT_TIMESTAMP - INTERVAL '8 days',
    CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '1 hour 30 minutes',
    CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '5 hours',
    'Se tensaron correas de transmisión en forzador evaporador y se balanceó polea motora. Consumo medido: 15.4 A.'
),
(
    6, 'TCK-2026-0006', 5, 7, 7, 'Error en display / Placa electrónica',
    'media', 'Parpadeo de LED Timer en unidad interior Piso-Techo.',
    'resuelto', 3,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '3 hours',
    CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '6 hours 15 minutes',
    'Se reemplazó sensor de pozo de serpentina (NTC 10k) desvalorizado. Prueba de marcha durante 40 min exitosa.'
);

SELECT setval('maintenance_requests_id_seq', (SELECT MAX(id) FROM maintenance_requests));

-- 7. PLANES DE MANTENIMIENTO PREVENTIVO Y CHECKLISTS DINÁMICOS
INSERT INTO maintenance_plans (id, name, asset_type_id, frequency_days, is_active) VALUES
(1, 'Preventivo Mensual Split Muro / Piso-Techo (Limpieza y Control Eléctrico)', 2, 30, TRUE),
(2, 'Preventivo Trimestral Rooftop Alta Capacidad (ISO 55000)', 3, 90, TRUE),
(3, 'Preventivo Bimestral Cortina de Aire Acceso Tienda', 4, 60, TRUE);

SELECT setval('maintenance_plans_id_seq', (SELECT MAX(id) FROM maintenance_plans));

INSERT INTO plan_checklist_items (id, plan_id, step_order, task_description, input_type, unit) VALUES
-- Plan 1: Split / Piso-Techo
(1, 1, 1, 'Limpieza y sanitizado de filtros de aire de retorno', 'check', NULL),
(2, 1, 2, 'Desobstrucción de bandeja y manguera de drenaje de condensado', 'check', NULL),
(3, 1, 3, 'Medición de salto térmico (Delta T entre retorno e inyección)', 'number', '°C'),
(4, 1, 4, 'Medición de corriente de trabajo del compresor con pinza amperométrica', 'number', 'A'),
(5, 1, 5, 'Fotografía del equipo limpio y display encendido', 'photo', NULL),
-- Plan 2: Rooftop
(6, 2, 1, 'Reemplazo o lavado de banco de filtros G4 y revisión de correas', 'check', NULL),
(7, 2, 2, 'Verificación de ajuste de borneras de fuerza y contactores trifásicos', 'check', NULL),
(8, 2, 3, 'Medición de presión de succión (Baja) R410A en marcha', 'number', 'PSI'),
(9, 2, 4, 'Medición de consumo por fase (Fase R / S / T promedio)', 'number', 'A'),
(10, 2, 5, 'Fotografía de placa de medición / manómetros conectados', 'photo', NULL),
-- Plan 3: Cortina de Aire
(11, 3, 1, 'Limpieza de turbina tangencial y rejilla de aspiración', 'check', NULL),
(12, 3, 2, 'Verificación de switch magnético de apertura de puerta', 'check', NULL),
(13, 3, 3, 'Medición de velocidad de barrido de aire a 1 metro de altura', 'number', 'm/s');

SELECT setval('plan_checklist_items_id_seq', (SELECT MAX(id) FROM plan_checklist_items));

-- Ejecución preventiva histórica de ejemplo
INSERT INTO preventive_executions (
    id, plan_id, asset_id, technician_id, executed_at, results, observations, signature_url, sync_offline_id
) VALUES
(
    1, 2, 1, 3, CURRENT_TIMESTAMP - INTERVAL '10 days',
    '{"6": true, "7": true, "8": 119, "9": 18.1, "10": "evidencia_manometros_rt01.jpg"}'::jsonb,
    'Equipo Rooftop Carrier en óptimas condiciones operativas. Correas con tensión adecuada y filtros nuevos.',
    'firmado_conformidad_sofia_peralta',
    '99eebc99-9c0b-4ef8-bb6d-6bb9bd380a99'
);

SELECT setval('preventive_executions_id_seq', (SELECT MAX(id) FROM preventive_executions));
