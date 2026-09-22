/**
 * SpeakableCard — A card wrapper that includes a built-in VoiceSpeaker button.
 * Use this for any card that displays important information farmers should be
 * able to hear read aloud (e.g., token card, payment card, status card).
 */
import React from 'react';
import { VoiceSpeaker } from './VoiceSpeaker';

interface SpeakableCardProps {
  /** The text to read aloud when the speaker button is tapped */
  speakText: string;
  /** Card title shown in the header bar */
  title?: string;
  /** Optional subtitle under title */
  subtitle?: string;
  /** Extra classes for the outer card div */
  className?: string;
  /** Classes for the inner content area */
  contentClassName?: string;
  /** Speaker size */
  speakerSize?: 'sm' | 'md' | 'lg';
  /** Whether to auto-read on mount (for critical alerts) */
  autoRead?: boolean;
  /** Speaker variant */
  speakerVariant?: 'icon' | 'pill';
  /** Speaker label for pill variant */
  speakerLabel?: string;
  /** Card children */
  children: React.ReactNode;
  /** Optional id for Genie guidance targeting */
  id?: string;
}

export const SpeakableCard: React.FC<SpeakableCardProps> = ({
  speakText,
  title,
  subtitle,
  className = '',
  contentClassName = '',
  speakerSize = 'md',
  autoRead = false,
  speakerVariant = 'icon',
  speakerLabel,
  children,
  id
}) => {
  return (
    <div
      id={id}
      className={`bg-white border-2 border-agri-200 rounded-3xl shadow-sm overflow-hidden ${className}`}
    >
      {/* Card Header — only rendered when title is provided */}
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-agri-100 bg-agri-50">
          <div className="min-w-0">
            <p className="text-sm font-black text-agri-900 leading-tight">{title}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>
            )}
          </div>
          <VoiceSpeaker
            text={speakText}
            size={speakerSize}
            autoRead={autoRead}
            variant={speakerVariant}
            pillLabel={speakerLabel}
            className="flex-shrink-0"
          />
        </div>
      )}

      {/* If no title — floating speaker button in top-right corner */}
      {!title && (
        <div className="relative">
          <div className="absolute top-3 right-3 z-10">
            <VoiceSpeaker
              text={speakText}
              size={speakerSize}
              autoRead={autoRead}
              variant={speakerVariant}
              pillLabel={speakerLabel}
            />
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className={`${contentClassName}`}>{children}</div>
    </div>
  );
};
