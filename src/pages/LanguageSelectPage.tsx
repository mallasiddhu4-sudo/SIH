import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Volume2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { LanguageCode, LanguageInfo } from '../types';
import { PrimaryButton } from '../components/common/PrimaryButton';

export const LanguageSelectPage: React.FC = () => {
  const { language, setLanguage, languages, t, currentLanguageInfo } = useLanguage();
  const { speak, isSpeaking, activeSpeakerId } = useVoice();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
  };

  const handleProceed = () => {
    setLanguage(language);
    if (isAuthenticated) {
      navigate('/farmer/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <main className="min-h-screen bg-warmgray-50 flex flex-col justify-between py-8 px-4 sm:px-6 selection:bg-agri-200">
      <div className="max-w-2xl mx-auto w-full">
        {/* Top Brand & Identity */}
        <div className="text-center space-y-3 mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-agri-700 text-white text-4xl shadow-md border-3 border-agri-600 mb-1">
            🌾
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {t('app.title')}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {t('app.subtitle')}
            </p>
          </div>
        </div>

        {/* Language Selection Card */}
        <div className="bg-white border-2 border-agri-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1 border-b border-slate-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('lang_select.choose_heading')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {t('lang_select.choose_subtext')}
            </p>
          </div>

          {/* 5 Clean Language Buttons */}
          <div className="space-y-3">
            {languages.map((lang: LanguageInfo) => {
              const isSelected = language === lang.code;
              const speakerKey = `lang_card_${lang.code}`;
              const isCardSpeaking = isSpeaking && activeSpeakerId === speakerKey;

              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectLanguage(lang.code);
                    }
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 select-none focus:outline-none focus:ring-4 focus:ring-agri-400 ${
                    isSelected
                      ? 'bg-agri-50 border-agri-600 ring-2 ring-agri-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-agri-300 hover:bg-warmgray-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-colors ${
                        isSelected
                          ? 'bg-agri-700 text-white'
                          : 'bg-warmgray-100 text-slate-600'
                      }`}
                    >
                      {isSelected ? <CheckCircle2 size={22} className="text-white" /> : lang.code.toUpperCase()}
                    </div>

                    <div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                        {lang.nativeLabel}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold">
                        {lang.label}
                      </div>
                    </div>
                  </div>

                  {/* Audio Preview */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(lang.greeting, speakerKey, lang.code);
                    }}
                    title={`Listen in ${lang.nativeLabel}`}
                    aria-label={`Listen in ${lang.nativeLabel}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCardSpeaking
                        ? 'bg-agri-600 text-white ring-4 ring-agri-200 animate-pulse'
                        : 'bg-agri-50 text-agri-800 border border-agri-200 hover:bg-agri-100'
                    }`}
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="pt-2">
            <PrimaryButton
              onClick={handleProceed}
              size="lg"
              variant="primary"
              icon={<ArrowRight size={22} />}
              voiceText={`${t('lang_select.continue_btn')}. ${currentLanguageInfo.nativeLabel}`}
            >
              {t('lang_select.continue_btn')}
            </PrimaryButton>
          </div>
        </div>

        {/* Minimal Footer Support */}
        <div className="mt-8 text-center text-xs text-slate-500 pb-4 space-y-1">
          <p>
            Kisan Call Centre Helpline: <strong className="text-slate-800 font-bold">1800-180-1551</strong> (Toll-Free)
          </p>
        </div>
      </div>
    </main>
  );
};

