import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Upload, 
  Activity, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ArrowRight, 
  Eye, 
  RefreshCw, 
  MapPin,
  HeartHandshake
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DR_GRADES } from '../data/mockData';
import VoiceGuide from '../components/VoiceGuide';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function HealthWorkerDashboard() {
  const navigate = useNavigate();
  const { 
    healthCentreInfo, 
    patients, 
    selectPatientForScreening, 
    language, 
    pendingSyncCount,
    syncOfflineScans
  } = useApp();

  const handleStartScreeningForPatient = (patient) => {
    selectPatientForScreening(patient);
    navigate('/fundus-upload');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner Card (Medical Gradient) */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <HeartHandshake className="w-9 h-9" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase bg-white/20 text-teal-100 border border-white/20">
                  {language === 'hi' ? 'आयुष्मान आरोग्य मंदिर' : 'Ayushman Arogya Mandir'}
                </span>
                <span className="text-xs text-teal-200 font-mono">
                  ID: {healthCentreInfo.workerId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
                {language === 'hi' 
                  ? `नमस्ते, ${healthCentreInfo.healthWorker}` 
                  : `Welcome, ${healthCentreInfo.healthWorker}`}
              </h1>
              <p className="text-sm text-teal-100 flex items-center gap-1.5 mt-0.5 font-medium">
                <MapPin className="w-4 h-4 text-teal-300 flex-shrink-0" />
                <span>{healthCentreInfo.name}, {healthCentreInfo.location}</span>
              </p>
            </div>
          </div>

          {/* Attached Doctor & Date Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-xs">
            <div>
              <span className="text-teal-200 block font-medium">
                {language === 'hi' ? 'संबद्ध नेत्र रोग विशेषज्ञ:' : 'Attached Specialist:'}
              </span>
              <span className="font-bold text-white text-sm">{healthCentreInfo.attachedDoctor}</span>
            </div>
            <div className="h-6 w-px bg-white/20 hidden sm:block" />
            <div className="text-teal-100 font-medium">
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Guidance for Rural Worker */}
      <VoiceGuide 
        title={language === 'hi' ? "आशा कार्यकर्ता ध्वनि सहायता" : "ASHA Health Worker Voice Assistant"}
        textEn="Welcome to NetraSaarthi screening portal. To screen a diabetic patient, click the Register Patient card, or select Start Eye Scan to capture their fundus photo."
        textHi="नेत्रसारथी पोर्टल में आपका स्वागत है। मरीज की जांच करने के लिए पहले नया मरीज पंजीकृत करें या सीधे आंख का फोटो लेकर जांच शुरू करें।"
      />

      {/* 4 Large Action Cards (Optimized for Rural Touchscreens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Big Action 1: Register New Patient */}
        <Link
          to="/patient-registration"
          className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-teal-600 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-teal-50 rounded-full group-hover:scale-150 transition-transform" />
          <div>
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserPlus className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 1</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 mb-1 font-display">
              {language === 'hi' ? 'नया मरीज पंजीकरण' : 'Register Patient'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {language === 'hi' ? 'आभा आईडी, नाम और शुगर विवरण दर्ज करें' : 'Add ABHA ID, diabetes duration, and blood sugar details'}
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-bold text-teal-700 gap-1 group-hover:translate-x-1 transition-transform">
            <span>{language === 'hi' ? 'पंजीकरण शुरू करें' : 'Open Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Big Action 2: Fundus Eye Scan */}
        <Link
          to="/fundus-upload"
          className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-teal-600 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-teal-50 rounded-full group-hover:scale-150 transition-transform" />
          <div>
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 2</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 mb-1 font-display">
              {language === 'hi' ? 'आंख का फोटो लें' : 'Capture Eye Scan'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {language === 'hi' ? 'कैमरा या फंडस मशीन से आंख की फोटो खींचें' : 'Live camera alignment reticle or upload retinal fundus image'}
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-bold text-teal-700 gap-1 group-hover:translate-x-1 transition-transform">
            <span>{language === 'hi' ? 'स्कैन शुरू करें' : 'Start Eye Scan'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Big Action 3: Patient Records & History */}
        <Link
          to="/patient-history"
          className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-600 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform" />
          <div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <History className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Records</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 mb-1 font-display">
              {language === 'hi' ? 'पुरानी जांच देखें' : 'Patient History'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {language === 'hi' ? 'मरीज की पुरानी रिपोर्ट और सुधार ट्रैक करें' : 'Review longitudinal scans and diabetic progression trends'}
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-bold text-blue-700 gap-1 group-hover:translate-x-1 transition-transform">
            <span>{language === 'hi' ? 'रिकॉर्ड खोलें' : 'View Records'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Big Action 4: Offline Rural Sync */}
        <div
          onClick={syncOfflineScans}
          className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-500 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-pointer"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform" />
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <RefreshCw className={`w-7 h-7 ${pendingSyncCount > 0 ? 'animate-spin' : ''}`} />
            </div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Sync Queue</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 mb-1 font-display">
              {language === 'hi' ? 'डेटा सिंक करें' : 'Cloud Sync'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {pendingSyncCount > 0 
                ? `${pendingSyncCount} scans waiting to sync with District Hospital`
                : 'All screening reports synchronized with Ayushman Bharat cloud'}
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-bold text-amber-700 gap-1">
            <span>{pendingSyncCount > 0 ? 'Click to Sync Now' : 'Status: Up to Date'}</span>
          </div>
        </div>

      </div>

      {/* Daily Screening Triage Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Today Screened</span>
            <div className="text-2xl font-black text-slate-900 font-display">{healthCentreInfo.screeningsToday}</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4 border-l-4 border-l-emerald-600">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-emerald-700 uppercase font-bold tracking-wider">Grade 0: Normal</span>
            <div className="text-2xl font-black text-emerald-800 font-display">{healthCentreInfo.normalToday}</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-amber-700 uppercase font-bold tracking-wider">Grade 1-2: Mild/Mod</span>
            <div className="text-2xl font-black text-amber-800 font-display">3</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-card flex items-center gap-4 border-l-4 border-l-rose-600">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-rose-700 uppercase font-bold tracking-wider">Grade 3-4: Urgent</span>
            <div className="text-2xl font-black text-rose-800 font-display">{healthCentreInfo.referralsToday}</div>
          </div>
        </div>

      </div>

      {/* Patient Screening List / Worklist */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
              <span>{language === 'hi' ? 'हाल ही में जांच किए गए मरीज' : 'Recent Patient Screenings'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {patients.length} Registered
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi' ? 'तुरंत जांच शुरू करने या रिपोर्ट देखने के लिए मरीज चुनें' : 'Select a patient below to start an eye scan or view AI diagnostic findings'}
            </p>
          </div>

          <Link
            to="/patient-registration"
            className="btn-primary-large py-2.5 px-5 text-sm gap-2 w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'hi' ? 'नया मरीज जोड़ें' : 'Register New Patient'}</span>
          </Link>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-bold">Patient Name & ABHA ID</th>
                <th className="px-4 py-3.5 font-bold">Age / Gender</th>
                <th className="px-4 py-3.5 font-bold">Village</th>
                <th className="px-4 py-3.5 font-bold">Blood Sugar (RBS)</th>
                <th className="px-4 py-3.5 font-bold">AI DR Grade</th>
                <th className="px-4 py-3.5 font-bold">Triage Action</th>
                <th className="px-4 py-3.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((patient) => {
                const gradeInfo = DR_GRADES[patient.latestGrade] || DR_GRADES[0];
                return (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{patient.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{patient.abhaId || patient.id}</div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                      {patient.age} Yrs • {patient.gender}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 truncate max-w-[150px]">
                      {patient.village}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold ${
                        (patient.rbs || 0) > 200 ? 'text-rose-700' : 'text-emerald-700'
                      }`}>
                        {patient.rbs ? `${patient.rbs} mg/dL` : 'Not tested'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${gradeInfo.badgeColor}`}>
                        Grade {patient.latestGrade}: {gradeInfo.shortName}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold ${
                        patient.latestGrade >= 3 ? 'text-rose-700' : patient.latestGrade >= 2 ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {patient.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleStartScreeningForPatient(patient)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white border border-teal-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        📸 Scan Eye
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <MedicalDisclaimer compact={true} />

    </div>
  );
}
