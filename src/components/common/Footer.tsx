import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, ShieldCheck, Globe, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { VoiceSpeaker } from './VoiceSpeaker';

export const Footer: React.FC = () => {
  const { t, currentLanguageInfo } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 text-sm mt-auto border-t-4 border-agri-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800">
          {/* Col 1: Portal Summary */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌾</span>
              <h3 className="font-bold text-white text-base">{t('app.title')}</h3>
              <VoiceSpeaker translationKey="app.title" size="sm" />
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-3">
              {t('app.subtitle')}. Transparent digital records for crop procurement, live queue tracking, and direct bank credit.
            </p>
            <div className="flex items-center gap-2 text-xs text-agri-300">
              <ShieldCheck size={16} />
              <span>SIH Prototype Problem Statement 26032</span>
            </div>
          </div>

          {/* Col 2: Farmer Support & Helpline */}
          <div id="kisan-helpline-card">
            <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Phone size={16} className="text-harvest-400" />
              Farmer Support & Helpline
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="font-semibold text-white">Toll-Free:</span>
                <a href="tel:18001801551" className="text-harvest-300 hover:underline">1800-180-1551</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-white">Working Hours:</span>
                <span>8:00 AM - 6:00 PM</span>
              </li>
              <li className="text-slate-400 text-xs">
                Call for token inquiries, moisture specifications, or payment queries.
              </li>
            </ul>
          </div>

          {/* Col 3: Accessibility & Language */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Globe size={16} className="text-harvest-400" />
              Language & Accessibility
            </h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="text-slate-400">
                Active Language: <strong className="text-white">{currentLanguageInfo.nativeLabel} ({currentLanguageInfo.label})</strong>
              </p>
              <Link
                to="/language"
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-agri-300 px-3 py-1.5 rounded text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Globe size={14} />
                {t('app.language_change')}
              </Link>
              <p className="text-slate-500 text-xs pt-1">
                🔊 Audio assistance is available on all pages using the speaker button.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Farmer Procurement Portal. Built for Smart India Hackathon Demonstration.</p>
          <p className="text-slate-400">Prototype concept for low-literacy rural farmer accessibility.</p>
        </div>
      </div>
    </footer>
  );
};
