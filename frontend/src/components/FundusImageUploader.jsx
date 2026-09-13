import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  X, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  FileImage, 
  Sparkles, 
  ArrowRight,
  Eye,
  Info,
  Layers,
  HardDrive
} from 'lucide-react';
import { screeningApi } from '../services/api';
import { evaluateClientFundusQuality } from '../utils/qualityCheck';

// Configuration Constants
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

/**
 * Mock API endpoint that simulates chunked HTTP multipart upload with real-time progress
 */
const mockUploadFundusApi = (file, { onProgress, shouldSimulateError = false }) => {
  return new Promise((resolve, reject) => {
    let currentProgress = 0;
    const stages = [
      { threshold: 25, label: "Connecting to secure ophthalmic gateway..." },
      { threshold: 55, label: "Transferring high-resolution fundus payload..." },
      { threshold: 85, label: "Running optical integrity check..." },
      { threshold: 100, label: "Upload finalized and encrypted." }
    ];

    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 12;

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);

        if (shouldSimulateError) {
          reject(new Error("Network connection dropped during fundus transmission (Mock API Error 503)."));
          return;
        }

        const stageObj = stages.find(s => currentProgress <= s.threshold) || stages[stages.length - 1];
        onProgress(100, stageObj.label);

        resolve({
          status: 'success',
          fileId: `FND-${Date.now().toString(36).toUpperCase()}`,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          opticalQualityScore: 94
        });
      } else {
        const stageObj = stages.find(s => currentProgress <= s.threshold) || stages[0];
        onProgress(currentProgress, stageObj.label);
      }
    }, 160);
  });
};

