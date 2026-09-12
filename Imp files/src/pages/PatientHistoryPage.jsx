import React, { useState } from 'react';
import { 
  History, 
  TrendingUp, 
  User, 
  Calendar, 
  Printer, 
  Activity, 
  Eye
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { DR_GRADES, CLINICAL_SAMPLE_CASES } from '../data/mockData';
import RetinalVisualizer from '../components/RetinalVisualizer';
import ReferralSlipModal from '../components/ReferralSlipModal';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function PatientHistoryPage() {
  const { patients, language } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 'PAT-2026-001');
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  const patient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const historyData = patient.history && patient.history.length > 0
    ? patient.history.map(item => ({
        date: item.date,
        grade: item.grade,
        gradeLabel: `Grade ${item.grade}`,
        rbs: item.rbs || 200,
        hba1c: item.hba1c || 8.0,
        notes: item.notes
      })).reverse()
    : [
        { date: "2025-04-10", grade: 1, gradeLabel: "Grade 1", rbs: 175, hba1c: 7.2, notes: "Early microaneurysms" },
        { date: "2025-11-20", grade: 2, gradeLabel: "Grade 2", rbs: 230, hba1c: 8.4, notes: "Moderate NPDR with hard exudates" },
        { date: "2026-09-01", grade: patient.latestGrade, gradeLabel: `Grade ${patient.latestGrade}`, rbs: patient.rbs || 280, hba1c: 9.8, notes: "Latest screening" }
      ];

  const drInfo = DR_GRADES[patient.latestGrade] || DR_GRADES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header & Patient Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5 font-display">
            <History className="w-7 h-7 text-teal-700" />
            <span>{language === 'hi' ? 'मरीज इतिहास एवं रेटिना रिपोर्ट' : 'Longitudinal Patient History & DR Progression'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Track microvascular disease progression, glycemic trends, and past tele-ophthalmology consultations
          </p>
        </div>

        {/* Patient Switcher Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Patient:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full md:w-64 px-3.5 py-2 rounded-xl glass-input text-xs font-bold text-slate-900 cursor-pointer shadow-sm"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id} className="bg-white text-slate-900">
                {p.name} ({p.village}) - Grade {p.latestGrade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Bio Summary Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 font-display">{patient.name}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                {patient.abhaId || patient.id}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${drInfo.badgeColor}`}>
                Current: Grade {patient.latestGrade} ({drInfo.shortName})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {patient.age} Yrs • {patient.gender} • Village: <span className="text-slate-800 font-bold">{patient.village}</span> • Phone: {patient.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div>
            <span className="text-slate-500 block text-[11px]">Known Diabetes</span>
            <span className="font-bold text-teal-800">{patient.diabetesYears || 10} Years</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 block text-[11px]">Random Sugar (RBS)</span>
            <span className="font-bold text-rose-700">{patient.rbs || 240} mg/dL</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 block text-[11px]">Total Screenings</span>
            <span className="font-bold text-slate-900">{historyData.length} Visits</span>
          </div>
        </div>
      </div>

      {/* Recharts Analytics: DR Progression & Blood Sugar Correlation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Diabetic Retinopathy Grade Progression (0 to 4) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-display">
                <TrendingUp className="w-4 h-4 text-teal-700" />
                <span>DR Severity Grade Trajectory</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">ICDR Clinical Grade scale (0: Normal to 4: Proliferative)</p>
            </div>
            <span className="text-xs font-mono text-teal-800 font-bold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              Longitudinal
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} 
                  itemStyle={{ color: '#0f766e', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="grade" stroke="#0F766E" strokeWidth={3} fillOpacity={1} fill="url(#gradeGradient)" name="ICDR Grade" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Glycemic Control (RBS mg/dL & HbA1c) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-display">
                <Activity className="w-4 h-4 text-rose-600" />
                <span>Glycemic Control (RBS Blood Sugar)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Blood sugar correlation with microvascular retinal damage</p>
            </div>
            <span className="text-xs font-mono text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              Target: &lt;140 mg/dL
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 350]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} 
                  itemStyle={{ color: '#e11d48', fontWeight: 'bold' }}
                />
                <Bar dataKey="rbs" fill="#e11d48" radius={[8, 8, 0, 0]} name="RBS (mg/dL)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Side-by-Side Fundus Scan Comparison (Baseline vs Latest) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-display">
              <Eye className="w-5 h-5 text-teal-700" />
              <span>Comparative Retinal Fundus & Grad-CAM Inspection</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Side-by-side progression analysis between baseline exam and current visit
            </p>
          </div>
          <button
            onClick={() => setIsReferralOpen(true)}
            className="btn-primary-large py-2 px-4 text-xs gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Current Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Baseline Scan (Previous visit) */}
          <div className="flex flex-col items-center bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Baseline Scan (Visit 1): Grade 1-2
            </span>
            <RetinalVisualizer 
              grade={patient.latestGrade >= 3 ? 2 : 1}
              eye="OD"
              hotspots={CLINICAL_SAMPLE_CASES[2].gradcamHotspots}
              interactive={false}
              defaultMode="original"
            />
            <p className="text-xs text-slate-500 text-center mt-3 font-medium">
              Early microaneurysms and mild exudation detected in initial screening.
            </p>
          </div>

          {/* Current Scan (Latest visit) */}
          <div className="flex flex-col items-center bg-teal-50/40 p-4 sm:p-5 rounded-2xl border-2 border-teal-600 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Current Scan: Grade {patient.latestGrade} ({drInfo.shortName})
              </span>
            </div>
            <RetinalVisualizer 
              grade={patient.latestGrade}
              eye="OD"
              hotspots={CLINICAL_SAMPLE_CASES[patient.latestGrade]?.gradcamHotspots || []}
              lesionMarkers={CLINICAL_SAMPLE_CASES[patient.latestGrade]?.lesionMarkers || []}
              interactive={true}
              defaultMode="gradcam"
            />
            <p className="text-xs text-slate-700 text-center mt-3 font-semibold">
              Explainable Grad-CAM highlighting active lesion clusters and referral zones.
            </p>
          </div>

        </div>
      </div>

      {/* Screening Visits History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-2 border-b border-slate-100 font-display">
          <Calendar className="w-4 h-4 text-teal-700" />
          <span>Screening Visits & Specialist Consultation Log</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-bold">Screening Date</th>
                <th className="px-4 py-3.5 font-bold">DR Grade</th>
                <th className="px-4 py-3.5 font-bold">Blood Sugar</th>
                <th className="px-4 py-3.5 font-bold">Clinical Findings & Doctor Directives</th>
                <th className="px-4 py-3.5 font-bold text-right">Referral Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyData.map((record, idx) => {
                const gr = DR_GRADES[record.grade] || DR_GRADES[0];
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-900 font-bold">
                      {record.date}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${gr.badgeColor}`}>
                        Grade {record.grade}: {gr.shortName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-800">
                      {record.rbs} mg/dL (HbA1c: {record.hba1c}%)
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-md font-medium">
                      {record.notes}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setIsReferralOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
                      >
                        🖨️ View Slip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Referral Slip Modal */}
      <ReferralSlipModal 
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        screeningResult={{
          grade: patient.latestGrade,
          confidence: 96.4,
          lesions: CLINICAL_SAMPLE_CASES[patient.latestGrade]?.lesions || {}
        }}
        patient={patient}
        eye="OD"
      />

    </div>
  );
}
