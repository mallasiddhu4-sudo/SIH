/**
 * SpeakableLabel — An inline label/value pair with a built-in speaker button.
 * Useful for data fields (e.g., "Token: A127 🔊", "Amount: ₹1,12,752 🔊")
 * in farmer-facing pages.
 */
import React from 'react';
import { VoiceSpeaker } from './VoiceSpeaker';

interface SpeakableLabelProps {
  /** Short display label shown before the value (e.g., "Token") */
  label?: string;
  /** The value to display (e.g., "A127") */
  value: React.ReactNode;
  /** Full sentence to read aloud (defaults to "label: value" if not provided) */
  speakText?: string;
  /** Extra classes */
  className?: string;
  /** Speaker size */
  speakerSize?: 'sm' | 'md';
  /** If true, speaks automatically on first render */
  autoRead?: boolean;
  /** Layout: 'row' places label+value inline, 'col' stacks them */
  layout?: 'row' | 'col';
  /** Text styles */
  labelClass?: string;
  valueClass?: string;
}

export const SpeakableLabel: React.FC<SpeakableLabelProps> = ({
  label,
  value,
  speakText,
  className = '',
  speakerSize = 'sm',
  autoRead = false,
  layout = 'row',
  labelClass = 'text-xs text-slate-500 font-semibold',
  valueClass = 'text-sm font-black text-slate-900'
}) => {
  const textToSpeak = speakText || (label ? `${label}: ${value}` : String(value));

  if (layout === 'col') {
    return (
      <div className={`space-y-0.5 ${className}`}>
        {label && <span className={labelClass}>{label}</span>}
        <div className="flex items-center gap-1.5">
          <span className={valueClass}>{value}</span>
          <VoiceSpeaker text={textToSpeak} size={speakerSize} autoRead={autoRead} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className={labelClass}>{label}:</span>}
      <span className={valueClass}>{value}</span>
      <VoiceSpeaker text={textToSpeak} size={speakerSize} autoRead={autoRead} />
    </div>
  );
};
