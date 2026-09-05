import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Camera, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  User, 
  Zap,
  Layers,
  FileImage
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CLINICAL_SAMPLE_CASES } from '../data/mockData';
import RetinalVisualizer from '../components/RetinalVisualizer';
import VoiceGuide from '../components/VoiceGuide';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import FundusImageUploader from '../components/FundusImageUploader';

export default function FundusUploadPage() {
  const navigate = useNavigate();
  const { 
    selectedPatient, 
    setScreeningImageAndCase, 
    language 
  } = useApp();

  const [eye, setEye] = useState('OD'); // OD = Right Eye, OS = Left Eye
  const [activeTab, setActiveTab] = useState('uploader'); // 'uploader' | 'samples' | 'camera'
  const [selectedCase, setSelectedCase] = useState(CLINICAL_SAMPLE_CASES[3]); // Default Severe NPDR preset
  const [uploadedImageObject, setUploadedImageObject] = useState(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);

  // Stop camera when leaving page
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error", err);
      setCameraError("Camera access unavailable or permission denied. Please use Drag & Drop upload or clinical sample presets.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureFrameFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 400, 400);
    const dataUrl = canvas.toDataURL('image/png');
    
    setUploadedImageObject({ previewUrl: dataUrl });
    stopCamera();
    setSelectedCase(CLINICAL_SAMPLE_CASES[2]);
    setActiveTab('uploader');
  };

  // Called when image is selected and validated in FundusImageUploader
  const handleImageUploaded = (data) => {
    if (data) {
      setUploadedImageObject(data);
      // Link with appropriate clinical case metadata
      setSelectedCase(CLINICAL_SAMPLE_CASES[3]);
    } else {
      setUploadedImageObject(null);
    }
  };

  // Called when user clicks "Start Screening"
  const handleStartScreening = (customPreviewUrl = null) => {
    const imageUrl = customPreviewUrl || uploadedImageObject?.previewUrl || null;
    setScreeningImageAndCase(eye, selectedCase, imageUrl);
    navigate('/ai-analysis');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/patient-registration')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'मरीज विवरण बदलें' : 'Back to Patient Registration'}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5 font-display">
            <span>{language === 'hi' ? 'आंख का फंडस फोटो अपलोड' : 'Fundus Image Acquisition'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Step 2 of 3
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Upload or drag & drop high-resolution retinal fundus photograph for diabetic retinopathy screening
          </p>
        </div>

        {/* Eye Selector Pill (OD vs OS) */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setEye('OD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              eye === 'OD'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>OD (Right Eye / दाहिनी आंख)</span>
          </button>
          <button
            onClick={() => setEye('OS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              eye === 'OS'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>OS (Left Eye / बायीं आंख)</span>
          </button>
        </div>
      </div>

      {/* Active Patient Details Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">
                {selectedPatient.name || `Patient ${selectedPatient.id}`}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                {selectedPatient.abhaId || selectedPatient.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Age: {selectedPatient.age || 58} Yrs • Known Diabetes: {selectedPatient.diabetesYears || 10} Years
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div>
            <span className="text-slate-500 block text-[11px]">Selected Eye</span>
            <span className="font-bold text-teal-800">{eye === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 block text-[11px]">Random Blood Sugar</span>
            <span className="font-bold text-rose-700">{selectedPatient.rbs || 220} mg/dL</span>
          </div>
        </div>
      </div>

      {/* Voice Guide */}
      <VoiceGuide 
        title={language === 'hi' ? "फोटो अपलोड के निर्देश" : "Fundus Upload Voice Instructions"}
        textEn="Drag and drop or browse a clear 45° macular-centered fundus photo. Supported formats are JPG, JPEG, and PNG under 15 megabytes."
        textHi="कृपया आंख की साफ रेटिना फोटो ड्रैग और ड्रॉप करें या चुनें। केवल JPG, JPEG या PNG फाइल 15 MB से कम साइज में अपलोड करें।"
      />

      {/* Acquisition Mode Switch Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => {
            setActiveTab('uploader');
            stopCamera();
          }}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'uploader'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Drag & Drop / File Upload</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('samples');
            stopCamera();
          }}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'samples'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Clinical Sample Cases (Presets)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('camera');
            startCamera();
          }}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'camera'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Camera Mode</span>
        </button>
      </div>

      {/* Mode 1: Dedicated Drag & Drop / File Picker Fundus Uploader */}
      {activeTab === 'uploader' && (
        <FundusImageUploader 
          selectedEye={eye}
          onImageSelected={handleImageUploaded}
          onStartScreening={handleStartScreening}
        />
      )}

      {/* Mode 2: Clinical Cases Gallery (Preset Fallback for Demos) */}
      {activeTab === 'samples' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card flex flex-col items-center justify-between">
            <RetinalVisualizer 
              grade={selectedCase.predictedGrade}
              eye={eye}
              hotspots={selectedCase.gradcamHotspots}
              lesionMarkers={selectedCase.lesionMarkers}
              qualityScore={selectedCase.qualityScore}
              interactive={false}
              defaultMode="original"
            />
            <p className="text-xs text-slate-500 text-center mt-3 font-medium">
              Selected Preset: <span className="font-bold text-slate-900">{selectedCase.title}</span> ({selectedCase.confidence}% Conf.)
            </p>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 font-display">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Select Diagnostic Preset</span>
              </h3>
              
              <div className="space-y-2">
                {CLINICAL_SAMPLE_CASES.map((sample) => {
                  const isSelected = selectedCase.id === sample.id;
                  return (
                    <div
                      key={sample.id}
                      onClick={() => setSelectedCase(sample)}
                      className={`p-3 rounded-2xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-600 shadow-xs scale-[1.01]'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-xs ${
                          sample.predictedGrade >= 3 ? 'text-rose-700' : sample.predictedGrade >= 2 ? 'text-amber-700' : 'text-teal-800'
                        }`}>
                          {sample.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {sample.confidence}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">{sample.description}</p>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleStartScreening(null)}
                className="w-full btn-primary-large text-base py-3.5 mt-3"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Start Screening Preset</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Mode 3: Live Camera Mode */}
      {activeTab === 'camera' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-card flex flex-col items-center justify-center space-y-4">
          {cameraError ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center max-w-md">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-600" />
              <p className="font-semibold">{cameraError}</p>
            </div>
          ) : (
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-teal-600 shadow-2xl bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-teal-400/80 pointer-events-none animate-pulse" />
              <div className="absolute bottom-4 px-3 py-1 rounded-full bg-black/80 text-teal-300 text-[10px] font-mono font-bold">
                Align Retinal Center in Reticle
              </div>
            </div>
          )}

          {isCameraActive && (
            <button
              type="button"
              onClick={captureFrameFromCamera}
              className="btn-primary-large text-sm py-3 px-8 gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Capture & Transfer to Uploader</span>
            </button>
          )}
        </div>
      )}

      {/* Regulatory Notice */}
      <MedicalDisclaimer compact={true} />

    </div>
  );
}
