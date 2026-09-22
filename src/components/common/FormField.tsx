import React from 'react';
import { VoiceSpeaker } from './VoiceSpeaker';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label: string;
  labelVoiceText?: string;
  labelVoiceKey?: string;
  error?: string;
  helperText?: string;
  helperVoiceText?: string;
  icon?: React.ReactNode;
  as?: 'input' | 'select';
  options?: { value: string; label: string; sublabel?: string }[];
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  labelVoiceText,
  labelVoiceKey,
  error,
  helperText,
  helperVoiceText,
  icon,
  as = 'input',
  options = [],
  className = '',
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className="space-y-1.5 w-full">
      {/* Label and Voice Button Row */}
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 select-none"
        >
          {icon && <span className="text-agri-700">{icon}</span>}
          <span>{label}</span>
          {props.required && <span className="text-red-600 font-bold">*</span>}
        </label>

        <VoiceSpeaker
          text={labelVoiceText || label}
          translationKey={labelVoiceKey}
          size="sm"
          label={`Listen to ${label}`}
        />
      </div>

      {/* Input or Select Element */}
      <div className="relative">
        {as === 'select' ? (
          <select
            id={inputId}
            className={`w-full px-4 py-3 sm:py-3.5 text-base sm:text-lg font-semibold bg-white border-2 rounded-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-agri-300 transition-all min-h-[52px] ${
              error ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-agri-600'
            } ${className}`}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="py-2 text-base font-medium">
                {opt.label} {opt.sublabel ? `(${opt.sublabel})` : ''}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            className={`w-full px-4 py-3 sm:py-3.5 text-base sm:text-lg font-semibold bg-white border-2 rounded-xl text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-agri-300 transition-all min-h-[52px] ${
              error ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-agri-600'
            } ${className}`}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-red-600 text-sm font-semibold pt-0.5">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
          <VoiceSpeaker text={error} size="sm" />
        </div>
      )}

      {/* Helper Guidance Text */}
      {helperText && !error && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 pt-0.5">
          <span>{helperText}</span>
          {helperVoiceText && <VoiceSpeaker text={helperVoiceText} size="sm" />}
        </div>
      )}
    </div>
  );
};
