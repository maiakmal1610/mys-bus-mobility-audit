import React, { useState } from "react";
import { X, ShieldAlert, Download, Copy, Check, FileText } from "lucide-react";
import { BusStopProperties } from "../types";

interface AdvocacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  stops: BusStopProperties[];
}

export const AdvocacyModal: React.FC<AdvocacyModalProps> = ({
  isOpen,
  onClose,
  stops,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter top 10 most deficient stops (score 0, missing critical shelter)
  const criticalStops = stops
    .filter((s) => s.quality_score === 0 || !s.amenities.shelter)
    .slice(0, 10);

  const reportText = `=====================================================
CITIZEN INFRASTRUCTURE AUDIT REPORT
PRIORITY TRANSIT DEFICIT ACTION LIST
Submitted to: DBKL (Dewan Bandaraya Kuala Lumpur) & Prasarana Malaysia Berhad
Prepared by: Klang Valley Commuters Civic Tech Audit (GKL-Pulse)
=====================================================

Executive Summary:
Across 2,565 audited bus stops in the Klang Valley, severe infrastructure deficits 
persist at first-mile transit access points. The following 10 stops represent 
critical non-compliance lacking weather shelters and night illumination.

TOP 10 PRIORITY ACTION BUS STOPS:
${criticalStops
  .map(
    (s, idx) =>
      `${idx + 1}. [${s.stop_id}] ${s.stop_name} (${s.council})
   Quality Score: ${s.quality_score}/9
   Missing: ${!s.amenities.shelter ? "Rain Shelter | " : ""}${
        !s.amenities.street_light ? "Street Light | " : ""
      }${!s.amenities.bench ? "Seating Bench" : ""}`
  )
  .join("\n\n")}

Action Requested:
1. Immediate inspection and provision of basic weather-proof rain canopies.
2. Installation of solar/grid street lighting for commuter safety at night.
3. Installation of physical timetable and route network displays.

Generated automatically via GKL Bus Mobility & Infrastructure Audit Platform.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DBKL_Prasarana_BusStop_Audit_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-xs text-slate-300 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Council Action Advocacy Report
              </h2>
              <p className="text-[11px] text-slate-400">
                Formal civic dossier for submission to DBKL, Prasarana & APAD
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap max-h-80 overflow-y-auto">
            {reportText}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>Copy Report Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Action Dossier (.txt)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
