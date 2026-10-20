"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  INITIAL_ASSETS,
  INITIAL_ASSET_TYPES,
  INITIAL_CHECKLIST_ITEMS,
  INITIAL_MAINTENANCE_PLANS,
  INITIAL_PREVENTIVE_EXECUTIONS,
  INITIAL_REQUESTS,
  INITIAL_STORES,
  INITIAL_USERS,
  INITIAL_ZONES,
  STANDARD_HVAC_SYMPTOMS,
} from "@/lib/initial-data";
import {
  calculateOperationalKPIs,
  SLA_HOURS_BY_PRIORITY,
} from "@/lib/kpi-engine";
import { QrCodeSvg } from "@/components/QrCodeSvg";
import {
  Asset,
  AssetStatus,
  CriticalityLevel,
  MaintenanceRequest,
  OfflineQueueItem,
  PreventiveExecution,
  RegionType,
  TicketPriority,
  TicketStatus,
  User,
} from "@/types/cmms";

type ActiveTab =
  | "home"
  | "assets"
  | "asset_360"
  | "tickets"
  | "preventive"
  | "kpis"
  | "mobile_pwa"
  | "db_architecture";

function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function CMMSPlatformPage() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [requests, setRequests] =
    useState<MaintenanceRequest[]>(INITIAL_REQUESTS);
  const [executions, setExecutions] = useState<PreventiveExecution[]>(
    INITIAL_PREVENTIVE_EXECUTIONS
  );
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[1]);

  // Filtros de Jerarquía (Región -> Zona -> Local -> Activo)
  const [selectedRegion, setSelectedRegion] = useState<RegionType | "TODAS">(
    "TODAS"
  );
  const [selectedZoneId, setSelectedZoneId] = useState<number | "TODAS">(
    "TODAS"
  );
  const [selectedStoreId, setSelectedStoreId] = useState<number | "TODOS">(
    "TODOS"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(
    INITIAL_ASSETS[0]
  );

  // Modal de Impresión de Etiquetas QR
  const [qrPrintAssets, setQrPrintAssets] = useState<Asset[] | null>(null);

  // Modal de Nuevo Activo HVAC
  const [showNewAssetModal, setShowNewAssetModal] = useState<boolean>(false);
  const [newAssetForm, setNewAssetForm] = useState({
    store_id: 1,
    asset_type_id: 1,
    tag_code: "HVAC-LOC001-SM02",
    brand: "Daikin",
    model: "FTXM50M",
    serial_number: "SN-DAI-2026-1104",
    location_in_store: "Línea de Cajas Rápidas",
    criticality: "alta" as CriticalityLevel,
    capacity_kcal_fg: 4500,
    refrigerant_type: "R32",
    power_supply: "220V Monofásico",
    is_inverter: true,
    custom_spec_key: "consumo_nominal_amp",
    custom_spec_val: "6.4",
  });

  // Formulario de Nuevo Ticket
  const [newTicketForm, setNewTicketForm] = useState({
    store_id: 1,
    asset_id: 2,
    failure_symptom: STANDARD_HVAC_SYMPTOMS[0],
    priority: "alta" as TicketPriority,
    description: "",
    photo_evidence_url: "",
  });

  // Estado de Ejecución de Checklist Preventivo
  const [selectedPlanId, setSelectedPlanId] = useState<number>(2);
  const [selectedPreventiveAssetId, setSelectedPreventiveAssetId] =
    useState<number>(1);
  const [checklistValues, setChecklistValues] = useState<
    Record<string, boolean | number | string>
  >({
    "6": true,
    "7": true,
    "8": 118,
    "9": 18.2,
    "10": "foto_manometros_campo.jpg",
  });
  const [preventiveObservations, setPreventiveObservations] =
    useState<string>("");
  const [signatureText, setSignatureText] = useState<string>(
    "Conformidad Encargado Local - Sofía Peralta"
  );

  // Estado de Escáner QR en App Móvil
  const [qrInputCode, setQrInputCode] = useState<string>("");
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(
    INITIAL_ASSETS[0]
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    let loadedAssets = INITIAL_ASSETS;
    try {
      const savedAssets = localStorage.getItem("cmms_528_assets");
      const savedRequests = localStorage.getItem("cmms_528_requests");
      const savedExecutions = localStorage.getItem("cmms_528_executions");
      const savedQueue = localStorage.getItem("cmms_528_offline_queue");

      if (savedAssets) {
        loadedAssets = JSON.parse(savedAssets);
        setAssets(loadedAssets);
      }
      if (savedRequests) setRequests(JSON.parse(savedRequests));
      if (savedExecutions) setExecutions(JSON.parse(savedExecutions));
      if (savedQueue) setOfflineQueue(JSON.parse(savedQueue));
    } catch {
      // Ignorar errores de parseo
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qrParam = params.get("qr");
      if (qrParam) {
        const q = qrParam.trim().toLowerCase();
        const found = loadedAssets.find(
          (a) =>
            a.qr_code_uuid.toLowerCase() === q ||
            a.tag_code.toLowerCase() === q ||
            a.qr_code_uuid.toLowerCase().startsWith(q)
        );
        if (found) {
          setSelectedAsset(found);
          setScannedAsset(found);
          setActiveTab("asset_360");
        }
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cmms_528_assets", JSON.stringify(assets));
      localStorage.setItem("cmms_528_requests", JSON.stringify(requests));
      localStorage.setItem("cmms_528_executions", JSON.stringify(executions));
      localStorage.setItem(
        "cmms_528_offline_queue",
        JSON.stringify(offlineQueue)
      );
    } catch {
      // Ignorar cuota excedida
    }
  }, [assets, requests, executions, offlineQueue]);

  const kpis = useMemo(
    () => calculateOperationalKPIs(assets, requests, executions, 528),
    [assets, requests, executions]
  );

  const filteredZones = useMemo(() => {
    if (selectedRegion === "TODAS") return INITIAL_ZONES;
    return INITIAL_ZONES.filter((z) => z.region === selectedRegion);
  }, [selectedRegion]);

  const filteredStores = useMemo(() => {
    const validZoneIds = new Set(filteredZones.map((z) => z.id));
    return INITIAL_STORES.filter((s) => {
      if (selectedZoneId !== "TODAS" && s.zone_id !== selectedZoneId)
        return false;
      return validZoneIds.has(s.zone_id);
    });
  }, [filteredZones, selectedZoneId]);

  const filteredAssets = useMemo(() => {
    const validStoreIds = new Set(filteredStores.map((s) => s.id));
    return assets.filter((a) => {
      if (selectedStoreId !== "TODOS" && a.store_id !== selectedStoreId)
        return false;
      if (!validStoreIds.has(a.store_id)) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const store = INITIAL_STORES.find((s) => s.id === a.store_id);
        return (
          a.tag_code.toLowerCase().includes(q) ||
          a.brand.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q) ||
          a.qr_code_uuid.toLowerCase().includes(q) ||
          (store && store.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [assets, filteredStores, selectedStoreId, searchQuery]);

  const selectedAssetTickets = useMemo(() => {
    if (!selectedAsset) return [];
    return requests.filter((r) => r.asset_id === selectedAsset.id);
  }, [requests, selectedAsset]);

  const selectedAssetPreventives = useMemo(() => {
    if (!selectedAsset) return [];
    return executions.filter((ex) => ex.asset_id === selectedAsset.id);
  }, [executions, selectedAsset]);

  const enqueueIfOffline = (
    entityType: OfflineQueueItem["entity_type"],
    actionLabel: string,
    payload: unknown
  ): string => {
    const syncId = generateUuid();
    if (isOfflineMode) {
      const item: OfflineQueueItem = {
        sync_offline_id: syncId,
        entity_type: entityType,
        action_label: actionLabel,
        payload,
        created_at: new Date().toISOString(),
        synced: false,
      };
      setOfflineQueue((prev) => [item, ...prev]);
    }
    return syncId;
  };

  const handleSyncOfflineQueue = async () => {
    const pending = offlineQueue.filter((item) => !item.synced);
    if (pending.length === 0) {
      notify("La cola Offline ya está 100% sincronizada con el servidor central.");
      return;
    }

    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pending }),
      });
    } catch {
      // Fallback local
    }

    setOfflineQueue((prev) => prev.map((item) => ({ ...item, synced: true })));
    setIsOfflineMode(false);
    notify(
      `Sincronización exitosa: ${pending.length} registro(s) enviados con idempotencia UUID (sync_offline_id).`
    );
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Math.max(0, ...assets.map((a) => a.id)) + 1;
    const created: Asset = {
      id: newId,
      store_id: Number(newAssetForm.store_id),
      asset_type_id: Number(newAssetForm.asset_type_id),
      tag_code: newAssetForm.tag_code.toUpperCase(),
      qr_code_uuid: generateUuid(),
      brand: newAssetForm.brand,
      model: newAssetForm.model,
      serial_number: newAssetForm.serial_number,
      location_in_store: newAssetForm.location_in_store,
      criticality: newAssetForm.criticality,
      status: "operativo",
      capacity_kcal_fg: Number(newAssetForm.capacity_kcal_fg),
      refrigerant_type: newAssetForm.refrigerant_type,
      power_supply: newAssetForm.power_supply,
      is_inverter: newAssetForm.is_inverter,
      installation_date: new Date().toISOString().slice(0, 10),
      warranty_expiration: "2028-10-19",
      technical_specs: {
        [newAssetForm.custom_spec_key || "consumo_nominal_amp"]:
          newAssetForm.custom_spec_val || "7.8",
        protocolo_mantenimiento: "ISO 55000 Fase 1",
      },
    };

    setAssets((prev) => [created, ...prev]);
    setSelectedAsset(created);
    setShowNewAssetModal(false);
    setQrPrintAssets([created]);
    notify(
      `Activo ${created.tag_code} dado de alta. Código QR generado en base a su UUID único.`
    );
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNumber = `TCK-2026-${String(requests.length + 1).padStart(4, "0")}`;
    const syncId = enqueueIfOffline(
      "maintenance_request",
      `Nuevo Ticket ${nextNumber} (${newTicketForm.failure_symptom})`,
      newTicketForm
    );

    const newTicket: MaintenanceRequest = {
      id: requests.length + 1,
      ticket_number: nextNumber,
      store_id: Number(newTicketForm.store_id),
      asset_id: Number(newTicketForm.asset_id) || null,
      created_by_user_id: currentUser.id,
      failure_symptom: newTicketForm.failure_symptom,
      priority: newTicketForm.priority,
      description:
        newTicketForm.description ||
        `Reporte generado por ${currentUser.full_name} desde tienda.`,
      photo_evidence_url:
        newTicketForm.photo_evidence_url || "evidencia_falla_local.jpg",
      status: "abierto",
      assigned_technician_id: null,
      reported_at: new Date().toISOString(),
      attended_at: null,
      resolved_at: null,
      resolution_comment: null,
      sync_offline_id: syncId,
    };

    setRequests((prev) => [newTicket, ...prev]);

    if (newTicket.asset_id) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === newTicket.asset_id ? { ...a, status: "con_falla" } : a
        )
      );
    }

    setNewTicketForm((prev) => ({ ...prev, description: "" }));
    notify(
      isOfflineMode
        ? `Ticket ${nextNumber} guardado en Cola Offline (sync_offline_id: ${syncId.slice(0, 8)}).`
        : `Ticket ${nextNumber} creado y vinculado al historial del activo.`
    );
  };

  const handleAdvanceTicketStatus = (
    ticket: MaintenanceRequest,
    nextStatus: TicketStatus,
    technicianId?: number
  ) => {
    const nowIso = new Date().toISOString();
    let resolutionText = ticket.resolution_comment;

    if (nextStatus === "resuelto" && !resolutionText) {
      resolutionText =
        "Reparación completada en visita técnica. Parámetros eléctricos y presiones de refrigerante normalizados.";
    }

    enqueueIfOffline(
      "ticket_status_update",
      `Cambio de estado ${ticket.ticket_number} -> ${nextStatus.toUpperCase()}`,
      { ticket_id: ticket.id, status: nextStatus }
    );

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== ticket.id) return r;
        return {
          ...r,
          status: nextStatus,
          assigned_technician_id:
            technicianId ?? r.assigned_technician_id ?? 3,
          attended_at:
            nextStatus === "en_visita" && !r.attended_at
              ? nowIso
              : r.attended_at,
          resolved_at: nextStatus === "resuelto" ? nowIso : r.resolved_at,
          resolution_comment: resolutionText,
        };
      })
    );

    if (ticket.asset_id) {
      let targetAssetStatus: AssetStatus | null = null;
      if (nextStatus === "en_visita") targetAssetStatus = "en_reparacion";
      if (nextStatus === "resuelto") targetAssetStatus = "operativo";

      if (targetAssetStatus) {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === ticket.asset_id ? { ...a, status: targetAssetStatus! } : a
          )
        );
      }
    }

    notify(
      `Ticket ${ticket.ticket_number} actualizado a estado "${nextStatus.toUpperCase()}".`
    );
  };

  const handleSavePreventiveExecution = (e: React.FormEvent) => {
    e.preventDefault();
    const syncId = generateUuid();

    const newExec: PreventiveExecution = {
      id: executions.length + 1,
      plan_id: selectedPlanId,
      asset_id: selectedPreventiveAssetId,
      technician_id: currentUser.role === "tecnico" ? currentUser.id : 3,
      executed_at: new Date().toISOString(),
      results: { ...checklistValues },
      observations:
        preventiveObservations ||
        "Mantenimiento preventivo ejecutado según protocolo HVAC sin anomalías.",
      signature_url: signatureText || "Firmado en pantalla táctil",
      sync_offline_id: syncId,
    };

    if (isOfflineMode) {
      setOfflineQueue((prev) => [
        {
          sync_offline_id: syncId,
          entity_type: "preventive_execution",
          action_label: `Checklist Preventivo en Activo #${selectedPreventiveAssetId}`,
          payload: newExec,
          created_at: new Date().toISOString(),
          synced: false,
        },
        ...prev,
      ]);
    }

    setExecutions((prev) => [newExec, ...prev]);
    setPreventiveObservations("");
    notify(
      isOfflineMode
        ? `Preventivo guardado Offline con firma digital (sync_offline_id: ${syncId.slice(0, 8)}).`
        : `Checklist preventivo registrado en la Hoja de Vida del activo.`
    );
  };

  const handleScanQrAndOpenAssetHistory = (
    codeOrUuid: string,
    openFullView = true
  ) => {
    setQrInputCode(codeOrUuid);
    const q = codeOrUuid.trim().toLowerCase();
    const found = assets.find(
      (a) =>
        a.qr_code_uuid.toLowerCase() === q ||
        a.tag_code.toLowerCase() === q ||
        a.qr_code_uuid.toLowerCase().startsWith(q)
    );
    if (found) {
      setScannedAsset(found);
      setSelectedAsset(found);
      setNewTicketForm((prev) => ({
        ...prev,
        store_id: found.store_id,
        asset_id: found.id,
      }));
      setSelectedPreventiveAssetId(found.id);
      if (openFullView) {
        setActiveTab("asset_360");
      }
      notify(
        `QR escaneado: ${found.tag_code} (${found.brand} ${found.model}) — Abriendo Ficha Técnica e Historial.`
      );
    } else {
      notify("No se encontró un activo registrado con ese código QR.");
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const currentPlanItems = useMemo(
    () =>
      INITIAL_CHECKLIST_ITEMS.filter(
        (item) => item.plan_id === selectedPlanId
      ).sort((a, b) => a.step_order - b.step_order),
    [selectedPlanId]
  );

  const pendingOfflineCount = offlineQueue.filter((i) => !i.synced).length;
  const canCreateOrEditAssets =
    currentUser.role === "admin" || currentUser.role === "jefe_mantenimiento";
  const canModifyFirestoreDb = currentUser.role === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-500/40 flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shadow-inner">
              ❄️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight">
                  Fracttal-AR CMMS / GMAO
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-medium">
                  Red 528 Locales • Fase 1 HVAC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Climatización Activa • Etiquetado QR por Activo y Trazabilidad de Historial Completo
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const next = !isOfflineMode;
                setIsOfflineMode(next);
                notify(
                  next
                    ? "Modo Offline activado: Los tickets y checklists se guardarán localmente con sync_offline_id."
                    : "Conexión restablecida. Podés sincronizar la cola pendiente."
                );
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition ${
                isOfflineMode
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOfflineMode ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              {isOfflineMode
                ? `MODO OFFLINE CAMPO (${pendingOfflineCount} en cola)`
                : "ONLINE • PostgreSQL Sync"}
            </button>

            {pendingOfflineCount > 0 && (
              <button
                onClick={handleSyncOfflineQueue}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition"
              >
                🔄 Sincronizar ({pendingOfflineCount})
              </button>
            )}

            <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400">Rol activo:</span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const found = INITIAL_USERS.find(
                    (u) => u.id === Number(e.target.value)
                  );
                  if (found) setCurrentUser(found);
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none"
              >
                {INITIAL_USERS.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900">
                    {u.full_name} [{u.role.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-1 border-t border-slate-800/80 pt-2">
          {[
            { id: "home", label: "🏠 Pantalla Inicial" },
            { id: "assets", label: "🏢 1. Activos HVAC & Generador QR" },
            {
              id: "asset_360",
              label: `🔍 Hoja de Vida QR (${selectedAsset?.tag_code ?? "Equipo"})`,
            },
            {
              id: "tickets",
              label: `🛠️ 2. Solicitudes / Tickets (${kpis.openTicketsCount} abiertos)`,
            },
            { id: "preventive", label: "📋 3. Planes Preventivos & Firma" },
            { id: "kpis", label: "📊 4. KPIs (MTTR / MTBF / SLA)" },
            { id: "mobile_pwa", label: "📱 5. App Móvil Offline + Escáner QR" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-lg whitespace-nowrap transition border-b-2 ${
                activeTab === tab.id
                  ? "bg-slate-800 text-blue-400 border-blue-500"
                  : "text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* ===================================================================
            PANTALLA INICIAL: CENTRO DE COMANDO PRINCIPAL CMMS RED 528 LOCALES
        =================================================================== */}
        {activeTab === "home" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  PANTALLA INICIAL • SISTEMA CMMS / GMAO
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Gestión de Mantenimiento Climatización (HVAC) — 528 Sucursales
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Seleccioná cualquiera de los 5 módulos activos de Fase 1 o escaneá directamente el código QR de un equipo de aire acondicionado para abrir su Hoja de Vida e Historial Técnico.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {canCreateOrEditAssets && (
                  <button
                    onClick={() => {
                      setShowNewAssetModal(true);
                      setActiveTab("assets");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                  >
                    + Cargar Aire Acondicionado y Generar QR
                  </button>
                )}
                {canModifyFirestoreDb && (
                  <button
                    onClick={() => setActiveTab("db_architecture")}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow"
                  >
                    🔥 Administrar BD Firestore (Solo Admin)
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("tickets")}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
                >
                  🚨 Reportar Falla en Local
                </button>
              </div>
            </div>

            {/* Tarjetas de Acceso Directo a los 5 Módulos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab("assets")}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-500 shadow-sm cursor-pointer transition space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-blue-600">
                    Módulo 1
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                    {assets.length} Equipos Cargados
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  🏢 Activos HVAC y Generador de Etiquetas QR
                </h3>
                <p className="text-xs text-slate-600">
                  Jerarquía Zona → Local → Activo, ficha técnica JSONB y generación de códigos QR listos para imprimir y pegar en cada equipo.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("asset_360")}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-500 shadow-sm cursor-pointer transition space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-indigo-600">
                    Escaneo QR Directo
                  </span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                    Datos + Historial
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  🔍 Hoja de Vida 360° del Equipo Escaneado
                </h3>
                <p className="text-xs text-slate-600">
                  Pantalla que se abre al escanear el código QR del aire acondicionado: muestra sus datos de placa, historial de fallas e historial de preventivos.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("tickets")}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-500 shadow-sm cursor-pointer transition space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-red-600">
                    Módulo 2
                  </span>
                  <span className="text-xs bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded">
                    {kpis.openTicketsCount} Tickets Abiertos
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  🛠️ Solicitudes de Mantenimiento / Ticketing
                </h3>
                <p className="text-xs text-slate-600">
                  Reporte de fallas desde tienda con síntomas estandarizados, asignación de técnico y cierre técnico con trazabilidad de tiempos.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("preventive")}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-500 shadow-sm cursor-pointer transition space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-emerald-600">
                    Módulo 3
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                    {executions.length} Ejecutados
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  📋 Planes Preventivos y Checklists con Firma
                </h3>
                <p className="text-xs text-slate-600">
                  Protocolos preventivos por tipo de equipo (Check, Medición en PSI/A/°C y Foto) más firma digital de conformidad en pantalla.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("kpis")}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-500 shadow-sm cursor-pointer transition space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-amber-600">
                    Módulo 4
                  </span>
                  <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded">
                    MTTR: {kpis.mttrHours}h | SLA: {kpis.slaCompliancePercent}%
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  📊 KPIs Operativos (MTTR, MTBF, Disponibilidad)
                </h3>
                <p className="text-xs text-slate-600">
                  Métricas de confiabilidad ISO 55000 calculadas en tiempo real desde los tickets correctivos de las 8 zonas.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("mobile_pwa")}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-500 shadow-sm cursor-pointer transition space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-purple-600">
                    Módulo 5
                  </span>
                  <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded">
                    Offline-First PWA
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  📱 App Móvil de Campo + Escáner QR
                </h3>
                <p className="text-xs text-slate-600">
                  Vista móvil para Técnicos y Encargados de Local con lector QR y cola de sincronización sin conexión (sync_offline_id).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MÓDULO 1: GESTIÓN DE ACTIVOS HVAC Y GENERADOR DE ETIQUETAS QR
        =================================================================== */}
        {activeTab === "assets" && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    1. Región
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value as RegionType | "TODAS");
                      setSelectedZoneId("TODAS");
                      setSelectedStoreId("TODOS");
                    }}
                    className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
                  >
                    <option value="TODAS">Todas las Regiones (528 Locales)</option>
                    <option value="CABA">CABA (168 Locales)</option>
                    <option value="GBA">GBA (210 Locales)</option>
                    <option value="Interior">Interior (150 Locales)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    2. Zona Supervisión
                  </label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => {
                      setSelectedZoneId(
                        e.target.value === "TODAS"
                          ? "TODAS"
                          : Number(e.target.value)
                      );
                      setSelectedStoreId("TODOS");
                    }}
                    className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
                  >
                    <option value="TODAS">Todas las Zonas ({filteredZones.length})</option>
                    {filteredZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        Zona {z.id}: {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    3. Local / Sucursal
                  </label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) =>
                      setSelectedStoreId(
                        e.target.value === "TODOS"
                          ? "TODOS"
                          : Number(e.target.value)
                      )
                    }
                    className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
                  >
                    <option value="TODOS">
                      Todos los locales cabeceras ({filteredStores.length})
                    </option>
                    {filteredStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Buscar Tag / QR / Marca
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej: HVAC-LOC001-RT01 o Carrier..."
                    className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 w-56"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setQrPrintAssets(filteredAssets)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition"
                >
                  🖨️ Imprimir Plancha QR ({filteredAssets.length} equipos)
                </button>
                {canCreateOrEditAssets ? (
                  <button
                    onClick={() => setShowNewAssetModal(true)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                  >
                    + Cargar Nuevo Aire Acondicionado (Genera QR)
                  </button>
                ) : (
                  <span className="px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                    🔒 Rol Técnico: Sin permiso para cargar equipos
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {filteredAssets.map((asset) => {
                  const store = INITIAL_STORES.find(
                    (s) => s.id === asset.store_id
                  );
                  const type = INITIAL_ASSET_TYPES.find(
                    (t) => t.id === asset.asset_type_id
                  );
                  const isSelected = selectedAsset?.id === asset.id;
                  const assetTicketCount = requests.filter(
                    (r) => r.asset_id === asset.id
                  ).length;
                  const assetPrevCount = executions.filter(
                    (ex) => ex.asset_id === asset.id
                  ).length;

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`p-4 rounded-xl border transition cursor-pointer bg-white ${
                        isSelected
                          ? "border-blue-600 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                            <QrCodeSvg
                              value={`https://cmms.red528.com.ar/?qr=${asset.qr_code_uuid}`}
                              size={54}
                            />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {asset.tag_code}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {type?.name}
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${
                                  asset.criticality === "critica"
                                    ? "bg-red-100 text-red-700"
                                    : asset.criticality === "alta"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                Criticidad {asset.criticality}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 mt-1">
                              {asset.brand} {asset.model} —{" "}
                              <span className="font-normal text-slate-600">
                                {asset.location_in_store}
                              </span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              📍 {store?.code} {store?.name} ({store?.address},{" "}
                              {store?.city})
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                QR UUID: {asset.qr_code_uuid.slice(0, 13)}...
                              </span>
                              <span>
                                🛠️ <b>{assetTicketCount}</b> tickets en historial
                              </span>
                              <span>
                                📋 <b>{assetPrevCount}</b> preventivos firmados
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end justify-between">
                          <span
                            className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                              asset.status === "operativo"
                                ? "bg-emerald-100 text-emerald-700"
                                : asset.status === "con_falla"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {asset.status.replace("_", " ")}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            {asset.capacity_kcal_fg > 0
                              ? `${asset.capacity_kcal_fg.toLocaleString()} FG/kcal • ${asset.refrigerant_type}`
                              : asset.power_supply}
                          </p>
                          <div className="flex gap-1.5 mt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQrPrintAssets([asset]);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                            >
                              🖨️ Etiqueta QR
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScanQrAndOpenAssetHistory(
                                  asset.qr_code_uuid,
                                  true
                                );
                              }}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold"
                            >
                              🔍 Abrir Hoja de Vida QR →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit space-y-4">
                {selectedAsset ? (
                  <>
                    <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                            ETIQUETA ACTIVO HVAC • RED 528
                          </span>
                          <h3 className="text-base font-mono font-black text-slate-900 mt-1">
                            {selectedAsset.tag_code}
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {
                            INITIAL_STORES.find(
                              (s) => s.id === selectedAsset.store_id
                            )?.code
                          }
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border border-slate-300 rounded-lg shrink-0">
                          <QrCodeSvg
                            value={`https://cmms.red528.com.ar/?qr=${selectedAsset.qr_code_uuid}`}
                            size={96}
                          />
                        </div>
                        <div className="text-xs space-y-1 overflow-hidden">
                          <p className="font-bold text-slate-900 truncate">
                            {selectedAsset.brand} {selectedAsset.model}
                          </p>
                          <p className="text-slate-600 text-[11px]">
                            📍 {selectedAsset.location_in_store}
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            N/S: {selectedAsset.serial_number}
                          </p>
                          <p className="font-mono text-[10px] text-slate-500 break-all">
                            UUID: {selectedAsset.qr_code_uuid}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setQrPrintAssets([selectedAsset])}
                          className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                        >
                          🖨️ Imprimir Etiqueta
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleScanQrAndOpenAssetHistory(
                              selectedAsset.qr_code_uuid,
                              true
                            )
                          }
                          className="py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                        >
                          📱 Simular Escaneo QR
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase text-slate-600 block mb-1.5">
                        Ficha Técnica JSONB (technical_specs)
                      </span>
                      <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs space-y-1">
                        {Object.entries(selectedAsset.technical_specs).map(
                          ([k, v]) => (
                            <div
                              key={k}
                              className="flex justify-between border-b border-slate-800 pb-1 last:border-none"
                            >
                              <span className="text-blue-300">{k}:</span>
                              <span className="text-emerald-300">
                                {String(v)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VISTA 360° / HOJA DE VIDA DEL EQUIPO AL ESCANEAR SU CÓDIGO QR
        =================================================================== */}
        {activeTab === "asset_360" && selectedAsset && (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-5">
                <div className="p-2.5 bg-white rounded-xl shadow">
                  <QrCodeSvg
                    value={`https://cmms.red528.com.ar/?qr=${selectedAsset.qr_code_uuid}`}
                    size={104}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-blue-600 text-white">
                      HOJA DE VIDA DEL ACTIVO (DESTINO ESCANEO QR)
                    </span>
                    <span
                      className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        selectedAsset.status === "operativo"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                          : "bg-red-500/20 text-red-300 border border-red-400/40"
                      }`}
                    >
                      Estado: {selectedAsset.status.replace("_", " ")}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black font-mono tracking-tight">
                    {selectedAsset.tag_code} — {selectedAsset.brand}{" "}
                    {selectedAsset.model}
                  </h2>

                  <p className="text-xs text-slate-300">
                    📍{" "}
                    <b>
                      {
                        INITIAL_STORES.find(
                          (s) => s.id === selectedAsset.store_id
                        )?.code
                      }{" "}
                      -{" "}
                      {
                        INITIAL_STORES.find(
                          (s) => s.id === selectedAsset.store_id
                        )?.name
                      }
                    </b>{" "}
                    • Ubicación: <b>{selectedAsset.location_in_store}</b> • N/S:{" "}
                    <span className="font-mono">
                      {selectedAsset.serial_number}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => setQrPrintAssets([selectedAsset])}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold transition"
                >
                  🖨️ Imprimir Etiqueta QR
                </button>
                <button
                  onClick={() => {
                    setNewTicketForm((prev) => ({
                      ...prev,
                      store_id: selectedAsset.store_id,
                      asset_id: selectedAsset.id,
                    }));
                    setActiveTab("tickets");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow transition"
                >
                  🚨 Reportar Falla en este Equipo
                </button>
                <button
                  onClick={() => {
                    setSelectedPreventiveAssetId(selectedAsset.id);
                    setActiveTab("preventive");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                >
                  📋 Ejecutar Checklist Preventivo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
                <h3 className="font-bold text-slate-900 text-base border-b pb-2">
                  1. Datos Técnicos de Placa y JSONB
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 block">Capacidad</span>
                    <b className="text-slate-900">
                      {selectedAsset.capacity_kcal_fg.toLocaleString()} kcal/fg
                    </b>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 block">Gas Refrigerante</span>
                    <b className="text-slate-900">
                      {selectedAsset.refrigerant_type}
                    </b>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 block">Alimentación</span>
                    <b className="text-slate-900">
                      {selectedAsset.power_supply}
                    </b>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 block">Vto. Garantía</span>
                    <b className="text-slate-900">
                      {selectedAsset.warranty_expiration}
                    </b>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 block mb-1.5">
                    Parámetros de Ingeniería (JSONB technical_specs)
                  </span>
                  <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs space-y-1.5">
                    {Object.entries(selectedAsset.technical_specs).map(
                      ([k, v]) => (
                        <div
                          key={k}
                          className="flex justify-between border-b border-slate-800 pb-1 last:border-none"
                        >
                          <span className="text-blue-300">{k}:</span>
                          <span className="text-emerald-300">{String(v)}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
                <h3 className="font-bold text-slate-900 text-base border-b pb-2">
                  2. Historial Correctivo / Fallas ({selectedAssetTickets.length})
                </h3>
                {selectedAssetTickets.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Este equipo no registra fallas ni tickets correctivos.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedAssetTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border">
                            {t.ticket_number}
                          </span>
                          <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-amber-100 text-amber-800">
                            {t.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900">
                          {t.failure_symptom}
                        </p>
                        <p className="text-slate-600">{t.description}</p>
                        {t.resolution_comment && (
                          <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                            <b>Diagnóstico / Solución:</b>{" "}
                            {t.resolution_comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
                <h3 className="font-bold text-slate-900 text-base border-b pb-2">
                  3. Historial de Preventivos ({selectedAssetPreventives.length})
                </h3>
                {selectedAssetPreventives.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Aún no hay ejecuciones preventivas registradas para este activo.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedAssetPreventives.map((ex) => {
                      const plan = INITIAL_MAINTENANCE_PLANS.find(
                        (p) => p.id === ex.plan_id
                      );
                      return (
                        <div
                          key={ex.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                        >
                          <span className="font-bold text-emerald-800 block">
                            {plan?.name}
                          </span>
                          <p className="text-slate-700">{ex.observations}</p>
                          <div className="p-2 rounded bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                            Mediciones: {JSON.stringify(ex.results)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ✍️ {ex.signature_url}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MÓDULO 4: KPIS Y MÉTRICAS OPERATIVAS
        =================================================================== */}
        {activeTab === "kpis" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  MTTR (Tiempo Medio Reparación)
                </span>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {kpis.mttrHours} hs
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  MTBF (Tiempo Entre Fallas)
                </span>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {kpis.mtbfHours} hs
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Disponibilidad Parque HVAC
                </span>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {kpis.availabilityPercent}%
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Cumplimiento SLA (Crítica ≤{SLA_HOURS_BY_PRIORITY.critica}h)
                </span>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {kpis.slaCompliancePercent}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MÓDULO 2: SOLICITUDES DE MANTENIMIENTO / TICKETING
        =================================================================== */}
        {activeTab === "tickets" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleCreateTicket}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit"
            >
              <h3 className="text-lg font-bold text-slate-900">
                Reportar Falla de Climatización
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">
                    Sucursal / Local
                  </label>
                  <select
                    value={newTicketForm.store_id}
                    onChange={(e) => {
                      const storeId = Number(e.target.value);
                      const firstAsset = assets.find(
                        (a) => a.store_id === storeId
                      );
                      setNewTicketForm({
                        ...newTicketForm,
                        store_id: storeId,
                        asset_id: firstAsset ? firstAsset.id : 0,
                      });
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    {INITIAL_STORES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    Equipo HVAC Afectado
                  </label>
                  <select
                    value={newTicketForm.asset_id}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        asset_id: Number(e.target.value),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    {assets
                      .filter((a) => a.store_id === newTicketForm.store_id)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.tag_code} • {a.brand}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    Síntoma Estandarizado
                  </label>
                  <select
                    value={newTicketForm.failure_symptom}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        failure_symptom: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    {STANDARD_HVAC_SYMPTOMS.map((sym) => (
                      <option key={sym} value={sym}>
                        {sym}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    Descripción del Problema
                  </label>
                  <textarea
                    rows={3}
                    value={newTicketForm.description}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition"
              >
                🚀 Emitir Ticket de Mantenimiento
              </button>
            </form>

            <div className="lg:col-span-2 space-y-3">
              {requests.map((ticket) => {
                const asset = assets.find((a) => a.id === ticket.asset_id);
                return (
                  <div
                    key={ticket.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                        {ticket.ticket_number}
                      </span>
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {ticket.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900">
                      {ticket.failure_symptom}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {ticket.description}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t text-xs">
                      <span>
                        Equipo: <b>{asset?.tag_code ?? "General"}</b>
                      </span>
                      {ticket.status !== "resuelto" && (
                        <button
                          onClick={() =>
                            handleAdvanceTicketStatus(ticket, "resuelto", 3)
                          }
                          className="px-3 py-1 rounded bg-emerald-600 text-white font-bold"
                        >
                          ✅ Resolver Ticket
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            MÓDULO 3: PLANES PREVENTIVOS Y CHECKLISTS DINÁMICOS CON FIRMA
        =================================================================== */}
        {activeTab === "preventive" && (
          <form
            onSubmit={handleSavePreventiveExecution}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5"
          >
            <h3 className="text-lg font-bold text-slate-900">
              Ejecución de Checklist Preventivo Dinámico
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">
                  Plan Preventivo
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                >
                  {INITIAL_MAINTENANCE_PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">
                  Equipo HVAC Objetivo
                </label>
                <select
                  value={selectedPreventiveAssetId}
                  onChange={(e) =>
                    setSelectedPreventiveAssetId(Number(e.target.value))
                  }
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.tag_code} — {a.brand} {a.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {currentPlanItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-50 border flex justify-between items-center text-xs"
                >
                  <span>
                    <b>Paso {item.step_order}:</b> {item.task_description}
                  </span>
                  <span className="font-mono">
                    {item.input_type} {item.unit ?? ""}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="font-semibold">
                  Firma Digital de Conformidad
                </span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-blue-600"
                >
                  Limpiar
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={280}
                height={90}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full max-w-md h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-crosshair"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              ✍️ Firmar y Guardar en Historial del Equipo
            </button>
          </form>
        )}

        {/* ===================================================================
            MÓDULO 5: APP MÓVIL OFFLINE-FIRST Y ESCÁNER DE CÓDIGOS QR
        =================================================================== */}
        {activeTab === "mobile_pwa" && (
          <div className="max-w-sm mx-auto bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl text-white space-y-4">
            <div className="bg-blue-700 p-3 rounded-xl text-xs font-bold flex justify-between">
              <span>📱 CMMS App Campo</span>
              <span>{isOfflineMode ? "OFFLINE" : "ONLINE"}</span>
            </div>
            <div className="bg-white text-slate-900 p-4 rounded-xl space-y-3 text-xs">
              <p className="font-bold">
                Tocá un equipo para simular el escaneo de su etiqueta QR:
              </p>
              <div className="space-y-1.5">
                {assets.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      handleScanQrAndOpenAssetHistory(a.qr_code_uuid, true)
                    }
                    className="w-full p-2.5 border rounded-lg flex justify-between items-center hover:bg-blue-50"
                  >
                    <span className="font-mono font-bold text-blue-700">
                      📷 {a.tag_code}
                    </span>
                    <span>Ver Datos e Historial →</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Alta de Activo HVAC */}
      {showNewAssetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAsset}
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">
                Cargar Nuevo Aire Acondicionado (Genera QR)
              </h3>
              <button
                type="button"
                onClick={() => setShowNewAssetModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tag Code</label>
                <input
                  type="text"
                  required
                  value={newAssetForm.tag_code}
                  onChange={(e) =>
                    setNewAssetForm({
                      ...newAssetForm,
                      tag_code: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Marca</label>
                <input
                  type="text"
                  required
                  value={newAssetForm.brand}
                  onChange={(e) =>
                    setNewAssetForm({
                      ...newAssetForm,
                      brand: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Modelo</label>
                <input
                  type="text"
                  required
                  value={newAssetForm.model}
                  onChange={(e) =>
                    setNewAssetForm({
                      ...newAssetForm,
                      model: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">
                  Ubicación en Tienda
                </label>
                <input
                  type="text"
                  value={newAssetForm.location_in_store}
                  onChange={(e) =>
                    setNewAssetForm({
                      ...newAssetForm,
                      location_in_store: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowNewAssetModal(false)}
                className="px-4 py-2 rounded-lg border text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
              >
                Guardar Equipo y Generar Etiqueta QR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Impresión de Etiquetas QR */}
      {qrPrintAssets && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Etiquetas QR Listas para Imprimir ({qrPrintAssets.length})
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
                >
                  🖨️ Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => setQrPrintAssets(null)}
                  className="px-3 py-2 rounded-lg border text-xs font-semibold"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {qrPrintAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 rounded-xl border-2 border-slate-900 bg-white flex items-center gap-3"
                >
                  <QrCodeSvg
                    value={`https://cmms.red528.com.ar/?qr=${asset.qr_code_uuid}`}
                    size={92}
                  />
                  <div className="text-xs">
                    <div className="font-mono font-black text-base">
                      {asset.tag_code}
                    </div>
                    <div className="font-bold">
                      {asset.brand} {asset.model}
                    </div>
                    <div className="text-slate-600">
                      📍 {asset.location_in_store}
                    </div>
                    <div className="font-mono text-[9px] text-slate-400">
                      {asset.qr_code_uuid}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
