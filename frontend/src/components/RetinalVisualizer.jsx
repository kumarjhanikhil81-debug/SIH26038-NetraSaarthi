import React, { useRef, useEffect, useState } from 'react';
import { Layers, Eye, Sliders, Sparkles, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { drawFundusOnCanvas, drawGradcamOnCanvas } from '../utils/retinaCanvas';
import { getApiBaseUrl } from '../services/api';

export default function RetinalVisualizer({
  grade = 2,
  eye = 'OD',
  hotspots = [],
  lesionMarkers = [],
  qualityScore = 95,
  interactive = true,
  defaultMode = 'gradcam', // 'original' | 'gradcam' | 'redfree' | 'lesions'
  customImageUrl = null,
  heatmapUrl = null,
}) {
  const baseCanvasRef = useRef(null);
  const gradcamCanvasRef = useRef(null);
  
  const [viewMode, setViewMode] = useState(defaultMode);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.65);
  const [showLesions, setShowLesions] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeMarker, setActiveMarker] = useState(null);

  // Redraw canvases on state change
  useEffect(() => {
    const isRedFree = viewMode === 'redfree';
    
    if (baseCanvasRef.current) {
      if (customImageUrl && typeof customImageUrl === 'string') {
        const fullCustomUrl = customImageUrl.startsWith('/static/')
          ? `${getApiBaseUrl()}${customImageUrl}`
          : customImageUrl;
        // Draw user uploaded image
        const ctx = baseCanvasRef.current.getContext('2d');
        const img = new Image();
        if (!fullCustomUrl.startsWith('data:') && !fullCustomUrl.startsWith('blob:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          try {
            ctx.clearRect(0, 0, 400, 400);
            ctx.save();
            ctx.beginPath();
            ctx.arc(200, 200, 188, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, 0, 0, 400, 400);
            ctx.restore();
          } catch (err) {
            console.warn("Canvas drawing error:", err);
          }
        };
        img.onerror = () => {
          drawFundusOnCanvas(baseCanvasRef.current, {
            grade,
            eye,
            isRedFree
          });
        };
        img.src = fullCustomUrl;
      } else {
        drawFundusOnCanvas(baseCanvasRef.current, {
          grade,
          eye,
          isRedFree
        });
      }
    }

    if (gradcamCanvasRef.current) {
      const showHeatmap = viewMode === 'gradcam' || (viewMode === 'original' && heatmapOpacity > 0);
      const effectiveOpacity = viewMode === 'gradcam' ? heatmapOpacity : 0;

      if (heatmapUrl && effectiveOpacity > 0) {
        const fullHeatmapUrl = heatmapUrl.startsWith('/static/')
          ? `${getApiBaseUrl()}${heatmapUrl}`
          : heatmapUrl;
        const gCtx = gradcamCanvasRef.current.getContext('2d');
        const hImg = new Image();
        if (!fullHeatmapUrl.startsWith('data:') && !fullHeatmapUrl.startsWith('blob:')) {
          hImg.crossOrigin = 'anonymous';
        }
        hImg.onload = () => {
          try {
            gCtx.clearRect(0, 0, 400, 400);
            gCtx.save();
            gCtx.beginPath();
            gCtx.arc(200, 200, 188, 0, Math.PI * 2);
            gCtx.clip();
            gCtx.globalAlpha = effectiveOpacity;
            gCtx.drawImage(hImg, 0, 0, 400, 400);
            gCtx.restore();
          } catch (err) {
            drawGradcamOnCanvas(gradcamCanvasRef.current, hotspots, effectiveOpacity);
          }
        };
        hImg.onerror = () => {
          drawGradcamOnCanvas(gradcamCanvasRef.current, hotspots, effectiveOpacity);
        };
        hImg.src = fullHeatmapUrl;
      } else {
        drawGradcamOnCanvas(gradcamCanvasRef.current, hotspots, effectiveOpacity);
      }
    }
  }, [grade, eye, viewMode, heatmapOpacity, hotspots, customImageUrl, heatmapUrl]);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* Visualizer Top Control Bar */}
      {interactive && (
        <div className="w-full flex flex-wrap items-center justify-between gap-2 p-2 mb-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setViewMode('original')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'original'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Original Fundus
            </button>
            <button
              onClick={() => setViewMode('gradcam')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'gradcam'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Grad-CAM Heatmap
            </button>
            <button
              onClick={() => setViewMode('redfree')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'redfree'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Red-Free (Green)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowLesions(v => !v)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                showLesions 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle lesion markers"
            >
              Lesions
            </button>
            <button
              onClick={() => setShowLandmarks(v => !v)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                showLandmarks 
                  ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Toggle anatomical landmarks"
            >
              Landmarks
            </button>
          </div>
        </div>
      )}

      {/* Main Retinal View Canvas Area */}
      <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full p-2 bg-slate-950 shadow-2xl border-4 border-slate-300 flex items-center justify-center overflow-hidden group">
        
        {/* Alignment reticle ring */}
        <div className="absolute inset-2 rounded-full border border-teal-500/30 pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-slate-700/40 border-dashed pointer-events-none" />

        {/* Zoom Transform Wrapper */}
        <div 
          className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base Fundus Canvas */}
          <canvas
            ref={baseCanvasRef}
            width={400}
            height={400}
            className="absolute inset-0 w-full h-full rounded-full"
          />

          {/* Grad-CAM Attention Heatmap Canvas */}
          <canvas
            ref={gradcamCanvasRef}
            width={400}
            height={400}
            className={`absolute inset-0 w-full h-full rounded-full pointer-events-none transition-opacity duration-300 ${
              viewMode === 'gradcam' ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Anatomical Landmark Overlays */}
          {showLandmarks && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Optic Disc */}
              <div 
                className={`absolute top-[42%] ${eye === 'OD' ? 'right-[18%]' : 'left-[18%]'} -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-black/80 border border-yellow-400 text-yellow-300 text-[10px] font-bold font-mono tracking-wider shadow-lg`}
              >
                Optic Disc (ONH)
              </div>
              {/* Macula */}
              <div 
                className={`absolute top-[52%] ${eye === 'OD' ? 'left-[40%]' : 'right-[40%]'} -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-black/80 border border-cyan-400 text-cyan-300 text-[10px] font-bold font-mono tracking-wider shadow-lg`}
              >
                Macula / Fovea
              </div>
            </div>
          )}

          {/* Interactive Lesion Pin Markers */}
          {showLesions && lesionMarkers.map((marker, idx) => (
            <div
              key={idx}
              onClick={() => setActiveMarker(marker)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/pin"
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            >
              <div 
                className="w-4 h-4 rounded-full border-2 animate-ping absolute opacity-75"
                style={{ borderColor: marker.color }}
              />
              <div 
                className="w-3.5 h-3.5 rounded-full border-2 shadow-lg flex items-center justify-center transition-transform hover:scale-150"
                style={{ backgroundColor: marker.color, borderColor: '#ffffff' }}
              />
              {/* Tooltip on hover */}
              <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 opacity-0 group-hover/pin:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap pointer-events-none shadow-xl z-30">
                {marker.type}
              </div>
            </div>
          ))}
        </div>

        {/* Eye Indicator Badge */}
        <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-white text-xs font-bold font-mono shadow-md">
          {eye === 'OD' ? 'OD (Right Eye)' : eye === 'OS' ? 'OS (Left Eye)' : 'Eye Scan'}
        </div>

        {/* Quality Score Badge */}
        <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold font-mono shadow-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Quality: {qualityScore}%
        </div>

        {/* Active Marker Detail Card inside canvas */}
        {activeMarker && (
          <div className="absolute bottom-4 left-4 right-4 z-30 p-3 rounded-2xl bg-white/95 border border-amber-400 text-slate-900 text-xs flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: activeMarker.color }} />
              <div>
                <span className="font-bold text-slate-900">{activeMarker.type}</span>
                <p className="text-[10px] text-slate-600">Microvascular lesion segmented by AI</p>
              </div>
            </div>
            <button
              onClick={() => setActiveMarker(null)}
              className="text-slate-600 hover:text-slate-900 px-2 py-1 text-xs bg-slate-100 rounded-lg font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Visualizer Bottom Controls (Opacity slider & Zoom) */}
      {interactive && viewMode === 'gradcam' && (
        <div className="w-full mt-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Sliders className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="font-bold text-slate-700 whitespace-nowrap">Heatmap Opacity:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
              className="w-32 sm:w-40 accent-purple-600 cursor-pointer"
            />
            <span className="font-mono font-bold text-purple-700 w-8">{Math.round(heatmapOpacity * 100)}%</span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setZoomLevel(z => Math.max(1, z - 0.2))}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-slate-600">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(z => Math.min(1.8, z + 0.2))}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Grad-CAM Color Legend */}
      {viewMode === 'gradcam' && (
        <div className="w-full mt-2 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 shadow-2xs flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span className="font-bold text-slate-800">AI Attention Weight:</span>
          <div className="flex items-center gap-2">
            <span>Low (0.0)</span>
            <div 
              className="w-28 h-2.5 rounded-full shadow-inner" 
              style={{ background: 'linear-gradient(to right, #2563eb, #2dd4bf, #facc15, #dc2626)' }} 
            />
            <span className="text-red-600 font-bold">High (1.0)</span>
          </div>
        </div>
      )}
    </div>
  );
}
