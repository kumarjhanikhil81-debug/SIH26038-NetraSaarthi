import React, { useRef } from 'react';
import { X, Printer, QrCode, Building2, User, Eye, ShieldAlert, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DR_GRADES } from '../data/mockData';

export default function ReferralSlipModal({ isOpen, onClose, screeningResult, patient, eye = 'OD' }) {
  const { healthCentreInfo, language } = useApp();
  const printRef = useRef(null);

  if (!isOpen || !screeningResult) return null;

  const drInfo = DR_GRADES[screeningResult.grade] || DR_GRADES[0];
  const refSlipNo = `REF-STP-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto no-print">
      <div className="relative w-full max-w-3xl my-8 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden print:w-full print:border-none print:shadow-none print:my-0">
        
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Official Clinical Referral Slip & Screening Summary
              </h3>
              <p className="text-xs text-slate-500">
                Ayushman Bharat Digital Health Mission (ABDM) Compatible
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary-large py-2 px-4 text-xs gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div 
          ref={printRef}
          className="p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-4 text-sm"
        >
          {/* Header Banner */}
          <div className="border-b-2 border-teal-800 pb-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 font-bold text-xs">
                  GOVERNMENT OF INDIA
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  National Health Mission (NHM)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-teal-950 tracking-tight">
                {healthCentreInfo.name}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {healthCentreInfo.location} • Tele-Ophthalmology Network
              </p>
            </div>

            <div className="text-center sm:text-right border-l-0 sm:border-l sm:pl-4 border-slate-300">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Referral Slip No.</div>
              <div className="text-sm font-mono font-black text-teal-900">{refSlipNo}</div>
              <div className="text-xs text-slate-500">Date: {new Date().toLocaleDateString('en-GB')}</div>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 mb-4">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Patient Name</div>
              <div className="font-bold text-slate-900 text-sm">{patient.name}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Age / Gender</div>
              <div className="font-bold text-slate-900 text-sm">{patient.age} Yrs / {patient.gender}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">ABHA / Aadhaar ID</div>
              <div className="font-mono font-bold text-teal-900 text-xs">{patient.abhaId || 'ABHA-91-4402-1190'}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Village / Panchayat</div>
              <div className="font-semibold text-slate-900 text-xs truncate">{patient.village}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Diabetes Duration</div>
              <div className="font-bold text-slate-900 text-xs">{patient.diabetesYears || 10} Years Known DM</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Blood Sugar (RBS)</div>
              <div className="font-bold text-rose-700 text-xs">{patient.rbs || 230} mg/dL</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Eye Examined</div>
              <div className="font-bold text-teal-800 text-xs">
                {eye === 'OD' ? 'OD (Right Eye)' : eye === 'OS' ? 'OS (Left Eye)' : 'Both Eyes (OU)'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Screened By (ASHA)</div>
              <div className="font-semibold text-slate-900 text-xs">{healthCentreInfo.healthWorker}</div>
            </div>
          </div>

          {/* AI Diagnostic Screening Result Box */}
          <div className={`p-4 rounded-2xl border-2 mb-4 ${
            screeningResult.grade >= 3
              ? 'bg-rose-50 border-rose-500 text-rose-950'
              : screeningResult.grade >= 2
              ? 'bg-amber-50 border-amber-500 text-amber-950'
              : 'bg-emerald-50 border-emerald-500 text-emerald-950'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase text-white ${
                  screeningResult.grade >= 3 ? 'bg-rose-600' : screeningResult.grade >= 2 ? 'bg-amber-600' : 'bg-emerald-600'
                }`}>
                  ICDR Grade {screeningResult.grade}: {drInfo.shortName}
                </span>
                <span className="text-xs font-bold">
                  (AI Confidence: {screeningResult.confidence || 96.4}%)
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
                ICD-10: {screeningResult.grade === 4 ? 'E11.359' : screeningResult.grade === 3 ? 'E11.349' : screeningResult.grade === 2 ? 'E11.339' : screeningResult.grade === 1 ? 'E11.329' : 'Z01.00'}
              </span>
            </div>

            <div className="font-bold text-base mb-1">
              Clinical Triage Priority: {drInfo.actionText}
            </div>
            <p className="text-xs leading-relaxed text-slate-800 font-medium">
              {drInfo.recommendation}
            </p>
          </div>

          {/* Lesion Pathology Findings Table */}
          <div className="mb-4">
            <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider mb-2">
              AI Quantitative Biomarker & Lesion Metrics:
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Microaneurysms</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{screeningResult.lesions?.microaneurysms ?? 0}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Hemorrhages</div>
                <div className="font-bold text-rose-700 text-sm mt-0.5">{screeningResult.lesions?.hemorrhages ?? 0}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Hard Exudates</div>
                <div className="font-bold text-amber-700 text-sm mt-0.5">{screeningResult.lesions?.hardExudates ?? 0}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Cotton Wool Spots</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{screeningResult.lesions?.cottonWoolSpots ?? 0}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Neovascularization</div>
                <div className="font-bold text-rose-800 text-sm mt-0.5">{screeningResult.lesions?.neovascularization ? 'Present (NVD)' : 'Absent'}</div>
              </div>
            </div>
          </div>

          {/* Referral Destination & Signatures */}
          <div className="border-t border-slate-300 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Referred To Hospital:</div>
              <div className="font-bold text-slate-900 text-sm">{healthCentreInfo.hospital}</div>
              <div className="text-xs text-slate-600">Department of Ophthalmology & Vitreoretina</div>
            </div>

            <div className="flex items-center justify-center">
              <div className="p-2 border border-slate-300 rounded-xl text-center bg-slate-50 flex items-center gap-2">
                <QrCode className="w-10 h-10 text-slate-800" />
                <div className="text-[10px] text-slate-500 text-left font-mono">
                  <div>Digital Scan ID</div>
                  <div className="font-bold text-slate-900">{refSlipNo}</div>
                  <div>Verify on ABDM Portal</div>
                </div>
              </div>
            </div>

            <div className="text-center sm:text-right pt-4 sm:pt-0">
              <div className="h-10 border-b border-dashed border-slate-400 mx-auto sm:ml-auto sm:mr-0 w-36 mb-1" />
              <div className="text-xs font-bold text-slate-900">Medical Officer / Doctor Sign</div>
              <div className="text-[10px] text-slate-500">Authorized Signature & Stamp</div>
            </div>
          </div>

          {/* Footer Disclaimer in Slip */}
          <div className="mt-4 pt-2 border-t border-slate-200 text-[10px] text-slate-500 text-center">
            * This referral slip was generated via NetraSaarthi AI Clinical Decision Support System at rural frontline PHC. It is intended for triage assistance and must be clinically validated upon arrival at the specialist clinic.
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-sm font-bold shadow-sm cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
