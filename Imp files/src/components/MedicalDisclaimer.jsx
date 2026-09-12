import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MedicalDisclaimer({ compact = false }) {
  const { language } = useApp();

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold shadow-sm">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
        <span>
          {language === 'hi' 
            ? "AI स्क्रीनिंग सहायता प्रणाली: यह प्राथमिक पहचान के लिए है, अंतिम चिकित्सीय निदान नहीं।" 
            : "AI Clinical Decision Support: Designed for screening triage. Final validation by registered Ophthalmologist is mandatory."}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-slate-800 text-xs sm:text-sm flex items-start gap-3.5 shadow-sm">
      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 mt-0.5 flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-700" />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="font-bold text-amber-900 uppercase tracking-wider text-xs">
            {language === 'hi' ? 'चिकित्सीय सूचना एवं अस्वीकरण' : 'Clinical Decision Support & Regulatory Notice'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white text-[10px] text-amber-800 border border-amber-300 font-mono font-semibold">
            ICDR Staging Guidelines v2.4
          </span>
        </div>
        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
          {language === 'hi'
            ? "नेत्रसारथी एक कृत्रिम बुद्धिमत्ता (AI) आधारित स्क्रीनिंग सहायता प्रणाली है। यह केवल आशा और प्राथमिक स्वास्थ्य कार्यकर्ताओं द्वारा प्राथमिक पहचान और रेफरल निर्णय के लिए बनाई गई है। किसी भी चिकित्सीय प्रक्रिया या दवा के लिए अधिकृत नेत्र रोग विशेषज्ञ की पुष्टि आवश्यक है।"
            : "NetraSaarthi is an Explainable AI-assisted screening and decision support platform designed for frontline rural healthcare triage. All automated classifications and Grad-CAM attention maps are intended solely to assist clinical judgment and require formal validation by a registered Ophthalmologist before initiating surgical or therapeutic interventions."}
        </p>
      </div>
    </div>
  );
}
