import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Activity, 
  UserPlus, 
  Upload, 
  History, 
  Stethoscope, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Globe2, 
  LogOut, 
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    userRole, 
    switchRole, 
    language, 
    toggleLanguage, 
    isOnline, 
    setIsOnline,
    isSyncing,
    pendingSyncCount, 
    syncOfflineScans,
    healthCentreInfo 
  } = useApp();

  const isHealthWorker = userRole === 'health_worker';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <Link to={isHealthWorker ? "/health-worker" : "/doctor-dashboard"} className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-900/15 group-hover:scale-105 transition-transform">
                <Eye className="w-6 h-6 text-white" />
                <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                    Netra<span className="text-teal-700">Saarthi</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                    XAI DR
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  {language === 'hi' ? 'ग्रामीण नेत्र स्वास्थ्य एवं AI स्क्रीनिंग' : 'Rural Retinal Health & AI Screening'}
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links for Health Worker vs Doctor */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            {isHealthWorker ? (
              <>
                <Link
                  to="/health-worker"
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    location.pathname === '/health-worker'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
                </Link>

                <Link
                  to="/patient-registration"
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    location.pathname === '/patient-registration'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'मरीज पंजीकरण' : 'New Patient'}</span>
                </Link>

                <Link
                  to="/fundus-upload"
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    location.pathname === '/fundus-upload'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'आंख स्कैन' : 'Eye Scan'}</span>
                </Link>

                <Link
                  to="/patient-history"
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    location.pathname === '/patient-history'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'इतिहास' : 'History'}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/doctor-dashboard"
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    location.pathname === '/doctor-dashboard'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Doctor Triage Queue</span>
                </Link>

                <Link
                  to="/patient-history"
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    location.pathname === '/patient-history'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Progression Analytics</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Header Utilities: Sync, Role Switch, Language, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Offline / Online Rural Sync Badge & Toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isOnline 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold shadow-sm'
                }`}
                title={isOnline ? "Online (Click to toggle Offline Mode)" : "Offline Mode active (Click to toggle Online)"}
              >
                {isOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">Online</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                    <WifiOff className="w-3.5 h-3.5 text-amber-800" />
                    <span>Offline Mode</span>
                  </>
                )}
              </button>

              {/* Dedicated Sync Button if offline items exist or syncing */}
              {(pendingSyncCount > 0 || isSyncing) && (
                <button
                  onClick={syncOfflineScans}
                  disabled={isSyncing}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white border border-teal-500 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  title="Synchronize queued offline records with FastAPI"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : `Sync (${pendingSyncCount})`}</span>
                </button>
              )}
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              title="Change Language / भाषा बदलें"
            >
              <Globe2 className="w-3.5 h-3.5 text-teal-700" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Role Switcher Button */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  switchRole('health_worker');
                  navigate('/health-worker');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isHealthWorker
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ASHA / Frontline Health Worker View"
              >
                🏥 ASHA
              </button>
              <button
                onClick={() => {
                  switchRole('doctor');
                  navigate('/doctor-dashboard');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  !isHealthWorker
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Specialist Ophthalmologist View"
              >
                👨‍⚕️ Doctor
              </button>
            </div>

            {/* Logout / Switch Role Link */}
            <Link
              to="/login"
              className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-300 shadow-sm transition-all"
              title="Sign Out / Switch Profile"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
