import React, { useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { useVoice } from '../../context/VoiceContext';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceSpeakerProps {
  text?: string;
  translationKey?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  overrideLanguage?: string;
  /** When true, automatically speaks text on mount */
  autoRead?: boolean;
  /** Variant style */
  variant?: 'icon' | 'pill' | 'inline';
  /** Short label for pill/inline variants */
  pillLabel?: string;
}

export const VoiceSpeaker: React.FC<VoiceSpeakerProps> = ({
  text,
  translationKey,
  size = 'md',
  className = '',
  label,
  overrideLanguage,
  autoRead = false,
  variant = 'icon',
  pillLabel
}) => {
  const { speak, isSpeaking, activeSpeakerId, isSupported } = useVoice();
  const { t, language } = useLanguage();

  const spokenText = text || (translationKey ? t(translationKey) : '');
  const speakerId = React.useId();
  const isActive = isSpeaking && activeSpeakerId === speakerId;

  // Auto-read on mount if requested (for critical alerts/confirmations)
  useEffect(() => {
    if (autoRead && isSupported && spokenText) {
      const timer = setTimeout(() => {
        speak(spokenText, speakerId, overrideLanguage || language);
      }, 600);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isSupported || !spokenText) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    speak(spokenText, speakerId, overrideLanguage || language);
  };

  // Sound wave animation when active
  const ActiveIcon = () => (
    <span className="flex items-center gap-[2px]">
      {[1, 2, 3].map(i => (
        <span
          key={i}
          className="bg-current rounded-full w-[3px]"
          style={{
            height: `${8 + i * 3}px`,
            animation: `soundWave 0.6s ease-in-out ${i * 0.1}s infinite alternate`
          }}
        />
      ))}
    </span>
  );

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label || `Listen: ${spokenText.slice(0, 40)}`}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-agri-600 select-none ${
          isActive
            ? 'bg-agri-600 text-white shadow-md'
            : 'bg-agri-100 text-agri-800 hover:bg-agri-200 border border-agri-300'
        } ${className}`}
      >
        {isActive ? <ActiveIcon /> : <Volume2 size={14} />}
        <span>{pillLabel || 'Listen'}</span>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label || `Listen: ${spokenText.slice(0, 40)}`}
        className={`inline-flex items-center gap-1.5 text-xs text-agri-700 hover:text-agri-900 font-semibold underline underline-offset-2 focus:outline-none select-none transition-colors ${className}`}
      >
        {isActive ? <ActiveIcon /> : <Volume2 size={13} />}
        <span>{pillLabel || 'Listen'}</span>
      </button>
    );
  }

  // Default 'icon' variant
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label || `Listen: ${spokenText.slice(0, 40)}`}
      title={label || 'Listen'}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-agri-600 select-none flex-shrink-0 ${
        isActive
          ? 'bg-agri-600 text-white ring-4 ring-agri-300 scale-110 shadow-md'
          : 'bg-agri-100 text-agri-800 hover:bg-agri-200 hover:scale-105 active:scale-95 shadow-sm border border-agri-300'
      } ${sizeClasses[size]} ${className}`}
    >
      {isActive ? <ActiveIcon /> : <Volume2 size={iconSizes[size]} />}
    </button>
  );
};
