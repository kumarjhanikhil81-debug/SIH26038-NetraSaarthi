import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Printer, 
  ArrowLeft, 
  History, 
  User, 
  Sparkles,
  Sliders,
  CheckCircle2,
  Stethoscope,
  Send,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DR_GRADES, CLINICAL_SAMPLE_CASES } from '../data/mockData';

// Reusable Components
import ResultCard from '../components/ResultCard';
import ConfidenceBar from '../components/ConfidenceBar';
import ExplanationPanel from '../components/ExplanationPanel';
import ReferralCard from '../components/ReferralCard';
import ImageComparison from '../components/ImageComparison';
import VoiceGuide from '../components/VoiceGuide';
import ReferralSlipModal from '../components/ReferralSlipModal';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function ScreeningResultPage() {
  const navigate = useNavigate();
  const { 
    screeningSession, 
    language,
    selectedPatient,
    isOnline,
    isSyncing,
    syncOfflineScans,
    pendingSyncCount
  } = useApp();

  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [teleReviewRequested, setTeleReviewRequested] = useState(false);

  // Active screening parameters from session
  const rawResult = screeningSession.result || {
    grade: screeningSession.caseData?.predictedGrade ?? 0,
    confidence: screeningSession.caseData?.confidence ?? 95.8,
    lesions: screeningSession.caseData?.lesions ?? CLINICAL_SAMPLE_CASES[0].lesions,
    hotspots: screeningSession.caseData?.gradcamHotspots ?? CLINICAL_SAMPLE_CASES[0].gradcamHotspots,
    lesionMarkers: screeningSession.caseData?.lesionMarkers ?? CLINICAL_SAMPLE_CASES[0].lesionMarkers,
    qualityScore: screeningSession.caseData?.qualityScore ?? 94
  };

  const patient = screeningSession.patient || selectedPatient;
  const activeEye = screeningSession.eye || 'OD';

  // Map numerical grade (0-4) or quality gate status to stateKey for ResultCard & ReferralCard
  const mapGradeToStateKey = (grade) => {
    if (rawResult.qualityStatus === 'INVALID_IMAGE' || rawResult.actionText?.toLowerCase().includes('not valid')) {
      return 'INVALID_IMAGE';
    }
    if (rawResult.qualityStatus === 'RETAKE_REQUIRED' || rawResult.actionText?.toLowerCase().includes('not clear')) {
      return 'RETAKE_REQUIRED';
    }
    switch (grade) {
      case 0: return 'NO_DR';
      case 1: return 'MILD_DR';
      case 2: return 'MODERATE_DR';
      case 3: return 'SEVERE_DR';
      case 4: return 'PROLIFERATIVE_DR';
      default: return 'NO_DR';
    }
  };

  // State switcher to preview all example states
  const [activeStateKey, setActiveStateKey] = useState(mapGradeToStateKey(rawResult.grade));

  // Ensure activeStateKey updates dynamically when screening result arrives
  useEffect(() => {
    if (rawResult.grade !== undefined && rawResult.grade !== null) {
      setActiveStateKey(mapGradeToStateKey(rawResult.grade));
    }
  }, [rawResult.grade, rawResult.qualityStatus, rawResult.actionText]);

  // Mapping stateKey back to simulated parameters for demonstration
  const getStateParameters = (key) => {
    switch (key) {
      case 'INVALID_IMAGE':
        return {
          grade: 0,
          confidence: 0,
          isLowConfidence: true,
          isInvalidImage: true,
          lesions: { microaneurysms: 0, hemorrhages: 0, hardExudates: 0, cottonWoolSpots: 0, neovascularization: false },
          hotspots: [],
          lesionMarkers: [],
          explanation: "No result as the image is not valid. The captured photograph does not contain human retinal fundus structures (optic disc, retinal vasculature, or macula).",
          fovea: "Not Retinal Tissue",
          quality: 0
        };
      case 'RETAKE_REQUIRED':
        return {
          grade: 0,
          confidence: 0,
          isLowConfidence: true,
          isRetakeRequired: true,
          lesions: { microaneurysms: 0, hemorrhages: 0, hardExudates: 0, cottonWoolSpots: 0, neovascularization: false },
          hotspots: [],
          lesionMarkers: [],
          explanation: "Retake the image, it is not clear. Excessive blur, optical defocus, or dark illumination obscures retinal microvasculature.",
          fovea: "Unclear / Obscured",
          quality: rawResult.qualityScore || 45
        };
      case 'NO_DR':
        return {
          grade: 0,
          confidence: 98.2,
          isLowConfidence: false,
          lesions: { microaneurysms: 0, hemorrhages: 0, hardExudates: 0, cottonWoolSpots: 0, neovascularization: false },
          hotspots: CLINICAL_SAMPLE_CASES[0].gradcamHotspots,
          lesionMarkers: CLINICAL_SAMPLE_CASES[0].lesionMarkers,
          explanation: "No pathological microvascular changes detected. Regular vascular calibre and clear foveal avascular zone.",
          fovea: "Clear / Intact",
          quality: 96
        };
      case 'MILD_DR':
        return {
          grade: 1,
          confidence: 93.4,
          isLowConfidence: false,
          lesions: { microaneurysms: 4, hemorrhages: 1, hardExudates: 0, cottonWoolSpots: 0, neovascularization: false },
          hotspots: CLINICAL_SAMPLE_CASES[1].gradcamHotspots,
          lesionMarkers: CLINICAL_SAMPLE_CASES[1].lesionMarkers,
          explanation: "Isolated microaneurysms detected in the superior temporal vascular branch. No signs of macular edema or exudation.",
          fovea: "Normal (> 1500 μm away)",
          quality: 92
        };
      case 'MODERATE_DR':
        return {
          grade: 2,
          confidence: 91.8,
          isLowConfidence: false,
          lesions: { microaneurysms: 14, hemorrhages: 8, hardExudates: 6, cottonWoolSpots: 2, neovascularization: false },
          hotspots: CLINICAL_SAMPLE_CASES[2].gradcamHotspots,
          lesionMarkers: CLINICAL_SAMPLE_CASES[2].lesionMarkers,
          explanation: "Multiple intraretinal blot hemorrhages and circinate lipid exudates approaching the macula. Specialist review recommended.",
          fovea: "Near foveal margin (approx 800 μm)",
          quality: 90
        };
      case 'SEVERE_DR':
        return {
          grade: 3,
          confidence: 95.8,
          isLowConfidence: false,
          lesions: { microaneurysms: 28, hemorrhages: 19, hardExudates: 15, cottonWoolSpots: 5, neovascularization: false },
          hotspots: CLINICAL_SAMPLE_CASES[3].gradcamHotspots,
          lesionMarkers: CLINICAL_SAMPLE_CASES[3].lesionMarkers,
          explanation: "Extensive 4-quadrant hemorrhages and significant venous beading. High risk of rapid progression to proliferative retinopathy.",
          fovea: "Mild lipid ring proximity (< 500 μm)",
          quality: 94
        };
      case 'PROLIFERATIVE_DR':
        return {
          grade: 4,
          confidence: 97.5,
          isLowConfidence: false,
          lesions: { microaneurysms: 42, hemorrhages: 31, hardExudates: 22, cottonWoolSpots: 8, neovascularization: true },
          hotspots: CLINICAL_SAMPLE_CASES[4].gradcamHotspots,
          lesionMarkers: CLINICAL_SAMPLE_CASES[4].lesionMarkers,
          explanation: "Active neovascular fronds (NVD/NVE) detected near the optic nerve head with preretinal fibrous proliferation. Urgent specialist intervention required.",
          fovea: "Severe involvement / Ischemic hazard",
          quality: 91
        };
      case 'UNDETERMINED':
        return {
          grade: 0,
          confidence: 52.0,
          isLowConfidence: true,
          lesions: { microaneurysms: 0, hemorrhages: 0, hardExudates: 0, cottonWoolSpots: 0, neovascularization: false },
          hotspots: [],
          lesionMarkers: [],
          explanation: "Optical artifact, low illumination, or excessive media opacity prevented confident convolutional feature segmentation.",
          fovea: "Indeterminate",
          quality: 42
        };
      default:
        return {
          grade: 0,
          confidence: 95.8,
          isLowConfidence: false,
          lesions: CLINICAL_SAMPLE_CASES[0].lesions,
          hotspots: CLINICAL_SAMPLE_CASES[0].gradcamHotspots,
          lesionMarkers: CLINICAL_SAMPLE_CASES[0].lesionMarkers,
          explanation: "Routine screening complete.",
          fovea: "Clear / Intact",
          quality: 94
        };
    }
  };

  const baseStateData = getStateParameters(activeStateKey);
  const isViewingOriginalResult = activeStateKey === mapGradeToStateKey(rawResult.grade);
  const stateData = isViewingOriginalResult ? {
    ...baseStateData,
    confidence: rawResult.confidence || baseStateData.confidence,
    lesions: rawResult.lesions && Object.keys(rawResult.lesions).length > 0 ? rawResult.lesions : baseStateData.lesions,
    hotspots: rawResult.hotspots && rawResult.hotspots.length > 0 ? rawResult.hotspots : baseStateData.hotspots,
    quality: rawResult.qualityScore || baseStateData.quality,
    explanation: rawResult.recommendation || baseStateData.explanation
  } : baseStateData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/health-worker')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5 font-display">
            <span>{language === 'hi' ? 'नेत्र जांच परिणाम (AI Screening)' : 'Retinal AI Screening Result'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              ICDR Compliant
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Explainable AI decision support for frontline clinical triage and specialist referral
          </p>
        </div>

        {/* State Preview Selector for Hackathon Demonstration */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-card">
          <Sliders className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Preview Severity:</span>
          <select
            value={activeStateKey}
            onChange={(e) => setActiveStateKey(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-xs font-bold text-slate-900 cursor-pointer"
          >
            <option value="NO_DR">No DR detected (Grade 0)</option>
            <option value="MILD_DR">Possible Mild DR (Grade 1)</option>
            <option value="MODERATE_DR">Possible Moderate DR (Grade 2)</option>
            <option value="SEVERE_DR">Possible Severe DR (Grade 3)</option>
            <option value="PROLIFERATIVE_DR">Possible Proliferative DR (Grade 4)</option>
            <option value="UNDETERMINED">Unable to determine / low confidence</option>
          </select>
        </div>
      </div>

      {/* Patient Profile Ribbon */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">
                {patient.name || `Patient ${patient.id}`}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                {patient.abhaId || patient.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Age: {patient.age || 58} Yrs • Known Diabetes: {patient.diabetesYears || 10} Years
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div>
            <span className="text-slate-500 block text-[11px]">Eye Examined</span>
            <span className="font-bold text-teal-800">{activeEye === 'OD' ? 'OD (Right Eye)' : 'OS (Left Eye)'}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 block text-[11px]">Doctor Review</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
              <span>{teleReviewRequested ? 'Tele-Review Submitted' : 'Specialist Review Recommended'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Offline Storage & Cloud Synchronization Banner */}
      {(rawResult.isOffline || !isOnline) ? (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-900 font-bold flex-shrink-0">
              <WifiOff className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs uppercase tracking-wider text-amber-900">
                  {language === 'hi' ? 'ऑफलाइन सुरक्षित संग्रह' : 'Stored in Local Device Vault (Internet OFF)'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  {pendingSyncCount} pending in queue
                </span>
              </div>
              <p className="text-xs text-amber-800/90 font-medium mt-0.5">
                {language === 'hi' 
                  ? 'यह जांच आपके फोन/टैबलेट में सुरक्षित सेव हो गई है। इंटरनेट चालू होने पर यह स्वतः जिला अस्पताल के सर्वर पर सिंक हो जाएगी।' 
                  : 'Diagnostic record is encrypted & saved locally. Connect to internet and click Sync to transmit to District Eye Hospital.'}
              </p>
            </div>
          </div>

          <button
            onClick={syncOfflineScans}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60 flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : (language === 'hi' ? 'क्लाउड पर सिंक करें' : 'Sync to Central Server')}</span>
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-300/80 text-emerald-950 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-900">
              {language === 'hi' 
                ? `क्लाउड सिंक सत्यापित • रिकॉर्ड #${screeningSession.backendScreeningId || rawResult.backendScreeningId || 'DB-1'}`
                : `Cloud Synced with FastAPI & SQLite Central Database (Screening #${screeningSession.backendScreeningId || rawResult.backendScreeningId || 'DB-1'})`}
            </span>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
            {language === 'hi' ? 'विशेषज्ञ समीक्षा के लिए उपलब्ध' : 'Verified in District Hospital System'}
          </span>
        </div>
      )}

      {/* 1. Primary ResultCard Component (Displays Status, Predicted DR Severity, Confidence, & Doctor Review Status) */}
      <ResultCard 
        stateKey={activeStateKey}
        confidence={stateData.confidence}
        eye={activeEye}
        doctorReviewStatus={teleReviewRequested ? 'Tele-Consultation Dispatched' : 'Specialist Review Recommended'}
      />

      {/* Voice Guide Audio Counseling */}
      <VoiceGuide 
        title={language === 'hi' ? "मरीज के लिए ऑडियो परामर्श (Hindi/English)" : "Patient Audio Counseling & Diagnosis Explanation"}
        textEn={DR_GRADES[stateData.grade]?.voiceTextEn || "AI screening complete. Specialist review recommended."}
        textHi={DR_GRADES[stateData.grade]?.voiceTextHi || "जांच पूर्ण हुई। विशेषज्ञ डॉक्टर से परामर्श लें।"}
      />

      {/* Main Grid: Visual Comparison & Explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: ImageComparison & ConfidenceBar (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* ConfidenceBar Component */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
            <ConfidenceBar 
              confidence={stateData.confidence}
              isLowConfidence={stateData.isLowConfidence}
            />
          </div>

          {/* ImageComparison Component (Original Retinal Image vs Explainability Heatmap) */}
          <ImageComparison 
            grade={stateData.grade}
            eye={activeEye}
            hotspots={stateData.hotspots}
            lesionMarkers={stateData.lesionMarkers}
            qualityScore={stateData.quality}
            customImageUrl={screeningSession.uploadedImageUrl}
          />

        </div>

        {/* Right Column: ExplanationPanel & ReferralCard (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ExplanationPanel Component (AI Explanation + Quantitative Biomarkers) */}
          <ExplanationPanel 
            explanationText={stateData.explanation}
            lesions={stateData.lesions}
            fovealInvolvement={stateData.fovea}
            opticalQuality={stateData.quality}
          />

          {/* ReferralCard Component (Referral Recommendation & Official Referral Slip) */}
          <ReferralCard 
            grade={stateData.grade}
            stateKey={activeStateKey}
            onPrintSlip={() => setIsReferralModalOpen(true)}
            onRequestTeleReview={() => setTeleReviewRequested(true)}
          />

          {/* History & Next Patient Links */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-card flex items-center justify-between gap-3">
            <Link
              to="/patient-history"
              className="flex-1 btn-secondary-large text-xs py-3 gap-1.5"
            >
              <History className="w-4 h-4" />
              <span>View DR History</span>
            </Link>

            <Link
              to="/patient-registration"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
            >
              <span>Next Patient ➕</span>
            </Link>
          </div>

        </div>

      </div>

      {/* Prominent Medical Decision Support Disclaimer */}
      <MedicalDisclaimer />

      {/* Official Government / ABDM Referral Slip Modal */}
      <ReferralSlipModal 
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        screeningResult={{
          grade: stateData.grade,
          confidence: stateData.confidence,
          lesions: stateData.lesions
        }}
        patient={patient}
        eye={activeEye}
      />

    </div>
  );
}
