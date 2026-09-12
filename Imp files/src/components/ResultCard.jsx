import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Stethoscope, 
  Clock, 
  ShieldAlert, 
  Eye
} from 'lucide-react';

/**
 * ResultCard Component
 * Renders the primary AI screening result banner, predicted DR severity state, 
 * doctor review status, and non-definitive clinical decision support notice.
 */
export default function ResultCard({
  stateKey = 'SEVERE_DR', // 'NO_DR' | 'MILD_DR' | 'MODERATE_DR' | 'SEVERE_DR' | 'PROLIFERATIVE_DR' | 'UNDETERMINED'
  confidence = 95.8,
  doctorReviewStatus = 'Specialist Review Recommended',
  eye = 'OD',
  className = ''
}) {
  // Severity state mapping
  const severityStates = {
    NO_DR: {
      title: "No DR detected",
      subtitle: "ICDR Grade 0 (Normal Retina)",
      badge: "Grade 0: Normal",
      gradient: "from-teal-800 via-teal-700 to-emerald-800",
      accentBg: "bg-emerald-500/20 border-emerald-300/40 text-emerald-100",
      statusText: "Screening Completed: Low Risk",
      summary: "No apparent microvascular diabetic retinopathy lesions detected in the analyzed 45° retinal field.",
      urgency: "Routine Follow-up (12 Months)",
      icon: CheckCircle2
    },
    MILD_DR: {
      title: "Possible Mild DR",
      subtitle: "ICDR Grade 1 (Mild Non-Proliferative DR)",
      badge: "Grade 1: Mild NPDR",
      gradient: "from-amber-700 via-amber-600 to-yellow-700",
      accentBg: "bg-amber-500/20 border-amber-300/40 text-amber-100",
      statusText: "Screening Completed: Early Lesions Detected",
      summary: "Isolated microaneurysms detected in parafoveal vascular arcades. Early surveillance recommended.",
      urgency: "Follow-up at PHC (6-12 Months)",
      icon: AlertTriangle
    },
    MODERATE_DR: {
      title: "Possible Moderate DR",
      subtitle: "ICDR Grade 2 (Moderate Non-Proliferative DR)",
      badge: "Grade 2: Moderate NPDR",
      gradient: "from-amber-800 via-orange-700 to-amber-900",
      accentBg: "bg-orange-500/20 border-orange-300/40 text-orange-100",
      statusText: "Screening Completed: Moderate Risk",
      summary: "Multiple microaneurysms, dot/blot hemorrhages, and lipid exudates detected. Specialist tele-consultation advised.",
      urgency: "Specialist Review Recommended (3-6 Months)",
      icon: AlertTriangle
    },
    SEVERE_DR: {
      title: "Possible Severe DR",
      subtitle: "ICDR Grade 3 (Severe Non-Proliferative DR)",
      badge: "Grade 3: Severe NPDR",
      gradient: "from-rose-800 via-rose-700 to-red-900",
      accentBg: "bg-rose-500/20 border-rose-300/40 text-rose-100",
      statusText: "Screening Completed: High Risk (Urgent)",
      summary: "Extensive 4-quadrant intraretinal hemorrhages and severe capillary non-perfusion detected. Prompt clinical evaluation indicated.",
      urgency: "Specialist Review Recommended (7-14 Days)",
      icon: AlertTriangle
    },
    PROLIFERATIVE_DR: {
      title: "Possible Proliferative DR",
      subtitle: "ICDR Grade 4 (Proliferative Diabetic Retinopathy)",
      badge: "Grade 4: PDR (Sight Threatening)",
      gradient: "from-red-950 via-rose-900 to-red-900",
      accentBg: "bg-red-500/30 border-red-300/50 text-red-100",
      statusText: "Screening Completed: Critical Sight-Threatening",
      summary: "Fragile neovascularization vessels (NVD/NVE) or vitreous hemorrhage detected. Emergency hospital referral required.",
      urgency: "Immediate Specialist Referral (Within 48-72h)",
      icon: ShieldAlert
    },
    UNDETERMINED: {
      title: "Unable to determine / low confidence",
      subtitle: "Sub-optimal Optical Quality or Ambiguous Biomarkers",
      badge: "Quality / Confidence Inconclusive",
      gradient: "from-slate-800 via-slate-700 to-slate-900",
      accentBg: "bg-slate-500/20 border-slate-400/40 text-slate-200",
      statusText: "Screening Inconclusive: Image Retake Recommended",
      summary: "Severe pupil constriction, corneal opacity, or motion blur prevented reliable automated AI feature extraction.",
      urgency: "Re-capture Fundus Image or Refer to Doctor",
      icon: HelpCircle
    }
  };

  const current = severityStates[stateKey] || severityStates.SEVERE_DR;
  const StateIcon = current.icon;

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${current.gradient} text-white shadow-elevated p-6 sm:p-8 space-y-5 ${className}`}>
      
      {/* Decorative Ambient Blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Meta Header: Screening Status + Eye + Doctor Status */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span className="uppercase tracking-wider font-bold text-white/90">
            {current.statusText}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Eye Indicator */}
          <span className="px-2.5 py-0.5 rounded-full bg-black/30 text-white border border-white/20 font-mono text-[11px] flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{eye === 'OD' ? 'OD (Right Eye)' : 'OS (Left Eye)'}</span>
          </span>

          {/* Doctor Review Status Pill */}
          <span className="px-3 py-0.5 rounded-full bg-white/20 text-white border border-white/30 text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-xs">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{doctorReviewStatus}</span>
          </span>
        </div>
      </div>

      {/* Main Severity Presentation */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/30 border border-white/20">
              {current.badge}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20">
              AI Confidence: {stateKey === 'UNDETERMINED' ? '< 60%' : `${confidence.toFixed(1)}%`}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight font-display text-white">
            {current.title}
          </h2>

          <p className="text-xs sm:text-sm text-white/90 max-w-2xl font-medium leading-relaxed">
            {current.summary}
          </p>
        </div>

        {/* Clinical Referral Urgency Box */}
        <div className="w-full md:w-auto min-w-[260px] p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 space-y-1.5 flex-shrink-0">
          <div className="text-[10px] uppercase font-bold text-white/75 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Recommended Clinical Action:</span>
          </div>
          <div className="font-bold text-sm text-white">
            {current.urgency}
          </div>
          <p className="text-[11px] text-white/80 leading-snug">
            Specialist review recommended to correlate with visual acuity and glycemic status.
          </p>
        </div>
      </div>

      {/* Non-Definitive Medical Decision Support Notice */}
      <div className="relative z-10 p-3 rounded-2xl bg-black/25 border border-white/15 text-[11px] text-white/90 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
        <span>
          <strong>AI screening result</strong> for preliminary triage only. This report does not represent a definitive medical diagnosis. A certified ophthalmologist should conduct dilated biomicroscopy.
        </span>
      </div>

    </div>
  );
}
