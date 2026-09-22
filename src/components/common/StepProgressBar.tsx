import React from 'react';
import { Check } from 'lucide-react';
import { VoiceSpeaker } from './VoiceSpeaker';

interface Step {
  id: number;
  title: string;
  voiceText?: string;
}

interface StepProgressBarProps {
  steps: Step[];
  currentStep: number;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full py-4 mb-6">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 -z-0" />
        
        {/* Active Connecting Line */}
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1.5 bg-agri-600 -z-0 transition-all duration-300"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
          }}
        />

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-base sm:text-lg border-3 transition-all duration-200 ${
                  isCompleted
                    ? 'bg-agri-700 text-white border-agri-800 shadow'
                    : isCurrent
                    ? 'bg-harvest-400 text-slate-950 border-harvest-600 ring-4 ring-harvest-200 scale-110 shadow-md font-extrabold'
                    : 'bg-white text-slate-400 border-slate-300'
                }`}
              >
                {isCompleted ? <Check size={22} className="stroke-[3]" /> : step.id}
              </div>

              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`text-xs sm:text-sm font-bold text-center select-none ${
                    isCurrent
                      ? 'text-agri-950 underline underline-offset-4 decoration-2 decoration-harvest-500'
                      : isCompleted
                      ? 'text-agri-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </span>
                {isCurrent && (
                  <VoiceSpeaker
                    text={step.voiceText || step.title}
                    size="sm"
                    label={`Listen step ${step.id}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
