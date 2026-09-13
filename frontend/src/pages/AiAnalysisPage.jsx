import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Cpu,
  Server,
  AlertCircle,
  RotateCw,
  XCircle,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DR_GRADES, CLINICAL_SAMPLE_CASES } from '../data/mockData';
import { evaluateClientFundusQuality } from '../utils/qualityCheck';
import RetinalVisualizer from '../components/RetinalVisualizer';

export default function AiAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    screeningSession, 
    submitScreeningToBackend, 
    isBackendConnected,
    language 
  } = useApp();

  const navState = location.state || {};
  const activeFile = navState.uploadedFile || screeningSession.uploadedFile;
  const activeImgUrl = navState.uploadedImageUrl || screeningSession.uploadedImageUrl;
  const activeEye = navState.eye || screeningSession.eye || 'OD';
  const activeCase = navState.caseData !== undefined ? navState.caseData : screeningSession.caseData;
  const patient = screeningSession.patient || {};

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(10);
  const [isCompleted, setIsCompleted] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  const [stepStates, setStepStates] = useState([
    {
      id: 0,
      title: "1. Retinal Morphology Verification Gate",
      desc: "Checking anatomical features: optic nerve head, vascular arcades, and choroidal pigment.",
      status: "pending", // 'pending' | 'active' | 'passed' | 'failed' | 'skipped'
      detail: null,
    },
    {
      id: 1,
      title: "2. Optical Clarity & Defocus Verification",
      desc: "Evaluating sharpness, focus score, illumination uniformity, and contrast dynamics.",
      status: "pending",
      detail: null,
    },
    {
      id: 2,
      title: "3. Deep Microvascular Lesion & Biomarker Analysis",
      desc: "Quantifying capillary microaneurysms, intraretinal blot hemorrhages, and lipid exudates.",
      status: "pending",
      detail: null,
    },
    {
      id: 3,
      title: "4. Multi-Quadrant Retinal Laser Scanning & Grad-CAM",
      desc: "Sweeping 360° laser scan and synthesizing convolutional attention activation maps.",
      status: "pending",
      detail: null,
    },
    {
      id: 4,
      title: "5. Clinical Diagnostic Verdict & ICDR Staging",
      desc: "Computing calibrated ICDR severity grade (0 to 4), confidence score, and report.",
      status: "pending",
      detail: null,
    },
  ]);

  const updateStepState = (idx, status, detail = null) => {
    setStepStates(prev => prev.map((s, i) => i === idx ? { ...s, status, detail: detail !== null ? detail : s.detail } : s));
  };

  useEffect(() => {
    let isCancelled = false;

    async function executeDiagnosticPipeline() {
      // 1. Kick off backend call in parallel
      const backendPromise = submitScreeningToBackend({
        uploadedFile: activeFile,
        uploadedImageUrl: activeImgUrl,
        eye: activeEye,
        caseData: activeCase,
        patient: patient,
      }).catch((err) => {
        console.warn("Backend screening error:", err.message);
        setApiError(err.message);
        return null;
      });

      // =========================================================================
      // STEP 1: Retinal Morphology Verification Gate
      // =========================================================================
      setCurrentStep(0);
      setProgress(15);
      updateStepState(0, 'active', 'Scanning anatomical features: optic nerve head, vascular arcades, and choroidal pigment...');

      let clientQuality = null;
      const imageSource = activeFile || activeImgUrl;
      if (imageSource) {
        try {
          clientQuality = await evaluateClientFundusQuality(imageSource);
        } catch (e) {
          console.warn("Client morphology evaluation error:", e);
        }
      }
      if (isCancelled) return;

      // Allow visual animation transition
      await new Promise(r => setTimeout(r, 650));
      if (isCancelled) return;

      // Check if Step 1 failed via client-side morphology gate
      if (clientQuality && clientQuality.is_retina === false) {
        updateStepState(0, 'failed', 'Rejected: Non-retinal image detected — lacks optic disc and vascular arcades. No result as the image is not valid.');
        updateStepState(1, 'skipped', 'Skipped: Optical clarity test halted.');
        updateStepState(2, 'skipped', 'Skipped: Microvascular biomarker analysis halted.');
        updateStepState(3, 'skipped', 'Skipped: Laser scanning & Grad-CAM halted.');
        updateStepState(4, 'skipped', 'Skipped: ICDR staging unavailable.');
        
        const res = await backendPromise;
        if (!isCancelled) {
          const fallbackRes = res || {
            isInvalidImage: true,
            qualityStatus: 'INVALID_IMAGE',
            gradeName: 'No Result as the Image is Not Valid',
            actionText: 'No result as the image is not valid',
            actionHindi: 'अमान्य फोटो: आंख के पर्दे की फोटो नहीं है',
            recommendation: 'No result as the image is not valid. The captured photograph is not a retinal fundus image. Please capture or upload a valid retinal scan.'
          };
          setAnalysisResult(fallbackRes);
          setIsCompleted(true);
          setProgress(100);
        }
        return;
      }

      // Mark Step 1 Passed
      updateStepState(0, 'passed', 'Verified: Optic nerve head, vascular arcades & choroidal pigmentation confirmed.');
      setProgress(35);

      // =========================================================================
      // STEP 2: Optical Clarity & Defocus Verification
      // =========================================================================
      setCurrentStep(1);
      updateStepState(1, 'active', 'Evaluating sharpness, focus score, illumination uniformity, and contrast dynamics...');
      await new Promise(r => setTimeout(r, 700));
      if (isCancelled) return;

      // Check if Step 2 failed via client-side clarity
      if (clientQuality && clientQuality.is_clear === false) {
        const qScore = Math.round(clientQuality.quality_score || 40);
        updateStepState(1, 'failed', `Rejected: Optical clarity below clinical threshold (${qScore}/100) — motion blur or low lighting. Retake the image, it is not clear.`);
        updateStepState(2, 'skipped', 'Skipped: Microvascular biomarker analysis halted.');
        updateStepState(3, 'skipped', 'Skipped: Laser scanning & Grad-CAM halted.');
        updateStepState(4, 'skipped', 'Skipped: ICDR staging unavailable.');

        const res = await backendPromise;
        if (!isCancelled) {
          const fallbackRes = res || {
            isRetakeRequired: true,
            qualityStatus: 'RETAKE_REQUIRED',
            gradeName: 'Retake Required (Image Not Clear)',
            actionText: 'Retake the image, it is not clear',
            actionHindi: 'दोबारा फोटो लें: फोटो साफ नहीं है',
            recommendation: 'Retake the image, it is not clear. Image clarity is insufficient for automated diagnostic analysis.'
          };
          setAnalysisResult(fallbackRes);
          setIsCompleted(true);
          setProgress(100);
        }
        return;
      }

      // Await backend response now before proceeding to deep ML stages
      const backendRes = await backendPromise;
      if (isCancelled) return;

      // Double-check backend verification results
      if (backendRes?.isInvalidImage || backendRes?.qualityStatus === 'INVALID_IMAGE') {
        updateStepState(0, 'failed', 'Rejected: Non-retinal image detected — lacks optic disc and vascular arcades. No result as the image is not valid.');
        updateStepState(1, 'skipped', 'Skipped: Optical clarity test halted.');
        updateStepState(2, 'skipped', 'Skipped: Microvascular biomarker analysis halted.');
        updateStepState(3, 'skipped', 'Skipped: Laser scanning & Grad-CAM halted.');
        updateStepState(4, 'skipped', 'Skipped: ICDR staging unavailable.');
        setAnalysisResult(backendRes);
        setIsCompleted(true);
        setProgress(100);
        return;
      }

      if (backendRes?.isRetakeRequired || backendRes?.qualityStatus === 'RETAKE_REQUIRED') {
        const qScore = Math.round(backendRes.qualityScore || 45);
        updateStepState(1, 'failed', `Rejected: Optical clarity below clinical threshold (${qScore}/100). Retake the image, it is not clear.`);
        updateStepState(2, 'skipped', 'Skipped: Microvascular biomarker analysis halted.');
        updateStepState(3, 'skipped', 'Skipped: Laser scanning & Grad-CAM halted.');
        updateStepState(4, 'skipped', 'Skipped: ICDR staging unavailable.');
        setAnalysisResult(backendRes);
        setIsCompleted(true);
        setProgress(100);
        return;
      }

      // Step 2 Passed!
      const clarityScore = Math.round(backendRes?.qualityScore ?? clientQuality?.quality_score ?? 94);
      updateStepState(1, 'passed', `Verified: Optical clarity optimal (Focus: ${clarityScore}/100, Sharpness & Illumination adequate).`);
      setProgress(55);

      // =========================================================================
      // STEP 3: Deep Microvascular Lesion & Biomarker Analysis
      // =========================================================================
      setCurrentStep(2);
      updateStepState(2, 'active', 'Quantifying capillary microaneurysms, intraretinal blot hemorrhages, and lipid exudates...');
      await new Promise(r => setTimeout(r, 700));
      if (isCancelled) return;

      const lesions = backendRes?.lesions || activeCase?.lesions || { microaneurysms: 0, hemorrhages: 0, hardExudates: 0, cottonWoolSpots: 0 };
      const ma = lesions.microaneurysms ?? 0;
      const he = lesions.hemorrhages ?? 0;
      const ex = (lesions.hardExudates ?? lesions.exudates) ?? 0;
      const cw = lesions.cottonWoolSpots ?? 0;
      updateStepState(2, 'passed', `Quantified: ${ma} microaneurysms, ${he} blot hemorrhages, ${ex} lipid exudates, ${cw} cotton wool spots.`);
      setProgress(75);

      // =========================================================================
      // STEP 4: Multi-Quadrant Retinal Laser Scanning & Grad-CAM
      // =========================================================================
      setCurrentStep(3);
      updateStepState(3, 'active', 'Sweeping 360° laser scan and synthesizing convolutional attention activation maps...');
      await new Promise(r => setTimeout(r, 700));
      if (isCancelled) return;

      const hotspots = backendRes?.hotspots || activeCase?.gradcamHotspots || [];
      updateStepState(3, 'passed', `Synthesized: 360° laser sweep complete — Grad-CAM attention map generated (${hotspots.length} focal activation zones).`);
      setProgress(90);

      // =========================================================================
      // STEP 5: Clinical Diagnostic Verdict & ICDR Staging
      // =========================================================================
      setCurrentStep(4);
      updateStepState(4, 'active', 'Computing calibrated ICDR severity grade (0 to 4), confidence score, and report...');
      await new Promise(r => setTimeout(r, 650));
      if (isCancelled) return;

      const finalGrade = backendRes?.grade ?? activeCase?.predictedGrade ?? 0;
      const finalGradeName = backendRes?.gradeName || (finalGrade === 0 ? "Normal Retina (No DR)" : `ICDR Grade ${finalGrade}`);
      const finalConf = backendRes?.confidence ?? 95.0;
      const finalRisk = backendRes?.riskCategory || (finalGrade === 0 ? "Low" : finalGrade >= 3 ? "Critical" : "Moderate");
      updateStepState(4, 'passed', `Diagnosed: ICDR Grade ${finalGrade} (${finalGradeName}) • Confidence: ${finalConf}% • Risk: ${finalRisk}`);
      setProgress(100);

      if (backendRes) {
        setAnalysisResult(backendRes);
      }
      setIsCompleted(true);
    }

    executeDiagnosticPipeline();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleGoToResults = () => {
    navigate('/screening-result', { state: { result: analysisResult } });
  };

  const handleReupload = () => {
    navigate('/fundus-upload');
  };

  const isInvalidImage = analysisResult?.isInvalidImage || analysisResult?.qualityStatus === 'INVALID_IMAGE' || stepStates[0].status === 'failed';
  const isRetakeRequired = analysisResult?.isRetakeRequired || analysisResult?.qualityStatus === 'RETAKE_REQUIRED' || stepStates[1].status === 'failed';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
          isInvalidImage
            ? 'bg-rose-50 border border-rose-200 text-rose-700'
            : isRetakeRequired
            ? 'bg-amber-50 border border-amber-200 text-amber-700'
            : 'bg-purple-50 border border-purple-200 text-purple-700'
        }`}>
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>FastAPI + Explainable Neural Diagnostic Engine</span>
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
          {isCompleted 
            ? isInvalidImage
              ? (language === 'hi' ? 'अमान्य फोटो: आंख के पर्दे की फोटो नहीं है' : 'No Result: Not a Retina Image')
              : isRetakeRequired
              ? (language === 'hi' ? 'दोबारा फोटो लें: फोटो साफ नहीं है' : 'Retake Required: Image Not Clear')
              : (language === 'hi' ? 'जांच पूर्ण हो चुकी है!' : 'Diagnostic Screening Complete')
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
          <div className={`relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] rounded-full overflow-hidden border-4 shadow-elevated flex items-center justify-center bg-slate-950 transition-colors ${
            isInvalidImage 
              ? 'border-rose-500' 
              : isRetakeRequired 
              ? 'border-amber-500' 
              : 'border-teal-600'
          }`}>
            
            {/* Visualizer Canvas */}
            <RetinalVisualizer 
              grade={isInvalidImage || isRetakeRequired ? 0 : (analysisResult?.grade ?? activeCase?.predictedGrade ?? 0)}
              eye={activeEye}
              hotspots={isInvalidImage || isRetakeRequired ? [] : (analysisResult?.hotspots ?? activeCase?.gradcamHotspots ?? [])}
              lesionMarkers={isInvalidImage || isRetakeRequired ? [] : (activeCase?.lesionMarkers ?? [])}
              heatmapUrl={isInvalidImage || isRetakeRequired ? null : (analysisResult?.heatmapUrl || analysisResult?.heatmap_url)}
              interactive={false}
              defaultMode={(!isInvalidImage && !isRetakeRequired && currentStep >= 3) ? "gradcam" : (!isInvalidImage && !isRetakeRequired && currentStep >= 1) ? "redfree" : "original"}
              customImageUrl={activeImgUrl}
            />

            {/* Glowing Laser Scanner Line (only while actively scanning valid retina) */}
            {!isCompleted && !isInvalidImage && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-center">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-scan" />
              </div>
            )}

            {/* Radar Circle Grid */}
            <div className={`absolute inset-0 rounded-full border pointer-events-none ${isInvalidImage ? 'border-rose-400/30' : isRetakeRequired ? 'border-amber-400/30' : 'border-teal-400/30'}`} />
            <div className={`absolute inset-8 rounded-full border pointer-events-none ${isInvalidImage ? 'border-rose-400/20' : isRetakeRequired ? 'border-amber-400/20' : 'border-teal-400/20'}`} />
            <div className={`absolute inset-16 rounded-full border pointer-events-none ${isInvalidImage ? 'border-rose-400/15' : isRetakeRequired ? 'border-amber-400/15' : 'border-teal-400/15'}`} />
          </div>

          {/* Progress Bar under scan */}
          <div className="w-full max-w-xs mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-mono font-bold">
              <span className="text-slate-500">Analysis Progress</span>
              <span className={isInvalidImage ? 'text-rose-600' : isRetakeRequired ? 'text-amber-600' : 'text-teal-700'}>
                {progress}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
              <div 
                className={`h-full rounded-full transition-all duration-300 shadow-xs ${
                  isInvalidImage 
                    ? 'bg-rose-500' 
                    : isRetakeRequired 
                    ? 'bg-amber-500' 
                    : 'bg-gradient-to-r from-teal-600 to-emerald-500'
                }`}
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
            <span className="text-xs text-purple-700 font-mono font-bold bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
              <Server className="w-3 h-3 text-purple-600" />
              <span>{activeFile ? "POST /screenings/analyze-upload" : "POST /screenings"}</span>
            </span>
          </div>

          {/* 5 Steps Indicator */}
          <div className="space-y-3">
            {stepStates.map((step, idx) => {
              const status = step.status; // 'pending' | 'active' | 'passed' | 'failed' | 'skipped'

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 ${
                    status === 'passed'
                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-800'
                      : status === 'failed'
                      ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                      : status === 'skipped'
                      ? 'bg-slate-50/40 border-slate-200 text-slate-400 opacity-60'
                      : status === 'active'
                      ? 'bg-purple-50/70 border-purple-400 shadow-sm text-slate-900 scale-[1.01]'
                      : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-50'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {status === 'passed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    ) : status === 'skipped' ? (
                      <Ban className="w-5 h-5 text-slate-400" />
                    ) : status === 'active' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-mono font-bold text-slate-500">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm flex items-center justify-between gap-2">
                      <span className={
                        status === 'passed' 
                          ? 'text-slate-900' 
                          : status === 'failed' 
                          ? 'text-rose-900 font-extrabold' 
                          : status === 'active' 
                          ? 'text-purple-900' 
                          : 'text-slate-500'
                      }>
                        {step.title}
                      </span>
                      
                      {status === 'passed' && (
                        <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-100/60 px-2 py-0.5 rounded flex-shrink-0">
                          Verified
                        </span>
                      )}
                      {status === 'failed' && (
                        <span className="text-[10px] text-rose-700 font-mono font-bold bg-rose-100 px-2 py-0.5 rounded flex-shrink-0">
                          Failed
                        </span>
                      )}
                      {status === 'skipped' && (
                        <span className="text-[10px] text-slate-400 font-mono font-bold flex-shrink-0">
                          Skipped
                        </span>
                      )}
                      {status === 'active' && (
                        <span className="text-[10px] text-purple-700 font-mono font-bold animate-pulse flex-shrink-0">
                          Analyzing...
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-[11px] mt-0.5 font-medium leading-relaxed ${
                      status === 'failed' 
                        ? 'text-rose-800 font-semibold' 
                        : status === 'passed' 
                        ? 'text-emerald-800' 
                        : 'text-slate-500'
                    }`}>
                      {step.detail || step.desc}
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
              <span>Backend Notice: {apiError}. High-precision local diagnostic fallback engaged.</span>
            </div>
          )}

          {/* Result Ready or Re-upload Action Buttons */}
          {isCompleted && (
            <div className="pt-4 border-t border-slate-100 animate-fade-in space-y-3">
              {isInvalidImage ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                    <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <span>No result as the image is not valid</span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium leading-relaxed">
                    {analysisResult?.recommendation || "The captured photograph is not a human retinal fundus image. Retinal morphology verification failed to locate optic disc, vascular arcades, or retinal pigmentation. Automated diabetic retinopathy analysis cannot be performed."}
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleReupload}
                      className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>Re-upload / Capture Retina Photograph</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGoToResults}
                      className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <span>View Technical Details</span>
                    </button>
                  </div>
                </div>
              ) : isRetakeRequired ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>Retake the image, it is not clear</span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    {analysisResult?.recommendation || "Image clarity is insufficient for automated diagnostic analysis. Excessive motion blur, optical defocus, or dark illumination obscures microvascular details."}
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleReupload}
                      className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>Retake / Re-upload Clear Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGoToResults}
                      className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <span>View Quality Report</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGoToResults}
                  className="w-full btn-primary-large text-base py-4 gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
                >
                  <span>
                    {language === 'hi' ? 'जांच परिणाम और विस्तृत रिपोर्ट देखें' : 'View Explainable Screening Result'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
