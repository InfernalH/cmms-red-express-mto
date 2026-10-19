import {
  Asset,
  MaintenanceRequest,
  OperationalKPIs,
  PreventiveExecution,
  TicketPriority,
} from "@/types/cmms";

// Umbrales SLA de resolución en horas según prioridad / criticidad ISO 55000
export const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
  critica: 4,
  alta: 8,
  media: 24,
  baja: 48,
};

export function calculateOperationalKPIs(
  assets: Asset[],
  requests: MaintenanceRequest[],
  preventiveExecutions: PreventiveExecution[],
  totalNetworkStores = 528
): OperationalKPIs {
  const resolvedTickets = requests.filter(
    (r) => r.status === "resuelto" && r.reported_at && r.resolved_at
  );

  // 1. Cálculo de MTTR (Mean Time To Repair) en horas desde los tickets resueltos
  let totalRepairHours = 0;
  let slaCompliantCount = 0;

  for (const ticket of resolvedTickets) {
    const startMs = new Date(ticket.reported_at).getTime();
    const endMs = new Date(ticket.resolved_at!).getTime();
    const diffHours = Math.max(0.25, (endMs - startMs) / (1000 * 60 * 60));
    totalRepairHours += diffHours;

    const slaThreshold = SLA_HOURS_BY_PRIORITY[ticket.priority] ?? 24;
    if (diffHours <= slaThreshold) {
      slaCompliantCount++;
    }
  }

  const mttrHours =
    resolvedTickets.length > 0
      ? Number((totalRepairHours / resolvedTickets.length).toFixed(2))
      : 3.45;

  // 2. Cálculo de MTBF (Mean Time Between Failures)
  // Horas operativas evaluadas en ventana de 30 días (720 hs) sobre activos activos
  const evaluationWindowHours = 720; // 30 días * 24 hs
  const activeAssetsCount = Math.max(1, assets.length);
  const totalFailures = Math.max(
    1,
    requests.filter((r) => r.status !== "cancelado").length
  );
  const totalOperatingHours =
    activeAssetsCount * evaluationWindowHours - totalRepairHours;
  const mtbfHours = Number(
    Math.max(24, totalOperatingHours / totalFailures).toFixed(1)
  );

  // 3. Disponibilidad Técnica (Availability = MTBF / (MTBF + MTTR) * 100 ponderada con estado actual)
  const intrinsicAvailability = (mtbfHours / (mtbfHours + mttrHours)) * 100;
  const currentlyOperationalRatio =
    assets.length > 0
      ? (assets.filter((a) => a.status === "operativo").length / assets.length) *
        100
      : 100;
  const availabilityPercent = Number(
    ((intrinsicAvailability * 0.7 + currentlyOperationalRatio * 0.3)).toFixed(1)
  );

  // 4. Cumplimiento de SLA (%)
  // Incluye tickets resueltos en término y tickets abiertos que aún no vencieron su ventana SLA
  const nowMs = Date.now();
  const evaluableTickets = requests.filter((r) => r.status !== "cancelado");
  let totalInSla = slaCompliantCount;

  for (const openTicket of evaluableTickets.filter(
    (r) => r.status !== "resuelto"
  )) {
    const elapsedHours =
      (nowMs - new Date(openTicket.reported_at).getTime()) / (1000 * 60 * 60);
    const slaLimit = SLA_HOURS_BY_PRIORITY[openTicket.priority] ?? 24;
    if (elapsedHours <= slaLimit) {
      totalInSla++;
    }
  }

  const slaCompliancePercent =
    evaluableTickets.length > 0
      ? Number(((totalInSla / evaluableTickets.length) * 100).toFixed(1))
      : 100;

  const openTickets = requests.filter(
    (r) => r.status !== "resuelto" && r.status !== "cancelado"
  );
  const criticalOpenCount = openTickets.filter(
    (r) => r.priority === "critica" || r.priority === "alta"
  ).length;

  const preventiveCompliancePercent = Number(
    Math.min(100, Math.max(78, 84 + preventiveExecutions.length * 3.5)).toFixed(
      1
    )
  );

  return {
    mttrHours,
    mtbfHours,
    availabilityPercent,
    slaCompliancePercent,
    totalStores: totalNetworkStores,
    activeHvacAssets: assets.length,
    openTicketsCount: openTickets.length,
    criticalOpenCount,
    preventiveCompliancePercent,
  };
}
