import React, { useState, useEffect } from "react";
import {
  X,
  Bus,
  CheckCircle,
  AlertTriangle,
  Star,
  Send,
  MessageSquare,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";
import { BusStopProperties } from "../types";
import { getLocalAudits, saveAuditReport, AuditReport } from "../lib/storage";

interface BusStopDrawerProps {
  stop: BusStopProperties | null;
  onClose: () => void;
  onReportSubmitted?: () => void;
  isSidebarCollapsed?: boolean;
}

export const BusStopDrawer: React.FC<BusStopDrawerProps> = ({
  stop,
  onClose,
  onReportSubmitted,
  isSidebarCollapsed = false,
}) => {
  const [rating, setRating] = useState<number>(3);
  const [comment, setComment] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [audits, setAudits] = useState<AuditReport[]>([]);

  useEffect(() => {
    if (stop) {
      const all = getLocalAudits();
      setAudits(all[stop.stop_id] || []);
      setComment("");
      setRating(Math.min(5, Math.max(1, Math.round(stop.quality_score / 2))));
    }
  }, [stop]);

  if (!stop) return null;

  const handleSubmitAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    saveAuditReport({
      stopId: stop.stop_id,
      rating,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    });

    const all = getLocalAudits();
    setAudits(all[stop.stop_id] || []);
    setComment("");
    if (onReportSubmitted) onReportSubmitted();
  };

  const handleCopyComplaintSlip = () => {
    const slipText = `[CITIZEN TRANSIT AUDIT COMPLAINT]
To: DBKL / Prasarana Malaysia / APAD
Bus Stop ID: ${stop.stop_id}
Bus Stop Name: ${stop.stop_name}
Jurisdiction: ${stop.council}
Current Quality Score: ${stop.quality_score} / 9
Deficiencies Identified:
${!stop.amenities.shelter ? "- Missing / Damaged Rain Shelter\n" : ""}${
      !stop.amenities.street_light ? "- Inadequate Street Lighting (Safety Hazard)\n" : ""
    }${!stop.amenities.bench ? "- No Seating Bench\n" : ""}${
      !stop.amenities.zebra_crossing ? "- No Safe Pedestrian Crossing\n" : ""
    }
Latest Citizen Comments:
"${audits.length > 0 ? audits[0].comment : "Urgent repair and upgrade requested for public commuter safety."}"
Generated via GKL Bus Mobility & Infrastructure Audit Platform.`;

    navigator.clipboard.writeText(slipText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`absolute ${
        isSidebarCollapsed ? "top-16" : "top-4"
      } left-4 z-20 w-80 max-h-[380px] bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 text-xs text-slate-200`}
    >
      {/* Pinned Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-750/70 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 uppercase tracking-wider">
              {stop.council.split(" ")[0]}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">#{stop.stop_id}</span>
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight truncate">
            {stop.stop_name}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
        {/* Quality Score Hero Card */}
        <div
          className="p-3 rounded-xl border flex items-center justify-between"
          style={{
            borderColor: `${stop.color}40`,
            backgroundColor: `${stop.color}15`,
          }}
        >
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              Infrastructure Quality Metric
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold text-white font-mono">
                {stop.quality_score.toFixed(0)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">/ 9 elements</span>
            </div>
            <div className="text-[10px] font-semibold mt-1" style={{ color: stop.color }}>
              {stop.tier}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
              style={{
                backgroundColor: `${stop.color}20`,
                color: stop.color,
                border: `1px solid ${stop.color}40`,
              }}
            >
              {stop.quality_score >= 6 ? "Compliant" : "Deficient"}
            </span>
          </div>
        </div>

        {/* Physical Infrastructure Checklist */}
        <div className="bg-slate-750/60 border border-slate-700 p-3 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Physical Amenities</span>
            <span className="text-[9px] text-slate-500 font-normal">AI Ground Truth</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div
              className={`p-1.5 rounded-lg flex items-center justify-between ${
                stop.amenities.shelter
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-red-500/15 text-red-400 border border-red-500/30"
              }`}
            >
              <span>☔ Rain Shelter</span>
              <span>{stop.amenities.shelter ? "Yes" : "No"}</span>
            </div>

            <div
              className={`p-1.5 rounded-lg flex items-center justify-between ${
                stop.amenities.street_light
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-red-500/15 text-red-400 border border-red-500/30"
              }`}
            >
              <span>💡 Night Light</span>
              <span>{stop.amenities.street_light ? "Yes" : "Dark"}</span>
            </div>

            <div
              className={`p-1.5 rounded-lg flex items-center justify-between ${
                stop.amenities.bench
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-700/60 text-slate-400"
              }`}
            >
              <span>🪑 Bench</span>
              <span>{stop.amenities.bench ? "Yes" : "No"}</span>
            </div>

            <div
              className={`p-1.5 rounded-lg flex items-center justify-between ${
                stop.amenities.zebra_crossing
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-700/60 text-slate-400"
              }`}
            >
              <span>🚸 Crossing</span>
              <span>{stop.amenities.zebra_crossing ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>

        {/* Crowdsourced Community Audit & Rating */}
        <div className="bg-slate-750/60 border border-slate-700 p-3 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Crowdsource Stop Audit</span>
            </h3>
            <span className="text-[10px] text-cyan-400 font-semibold">
              {audits.length} Reports
            </span>
          </div>

          <form onSubmit={handleSubmitAudit} className="space-y-2">
            <div>
              <div className="text-[10px] text-slate-400 mb-1">Rate Real Condition:</div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-0.5 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        star <= rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share ground reality (e.g., roof broken, unlit at night)..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-400 text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={!comment.trim()}
              className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              <span>Submit Community Audit</span>
            </button>
          </form>

          {audits.length > 0 && (
            <div className="pt-2 border-t border-slate-700 space-y-1.5">
              <div className="text-[10px] text-slate-400 font-semibold">
                Recent Commuter Notes:
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {audits.slice(0, 3).map((a, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-slate-800 border border-slate-700 text-[10px]"
                  >
                    <div className="flex items-center justify-between text-slate-400 mb-0.5">
                      <span className="text-amber-400 font-mono">
                        {"★".repeat(a.rating)}
                        {"☆".repeat(5 - a.rating)}
                      </span>
                      <span className="text-[9px]">
                        {new Date(a.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-300">{a.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Civic Call-to-Action */}
        <button
          onClick={handleCopyComplaintSlip}
          className="w-full py-2 bg-slate-700 hover:bg-slate-650 text-slate-100 border border-slate-600 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied Complaint Slip!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy Council Complaint Slip</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
