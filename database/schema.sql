-- ============================================================================
-- SISTEMA CMMS / GMAO (INSPIRADO EN FRACTTAL) - RED DE 528 LOCALES ARGENTINA
-- Esquema Relacional PostgreSQL (Fase 1 Activa + Fase 2 Latente)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ZONAS Y 528 LOCALES
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL, -- 'CABA', 'GBA', 'Interior'
    supervisor_user_id INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    zone_id INT REFERENCES zones(id) ON DELETE SET NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    surface_sqm NUMERIC(8, 2),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USUARIOS Y ASIGNACIÓN DE LOCALES
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(30) NOT NULL, -- 'admin', 'jefe_mantenimiento', 'tecnico', 'encargado_local'
    company_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE zones
    ADD CONSTRAINT fk_zones_supervisor
    FOREIGN KEY (supervisor_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE user_store_assignments (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    store_id INT REFERENCES stores(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, store_id)
);

-- 3. ACTIVOS (CLIMATIZACIÓN HOY, FRÍO COMERCIAL MAÑANA)
CREATE TABLE asset_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL, -- 'HVAC', 'REFRIG'
    name VARCHAR(100) NOT NULL
);

CREATE TABLE asset_types (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES asset_categories(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL -- 'Split Muro', 'Piso-Techo', 'Rooftop', 'Cortina de Aire'
);

CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    store_id INT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    asset_type_id INT NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
    tag_code VARCHAR(50) UNIQUE NOT NULL,
    qr_code_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    location_in_store VARCHAR(100),
    criticality VARCHAR(20) DEFAULT 'media', -- 'baja', 'media', 'alta', 'critica'
    status VARCHAR(30) DEFAULT 'operativo',  -- 'operativo', 'con_falla', 'en_reparacion', 'baja'
    capacity_kcal_fg INT,
    refrigerant_type VARCHAR(30),
    power_supply VARCHAR(30),
    is_inverter BOOLEAN DEFAULT FALSE,
    installation_date DATE,
    warranty_expiration DATE,
    technical_specs JSONB DEFAULT '{}'::jsonb,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PUNTO 2: SOLICITUDES DE MANTENIMIENTO (ACTIVO EN FASE 1)
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    asset_id INT REFERENCES assets(id) ON DELETE SET NULL,
    created_by_user_id INT REFERENCES users(id),
    failure_symptom VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'media',
    description TEXT,
    photo_evidence_url TEXT,
    status VARCHAR(30) DEFAULT 'abierto', -- 'abierto', 'asignado', 'en_visita', 'resuelto', 'cancelado'
    assigned_technician_id INT REFERENCES users(id),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attended_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_comment TEXT,
    closing_photo_url TEXT
);

-- 5. PUNTO 4: PLANES PREVENTIVOS Y CHECKLISTS (ACTIVO EN FASE 1)
CREATE TABLE maintenance_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    asset_type_id INT REFERENCES asset_types(id),
    frequency_days INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE plan_checklist_items (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL REFERENCES maintenance_plans(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    task_description VARCHAR(255) NOT NULL,
    input_type VARCHAR(30) DEFAULT 'check', -- 'check', 'number', 'photo'
    unit VARCHAR(20)
);

CREATE TABLE preventive_executions (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL REFERENCES maintenance_plans(id),
    asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    technician_id INT REFERENCES users(id),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    results JSONB NOT NULL,
    observations TEXT,
    signature_url TEXT,
    sync_offline_id UUID UNIQUE
);

-- ============================================================================
-- TABLAS ESQUELETO PARA FASE 2 (PUNTOS 3, 5 Y 8 - LATENTES EN BD)
-- ============================================================================

CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    wo_number VARCHAR(30) UNIQUE NOT NULL,
    request_id INT REFERENCES maintenance_requests(id) ON DELETE SET NULL,
    plan_id INT REFERENCES maintenance_plans(id) ON DELETE SET NULL,
    store_id INT NOT NULL REFERENCES stores(id),
    asset_id INT NOT NULL REFERENCES assets(id),
    assigned_to_id INT REFERENCES users(id),
    wo_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) DEFAULT 'pendiente',
    scheduled_date DATE,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    labor_cost NUMERIC(12, 2) DEFAULT 0,
    parts_cost NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    zone_id INT REFERENCES zones(id)
);

CREATE TABLE spare_parts (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    min_stock NUMERIC(8, 2) DEFAULT 0,
    unit_cost NUMERIC(10, 2) DEFAULT 0
);

CREATE TABLE work_order_parts_used (
    id SERIAL PRIMARY KEY,
    work_order_id INT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    spare_part_id INT NOT NULL REFERENCES spare_parts(id),
    warehouse_id INT REFERENCES warehouses(id),
    quantity NUMERIC(8, 2) NOT NULL,
    cost_at_moment NUMERIC(10, 2)
);

CREATE TABLE iot_telemetry (
    id BIGSERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    device_mac VARCHAR(50),
    metric_type VARCHAR(50) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÍNDICES DE RENDIMIENTO PARA ESCALA DE 528 LOCALES Y MILES DE ACTIVOS
-- ============================================================================
CREATE INDEX idx_stores_zone_id ON stores(zone_id);
CREATE INDEX idx_stores_code ON stores(code);
CREATE INDEX idx_assets_store_id ON assets(store_id);
CREATE INDEX idx_assets_type_id ON assets(asset_type_id);
CREATE INDEX idx_assets_qr_uuid ON assets(qr_code_uuid);
CREATE INDEX idx_assets_status_criticality ON assets(status, criticality);
CREATE INDEX idx_assets_technical_specs_gin ON assets USING GIN (technical_specs);
CREATE INDEX idx_requests_store_status ON maintenance_requests(store_id, status);
CREATE INDEX idx_requests_asset_id ON maintenance_requests(asset_id);
CREATE INDEX idx_requests_technician_id ON maintenance_requests(assigned_technician_id);
CREATE INDEX idx_requests_reported_at ON maintenance_requests(reported_at DESC);
CREATE INDEX idx_preventive_executions_asset ON preventive_executions(asset_id, executed_at DESC);
CREATE INDEX idx_iot_telemetry_asset_time ON iot_telemetry(asset_id, recorded_at DESC);
