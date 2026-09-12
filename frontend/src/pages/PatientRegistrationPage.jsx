import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ArrowRight, 
  ArrowLeft, 
  Activity, 
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Server
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import VoiceGuide from '../components/VoiceGuide';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function PatientRegistrationPage() {
  const navigate = useNavigate();
  const { registerPatient, isBackendConnected, language } = useApp();

  const [apiSuccess, setApiSuccess] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Today's date string in YYYY-MM-DD
  const todayDate = new Date().toISOString().split('T')[0];

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      patientId: `ANON-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      age: '',
      diabetesDuration: '',
      screeningDate: todayDate,
      notes: ''
    },
    mode: 'onTouched'
  });

  // Helper: Auto-generate a new anonymous ID
  const handleGenerateId = () => {
    const newAnonId = `ANON-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setValue('patientId', newAnonId, { shouldValidate: true, shouldDirty: true });
  };

  // Helper: Quick demo autofill
  const handleAutoFillDemo = () => {
    setValue('patientId', `ANON-2026-${Math.floor(1000 + Math.random() * 9000)}`, { shouldValidate: true });
    setValue('age', 58, { shouldValidate: true });
    setValue('diabetesDuration', 12, { shouldValidate: true });
    setValue('screeningDate', todayDate, { shouldValidate: true });
    setValue('notes', 'Known diabetic for 12 years with mild blurriness in right eye when reading. Compliant with Metformin.', { shouldValidate: true });
    setApiSuccess(null);
    setApiError(null);
  };

  // Form submit handler -> Calls FastAPI POST /patients via AppContext
  const onSubmit = async (data) => {
    setApiError(null);
    setApiSuccess(null);

    try {
      // 1. Submit to FastAPI backend (POST /patients)
      const registeredRecord = await registerPatient({
        custom_id: data.patientId,
        name: `Patient ${data.patientId}`,
        abha_id: data.patientId,
        age: Number(data.age),
        gender: 'Not Disclosed (De-identified)',
        village: 'PHC Sector Clinical Worklist',
        diabetes_years: Number(data.diabetesDuration),
        rbs: 220, // Default baseline for screening triage
        hba1c: 8.2,
        notes: data.notes || '',
        symptoms: data.notes ? [data.notes] : []
      });

      setApiSuccess({
        patientId: registeredRecord.custom_id || registeredRecord.id,
        message: 'Patient registered successfully in FastAPI (SQLite) registry'
      });
    } catch (err) {
      console.error('API Registration Error:', err);
      setApiError(err.message || 'Failed to register patient with FastAPI backend.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Top Navigation & Breadcrumb */}
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
            <span>{language === 'hi' ? 'अनाम मरीज पंजीकरण' : 'Patient Registration'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Step 1 of 3
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Privacy-preserving diabetic retinal screening intake connected to FastAPI & SQLite
          </p>
        </div>

        {/* Demo Autofill Helper Button */}
        <button
          type="button"
          onClick={handleAutoFillDemo}
          className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Autofill sample clinical data for demo testing"
        >
          <Zap className="w-4 h-4 text-amber-600" />
          <span>{language === 'hi' ? 'डेमो डेटा भरें (Demo Autofill)' : 'Demo: Autofill Sample'}</span>
        </button>
      </div>

      {/* Voice Guide for Registration */}
      <VoiceGuide 
        title={language === 'hi' ? "पंजीकरण ध्वनि निर्देश" : "Registration Voice Instructions"}
        textEn="Please enter the anonymous patient ID, age, diabetes duration in years, and screening date. No personal names or private identifiers are stored."
        textHi="कृपया अनाम मरीज आईडी, उम्र, डायबिटीज की अवधि और जांच की तारीख दर्ज करें। कोई भी निजी नाम या पहचान नहीं रखी जाती है।"
      />

      {/* Backend & Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-950 flex items-start justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-100 text-teal-800 flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-teal-900 flex items-center gap-2">
              <span>De-Identified Healthcare Record (POST /patients)</span>
              <span className="px-2 py-0.5 rounded-full bg-white text-[10px] text-teal-800 border border-teal-300 font-mono font-semibold">
                Zero-PII
              </span>
            </div>
            <p className="text-teal-800/90 mt-0.5 leading-relaxed font-medium">
              Data is validated via Pydantic and persisted to the SQLite database via FastAPI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-teal-200 text-[11px] font-mono text-teal-800 font-semibold flex-shrink-0">
          <Server className="w-3.5 h-3.5 text-teal-700" />
          <span>{isBackendConnected ? 'FastAPI: Online' : 'FastAPI: Standby'}</span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {apiSuccess && (
        <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-md animate-fade-in space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-base text-emerald-900">
                Patient Registered in Database!
              </h3>
              <p className="text-xs text-emerald-800 font-medium mt-0.5">
                Anonymous Record ID: <span className="font-mono font-bold text-slate-900">{apiSuccess.patientId}</span> • Saved to SQLite via POST /patients.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200">
            <button
              onClick={() => navigate('/fundus-upload')}
              className="btn-primary-large py-2.5 px-5 text-sm gap-2"
            >
              <span>Proceed to Eye Scan (Step 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setApiSuccess(null);
                reset({
                  patientId: `ANON-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                  age: '',
                  diabetesDuration: '',
                  screeningDate: todayDate,
                  notes: ''
                });
              }}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm cursor-pointer"
            >
              ➕ Register Another Patient
            </button>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-rose-900">Registration API Notice</div>
            <p className="text-rose-800 font-medium mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Main Registration Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-teal-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-700" />
            <span>Clinical Intake Parameters</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">* Required fields</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Field 1: Anonymous Patient ID */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="patientId" className="block text-xs font-bold text-slate-800">
                Anonymous Patient ID *
              </label>
              <button
                type="button"
                onClick={handleGenerateId}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Generate random anonymous identifier"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate ID</span>
              </button>
            </div>
            <input
              id="patientId"
              type="text"
              placeholder="e.g. ANON-2026-4402"
              aria-invalid={errors.patientId ? 'true' : 'false'}
              aria-describedby={errors.patientId ? 'patientId-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl glass-input text-sm font-mono font-bold text-slate-900 ${
                errors.patientId ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200' : ''
              }`}
              {...register('patientId', {
                required: 'Anonymous Patient ID is required',
                minLength: { value: 4, message: 'ID must be at least 4 characters' },
                pattern: {
                  value: /^[A-Za-z0-9-_]+$/,
                  message: 'Only alphanumeric characters, dashes, and underscores allowed'
                }
              })}
            />
            {errors.patientId && (
              <p id="patientId-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.patientId.message}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Unique de-identified screening code mapped to `custom_id` in database.
            </p>
          </div>

          {/* Field 2: Age (Years) */}
          <div>
            <label htmlFor="age" className="block text-xs font-bold text-slate-800 mb-1.5">
              Patient Age (Years) *
            </label>
            <input
              id="age"
              type="number"
              min="1"
              max="120"
              placeholder="e.g. 58"
              aria-invalid={errors.age ? 'true' : 'false'}
              aria-describedby={errors.age ? 'age-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl glass-input text-sm font-medium ${
                errors.age ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200' : ''
              }`}
              {...register('age', {
                required: 'Patient age is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Age must be at least 1' },
                max: { value: 120, message: 'Age cannot exceed 120' }
              })}
            />
            {errors.age && (
              <p id="age-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.age.message}</span>
              </p>
            )}
          </div>

          {/* Field 3: Diabetes Duration (Years) */}
          <div>
            <label htmlFor="diabetesDuration" className="block text-xs font-bold text-slate-800 mb-1.5">
              Diabetes Duration (Years) *
            </label>
            <input
              id="diabetesDuration"
              type="number"
              min="0"
              max="70"
              step="1"
              placeholder="e.g. 10 (0 for newly diagnosed)"
              aria-invalid={errors.diabetesDuration ? 'true' : 'false'}
              aria-describedby={errors.diabetesDuration ? 'diabetesDuration-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl glass-input text-sm font-medium ${
                errors.diabetesDuration ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200' : ''
              }`}
              {...register('diabetesDuration', {
                required: 'Diabetes duration is required',
                valueAsNumber: true,
                min: { value: 0, message: 'Duration cannot be negative' },
                max: { value: 70, message: 'Duration cannot exceed 70 years' }
              })}
            />
            {errors.diabetesDuration && (
              <p id="diabetesDuration-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.diabetesDuration.message}</span>
              </p>
            )}
          </div>

          {/* Field 4: Screening Date */}
          <div className="sm:col-span-2">
            <label htmlFor="screeningDate" className="block text-xs font-bold text-slate-800 mb-1.5">
              Screening Date *
            </label>
            <div className="relative">
              <input
                id="screeningDate"
                type="date"
                max={todayDate}
                aria-invalid={errors.screeningDate ? 'true' : 'false'}
                aria-describedby={errors.screeningDate ? 'screeningDate-error' : undefined}
                className={`w-full px-4 py-3 rounded-xl glass-input text-sm font-medium ${
                  errors.screeningDate ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200' : ''
                }`}
                {...register('screeningDate', {
                  required: 'Screening date is required'
                })}
              />
            </div>
            {errors.screeningDate && (
              <p id="screeningDate-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.screeningDate.message}</span>
              </p>
            )}
          </div>

          {/* Field 5: Optional Clinical Notes */}
          <div className="sm:col-span-2">
            <label htmlFor="notes" className="block text-xs font-bold text-slate-800 mb-1.5">
              Optional Clinical Observations / Visual Complaints
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g. Patient reports night vision difficulty, on Metformin therapy, previous cataract surgery in left eye..."
              aria-invalid={errors.notes ? 'true' : 'false'}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium"
              {...register('notes', {
                maxLength: { value: 500, message: 'Notes cannot exceed 500 characters' }
              })}
            />
            {errors.notes && (
              <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.notes.message}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Optional non-identifiable medical context saved with screening payload.
            </p>
          </div>

        </div>

        {/* Action Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/health-worker')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer transition-colors"
          >
            {language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto btn-primary-large text-base py-4 px-8 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Sending to FastAPI (POST /patients)...</span>
              </>
            ) : (
              <>
                <span>{language === 'hi' ? 'सहेजें और आंख स्कैन करें' : 'Save & Proceed to Eye Scan'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </form>

      {/* Regulatory & Clinical Notice */}
      <MedicalDisclaimer compact={true} />

    </div>
  );
}