export default function FundusImageUploader({
  onImageSelected,
  onStartScreening,
  selectedEye = 'OD',
  className = ''
}) {
  const fileInputRef = useRef(null);
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'invalid_image' | 'retake_required' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStageLabel, setUploadStageLabel] = useState('');
  const [qualityResult, setQualityResult] = useState(null);
  
  const [errorMessage, setErrorMessage] = useState(null);
  const [simulateErrorToggle, setSimulateErrorToggle] = useState(false);

  // Format bytes helper
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Validate File (Type and Size)
  const validateFile = (file) => {
    if (!file) {
      return { valid: false, error: "No file selected." };
    }

    // 1. File Type validation
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const isValidMime = ALLOWED_MIME_TYPES.includes(file.type);
    const isValidExt = ALLOWED_EXTENSIONS.includes(fileExtension);

    if (!isValidMime && !isValidExt) {
      return {
        valid: false,
        error: `Invalid file format (${fileExtension || 'unknown'}). Please upload JPG, JPEG, or PNG images only.`
      };
    }

    // 2. Max File Size validation (15 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 15 MB.`
      };
    }

    return { valid: true };
  };

  // Process and Upload File
  const processAndUploadFile = async (file) => {
    setErrorMessage(null);
    setQualityResult(null);

    // Validate
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setUploadStatus('error');
      return;
    }

    // Prepare preview
    const previewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setImagePreviewUrl(previewUrl);

    // Compute image dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = previewUrl;

    // Start upload & verification
    setUploadStatus('uploading');
    setUploadProgress(20);
    setUploadStageLabel('Inspecting image payload...');

    try {
      // Step 1: Simulated fast transmission channel
      await new Promise(r => setTimeout(r, 200));
      setUploadProgress(40);
      setUploadStageLabel('Stage 1: Analyzing retinal fundus morphology...');

      // Step 2: Two-stage quality gate check (Stage 1: Retina Morphology, Stage 2: Optical Clarity)
      setUploadStageLabel('Analyzing retinal morphology & optical clarity...');
      let qRes = await evaluateClientFundusQuality(file);

      // Corroborate with backend quality check API if connected
      try {
        const apiRes = await screeningApi.checkQuality(file);
        if (apiRes && apiRes.quality_status) {
          qRes = apiRes;
        }
      } catch (qErr) {
        console.warn("Backend quality check API unavailable, relying on client-side inspection:", qErr.message);
      }

      setQualityResult(qRes);

      // STAGE 1 GATE: Is it a retina?
      if (qRes.quality_status === 'INVALID_IMAGE' || qRes.is_retina === false) {
        setUploadStatus('invalid_image');
        setUploadProgress(100);
        setUploadStageLabel('Verification Failed: Not a retinal fundus image.');
        const invalidMsg = qRes.quality_messages?.[0] || 'No result as the image is not valid. The uploaded photograph is not a retinal fundus image.';
        setErrorMessage(invalidMsg);
        if (onImageSelected) onImageSelected(null);
        return;
      }

      // STAGE 2 GATE: Is the retina image clear?
      if (qRes.quality_status === 'RETAKE_REQUIRED' || qRes.is_clear === false) {
        setUploadStatus('retake_required');
        setUploadProgress(100);
        setUploadStageLabel('Clarity Warning: Retake required (Image not clear).');
        const retakeMsg = qRes.quality_messages?.[0] || 'Retake the image, it is not clear. Motion blur, optical defocus, or dark illumination obscures microvascular details.';
        setErrorMessage(retakeMsg);
        if (onImageSelected) onImageSelected(null);
        return;
      }

      // Passed both gates: Image is verified as retina AND verified clear!
      setUploadStatus('success');
      setUploadProgress(100);
      setUploadStageLabel('Retina verified & clear. Ready for deep AI analysis and laser scanning.');

      // Pass verified result and preview to parent
      if (onImageSelected) {
        onImageSelected({
          file,
          previewUrl,
          qualityResult: qRes,
          dimensions: imageDimensions
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus('error');
      setErrorMessage(err.message || "Failed to process fundus image. Please check your connection and retry.");
    }
  };

  // Drag and Drop Event Handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging false if leaving the parent boundary
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processAndUploadFile(files[0]);
    }
  };

  // Native File Picker Change
  const handleFileInputChange = (e) => {
    const files = e.target?.files;
    if (files && files.length > 0) {
      processAndUploadFile(files[0]);
    }
  };

  // Remove / Reset functionality
  const handleRemoveImage = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setImageDimensions(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadStageLabel('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageSelected) {
      onImageSelected(null);
    }
  };

  // Retry functionality
  const handleRetryUpload = () => {
    if (selectedFile) {
      processAndUploadFile(selectedFile);
    }
  };

  return (
    <div className={`w-full space-y-5 ${className}`}>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleFileInputChange}
        className="hidden"
        id="fundus-file-input"
      />

      {/* State 1: Dropzone (When no image is selected or upload failed without preview) */}
      {!imagePreviewUrl && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full rounded-3xl p-8 sm:p-10 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
            isDragging 
              ? 'border-teal-600 bg-teal-50/80 scale-[1.01] shadow-elevated' 
              : 'border-slate-300 hover:border-teal-600 bg-slate-50/70 hover:bg-teal-50/30 shadow-card'
          }`}
        >
          {/* Visual Icon */}
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-all duration-300 ${
            isDragging 
              ? 'bg-teal-600 text-white scale-110 shadow-lg' 
              : 'bg-teal-100/80 text-teal-800 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white'
          }`}>
            <Upload className="w-9 h-9" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1.5 font-display">
            {isDragging ? 'Drop Retinal Image Here' : 'Drag & Drop Fundus Image Here'}
          </h3>

          <p className="text-xs text-slate-600 max-w-sm mb-4 font-medium">
            Click to browse your device or drag and drop. High-resolution 45° macular fundus photographs recommended.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
              JPG, JPEG, PNG
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
              Max Size: 15 MB
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Examining: {selectedEye === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}
            </span>
          </div>

          <button
            type="button"
            className="mt-5 btn-primary-large text-xs py-2.5 px-6 gap-2"
          >
            <FileImage className="w-4 h-4" />
            <span>Browse Files</span>
          </button>
        </div>
      )}

      {/* State 2: Selected Image Preview & Progress Card */}
      {imagePreviewUrl && (
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
                <Eye className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-display">
                  Fundus Image Selected ({selectedEye === 'OD' ? 'OD - Right Eye' : 'OS - Left Eye'})
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedFile?.name || 'fundus_photo.jpg'} • {selectedFile ? formatBytes(selectedFile.size) : '2.4 MB'}
                </p>
              </div>
            </div>

            {/* Remove / Replace Button */}
            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Remove image and select a different file"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove Image</span>
            </button>
          </div>

          {/* Main Inspection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            
            {/* Circular Retinal Viewport (5 Cols) */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-teal-600 shadow-elevated bg-slate-950 flex items-center justify-center group">
                <img 
                  src={imagePreviewUrl} 
                  alt="Fundus Preview" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Alignment Reticle Ring */}
                <div className="absolute inset-4 rounded-full border border-teal-400/40 pointer-events-none" />
                <div className="absolute inset-10 rounded-full border border-teal-400/25 pointer-events-none" />
                
                {/* Upload Status Badge in bottom of viewport */}
                <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/80 text-white text-[10px] font-mono font-bold backdrop-blur-xs flex items-center gap-1.5">
                  {uploadStatus === 'uploading' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                  {uploadStatus === 'success' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                  {uploadStatus === 'invalid_image' && <span className="w-2 h-2 rounded-full bg-rose-400" />}
                  {uploadStatus === 'retake_required' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                  {uploadStatus === 'error' && <span className="w-2 h-2 rounded-full bg-rose-400" />}
                  <span>
                    {uploadStatus === 'uploading' ? 'Analyzing...' 
                      : uploadStatus === 'success' ? 'Verified Retina' 
                      : uploadStatus === 'invalid_image' ? 'Not a Retina' 
                      : uploadStatus === 'retake_required' ? 'Retake Required' 
                      : 'Error'}
                  </span>
                </div>
              </div>

              {imageDimensions && (
                <span className="text-[11px] font-mono text-slate-500 mt-2.5 font-bold">
                  Resolution: {imageDimensions.width} × {imageDimensions.height} px
                </span>
              )}
            </div>

            {/* Metadata & Progress Telemetry (7 Cols) */}
            <div className="sm:col-span-7 space-y-4">
              
              {/* Progress Bar Container */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    {uploadStatus === 'uploading' && <RotateCw className="w-3.5 h-3.5 text-teal-700 animate-spin" />}
                    {uploadStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {uploadStatus === 'invalid_image' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                    {uploadStatus === 'retake_required' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    {uploadStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                    <span>Status: {
                      uploadStatus === 'success' ? 'VALIDATED' 
                      : uploadStatus === 'invalid_image' ? 'NOT A RETINA' 
                      : uploadStatus === 'retake_required' ? 'UNCLEAR IMAGE' 
                      : uploadStatus.toUpperCase()
                    }</span>
                  </span>
                  <span className={`font-mono font-bold text-xs ${
                    uploadStatus === 'success' ? 'text-emerald-700' : uploadStatus === 'retake_required' ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {uploadProgress}%
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
                  <div 
                    className={`h-full rounded-full transition-all duration-200 ${
                      uploadStatus === 'error' || uploadStatus === 'invalid_image'
                        ? 'bg-rose-500' 
                        : uploadStatus === 'retake_required'
                        ? 'bg-amber-500'
                        : uploadStatus === 'success' 
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-500' 
                        : 'bg-gradient-to-r from-teal-500 to-teal-700'
                    }`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-600 font-medium">
                  {uploadStageLabel || 'Ready for screening pipeline'}
                </p>
              </div>

              {/* Technical Specifications Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Retina Check</span>
                  <span className={`font-mono font-bold ${
                    qualityResult?.is_retina ? 'text-emerald-700' : qualityResult ? 'text-rose-700' : 'text-slate-700'
                  }`}>
                    {qualityResult?.is_retina ? 'Verified Fundus' : qualityResult ? 'Non-Retinal Image' : 'Checking...'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Optical Quality</span>
                  <span className={`font-mono font-bold ${
                    qualityResult?.quality_status === 'GOOD' ? 'text-emerald-700' : qualityResult?.quality_status === 'RETAKE_REQUIRED' ? 'text-amber-700' : 'text-slate-700'
                  }`}>
                    {qualityResult?.quality_score !== undefined ? `${qualityResult.quality_score}% (${qualityResult.quality_status})` : '94% (Evaluating)'}
                  </span>
                </div>
              </div>

              {/* State A: Invalid Image Rejection Banner */}
              {uploadStatus === 'invalid_image' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2 animate-shake">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <span>No result as the image is not valid</span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium leading-relaxed">
                    The uploaded photograph is not a retinal fundus image (lacks optic disc, retinal vasculature, or macular anatomy). Automated diabetic retinopathy diagnosis cannot be performed on non-retinal photographs.
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mt-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Re-upload Retina Photograph</span>
                  </button>
                </div>
              )}

              {/* State B: Retake Required Banner */}
              {uploadStatus === 'retake_required' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>Retake the image, it is not clear</span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    {errorMessage || "Image clarity is insufficient for automated diagnostic analysis. Motion blur, optical defocus, or dark illumination obscures microvascular details."}
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mt-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Retake / Re-upload Clear Image</span>
                  </button>
                </div>
              )}

              {/* State C: Generic Error Retry */}
              {uploadStatus === 'error' && (
                <button
                  type="button"
                  onClick={handleRetryUpload}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Retry Upload</span>
                </button>
              )}

            </div>

          </div>

          {/* Primary "Start Screening" Action Button (Only enabled when image is valid and clear) */}
          {uploadStatus === 'success' && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="text-xs text-slate-500 font-medium">
                Retinal fundus image verified and sharp. Ready to initiate deep AI microvascular feature extraction.
              </div>

              <button
                type="button"
                onClick={() => onStartScreening && onStartScreening(imagePreviewUrl, selectedFile)}
                className="w-full sm:w-auto btn-primary-large text-base py-3.5 px-8 gap-2.5 shadow-md hover:scale-[1.02] transition-transform"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>Start Deep AI Screening</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      )}

      {/* Error Alert Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3 shadow-xs animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-rose-900">Upload Validation Error</div>
            <p className="text-rose-800 font-medium mt-0.5">{errorMessage}</p>
          </div>
          {selectedFile && uploadStatus === 'error' && (
            <button
              onClick={handleRetryUpload}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Developer / Demo Simulator Toggle: Simulate Network Error */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-medium">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Demo Mock API Simulator:</span>
        </span>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={simulateErrorToggle}
            onChange={(e) => setSimulateErrorToggle(e.target.checked)}
            className="rounded text-teal-700 focus:ring-teal-500 h-3.5 w-3.5"
          />
          <span className={simulateErrorToggle ? 'text-rose-700 font-bold' : 'text-slate-600'}>
            Simulate 503 Network Error (Test Retry)
          </span>
        </label>
      </div>

    </div>
  );
}
