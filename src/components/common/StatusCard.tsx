import React from 'react';
import { VoiceSpeaker } from './VoiceSpeaker';
import { ChevronRight } from 'lucide-react';

interface StatusCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badgeText?: string;
  badgeVariant?: 'green' | 'amber' | 'blue' | 'gray';
  voiceText?: string;
  voiceKey?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  description,
  icon,
  badgeText,
  badgeVariant = 'green',
  voiceText,
  voiceKey,
  onClick,
  className = '',
  disabled = false
}) => {
  const badgeStyles = {
    green: 'bg-agri-100 text-agri-900 border-agri-300',
    amber: 'bg-harvest-100 text-harvest-900 border-harvest-300',
    blue: 'bg-civic-100 text-civic-900 border-civic-300',
    gray: 'bg-slate-100 text-slate-800 border-slate-300'
  };

  const spokenContent = voiceText || `${title}. ${description}. ${badgeText ? `Status: ${badgeText}` : ''}`;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative bg-white border-2 rounded-2xl p-5 sm:p-6 transition-all duration-200 select-none ${
        onClick && !disabled
          ? 'cursor-pointer hover:border-agri-600 hover:shadow-lg active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-agri-300 border-slate-200'
          : 'border-slate-200 shadow-sm'
      } ${disabled ? 'opacity-60 cursor-not-allowed bg-warmgray-50' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon and Details */}
        <div className="flex items-start gap-4 flex-1">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-agri-50 border border-agri-200 flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 group-hover:scale-105 transition-transform">
            {icon}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight group-hover:text-agri-800">
                {title}
              </h3>
              {badgeText && (
                <span
                  className={`text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${badgeStyles[badgeVariant]}`}
                >
                  {badgeText}
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Right: Speaker & Chevron */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <VoiceSpeaker
            text={spokenContent}
            translationKey={voiceKey}
            size="md"
            label={`Listen to ${title}`}
          />
          {onClick && !disabled && (
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-agri-600 group-hover:text-white text-slate-500 flex items-center justify-center transition-colors">
              <ChevronRight size={20} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
