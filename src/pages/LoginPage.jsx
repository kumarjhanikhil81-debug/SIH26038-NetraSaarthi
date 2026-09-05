import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Stethoscope, 
  HeartHandshake,
  Building2,
  Lock,
  Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function LoginPage() {
  const navigate = useNavigate();
  const { switchRole, language } = useApp();
  const [selectedRole, setSelectedRole] = useState('health_worker');

  const handleLogin = (role) => {
    switchRole(role);
    if (role === 'health_worker') {
      navigate('/health-worker');
    } else {
      navigate('/doctor-dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative bg-medical-grid">
      
      {/* Background Decorative Soft Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-4xl">
        
        {/* Top Header & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
            <span>Ayushman Bharat & National Tele-Ophthalmology Initiative</span>
          </div>

          <div className="flex items-center justify-center gap-3.5 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-900/20">
              <Eye className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
              Netra<span className="text-teal-700">Saarthi</span>
            </h1>
          </div>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Explainable AI Diabetic Retinopathy Screening & Decision Support for Rural Healthcare Centers
          </p>
        </div>

        {/* Role Selection Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Card 1: Rural Health Worker (ASHA / ANM) */}
          <div 
            onClick={() => setSelectedRole('health_worker')}
            className={`cursor-pointer rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between relative ${
              selectedRole === 'health_worker'
                ? 'bg-white border-2 border-teal-700 shadow-elevated scale-[1.02]'
                : 'glass-panel hover:border-slate-300'
            }`}
          >
            {selectedRole === 'health_worker' && (
              <div className="absolute top-4 right-4">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-600"></span>
                </span>
              </div>
            )}

            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4 shadow-sm">
                <HeartHandshake className="w-8 h-8" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-teal-100 text-teal-800">
                Primary Care / PHC
              </span>

              <h2 className="text-2xl font-bold text-slate-900 mt-2.5 mb-1 font-display">
                Rural Health Worker
              </h2>
              <p className="text-xs text-teal-700 font-bold mb-3">
                ASHA / ANM / Ayushman Arogya Mandir Worker
              </p>

              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Simplified 3-step screening interface with touch buttons, Hindi/English voice guidance, fundus image capture, and instant referral generation.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>One-touch patient registration with ABHA ID</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>AI Grad-CAM visual heatmaps (Grade 0-4)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Bilingual audio guidance for rural patients</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleLogin('health_worker')}
              className="mt-6 w-full btn-primary-large text-base py-3.5"
            >
              <span>Login as Health Worker</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Card 2: Specialist Doctor / Ophthalmologist */}
          <div 
            onClick={() => setSelectedRole('doctor')}
            className={`cursor-pointer rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between relative ${
              selectedRole === 'doctor'
                ? 'bg-white border-2 border-blue-600 shadow-elevated scale-[1.02]'
                : 'glass-panel hover:border-slate-300'
            }`}
          >
            {selectedRole === 'doctor' && (
              <div className="absolute top-4 right-4">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                </span>
              </div>
            )}

            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4 shadow-sm">
                <Stethoscope className="w-8 h-8" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-800">
                District Hospital / Tele-Consult
              </span>

              <h2 className="text-2xl font-bold text-slate-900 mt-2.5 mb-1 font-display">
                Specialist Doctor
              </h2>
              <p className="text-xs text-blue-700 font-bold mb-3">
                Ophthalmologist / Vitreoretinal Specialist
              </p>

              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                High-resolution tele-ophthalmology triage dashboard with Grad-CAM inspection, lesion quantification, clinical grade verification, and digital prescription.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Prioritized high-risk referral queue</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Explainable AI biomarker inspection (NVD/MA/Exudates)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Clinical sign-off & laser/anti-VEGF advisories</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleLogin('doctor')}
              className="mt-6 w-full btn-secondary-large text-base py-3.5 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:text-white"
            >
              <span>Login as Specialist Doctor</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Demo Fast Login Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center flex flex-wrap items-center justify-between gap-3 text-xs mb-6">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-bold text-teal-800">Demo Fast Launch:</span>
            <span>One-click credentials ready for SIH evaluation demonstration.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLogin('health_worker')}
              className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold transition-all cursor-pointer"
            >
              🚀 Launch ASHA Portal
            </button>
            <button
              onClick={() => handleLogin('doctor')}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold transition-all cursor-pointer"
            >
              🔬 Launch Doctor Portal
            </button>
          </div>
        </div>

        {/* Prominent Medical Decision Support Disclaimer */}
        <MedicalDisclaimer />

      </div>
    </div>
  );
}
