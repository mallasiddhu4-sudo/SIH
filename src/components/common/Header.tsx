import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Globe, Phone, LogOut, ShieldCheck, User, Wrench } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { VoiceSpeaker } from './VoiceSpeaker';

export const Header: React.FC = () => {
  const { t, currentLanguageInfo } = useLanguage();
  const { farmer, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLanguagePage = location.pathname === '/language' || location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b-2 border-agri-200 shadow-sm sticky top-0 z-40">
      {/* Top Civic Info Bar */}
      <div className="bg-agri-900 text-white text-xs sm:text-sm py-1.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-harvest-500 text-slate-950 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              SIH 26032
            </span>
            <span className="hidden sm:inline text-agri-200">|</span>
            <span className="flex items-center gap-1 text-agri-100">
              <ShieldCheck size={15} className="text-agri-300 inline" />
              {t('app.trust_notice')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:18001801551"
              className="flex items-center gap-1.5 text-harvest-300 hover:text-harvest-200 font-semibold transition-colors"
            >
              <Phone size={14} />
              <span className="hidden md:inline">{t('app.helpline')}</span>
              <span className="md:hidden">1800-180-1551</span>
            </a>

            {!isLanguagePage && (
              <Link
                to="/language"
                id="header-change-lang-btn"
                className="flex items-center gap-1.5 bg-agri-800 hover:bg-agri-700 active:bg-agri-900 text-white px-3 py-1 rounded-lg text-xs font-bold border border-agri-600 shadow-sm transition-all hover:scale-102"
                title={t('app.language_change')}
              >
                <Globe size={14} className="text-harvest-400 flex-shrink-0" />
                <span>{currentLanguageInfo.nativeLabel}</span>
                <span className="text-[10px] text-agri-200 uppercase font-semibold hidden sm:inline">({t('app.language_change')})</span>
              </Link>
            )}

            {/* Officer / Admin Quick Links (top-right) */}
            <div className="hidden md:flex items-center gap-1.5">
              <Link
                to="/centre/dashboard"
                className="flex items-center gap-1 bg-civic-700 hover:bg-civic-600 text-white px-2 py-1 rounded text-xs transition-colors"
                title="Centre Operator Dashboard"
              >
                <Wrench size={12} />
                <span>Operator</span>
              </Link>
              <Link
                to="/centre/intelligence"
                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs transition-colors"
                title="Centre Intelligence"
              >
                <span>🧠</span>
                <span>Intelligence</span>
              </Link>
              <Link
                to="/admin/department"
                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs transition-colors"
                title="Department Dashboard"
              >
                <span>📊</span>
                <span>Dept</span>
              </Link>
            </div>
            {/* Mobile: single Operator link */}
            <Link
              to="/centre/dashboard"
              className="md:hidden flex items-center gap-1 bg-civic-700 hover:bg-civic-600 text-white px-2 py-1 rounded text-xs transition-colors"
              title="Centre Operator Console"
            >
              <Wrench size={13} />
              <span className="hidden sm:inline">Operator</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link to={isAuthenticated ? '/farmer/dashboard' : '/login'} className="flex items-center gap-3 group">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-agri-700 text-white flex items-center justify-center text-2xl sm:text-3xl shadow-md border-2 border-agri-600 group-hover:bg-agri-800 transition-colors">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-agri-950 tracking-tight leading-tight group-hover:text-agri-800">
                {t('app.title')}
              </h1>
              <VoiceSpeaker translationKey="app.title" size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-tight">
              {t('app.subtitle')}
            </p>
          </div>
        </Link>

        {/* Right Auth / Farmer Profile */}
        {isAuthenticated && farmer ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <User size={15} className="text-agri-700" />
                {farmer.name}
              </span>
              <span className="text-xs font-mono bg-agri-100 text-agri-900 px-2 py-0.5 rounded border border-agri-300 font-semibold">
                ID: {farmer.farmerId}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs sm:text-sm bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg border border-red-200 font-semibold transition-colors min-h-touch"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          !isLanguagePage && (
            <Link
              to="/login"
              className="text-xs sm:text-sm bg-agri-700 hover:bg-agri-800 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors min-h-touch flex items-center"
            >
              {t('login.login_btn')}
            </Link>
          )
        )}
      </div>
    </header>
  );
};
