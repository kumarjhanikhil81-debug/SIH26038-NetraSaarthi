import React from 'react';
import { 
  Building2, 
  Printer, 
  Clock, 
  Send
} from 'lucide-react';

/**
 * ReferralCard Component
 * Displays clinical referral recommendation, urgency timeframe, 
 * destination facility, and triggers official referral slip generation.
 */
export default function ReferralCard({
  stateKey = 'NO_DR',
  grade = null,
  onPrintSlip,
  onRequestTeleReview,
  className = ''
}) {
  // Referral protocols based on severity
  const protocols = {
    NO_DR: {
      urgency: "Routine Annual Screening",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-300",
      timeframe: "Within 12 months",
      destination: "Primary Health Centre (PHC) / Ayushman Arogya Mandir",
      directive: "Continue strict blood glucose control and maintain annual retinal screening schedule.",
      requiresImmediateAction: false
    },
    MILD_DR: {
      urgency: "Routine Follow-Up at PHC",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-300",
      timeframe: "Within 6 to 12 months",
      destination: "Primary Health Centre / Community Health Centre (CHC)",
      directive: "Reinforce diabetes self-management, lipid profiling, and blood pressure monitoring.",
      requiresImmediateAction: false
    },
    MODERATE_DR: {
      urgency: "Specialist Review Recommended",
      badgeColor: "bg-orange-50 text-orange-800 border-orange-300",
      timeframe: "Within 30 to 60 days",
      destination: "Sub-District Hospital / District Tele-Ophthalmology Unit",
      directive: "Specialist review recommended. Comprehensive dilated fundus biomicroscopy and OCT examination advised.",
      requiresImmediateAction: true
    },
    SEVERE_DR: {
      urgency: "Specialist Review Recommended (Urgent)",
      badgeColor: "bg-rose-50 text-rose-800 border-rose-300",
      timeframe: "Within 7 to 14 days",
      destination: "District Eye Hospital / Tertiary Vitreo-Retina Center",
      directive: "Specialist review recommended urgently for Pan-Retinal Photocoagulation (PRP Laser) evaluation and Anti-VEGF therapy assessment.",
      requiresImmediateAction: true
    },
    PROLIFERATIVE_DR: {
      urgency: "Specialist Review Recommended (Emergency)",
      badgeColor: "bg-red-50 text-red-900 border-red-400",
      timeframe: "Within 48 to 72 hours",
      destination: "Government Medical College / Tertiary Vitreo-Retina Center",
      directive: "High risk of sudden vision loss. Immediate specialist review recommended for urgent laser photocoagulation or vitrectomy consultation.",
      requiresImmediateAction: true
    },
    UNDETERMINED: {
      urgency: "Specialist Review Recommended (Quality Inconclusive)",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      timeframe: "Within 7 days or immediate re-capture",
      destination: "Nearest Community Health Centre (CHC) Eye Care Unit",
      directive: "Image quality prevented automated AI classification. Re-capture image after pupil dilation or refer for manual indirect ophthalmoscopy.",
      requiresImmediateAction: false
    },
    INVALID_IMAGE: {
      urgency: "Invalid Image: Retinal Scan Required",
      badgeColor: "bg-rose-50 text-rose-800 border-rose-300",
      timeframe: "Immediate recapture required",
      destination: "Primary Health Centre / Screening Unit",
      directive: "No result as the image is not valid. The captured photograph is not a retinal fundus image. Please take or upload a valid retinal scan.",
      requiresImmediateAction: false
    },
    RETAKE_REQUIRED: {
      urgency: "Image Not Clear: Retake Required",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-300",
      timeframe: "Immediate recapture required",
      destination: "Primary Health Centre / Screening Unit",
      directive: "Retake the image, it is not clear. Ensure steady patient fixation, correct camera focus, and adequate illumination.",
      requiresImmediateAction: false
    }
  };

  let effectiveKey = stateKey;
  if (stateKey !== 'INVALID_IMAGE' && stateKey !== 'RETAKE_REQUIRED' && stateKey !== 'UNDETERMINED' && grade !== null && grade !== undefined) {
    const num = Number(grade);
    if (num === 0) effectiveKey = 'NO_DR';
    else if (num === 1) effectiveKey = 'MILD_DR';
    else if (num === 2) effectiveKey = 'MODERATE_DR';
    else if (num === 3) effectiveKey = 'SEVERE_DR';
    else if (num === 4) effectiveKey = 'PROLIFERATIVE_DR';
  }

  const protocol = protocols[effectiveKey] || protocols[stateKey] || protocols.NO_DR;

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 font-display">
            <Building2 className="w-5 h-5 text-teal-700" />
            <span>Referral Recommendation & Clinical Protocol</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Guidance for frontline health workers based on National Health Mission & ICDR standards
          </p>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${protocol.badgeColor}`}>
          {protocol.urgency}
        </span>
      </div>

      {/* Protocol Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-teal-700" />
            <span>Recommended Timeframe:</span>
          </span>
          <div className="font-bold text-slate-900 text-sm font-display">
            {protocol.timeframe}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-blue-700" />
            <span>Destination Referral Facility:</span>
          </span>
          <div className="font-bold text-slate-900 text-sm font-display truncate">
            {protocol.destination}
          </div>
        </div>

      </div>

      {/* Clinical Directive Summary */}
      <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs text-slate-800 space-y-1">
        <span className="font-bold text-teal-950 uppercase tracking-wider block text-[10px]">
          Clinical Action Directives:
        </span>
        <p className="font-medium leading-relaxed">
          {protocol.directive}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onPrintSlip}
          className="flex-1 btn-primary-large text-sm py-3.5 gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Referral Slip</span>
        </button>

        {onRequestTeleReview && (
          <button
            type="button"
            onClick={onRequestTeleReview}
            className="btn-secondary-large text-xs py-3 px-5 gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send for Tele-Ophthalmology Review</span>
          </button>
        )}
      </div>

    </div>
  );
}
