# ❄️ Sistema CMMS / GMAO (Inspirado en Fracttal) — Red de 528 Locales Argentina

Plataforma **Full-Stack (Web Admin + App Móvil PWA Offline-First)** diseñada bajo lineamientos **ISO 55000** para la gestión integral de mantenimiento de una red de **528 sucursales** distribuidas en `CABA`, `GBA` e `Interior`.

---

## 🏗️ 1. Arquitectura y Enfoque por Fases

### Fase 1 — Activa en este MVP (Climatización HVAC)
1. **Módulo 1 — Gestión de Activos e Instalaciones (`zones`, `stores`, `asset_categories`, `asset_types`, `assets`)**:
   - Jerarquía completa: `Región` (`CABA`, `GBA`, `Interior`) $\rightarrow$ `Zona` (8 zonas operativas) $\rightarrow$ `Local` (528 locales) $\rightarrow$ `Activo HVAC` (`Split Muro`, `Piso-Techo`, `Rooftop`, `Cortina de Aire`).
   - Identificación unívoca por `tag_code` y código QR (`qr_code_uuid`), criticidad ISO 55000 (`baja`, `media`, `alta`, `critica`) y atributos técnicos extensibles en `technical_specs` (`JSONB` con índice GIN).
2. **Módulo 2 — Solicitudes de Mantenimiento / Ticketing (`maintenance_requests`)**:
   - Reporte de fallas desde tienda con catálogo de síntomas estandarizados de climatización, adjunto fotográfico, prioridad SLA y máquina de estados (`abierto` $\rightarrow$ `asignado` $\rightarrow$ `en_visita` $\rightarrow$ `resuelto` / `cancelado`).
3. **Módulo 3 — Planes Preventivos y Checklists Dinámicos (`maintenance_plans`, `plan_checklist_items`, `preventive_executions`)**:
   - Pasos configurables con tipos de entrada `check`, `number` (con unidad física: `°C`, `PSI`, `A`, `m/s`) y `photo`.
   - Captura de resultados en `results` (`JSONB`), firma digital de conformidad en pantalla táctil (`signature_url`) e idempotencia de sincronización mediante `sync_offline_id` (`UUID`).
4. **Módulo 4 — KPIs y Métricas Operativas**:
   - Cálculo en tiempo real de **MTTR** (Mean Time To Repair), **MTBF** (Mean Time Between Failures), **Disponibilidad Técnica del Parque HVAC (%)** y **Cumplimiento de SLA (%)** según severidad.
5. **Módulo 5 — App Móvil PWA Offline-First y Escáner QR**:
   - Soporte de operación desconectada (`Service Worker` + `localStorage` / cola de sincronización con `sync_offline_id` UUID) y lector de etiquetas QR de activos.

### Fase 2 — Latente en Base de Datos (Tablas creadas en SQL y Prisma, sin UI aún)
- **Equipos de Frío Alimentario / Comercial (`REFRIG`)**: Ya precargados en `asset_categories` y `asset_types` (Heladeras murales, pozos de frío, cámaras frigoríficas, centrales de frío).
- **Motor Complejo de Órdenes de Trabajo (`work_orders`)**: Con costos detallados de mano de obra (`labor_cost`) y repuestos (`parts_cost`).
- **Gestión de Almacenes, Pañoles e Inventario (`warehouses`, `spare_parts`, `work_order_parts_used`)**.
- **Telemetría IoT y Alertas Predictivas (`iot_telemetry`)**.

---

## 📂 2. Estructura del Proyecto

- [`database/schema.sql`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/database/schema.sql): Esquema relacional PostgreSQL exacto con las 15 tablas e índices de alto rendimiento (incluyendo índice GIN sobre `technical_specs`).
- [`database/seed.sql`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/database/seed.sql): Datos iniciales + generación procedural con `generate_series` de los **528 locales** distribuidos en las 8 zonas de Argentina.
- [`prisma/schema.prisma`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/prisma/schema.prisma): Modelo Prisma ORM mapeado 1:1 con el esquema SQL.
- [`docker-compose.yml`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/docker-compose.yml): Contenedor PostgreSQL 16 que ejecuta automáticamente el esquema y el seed al iniciar.
- [`src/types/cmms.ts`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/src/types/cmms.ts): Definiciones TypeScript de todas las entidades y KPIs.
- [`src/lib/kpi-engine.ts`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/src/lib/kpi-engine.ts): Motor de cálculo de `MTTR`, `MTBF`, `Disponibilidad` y `SLA`.
- [`src/lib/initial-data.ts`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/src/lib/initial-data.ts): Dataset inicial de zonas, sucursales, activos HVAC, tickets y planes preventivos.
- [`src/app/page.tsx`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/src/app/page.tsx): Aplicación Full-Stack (Consola Web Admin + App Móvil PWA Offline-First).
- [`preview-cmms.html`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/preview-cmms.html): Vista previa interactiva autónoma para abrir directamente en cualquier navegador sin requerir instalación previa.

---

## 🚀 3. Cómo Ejecutar el Proyecto

### Opción A: Vista Previa Inmediata (Sin dependencias)
Podés abrir directamente el archivo [`preview-cmms.html`](file:///c:/Users/hugo_morales/Documents/antigravity/vibrant-oppenheimer/preview-cmms.html) haciendo doble clic en tu navegador para probar los tableros, activos QR, tickets, checklists y modo Offline.

### Opción B: Entorno Completo Next.js + PostgreSQL + Prisma
1. **Iniciar Base de Datos PostgreSQL 16 (con las 15 tablas y los 528 locales precargados):**
   ```bash
   docker compose up -d
   ```
2. **Instalar Node.js LTS** (si aún no está instalado en el equipo):
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```
3. **Instalar dependencias y levantar servidor de desarrollo:**
   ```bash
   cp .env.example .env
   npm install
   npm run db:generate
   npm run dev
   ```
   Luego ingresá en `http://localhost:3000`.
