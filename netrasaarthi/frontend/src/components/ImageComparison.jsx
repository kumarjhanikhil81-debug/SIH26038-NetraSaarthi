import React, { useState } from 'react';
import { 
  Eye, 
  Sparkles, 
  Layers, 
  Info
} from 'lucide-react';
import RetinalVisualizer from './RetinalVisualizer';

/**
 * ImageComparison Component
 * Displays side-by-side or blended comparison of the Original Retinal Image 
 * versus the Explainability Grad-CAM Heatmap.
 */
export default function ImageComparison({
  grade = 3,
  eye = 'OD',
  hotspots = [],
  lesionMarkers = [],
  qualityScore = 94,
  customImageUrl = null,
  className = ''
}) {
  const [viewMode, setViewMode] = useState('blend'); // 'blend' | 'side-by-side'

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6 ${className}`}>
      
      {/* Top Header & View Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 font-display">
            <Layers className="w-5 h-5 text-teal-700" />
            <span>Retinal Fundus & Explainability Heatmap Comparison</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Compare raw 45° macular image with Class Activation Mapping (Grad-CAM) feature attribution
          </p>
        </div>

        {/* Mode Switch Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('blend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'blend'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blend & Inspect
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'side-by-side'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side View
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Blend & Layer Inspection */}
      {viewMode === 'blend' && (
        <div className="w-full flex flex-col items-center space-y-4">
          <RetinalVisualizer 
            grade={grade}
            eye={eye}
            hotspots={hotspots}
            lesionMarkers={lesionMarkers}
            qualityScore={qualityScore}
            interactive={true}
            defaultMode="gradcam"
            customImageUrl={customImageUrl}
          />
        </div>
      )}

      {/* Mode 2: Side-by-Side Static & Heatmap Comparison */}
      {viewMode === 'side-by-side' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Left: Original Retinal Image */}
            <div className="flex flex-col items-center bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>1. Original Retinal Image</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {eye === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}
                </span>
              </div>

              <RetinalVisualizer 
                grade={grade}
                eye={eye}
                hotspots={[]}
                lesionMarkers={[]}
                interactive={false}
                defaultMode="original"
                customImageUrl={customImageUrl}
              />

              <p className="text-[11px] text-slate-500 text-center font-medium">
                Standard 45° Color Fundus with Optic Disc & Macula Fovea
              </p>
            </div>

            {/* Right: Grad-CAM Explainability Heatmap */}
            <div className="flex flex-col items-center bg-purple-50/50 p-5 rounded-2xl border-2 border-purple-300 space-y-3 shadow-sm">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>2. Explainability Heatmap (Grad-CAM)</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                  Layer: conv5_block3
                </span>
              </div>

              <RetinalVisualizer 
                grade={grade}
                eye={eye}
                hotspots={hotspots}
                lesionMarkers={lesionMarkers}
                interactive={false}
                defaultMode="gradcam"
                customImageUrl={customImageUrl}
              />

              <p className="text-[11px] text-purple-900 text-center font-semibold">
                Warm colors (Red/Yellow) highlight focal clusters driving prediction
              </p>
            </div>

          </div>

          {/* Colormap Legend */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-500" />
              <span>Jet/Turbo Activation Colormap:</span>
            </span>

            <div className="flex items-center gap-3">
              <div 
                className="w-48 h-3 rounded-full border border-slate-300" 
                style={{ background: 'linear-gradient(to right, #2563eb, #06b6d4, #eab308, #dc2626)' }}
              />
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 font-bold">
                <span>0.0 (Low)</span>
                <span>→</span>
                <span className="text-red-600">1.0 (Peak Attention)</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
