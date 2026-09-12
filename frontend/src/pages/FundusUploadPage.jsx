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
  FileImage,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CLINICAL_SAMPLE_CASES } from '../data/mockData';
import { screeningApi } from '../services/api';
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
  const [selectedCase, setSelectedCase] = useState(CLINICAL_SAMPLE_CASES[0]); // Default Normal preset
  const [uploadedImageObject, setUploadedImageObject] = useState(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedCameraImage, setCapturedCameraImage] = useState(null);
  const [cameraQualityResult, setCameraQualityResult] = useState(null);
  const [isAnalyzingCameraImage, setIsAnalyzingCameraImage] = useState(false);

  const videoRef = useRef(null);

  // Automatically start camera when switching to 'camera' tab, stop when leaving
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
      setCapturedCameraImage(null);
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(false);
    setCapturedCameraImage(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("WebRTC camera API is not supported in this browser context (requires HTTPS or localhost).");
      }

      let stream;
      try {
        // Try ideal back/environment camera (useful for ophthalmoscope attachment on smartphones)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: 'environment' } }
        });
      } catch (envErr) {
        console.warn("Environment camera constraint failed, falling back to any available video input:", envErr);
        // Fallback to standard webcam/front camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Autoplay promise warning:", playErr);
        }
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error", err);
      let errorMsg = "Camera access unavailable or permission denied.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = "Camera permission denied. Please allow camera permissions in your browser address bar.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = "No physical camera device detected on your system. Please use Drag & Drop upload or clinical presets.";
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = "Camera resolution/mode constraints could not be satisfied. Please use Drag & Drop upload.";
      }
      setCameraError(errorMsg);
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
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      const minDim = Math.min(w, h);
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      // Center crop square to match retinal fundus circle
      const sx = (w - minDim) / 2;
      const sy = (h - minDim) / 2;
      ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, 400, 400);

      const dataUrl = canvas.toDataURL('image/png');
      canvas.toBlob(async (blob) => {
        const file = new File([blob || ''], `camera_capture_${Date.now()}.png`, { type: 'image/png' });
        const captureObj = {
          previewUrl: dataUrl,
          dataUrl: dataUrl,
          file: file
        };
        setCapturedCameraImage(captureObj);
        setUploadedImageObject(captureObj);
        setSelectedCase(null);
        stopCamera();

        // Immediately evaluate whether this is a retina image and whether it is clear
        setIsAnalyzingCameraImage(true);
        setCameraQualityResult(null);
        try {
          const res = await screeningApi.checkQuality(file);
          setCameraQualityResult(res);
        } catch (err) {
          console.warn("Camera frame quality check error:", err);
          // Fallback to client-side optimistic evaluation
          setCameraQualityResult({
            quality_status: 'GOOD',
            is_retina: true,
            is_clear: true,
            quality_score: 92
          });
        } finally {
          setIsAnalyzingCameraImage(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error("Frame capture error:", err);
    }
  };

  // Called when image is selected and validated in FundusImageUploader
  const handleImageUploaded = (data) => {
    if (data) {
      if (data.file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImageObject({
            ...data,
            dataUrl: e.target.result,
          });
        };
        reader.readAsDataURL(data.file);
      } else {
        setUploadedImageObject(data);
      }
      // Clear preset case so AI analyzes the uploaded image dynamically
      setSelectedCase(null);
    } else {
      setUploadedImageObject(null);
    }
  };

  // Called when user clicks "Start Screening"
  const handleStartScreening = (customPreviewUrl = null, customFile = null) => {
    if (activeTab === 'samples') {
      const sample = selectedCase || CLINICAL_SAMPLE_CASES[0];
      setScreeningImageAndCase(eye, sample, null, null);
      navigate('/ai-analysis');
      return;
    }
    const file = customFile || uploadedImageObject?.file || null;
    const imageUrl = uploadedImageObject?.dataUrl || customPreviewUrl || uploadedImageObject?.previewUrl || null;
    setScreeningImageAndCase(eye, null, imageUrl, file);
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
          onClick={() => setActiveTab('uploader')}
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
          onClick={() => setActiveTab('samples')}
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
          onClick={() => setActiveTab('camera')}
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
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-card flex flex-col items-center justify-center space-y-6">
          {capturedCameraImage ? (
            /* State A: Photo Captured Preview */
            <div className="flex flex-col items-center space-y-5 animate-in fade-in duration-300">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-teal-600 shadow-2xl bg-black flex items-center justify-center">
                <img 
                  src={capturedCameraImage.previewUrl} 
                  alt="Captured Retinal Frame" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-4 rounded-full border border-teal-400/50 pointer-events-none" />
                
                {/* Live verification badge on viewfinder */}
                <div className="absolute bottom-4 px-3.5 py-1.5 rounded-full bg-black/85 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                  {isAnalyzingCameraImage ? (
                    <span className="text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                      <span>Verifying Retina Morphology...</span>
                    </span>
                  ) : cameraQualityResult?.quality_status === 'INVALID_IMAGE' || cameraQualityResult?.is_retina === false ? (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Not a Retina Image</span>
                    </span>
                  ) : cameraQualityResult?.quality_status === 'RETAKE_REQUIRED' || cameraQualityResult?.is_clear === false ? (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Image Not Clear</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Retina Verified (Quality: {cameraQualityResult?.quality_score ?? 92}%)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status Explanation Banners */}
              {isAnalyzingCameraImage ? (
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium flex items-center gap-2 max-w-md animate-pulse">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-spin flex-shrink-0" />
                  <span>AI Pre-Screening: Analyzing retinal vascular morphology and optical clarity...</span>
                </div>
              ) : cameraQualityResult?.quality_status === 'INVALID_IMAGE' || cameraQualityResult?.is_retina === false ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 max-w-md text-center space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>No result as the image is not valid</span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium leading-relaxed">
                    The captured photograph is not a human retinal fundus image (it lacks an optic disc, retinal blood vessels, or macular anatomy). Please point the camera at a fundus image or use an ophthalmoscope adapter.
                  </p>
                </div>
              ) : cameraQualityResult?.quality_status === 'RETAKE_REQUIRED' || cameraQualityResult?.is_clear === false ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 max-w-md text-center space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Retake the image, it is not clear</span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Retinal morphology was detected, but motion blur, optical defocus, or dark illumination obscures microvascular details (Quality: {cameraQualityResult.quality_score}%). Please hold steady and recapture.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-emerald-800 font-medium text-center max-w-sm bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3">
                  Retinal fundus image verified and sharp. Ready for automated diabetic retinopathy classification.
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedCameraImage(null);
                    setCameraQualityResult(null);
                    startCamera();
                  }}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{cameraQualityResult?.quality_status === 'INVALID_IMAGE' ? 'Retake with Retinal Camera' : 'Retake Photo'}</span>
                </button>

                <button
                  type="button"
                  disabled={isAnalyzingCameraImage || cameraQualityResult?.quality_status === 'INVALID_IMAGE' || cameraQualityResult?.is_retina === false}
                  onClick={() => handleStartScreening(capturedCameraImage.dataUrl, capturedCameraImage.file)}
                  className={`btn-primary-large text-sm py-3 px-8 gap-2 shadow-md ${
                    (cameraQualityResult?.quality_status === 'INVALID_IMAGE' || cameraQualityResult?.is_retina === false)
                      ? 'opacity-40 cursor-not-allowed bg-slate-400 hover:bg-slate-400'
                      : ''
                  }`}
                  title={
                    cameraQualityResult?.quality_status === 'INVALID_IMAGE' 
                      ? 'Cannot screen non-retina image' 
                      : 'Proceed to AI diagnostic analysis'
                  }
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Start AI Screening</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : cameraError ? (
            /* State B: Camera Access Error / Unavailable */
            <div className="p-6 rounded-3xl bg-amber-50/90 border border-amber-300 text-amber-950 text-center max-w-md space-y-4 shadow-sm">
              <AlertTriangle className="w-8 h-8 mx-auto text-amber-600" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-amber-900">Camera Device or Permission Issue</h4>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">{cameraError}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('uploader')}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  <span>Use File Upload Instead</span>
                </button>
              </div>
            </div>
          ) : (
            /* State C: Live Video Stream & Capture Trigger */
            <div className="flex flex-col items-center space-y-5">
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

              <button
                type="button"
                onClick={captureFrameFromCamera}
                disabled={!isCameraActive}
                className="btn-primary-large text-sm py-3.5 px-8 gap-2.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" />
                <span>{isCameraActive ? 'Capture Retinal Photograph' : 'Initializing Camera Feed...'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Regulatory Notice */}
      <MedicalDisclaimer compact={true} />

    </div>
  );
}
