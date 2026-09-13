import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import HealthWorkerDashboard from './pages/HealthWorkerDashboard';
import PatientRegistrationPage from './pages/PatientRegistrationPage';
import DoctorRegistrationPage from './pages/DoctorRegistrationPage';
import FundusUploadPage from './pages/FundusUploadPage';
import AiAnalysisPage from './pages/AiAnalysisPage';
import ScreeningResultPage from './pages/ScreeningResultPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientHistoryPage from './pages/PatientHistoryPage';
import { ShieldCheck, Sparkles, Building2 } from 'lucide-react';

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F9FA] text-slate-900 selection:bg-teal-700 selection:text-white">
      {!isLoginPage && <Navbar />}
      
      <main className="flex-1 pb-16">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/health-worker" element={<HealthWorkerDashboard />} />
          <Route path="/patient-registration" element={<PatientRegistrationPage />} />
          <Route path="/doctor-registration" element={<DoctorRegistrationPage />} />
          <Route path="/fundus-upload" element={<FundusUploadPage />} />
          <Route path="/ai-analysis" element={<AiAnalysisPage />} />
          <Route path="/screening-result" element={<ScreeningResultPage />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/patient-history" element={<PatientHistoryPage />} />
          <Route path="*" element={<Navigate to="/health-worker" replace />} />
        </Routes>
      </main>

      {/* Global Bottom Footer (Healthcare Standards & ABDM Compliant) */}
      <footer className="w-full py-5 border-t border-slate-200/90 bg-white/90 backdrop-blur-md text-center text-xs text-slate-500 no-print shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-teal-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
              NetraSaarthi
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-slate-600">
              Explainable AI Diabetic Retinopathy Screening for Rural India
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200/70 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              ICDR Staging v2.4 Compliant
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200/70 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              ABDM & NHM Ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppLayout />
      </Router>
    </AppProvider>
  );
}
