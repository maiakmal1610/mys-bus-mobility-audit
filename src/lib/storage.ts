import { BusStopProperties } from "../types";

const STORAGE_KEY = "gkl_bus_audit_reports_v1";

export interface AuditReport {
  stopId: string;
  rating: number;
  comment: string;
  amenityCorrections?: Partial<BusStopProperties["amenities"]>;
  timestamp: string;
}

export function getLocalAudits(): Record<string, AuditReport[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export function saveAuditReport(report: AuditReport): void {
  try {
    const all = getLocalAudits();
    if (!all[report.stopId]) {
      all[report.stopId] = [];
    }
    all[report.stopId].unshift(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save audit report:", e);
  }
}
