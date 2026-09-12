import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import HealthWorkerDashboard from './pages/HealthWorkerDashboard';
import PatientRegistrationPage from './pages/PatientRegistrationPage';
import FundusUploadPage from './pages/FundusUploadPage';
import AiAnalysisPage from './pages/AiAnalysisPage';
import ScreeningResultPage from './pages/ScreeningResultPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientHistoryPage from './pages/PatientHistoryPage';
import SyncNotificationBanner from './components/SyncNotificationBanner';
import { ShieldCheck, Sparkles, Building2 } from 'lucide-react';

function AppLayout() {
  const location = useLocation();
  const { isOnline, pendingSyncCount, isSyncing, syncOfflineScans } = useApp();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F9FA] text-slate-900 selection:bg-teal-700 selection:text-white">
      {!isLoginPage && <Navbar />}
      
      {/* Persistent Offline Mode Banner across all pages */}
      {!isOnline && (
        <div className="bg-amber-600 text-amber-50 px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md border-b border-amber-700 sticky top-0 z-40 backdrop-blur-md bg-amber-600/95">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-100"></span>
              </span>
              <span className="font-extrabold uppercase tracking-wider text-[11px] bg-amber-800/80 px-2 py-0.5 rounded text-amber-100 border border-amber-700/50">
                Offline Mode Active
              </span>
              <span className="text-amber-50">
                All screening records are safely queued locally on this device. Reconnect internet to sync with FastAPI backend.
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {pendingSyncCount > 0 && (
                <span className="text-[11px] font-bold bg-amber-900/60 px-2.5 py-0.5 rounded-full border border-amber-500/50 text-amber-200">
                  {pendingSyncCount} unsynced
                </span>
              )}
              <button
                onClick={() => syncOfflineScans()}
                disabled={isSyncing}
                className="text-xs bg-white text-amber-900 font-bold px-3 py-1 rounded-lg hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSyncing ? 'Syncing...' : 'Sync with FastAPI'}
              </button>
            </div>
          </div>
        </div>
      )}

      
      <main className="flex-1 pb-16">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/health-worker" element={<HealthWorkerDashboard />} />
          <Route path="/patient-registration" element={<PatientRegistrationPage />} />
          <Route path="/fundus-upload" element={<FundusUploadPage />} />
          <Route path="/ai-analysis" element={<AiAnalysisPage />} />
          <Route path="/screening-result" element={<ScreeningResultPage />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/patient-history" element={<PatientHistoryPage />} />
          <Route path="*" element={<Navigate to="/health-worker" replace />} />
        </Routes>
      </main>

      {/* Floating Sync / Offline Toast Banner */}
      <SyncNotificationBanner />

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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("NetraSaarthi UI Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-black">!</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Screening Interface Recovery</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">
            {this.state.error?.message || "An unexpected interface error occurred during visual rendering."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/fundus-upload';
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-all shadow-sm"
            >
              Restart Fundus Upload
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <AppLayout />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}
