import React from 'react';
import { VoiceSpeaker } from './VoiceSpeaker';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'amber';
  size?: 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  voiceText?: string;
  voiceKey?: string;
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  variant = 'primary',
  size = 'lg',
  icon,
  voiceText,
  voiceKey,
  fullWidth = true,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-agri-700 hover:bg-agri-800 text-white shadow-md active:bg-agri-900 border-2 border-agri-800',
    secondary: 'bg-civic-700 hover:bg-civic-800 text-white shadow-md active:bg-civic-900 border-2 border-civic-800',
    amber: 'bg-harvest-500 hover:bg-harvest-600 text-slate-950 shadow-md active:bg-harvest-700 border-2 border-harvest-600 font-black',
    outline: 'bg-white hover:bg-warmgray-100 text-slate-800 border-2 border-slate-300 shadow-sm active:bg-warmgray-200'
  };

  const sizeStyles = {
    md: 'py-2.5 px-4 text-base min-h-[48px] rounded-xl',
    lg: 'py-3.5 px-6 text-lg sm:text-xl font-bold min-h-[56px] rounded-2xl',
    xl: 'py-4 px-8 text-xl sm:text-2xl font-black min-h-[64px] rounded-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${fullWidth ? 'w-full' : 'inline-flex'}`}>
      <button
        disabled={disabled}
        className={`flex items-center justify-center gap-3 transition-all duration-150 transform active:scale-[0.98] select-none focus:outline-none focus:ring-4 focus:ring-agri-400 disabled:opacity-50 disabled:cursor-not-allowed ${
          fullWidth ? 'w-full flex-1' : ''
        } ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon && <span className="text-xl sm:text-2xl flex-shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </button>

      {(voiceText || voiceKey) && (
        <VoiceSpeaker
          text={voiceText}
          translationKey={voiceKey}
          size={size === 'xl' ? 'lg' : 'md'}
          className="flex-shrink-0"
        />
      )}
    </div>
  );
};
