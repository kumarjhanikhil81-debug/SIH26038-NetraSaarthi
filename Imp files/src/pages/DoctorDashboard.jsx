import React, { useState } from 'react';
import { 
  Stethoscope, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Check, 
  X, 
  Printer, 
  Sparkles,
  Building2,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DR_GRADES, CLINICAL_SAMPLE_CASES } from '../data/mockData';
import RetinalVisualizer from '../components/RetinalVisualizer';
import ReferralSlipModal from '../components/ReferralSlipModal';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function DoctorDashboard() {
  const { 
    patients, 
    validateDoctorReview, 
    healthCentreInfo 
  } = useApp();

  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL' | 'URGENT' | 'MODERATE' | 'VALIDATED'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseForReview, setSelectedCaseForReview] = useState(null);
  
  // Review Modal State
  const [overrideGrade, setOverrideGrade] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [selectedAdvisory, setSelectedAdvisory] = useState('PRP Laser Photocoagulation Evaluation');
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  const openReviewModal = (patient) => {
    setSelectedCaseForReview(patient);
    setOverrideGrade(patient.latestGrade);
    setClinicalNotes(patient.doctorNotes || '');
  };

  const handleSaveReview = (approved) => {
    if (!selectedCaseForReview) return;
    validateDoctorReview(selectedCaseForReview.id, {
      overrideGrade: overrideGrade !== null ? overrideGrade : selectedCaseForReview.latestGrade,
      notes: clinicalNotes || (approved ? 'Clinically verified and approved by District Ophthalmologist.' : 'Grade adjusted following expert tele-review.'),
      advisory: selectedAdvisory
    });
    setSelectedCaseForReview(null);
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (patient.abhaId && patient.abhaId.includes(searchTerm));
    
    if (!matchesSearch) return false;
    if (filterSeverity === 'URGENT') return patient.latestGrade >= 3;
    if (filterSeverity === 'MODERATE') return patient.latestGrade === 2;
    if (filterSeverity === 'VALIDATED') return patient.reviewStatus === 'Specialist Validated';
    return true;
  });

  const urgentCount = patients.filter(p => p.latestGrade >= 3).length;
  const modCount = patients.filter(p => p.latestGrade === 2).length;
  const validatedCount = patients.filter(p => p.reviewStatus === 'Specialist Validated').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Doctor Header Banner (Medical Teal/Slate gradient) */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <Stethoscope className="w-9 h-9" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase bg-white/20 text-teal-100 border border-white/20">
                  Tele-Ophthalmology Triage Center
                </span>
                <span className="text-xs text-teal-200 font-mono">
                  {healthCentreInfo.hospital}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
                {healthCentreInfo.attachedDoctor}
              </h1>
              <p className="text-sm text-teal-100 font-medium">
                Frontline AI Screening Review & Specialist Validation Worklist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-teal-100 font-medium">PHC Tele-Link:</span>
            <span className="text-white font-mono font-bold">Rampur Health Block</span>
          </div>
        </div>
      </div>

      {/* Triage Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div 
          onClick={() => setFilterSeverity('ALL')}
          className={`p-4 sm:p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-card ${
            filterSeverity === 'ALL' ? 'border-teal-700 ring-2 ring-teal-600/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Tele-Queue</span>
          <div className="text-2xl font-black text-slate-900 font-display mt-1">{patients.length} Cases</div>
        </div>

        <div 
          onClick={() => setFilterSeverity('URGENT')}
          className={`p-4 sm:p-5 rounded-2xl bg-white border border-l-4 border-l-rose-600 cursor-pointer transition-all shadow-card ${
            filterSeverity === 'URGENT' ? 'border-rose-600 ring-2 ring-rose-600/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs text-rose-700 uppercase font-bold tracking-wider">Critical / Urgent</span>
          <div className="text-2xl font-black text-rose-800 font-display mt-1">{urgentCount} Cases</div>
        </div>

        <div 
          onClick={() => setFilterSeverity('MODERATE')}
          className={`p-4 sm:p-5 rounded-2xl bg-white border border-l-4 border-l-amber-500 cursor-pointer transition-all shadow-card ${
            filterSeverity === 'MODERATE' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs text-amber-700 uppercase font-bold tracking-wider">Moderate (30-Day)</span>
          <div className="text-2xl font-black text-amber-800 font-display mt-1">{modCount} Cases</div>
        </div>

        <div 
          onClick={() => setFilterSeverity('VALIDATED')}
          className={`p-4 sm:p-5 rounded-2xl bg-white border border-l-4 border-l-emerald-600 cursor-pointer transition-all shadow-card ${
            filterSeverity === 'VALIDATED' ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs text-emerald-700 uppercase font-bold tracking-wider">Doctor Validated</span>
          <div className="text-2xl font-black text-emerald-800 font-display mt-1">{validatedCount} Reviewed</div>
        </div>

      </div>

      {/* Review Queue Worklist Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient, village, ABHA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'URGENT', 'MODERATE', 'VALIDATED'].map(f => (
              <button
                key={f}
                onClick={() => setFilterSeverity(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterSeverity === f
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-bold">Patient & ABHA ID</th>
                <th className="px-4 py-3.5 font-bold">Age / Village</th>
                <th className="px-4 py-3.5 font-bold">Blood Sugar</th>
                <th className="px-4 py-3.5 font-bold">AI DR Classification</th>
                <th className="px-4 py-3.5 font-bold">Review Status</th>
                <th className="px-4 py-3.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map(patient => {
                const gradeInfo = DR_GRADES[patient.latestGrade] || DR_GRADES[0];
                return (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{patient.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{patient.abhaId || patient.id}</div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                      <div>{patient.age} Yrs • {patient.gender}</div>
                      <div className="text-slate-500 truncate max-w-[130px]">{patient.village}</div>
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        patient.reviewStatus === 'Specialist Validated'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
                      }`}>
                        {patient.reviewStatus === 'Specialist Validated' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{patient.reviewStatus}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => openReviewModal(patient)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white border border-teal-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        🔬 Review Case
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Specialist Case Review Modal */}
      {selectedCaseForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    Ophthalmic Case Review & Tele-Signoff
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-semibold">{selectedCaseForReview.abhaId}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 font-display">
                  {selectedCaseForReview.name} (Age: {selectedCaseForReview.age}, {selectedCaseForReview.gender})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Village: {selectedCaseForReview.village} • Blood Sugar: {selectedCaseForReview.rbs} mg/dL • Diabetes Duration: {selectedCaseForReview.diabetesYears} Yrs
                </p>
              </div>

              <button
                onClick={() => setSelectedCaseForReview(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side Fundus & Grad-CAM Inspection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Visualizer (6 Cols) */}
              <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center">
                <RetinalVisualizer 
                  grade={overrideGrade !== null ? overrideGrade : selectedCaseForReview.latestGrade}
                  eye={selectedCaseForReview.eyeScanned?.includes('OD') ? 'OD' : 'OS'}
                  hotspots={CLINICAL_SAMPLE_CASES[selectedCaseForReview.latestGrade]?.gradcamHotspots || []}
                  lesionMarkers={CLINICAL_SAMPLE_CASES[selectedCaseForReview.latestGrade]?.lesionMarkers || []}
                  interactive={true}
                  defaultMode="gradcam"
                />
              </div>

              {/* Right Review Controls (6 Cols) */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* AI Screening Assessment Card */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-900 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      AI Automated Finding:
                    </span>
                    <span className="text-xs font-mono text-purple-700 font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                      96.4% Confidence
                    </span>
                  </div>
                  <div className="font-bold text-base text-slate-900 font-display">
                    ICDR Grade {selectedCaseForReview.latestGrade}: {DR_GRADES[selectedCaseForReview.latestGrade]?.name}
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {DR_GRADES[selectedCaseForReview.latestGrade]?.recommendation}
                  </p>
                </div>

                {/* Grade Verification / Override Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Specialist Verified Grade (Override if needed):
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setOverrideGrade(g)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                          overrideGrade === g
                            ? 'bg-teal-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Grade {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommended Clinical Advisory */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Clinical Treatment Advisory / Action:
                  </label>
                  <select
                    value={selectedAdvisory}
                    onChange={(e) => setSelectedAdvisory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-semibold cursor-pointer"
                  >
                    <option value="PRP Laser Photocoagulation Evaluation">PRP Laser Photocoagulation Evaluation</option>
                    <option value="Anti-VEGF Intravitreal Injection Advisory">Anti-VEGF Intravitreal Injection Advisory</option>
                    <option value="Fluorescein Angiography (FFA) & OCT Referral">Fluorescein Angiography (FFA) & OCT Referral</option>
                    <option value="Intensive Glycemic Control & 3-Month Follow-up">Intensive Glycemic Control & 3-Month Follow-up</option>
                    <option value="Routine Annual Eye Exam at PHC">Routine Annual Eye Exam at PHC</option>
                  </select>
                </div>

                {/* Doctor Clinical Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Doctor's Tele-Consultation Notes & Directives:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter diagnostic confirmation, laser timing, or medications..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-medium"
                  />
                </div>

                {/* Doctor Sign-off Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleSaveReview(true)}
                    className="flex-1 btn-primary-large text-xs py-3 gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Validate Case</span>
                  </button>

                  <button
                    onClick={() => setIsReferralOpen(true)}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Referral Slip</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Referral Slip Modal from Doctor review */}
      {selectedCaseForReview && (
        <ReferralSlipModal 
          isOpen={isReferralOpen}
          onClose={() => setIsReferralOpen(false)}
          screeningResult={{
            grade: overrideGrade !== null ? overrideGrade : selectedCaseForReview.latestGrade,
            confidence: 96.4,
            lesions: CLINICAL_SAMPLE_CASES[selectedCaseForReview.latestGrade]?.lesions || {}
          }}
          patient={selectedCaseForReview}
          eye={selectedCaseForReview.eyeScanned || 'OD'}
        />
      )}

      <MedicalDisclaimer compact={true} />

    </div>
  );
}
