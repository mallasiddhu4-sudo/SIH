import React, { useEffect, useState } from 'react';
import { Volume2, X, Sparkles } from 'lucide-react';
import { useGenie } from '../../context/GenieContext';
import { useVoice } from '../../context/VoiceContext';
import { useLanguage } from '../../context/LanguageContext';

export const GuidanceOverlay: React.FC = () => {
  const { guidanceTarget, clearGuidance } = useGenie();
  const { speak } = useVoice();
  const { language } = useLanguage();

  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!guidanceTarget?.selector) {
      setRect(null);
      return;
    }

    const updatePosition = () => {
      const el = document.querySelector(guidanceTarget.selector);
      if (el) {
        // Scroll into view smoothly if not visible
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const bounding = el.getBoundingClientRect();
        setRect(bounding);
      } else {
        setRect(null);
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 300);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [guidanceTarget]);

  if (!guidanceTarget || !rect) {
    return null;
  }

  const tooltipTop = Math.max(10, rect.top - 70);
  const tooltipLeft = Math.max(16, Math.min(window.innerWidth - 320, rect.left + rect.width / 2 - 150));

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none transition-all duration-300 animate-fade-in"
      aria-live="polite"
    >
      {/* Soft spotlight cutout / highlight ring around target element */}
      <div
        style={{
          position: 'absolute',
          top: `${rect.top - 6}px`,
          left: `${rect.left - 6}px`,
          width: `${rect.width + 12}px`,
          height: `${rect.height + 12}px`,
        }}
        className="rounded-2xl ring-4 ring-agri-500 bg-agri-500/10 pointer-events-auto transition-all duration-300 animate-pulse"
        onClick={clearGuidance}
      />

      {/* Gentle Floating Hand Pointer Icon */}
      <div
        style={{
          position: 'absolute',
          top: `${rect.top - 36}px`,
          left: `${rect.left + rect.width / 2 - 18}px`,
        }}
        className="text-3xl filter drop-shadow-md pointer-events-none animate-bounce"
      >
        👇
      </div>

      {/* Guidance Message Bubble */}
      <div
        style={{
          position: 'absolute',
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`,
        }}
        className="pointer-events-auto max-w-xs sm:max-w-sm bg-slate-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border-2 border-agri-400 flex items-start gap-3 animate-fade-in"
      >
        <div className="w-8 h-8 rounded-full bg-agri-600 text-white flex items-center justify-center text-base flex-shrink-0 mt-0.5">
          🧞
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-agri-400">
              Genie Guide
            </span>
            <button
              type="button"
              onClick={clearGuidance}
              className="text-slate-400 hover:text-white p-0.5 rounded"
              title="Close guide"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
            {guidanceTarget.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => speak(guidanceTarget.speechText || guidanceTarget.message, 'overlay-replay', language)}
          className="w-8 h-8 rounded-full bg-agri-800 hover:bg-agri-700 text-agri-200 flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
          title="Listen again"
          aria-label="Listen again"
        >
          <Volume2 size={16} />
        </button>
      </div>
    </div>
  );
};
