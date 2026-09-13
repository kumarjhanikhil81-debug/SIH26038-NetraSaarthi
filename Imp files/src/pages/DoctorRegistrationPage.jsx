import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  UserRound,
  MapPin,
  BadgeCheck,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function DoctorRegistrationPage() {
  const navigate = useNavigate();
  const { registerDoctor, language } = useApp();
  const [apiSuccess, setApiSuccess] = useState(null);
  const [apiError, setApiError] = useState(null);

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      doctorId: `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      gender: '',
      age: '',
      medicalRegistrationNo: '',
      state: '',
      city: ''
    },
    mode: 'onTouched'
  });

  const generateDoctorId = () => {
    setValue('doctorId', `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const handleAutoFillDemo = () => {
    setValue('name', 'Dr. Ananya Sharma', { shouldValidate: true });
    setValue('doctorId', `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`, { shouldValidate: true });
    setValue('gender', 'Female', { shouldValidate: true });
    setValue('age', 38, { shouldValidate: true });
    setValue('medicalRegistrationNo', 'MCI-DEMO-45821', { shouldValidate: true });
    setValue('state', 'West Bengal', { shouldValidate: true });
    setValue('city', 'Kolkata', { shouldValidate: true });
    setApiSuccess(null);
    setApiError(null);
  };

  const submitDoctorToApiPlaceholder = async (formData) => {
    return new Promise(resolve => {
      setTimeout(() => resolve({
        status: 201,
        message: 'Doctor profile registered successfully in the specialist registry',
        data: { ...formData, registeredAt: new Date().toISOString() }
      }), 750);
    });
  };

  const onSubmit = async (data) => {
    setApiError(null);
    setApiSuccess(null);

    try {
      const apiResponse = await submitDoctorToApiPlaceholder(data);
      const registeredDoctor = registerDoctor({
        name: data.name.trim(),
        doctorId: data.doctorId.trim().toUpperCase(),
        gender: data.gender,
        age: Number(data.age),
        medicalRegistrationNo: data.medicalRegistrationNo.trim().toUpperCase(),
        state: data.state,
        city: data.city.trim()
      });

      setApiSuccess({ doctorId: registeredDoctor.doctorId, message: apiResponse.message });
      // Bring the success message into view after registration.
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    } catch (err) {
      console.error('Doctor Registration Error:', err);
      setApiError('Failed to register doctor profile. Please check network connectivity and try again.');
    }
  };

  const resetForm = () => {
    setApiSuccess(null);
    reset({
      name: '',
      doctorId: `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      gender: '',
      age: '',
      medicalRegistrationNo: '',
      state: '',
      city: ''
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'लॉगिन पर वापस जाएं' : 'Back to Login'}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5 font-display">
            <span>{language === 'hi' ? 'डॉक्टर पंजीकरण' : 'Doctor Registration'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">Specialist Portal</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Register your professional profile to access NetraSaarthi's tele-ophthalmology review dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoFillDemo}
          className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Zap className="w-4 h-4 text-amber-600" />
          <span>Demo: Autofill Sample</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 flex items-start gap-3 shadow-2xs">
        <div className="p-2 rounded-xl bg-blue-100 text-blue-800 flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-bold text-blue-900 flex items-center gap-2">
            <span>Professional Verification</span>
            <span className="px-2 py-0.5 rounded-full bg-white text-[10px] text-blue-800 border border-blue-300 font-mono font-semibold">DOCTOR PROFILE</span>
          </div>
          <p className="text-blue-800/90 mt-0.5 leading-relaxed font-medium">
            Doctor details are collected to establish the identity and professional authorization of specialists reviewing tele-ophthalmology cases.
          </p>
        </div>
      </div>

      {apiSuccess && (
        <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-md animate-fade-in space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-emerald-900">You are registered!</h3>
              <p className="text-xs text-emerald-800 font-medium mt-0.5">
                Doctor ID: <span className="font-mono font-bold text-slate-900">{apiSuccess.doctorId}</span> • Your registration is complete, but you are not logged in yet. Please go to the login page and enter your Doctor ID to continue.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200">
            <button onClick={() => navigate('/login')} className="btn-secondary-large py-2.5 px-5 text-sm gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
              <span>Go to Login</span><ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm cursor-pointer">
              Register Another Doctor
            </button>
          </div>
        </div>
      )}

      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs"><div className="font-bold text-rose-900">Registration Failed</div><p className="text-rose-800 font-medium mt-0.5">{apiError}</p></div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-700" /> Professional Details
          </h2>
          <span className="text-xs text-slate-500 font-medium">* Required fields</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-xs font-bold text-slate-800 mb-1.5">Doctor Name *</label>
            <div className="relative">
              <UserRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input id="name" type="text" placeholder="e.g. Dr. Ananya Sharma" className={`w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm font-medium ${errors.name ? 'border-rose-400' : ''}`} {...register('name', { required: 'Doctor name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' }, maxLength: { value: 80, message: 'Name cannot exceed 80 characters' } })} />
            </div>
            {errors.name && <ErrorText message={errors.name.message} />}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="doctorId" className="block text-xs font-bold text-slate-800">Doctor ID *</label>
              <button type="button" onClick={generateDoctorId} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"><RefreshCw className="w-3 h-3" /> Regenerate</button>
            </div>
            <input id="doctorId" type="text" placeholder="e.g. DOC-2026-4821" className={`w-full px-4 py-3 rounded-xl glass-input text-sm font-mono font-bold ${errors.doctorId ? 'border-rose-400' : ''}`} {...register('doctorId', { required: 'Doctor ID is required', minLength: { value: 5, message: 'Doctor ID is too short' }, pattern: { value: /^[A-Za-z0-9_-]+$/, message: 'Only letters, numbers, dashes and underscores allowed' } })} />
            {errors.doctorId && <ErrorText message={errors.doctorId.message} />}
          </div>

          <div>
            <label htmlFor="medicalRegistrationNo" className="block text-xs font-bold text-slate-800 mb-1.5">Medical Registration No. *</label>
            <div className="relative">
              <BadgeCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input id="medicalRegistrationNo" type="text" placeholder="e.g. WBMC-12345" className={`w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm font-mono font-medium ${errors.medicalRegistrationNo ? 'border-rose-400' : ''}`} {...register('medicalRegistrationNo', { required: 'Medical registration number is required', minLength: { value: 4, message: 'Registration number is too short' }, maxLength: { value: 40, message: 'Registration number is too long' } })} />
            </div>
            {errors.medicalRegistrationNo && <ErrorText message={errors.medicalRegistrationNo.message} />}
          </div>

          <div>
            <label htmlFor="gender" className="block text-xs font-bold text-slate-800 mb-1.5">Gender *</label>
            <select id="gender" className={`w-full px-4 py-3 rounded-xl glass-input text-sm font-medium bg-white ${errors.gender ? 'border-rose-400' : ''}`} {...register('gender', { required: 'Please select gender' })}>
              <option value="">Select gender</option><option value="Female">Female</option><option value="Male">Male</option><option value="Other">Other</option><option value="Prefer not to say">Prefer not to say</option>
            </select>
            {errors.gender && <ErrorText message={errors.gender.message} />}
          </div>

          <div>
            <label htmlFor="age" className="block text-xs font-bold text-slate-800 mb-1.5">Age (Years) *</label>
            <input id="age" type="number" min="18" max="100" placeholder="e.g. 38" className={`w-full px-4 py-3 rounded-xl glass-input text-sm font-medium ${errors.age ? 'border-rose-400' : ''}`} {...register('age', { required: 'Age is required', valueAsNumber: true, min: { value: 18, message: 'Doctor age must be at least 18' }, max: { value: 100, message: 'Please enter a valid age' } })} />
            {errors.age && <ErrorText message={errors.age.message} />}
          </div>

          <div>
            <label htmlFor="state" className="block text-xs font-bold text-slate-800 mb-1.5">State *</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <select id="state" className={`w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm font-medium bg-white ${errors.state ? 'border-rose-400' : ''}`} {...register('state', { required: 'State is required' })}>
                <option value="">Select state / UT</option>
                {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
            {errors.state && <ErrorText message={errors.state.message} />}
          </div>

          <div>
            <label htmlFor="city" className="block text-xs font-bold text-slate-800 mb-1.5">City *</label>
            <input id="city" type="text" placeholder="e.g. Kolkata" className={`w-full px-4 py-3 rounded-xl glass-input text-sm font-medium ${errors.city ? 'border-rose-400' : ''}`} {...register('city', { required: 'City is required', minLength: { value: 2, message: 'City must be at least 2 characters' }, maxLength: { value: 60, message: 'City cannot exceed 60 characters' } })} />
            {errors.city && <ErrorText message={errors.city.message} />}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <Lock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">For this prototype, the doctor profile is stored locally in the browser. In production, professional credentials should be securely verified against the appropriate medical registry before granting specialist access.</p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <button type="button" onClick={() => navigate('/login')} className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className={`w-full sm:w-auto btn-secondary-large text-base py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}>
            {isSubmitting ? <><RefreshCw className="w-5 h-5 animate-spin" /><span>Registering Doctor...</span></> : <><span>Register</span><ArrowRight className="w-5 h-5" /></>}
          </button>
        </div>
      </form>

      <MedicalDisclaimer compact={true} />
    </div>
  );
}

function ErrorText({ message }) {
  return <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{message}</span></p>;
}
