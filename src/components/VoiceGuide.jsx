import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, Play, Pause } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function VoiceGuide({ textEn, textHi, title = "Voice Guidance / ध्वनि मार्गदर्शन" }) {
  const { language, setLanguage } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }
  }, []);

  const currentText = language === 'hi' ? textHi : textEn;

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentText);
      utterance.rate = 0.9; // Slightly slower for rural patient clarity
      utterance.pitch = 1.0;

      // Select matching voice
      const voices = window.speechSynthesis.getVoices();
      if (language === 'hi') {
        const hiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
        if (hiVoice) utterance.voice = hiVoice;
      }

      utterance.onend = () => {
        setIsPlaying(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-50/90 via-white to-blue-50/90 border border-teal-200/90 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-700 text-white shadow-sm flex-shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>{title}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                <Sparkles className="w-3 h-3 text-purple-600" />
                AI Voice
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'मरीज और आशा कार्यकर्ता के लिए ऑडियो मार्गदर्शन' : 'Audio guidance for rural health worker & patient'}
            </p>
          </div>
        </div>

        {/* Language switch & Play Button */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => {
                if (isPlaying) window.speechSynthesis.cancel();
                setIsPlaying(false);
                setLanguage('en');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                language === 'en' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                if (isPlaying) window.speechSynthesis.cancel();
                setIsPlaying(false);
                setLanguage('hi');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                language === 'hi' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>

          <button
            onClick={handleToggleSpeech}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-teal-700 hover:bg-teal-800 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>{language === 'hi' ? 'रोकें (Pause)' : 'Pause Audio'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{language === 'hi' ? 'ऑडियो सुनें (Play)' : 'Play Voice'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Waveform indicator while playing */}
      {isPlaying && (
        <div className="flex items-center gap-1.5 my-2.5 py-1.5 px-3 bg-teal-50 rounded-xl border border-teal-200">
          <span className="text-[11px] text-teal-800 font-mono font-bold mr-2">Speaking...</span>
          <div className="flex items-center gap-1 h-3 flex-1">
            {[40, 80, 55, 90, 65, 45, 100, 70, 30, 85, 60, 95, 40].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-teal-600 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Audio transcript box */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm font-medium leading-relaxed shadow-sm">
        "{currentText}"
      </div>
    </div>
  );
}
