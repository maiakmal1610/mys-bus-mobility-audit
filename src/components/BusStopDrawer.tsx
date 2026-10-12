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
}

export const BusStopDrawer: React.FC<BusStopDrawerProps> = ({
  stop,
  onClose,
  onReportSubmitted,
}) => {
  const [rating, setRating] = useState<number>(3);
  const [comment, setComment] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [audits, setAudits] = useState<AuditReport[]>([]);

  useEffect(() => {
    if (stop) {
      const all = getLocalAudits();
      setAudits(all[stop.stop_id] || []);
      setSubmitted(false);
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
    setSubmitted(true);
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
    <div className="absolute top-4 left-4 z-20 w-88 max-h-[calc(100vh-2rem)] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 text-xs text-slate-200">
      {/* Pinned Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-800/50 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
              {stop.council}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">#{stop.stop_id}</span>
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight truncate">
            {stop.stop_name}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Quality Score Hero Card */}
        <div
          className="p-3.5 rounded-xl border flex items-center justify-between"
          style={{
            borderColor: `${stop.color}40`,
            backgroundColor: `${stop.color}10`,
          }}
        >
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              KRI Infrastructure Score
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold text-white font-mono">
                {stop.quality_score.toFixed(0)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 9 elements</span>
            </div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: stop.color }}>
              {stop.tier}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full uppercase"
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

        {/* Physical Infrastructure Checklist (KRI YOLOv8 Detected) */}
        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Detected Amenities</span>
            <span className="text-[9px] text-slate-500 font-normal">AI Ground Truth</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div
              className={`p-2 rounded-lg flex items-center justify-between ${
                stop.amenities.shelter
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              <span>☔ Rain Shelter</span>
              <span>{stop.amenities.shelter ? "Yes" : "Missing"}</span>
            </div>

            <div
              className={`p-2 rounded-lg flex items-center justify-between ${
                stop.amenities.street_light
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              <span>💡 Night Light</span>
              <span>{stop.amenities.street_light ? "Yes" : "Dark"}</span>
            </div>

            <div
              className={`p-2 rounded-lg flex items-center justify-between ${
                stop.amenities.bench
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-slate-800/60 text-slate-500"
              }`}
            >
              <span>🪑 Seating Bench</span>
              <span>{stop.amenities.bench ? "Yes" : "No"}</span>
            </div>

            <div
              className={`p-2 rounded-lg flex items-center justify-between ${
                stop.amenities.zebra_crossing
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-slate-800/60 text-slate-500"
              }`}
            >
              <span>🚸 Zebra Cross</span>
              <span>{stop.amenities.zebra_crossing ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>

        {/* Crowdsourced Community Audit & Rating */}
        <div className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Crowdsource Stop Audit</span>
            </h3>
            <span className="text-[10px] text-amber-400 font-semibold">
              {audits.length} Reports
            </span>
          </div>

          <form onSubmit={handleSubmitAudit} className="space-y-2.5">
            {/* 1-5 Star Rating */}
            <div>
              <div className="text-[10px] text-slate-400 mb-1">Your Condition Rating:</div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Box */}
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share ground reality (e.g., roof broken, dark at night, no pavement)..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700/70 rounded-lg p-2 text-white placeholder-slate-500 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={!comment.trim()}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-black font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Community Audit</span>
            </button>
          </form>

          {/* Past Community Reviews */}
          {audits.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 font-semibold">
                Recent Commuter Notes:
              </div>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {audits.slice(0, 3).map((a, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px]"
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

        {/* Civic Call-to-Action: Generate Complaint Slip */}
        <button
          onClick={handleCopyComplaintSlip}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Copy Council Complaint Slip</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
