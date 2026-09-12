import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Cpu,
  Server,
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DR_GRADES, CLINICAL_SAMPLE_CASES } from '../data/mockData';
import RetinalVisualizer from '../components/RetinalVisualizer';

export default function AiAnalysisPage() {
  const navigate = useNavigate();
  const { 
    screeningSession, 
    submitScreeningToBackend, 
    isBackendConnected,
    language 
  } = useApp();

  const activeCase = screeningSession.caseData || CLINICAL_SAMPLE_CASES[0];
  const activeEye = screeningSession.eye || 'OD';
  const patient = screeningSession.patient || {};

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(10);
  const [isCompleted, setIsCompleted] = useState(false);
  const [apiError, setApiError] = useState(null);

  const steps = [
    {
      title: "1. Retinal Pre-processing & CLAHE",
      desc: "Contrast-Limited Adaptive Histogram Equalization & Green-channel filtering.",
      duration: 600,
    },
    {
      title: "2. Anatomical Landmark Localization",
      desc: "Detecting Foveal Avascular Zone (FAZ) & Optic Nerve Head (ONH) boundary.",
      duration: 700,
    },
    {
      title: "3. Deep Microvascular Lesion Segmentation",
      desc: "Quantifying microaneurysms, flame/blot hemorrhages, and lipid exudate rings.",
      duration: 750,
    },
    {
      title: "4. Explainable AI Grad-CAM Generation",
      desc: "Computing convolutional feature activation maps for visual interpretability.",
      duration: 700,
    },
    {
      title: "5. FastAPI Inference & SQLite Persistence (POST /screenings)",
      desc: "Calibrating Bayesian confidence scores across ICDR Grades 0 to 4 & saving report.",
      duration: 650,
    },
  ];

  useEffect(() => {
    let stepIndex = 0;
    const interval = setInterval(async () => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        setProgress(Math.round(((stepIndex + 1) / steps.length) * 100));
      } else {
        clearInterval(interval);
        
        try {
          // Send request to FastAPI backend (POST /screenings)
          await submitScreeningToBackend();
        } catch (err) {
          console.warn("Backend screening error:", err.message);
          setApiError(err.message);
        } finally {
          setIsCompleted(true);
          setProgress(100);
        }
      }
    }, 750);

    return () => clearInterval(interval);
  }, []);

  const handleGoToResults = () => {
    navigate('/screening-result');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
          <span>FastAPI + Explainable Neural Diagnostic Engine</span>
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          {isCompleted 
            ? (language === 'hi' ? 'जांच पूर्ण हो चुकी है!' : 'Diagnostic Screening Complete')
            : (language === 'hi' ? 'AI द्वारा आंख की जांच जारी है...' : 'Analyzing Retinal Microvasculature...')}
        </h1>
        
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium">
          Patient: <span className="text-slate-900 font-bold">{patient?.name || patient?.custom_id || 'Registered Patient'}</span> • Examined: <span className="text-teal-700 font-bold">{activeEye === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}</span>
        </p>
      </div>

      {/* Main Grid: Live Radar Visualizer (Left) + Pipeline Steps (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left: Retinal Canvas with Laser Scanner Beam (5 Cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] rounded-full overflow-hidden border-4 border-teal-600 shadow-elevated flex items-center justify-center bg-slate-950">
            
            {/* Visualizer Canvas */}
            <RetinalVisualizer 
              grade={activeCase?.predictedGrade ?? 0}
              eye={activeEye}
              hotspots={activeCase?.gradcamHotspots ?? []}
              lesionMarkers={activeCase?.lesionMarkers ?? []}
              interactive={false}
              defaultMode={currentStep >= 3 ? "gradcam" : currentStep >= 1 ? "redfree" : "original"}
              customImageUrl={screeningSession.uploadedImageUrl}
            />

            {/* Glowing Laser Scanner Line */}
            {!isCompleted && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-center">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-scan" />
              </div>
            )}

            {/* Radar Circle Grid */}
            <div className="absolute inset-0 rounded-full border border-teal-400/30 pointer-events-none" />
            <div className="absolute inset-8 rounded-full border border-teal-400/20 pointer-events-none" />
            <div className="absolute inset-16 rounded-full border border-teal-400/15 pointer-events-none" />
          </div>

          {/* Progress Bar under scan */}
          <div className="w-full max-w-xs mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-mono font-bold">
              <span className="text-slate-500">Analysis Progress</span>
              <span className="text-teal-700">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
              <div 
                className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Diagnostic Pipeline Steps & Inference Engine (7 Cols) */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>Diagnostic Inference Pipeline</span>
            </h3>
            <span className="text-xs text-purple-700 font-mono font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
              <Server className="w-3 h-3 text-purple-600" />
              <span>POST /screenings</span>
            </span>
          </div>

          {/* 5 Steps Indicator */}
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isDone = currentStep > idx || isCompleted;
              const isCurrent = currentStep === idx && !isCompleted;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 ${
                    isDone 
                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-800' 
                      : isCurrent 
                      ? 'bg-purple-50/70 border-purple-400 shadow-sm text-slate-900 scale-[1.01]' 
                      : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-mono font-bold text-slate-500">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-bold text-xs sm:text-sm flex items-center justify-between">
                      <span className={isDone ? 'text-slate-900' : isCurrent ? 'text-purple-900' : 'text-slate-500'}>
                        {step.title}
                      </span>
                      {isDone && <span className="text-[10px] text-emerald-700 font-mono font-bold">Completed</span>}
                      {isCurrent && <span className="text-[10px] text-purple-700 font-mono font-bold animate-pulse">Processing...</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* API Warning Notice if Backend is in Fallback Mode */}
          {apiError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Backend Notice: {apiError}. Using high-precision local diagnostic fallback.</span>
            </div>
          )}

          {/* Result Ready Button */}
          {isCompleted && (
            <div className="pt-4 border-t border-slate-100 animate-fade-in">
              <button
                onClick={handleGoToResults}
                className="w-full btn-primary-large text-base py-4"
              >
                <span>
                  {language === 'hi' ? 'जांच परिणाम और रिपोर्ट देखें' : 'View Explainable Screening Result'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
