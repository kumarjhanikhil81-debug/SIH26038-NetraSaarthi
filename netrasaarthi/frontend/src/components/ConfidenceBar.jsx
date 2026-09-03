import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';

/**
 * ConfidenceBar Component
 * Renders calibrated confidence level with threshold indicators and color gradations
 */
export default function ConfidenceBar({
  confidence = 94.5,
  isLowConfidence = false,
  showLabels = true,
  className = ''
}) {
  // Determine confidence tier
  const isHigh = confidence >= 85 && !isLowConfidence;
  const isModerate = confidence >= 65 && confidence < 85 && !isLowConfidence;
  const isLow = confidence < 65 || isLowConfidence;

  const getTierInfo = () => {
    if (isLow) {
      return {
        label: "Low Confidence / Ambiguous",
        textColor: "text-amber-700",
        barColor: "bg-amber-500",
        badgeBg: "bg-amber-50 text-amber-800 border-amber-300",
        icon: AlertTriangle,
        description: "Image quality or ambiguous lesions prevent confident classification. Manual specialist review recommended."
      };
    }
    if (isModerate) {
      return {
        label: "Moderate Confidence",
        textColor: "text-blue-700",
        barColor: "bg-blue-600",
        badgeBg: "bg-blue-50 text-blue-800 border-blue-300",
        icon: CheckCircle2,
        description: "AI confidence meets baseline clinical screening threshold."
      };
    }
    return {
      label: "High Confidence",
      textColor: "text-emerald-700",
      barColor: "bg-gradient-to-r from-teal-600 to-emerald-600",
      badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
      icon: ShieldCheck,
      description: "Strong feature activation alignment across convolutional feature maps."
    };
  };

  const tier = getTierInfo();
  const IconComponent = tier.icon;

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <IconComponent className={`w-4 h-4 ${tier.textColor}`} />
            <span>AI Confidence Score</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${tier.badgeBg}`}>
              {tier.label}
            </span>
            <span className="font-mono font-black text-slate-900 text-sm">
              {isLowConfidence ? '< 60%' : `${confidence.toFixed(1)}%`}
            </span>
          </div>
        </div>
      )}

      {/* Progress Track */}
      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 shadow-xs ${tier.barColor}`}
          style={{ width: `${Math.min(100, Math.max(5, isLowConfidence ? 45 : confidence))}%` }}
        />
      </div>

      {/* Scale Legend Markers */}
      <div className="flex justify-between text-[10px] font-mono text-slate-500 font-semibold px-0.5">
        <span>0%</span>
        <span className="text-amber-600">65% (Triage Cutoff)</span>
        <span className="text-emerald-700">85% (High)</span>
        <span>100%</span>
      </div>

      {showLabels && (
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          {tier.description}
        </p>
      )}
    </div>
  );
}
