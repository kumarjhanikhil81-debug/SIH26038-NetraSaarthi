import React from 'react';
import { 
  Sparkles, 
  Activity, 
  Layers, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Cpu
} from 'lucide-react';

/**
 * ExplanationPanel Component
 * Presents detailed explainable AI (XAI) feature attribution, 
 * lesion counts, and anatomical risk factors.
 */
export default function ExplanationPanel({
  explanationText = "Convolutional feature maps identified dense focal activation around the superior temporal arcade, corresponding to clustered intraretinal microaneurysms and hard lipid exudates.",
  lesions = {
    microaneurysms: 28,
    hemorrhages: 19,
    hardExudates: 15,
    cottonWoolSpots: 5,
    neovascularization: false
  },
  fovealInvolvement = "Mild lipid ring proximity (< 500 μm)",
  opticalQuality = 94,
  className = ''
}) {
  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 font-display">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>AI Diagnostic Explanation & Feature Attribution</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Breakdown of deep neural activations, microvascular anomalies, and macula proximity
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          <span>Grad-CAM XAI Engine</span>
        </span>
      </div>

      {/* Primary Narrative Explanation Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
        <div className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4 text-purple-700" />
          <span>Clinical AI Explanation:</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
          {explanationText}
        </p>
        <p className="text-[11px] text-purple-900 font-semibold">
          Foveal Infiltration Status: <span className="font-bold text-slate-900">{fovealInvolvement}</span>
        </p>
      </div>

      {/* Quantitative Biomarkers & Lesions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-700" />
            <span>Detected Microvascular Biomarkers:</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            Quality: {opticalQuality}% Optimal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          {/* Microaneurysms */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Microaneurysms (MAs)</div>
              <div className="text-[10px] text-slate-500 font-medium">Early punctate focal dilations</div>
            </div>
            <span className="font-mono font-bold text-amber-700 text-sm px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200">
              {lesions?.microaneurysms ?? lesions?.micro_aneurysms ?? 0} found
            </span>
          </div>

          {/* Hemorrhages */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Intraretinal Hemorrhages</div>
              <div className="text-[10px] text-slate-500 font-medium">Dot, blot & flame hemorrhages</div>
            </div>
            <span className="font-mono font-bold text-rose-700 text-sm px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200">
              {lesions?.hemorrhages ?? lesions?.intraretinal_hemorrhages ?? 0} found
            </span>
          </div>

          {/* Hard Exudates */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Hard Exudates (Lipids)</div>
              <div className="text-[10px] text-slate-500 font-medium">Waxy circinate lipoprotein deposits</div>
            </div>
            <span className="font-mono font-bold text-yellow-700 text-sm px-2.5 py-1 rounded-xl bg-yellow-50 border border-yellow-200">
              {lesions?.hardExudates ?? lesions?.hard_exudates ?? 0} found
            </span>
          </div>

          {/* Cotton Wool Spots */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Cotton Wool Spots (CWS)</div>
              <div className="text-[10px] text-slate-500 font-medium">Localized nerve fiber layer infarcts</div>
            </div>
            <span className="font-mono font-bold text-slate-700 text-sm px-2.5 py-1 rounded-xl bg-slate-200">
              {lesions?.cottonWoolSpots ?? lesions?.cotton_wool_spots ?? 0} found
            </span>
          </div>

          {/* Neovascularization */}
          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Neovascularization (NVD/NVE)</div>
              <div className="text-[10px] text-slate-500 font-medium">Abnormal fragile new vessel proliferation on disc/retina</div>
            </div>
            <span className={`font-mono font-bold text-xs px-3 py-1 rounded-xl ${
              (Boolean(lesions?.neovascularization) && lesions?.neovascularization !== 0) || Boolean(lesions?.neovascularization_disc) || Boolean(lesions?.neovascularization_elsewhere)
                ? 'bg-red-100 text-red-900 border border-red-300'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {(Boolean(lesions?.neovascularization) && lesions?.neovascularization !== 0) || Boolean(lesions?.neovascularization_disc) || Boolean(lesions?.neovascularization_elsewhere) ? 'Present (High Risk)' : 'Absent'}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
