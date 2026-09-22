import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PageContainer } from '../components/common/PageContainer';
import { FormField } from '../components/common/FormField';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { VoiceSpeaker } from '../components/common/VoiceSpeaker';

export const LoginPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setError(t('login.invalid_credentials'));
      return;
    }

    const success = login(phone, pin);
    if (success) {
      navigate('/farmer/dashboard');
    } else {
      setError(t('login.invalid_credentials'));
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
    navigate('/farmer/dashboard');
  };

  return (
    <PageContainer
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      maxWidth="md"
    >
      <div className="bg-white border-2 border-agri-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Quick Demo Login Option for SIH Evaluators & Quick Testing */}
        <div
          id="demo-login-box"
          className="bg-harvest-50 border-2 border-harvest-400 rounded-2xl p-4 sm:p-5 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider bg-harvest-400 text-slate-950 px-2 py-0.5 rounded">
              SIH Demo Mode
            </span>
            <VoiceSpeaker
              text={language === 'te' ? 'రవి కుమార్ డెమో లాగిన్' : 'Instant 1-Click Demo Login for Ravi Kumar.'}
              size="sm"
            />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800">
            {language === 'te'
              ? 'ముందుగా నమోదు చేయబడిన వివరాలతో నేరుగా లాగిన్ అవ్వడానికి ఇక్కడ నొక్కండి:'
              : 'Click below for instant one-click login with pre-loaded slot and live queue token:'}
          </p>
          <button
            type="button"
            id="demo-login-btn"
            onClick={handleDemoLogin}
            className="w-full py-3 px-4 rounded-xl bg-harvest-500 hover:bg-harvest-600 active:bg-harvest-700 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
          >
            <Sparkles size={20} />
            <span>{language === 'te' ? 'డెమో లాగిన్ (రవి కుమార్ - వరి రైతు)' : 'Quick Demo Login (Ravi Kumar - Paddy)'}</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-widest absolute">
            {language === 'te' ? 'లేదా మొబైల్ ద్వారా లాగిన్' : 'Or Login with Mobile'}
          </span>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-sm font-bold">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span>{error}</span>
              <VoiceSpeaker text={error} size="sm" />
            </div>
          )}

          <div id="mobile-input-container">
            <FormField
              id="mobile-input"
              label={t('login.mobile_label')}
              labelVoiceKey="login.mobile_label"
              type="tel"
              pattern="[0-9]*"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              placeholder={t('login.mobile_placeholder')}
              helperText={t('login.mobile_help')}
              helperVoiceText={t('login.mobile_help')}
              icon={<Phone size={20} />}
              required
            />
          </div>

          <div id="pin-input-container">
            <FormField
              id="pin-input"
              label={t('login.pin_label')}
              labelVoiceKey="login.pin_label"
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder={t('login.pin_placeholder')}
              helperText={t('login.pin_help')}
              helperVoiceText={t('login.pin_help')}
              icon={<Lock size={20} />}
            />
          </div>

          <div className="pt-2">
            <PrimaryButton
              type="submit"
              size="lg"
              variant="primary"
              icon={<LogIn size={22} />}
              voiceKey="login.login_btn"
            >
              {t('login.login_btn')}
            </PrimaryButton>
          </div>
        </form>

        {/* Registration Prompt */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <span className="text-sm font-semibold text-slate-600 block">
            {t('login.new_farmer_prompt')}
          </span>

          <Link to="/register" className="block w-full">
            <button
              type="button"
              id="register-btn"
              className="w-full py-2.5 px-4 rounded-xl border-2 border-slate-300 text-slate-800 hover:bg-warmgray-100 font-bold text-sm flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              <span>{t('login.register_btn')}</span>
            </button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

