import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { VoiceSpeaker } from './VoiceSpeaker';
import { useLanguage } from '../../context/LanguageContext';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  titleVoiceText?: string;
  subtitle?: string;
  subtitleVoiceText?: string;
  showBackButton?: boolean;
  backTo?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  titleVoiceText,
  subtitle,
  subtitleVoiceText,
  showBackButton = false,
  backTo,
  maxWidth = '2xl',
  className = ''
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl'
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
      <div className={`mx-auto ${maxWidthStyles[maxWidth]} ${className}`}>
        {/* Top Header / Back row */}
        {(showBackButton || title) && (
          <div className="mb-6 space-y-2">
            {showBackButton && (
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 text-base font-bold text-slate-700 hover:text-agri-800 bg-white hover:bg-warmgray-100 px-3.5 py-2 rounded-xl border border-slate-300 shadow-sm transition-colors min-h-[44px]"
                >
                  <ArrowLeft size={20} className="text-agri-700" />
                  <span>{t('app.back')}</span>
                </button>

                <VoiceSpeaker text={t('app.back')} size="sm" label="Listen: Back" />
              </div>
            )}

            {title && (
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {title}
                </h2>
                <VoiceSpeaker
                  text={titleVoiceText || title}
                  size="md"
                  label={`Listen: ${title}`}
                />
              </div>
            )}

            {subtitle && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-sm sm:text-base text-slate-600 font-medium">
                  {subtitle}
                </p>
                {subtitleVoiceText && (
                  <VoiceSpeaker
                    text={subtitleVoiceText}
                    size="sm"
                    label={`Listen: ${subtitle}`}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {children}
      </div>
    </main>
  );
};
