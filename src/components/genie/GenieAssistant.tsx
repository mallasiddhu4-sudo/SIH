import React, { useState } from 'react';
import { Mic, MicOff, Send, X, Sparkles, Volume2, HelpCircle } from 'lucide-react';
import { useGenie } from '../../context/GenieContext';
import { useLanguage } from '../../context/LanguageContext';
import { useVoice } from '../../context/VoiceContext';
import { speechRecognitionService } from '../../services/speechRecognitionService';

export const GenieAssistant: React.FC = () => {
  const {
    isOpen,
    isListening,
    transcript,
    activeMessage,
    openGenie,
    closeGenie,
    startListening,
    stopListening,
    askGenie
  } = useGenie();

  const { language } = useLanguage();
  const { isSpeaking } = useVoice();
  const [inputText, setInputText] = useState('');

  const quickPrompts: Record<string, string[]> = {
    te: [
      'ధాన్యం కేంద్రాలు ఎక్కడ ఉన్నాయి?',
      'స్లాట్ బుక్ చేయాలి',
      'నా టోకెన్ ఎంత?',
      'నా ముందు ఎంతమంది ఉన్నారు?',
      'నా స్లాట్ మార్చాలి (Reschedule)',
      'నా స్లాట్ రద్దు చేయాలి (Cancel)',
      'నా పంట పరిస్థితి ఏంటి?',
      'డబ్బులు ఎప్పుడు వస్తాయి?',
      'నాకు సహాయం కావాలి'
    ],
    en: [
      'Where are procurement centres?',
      'Book my slot',
      'What is my token?',
      'How many farmers ahead?',
      'Reschedule my slot',
      'Cancel my slot',
      'What is my crop status?',
      'Where is my payment?',
      'Help me'
    ],
    hi: [
      'खरीद केंद्र कहाँ हैं?',
      'स्लॉट बुक करें',
      'मेरा टोकन क्या है?',
      'मुझसे आगे कितने किसान हैं?',
      'स्लॉट रीशेड्यूल करें',
      'स्लॉट रद्द करें',
      'फसल की स्थिति क्या है?',
      'भुगतान की स्थिति क्या है?',
      'मदद चाहिए'
    ],
    ta: [
      'கொள்முதல் மையங்கள் எங்கே?',
      'ஸ்லாட் புக் செய்ய',
      'எனது டோக்கன் என்ன?',
      'என் முன் எத்தனை பேர்?',
      'ஸ்லாட் மாற்றவும்',
      'ஸ்லாட் ரத்து செய்',
      'பயிர் நிலை என்ன?',
      'பணம் எப்போது வரும்?',
      'உதவி வேண்டும்'
    ],
    kn: [
      'ಖರೀದಿ ಕೇಂದ್ರಗಳು ಎಲ್ಲಿವೆ?',
      'ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ',
      'ನನ್ನ ಟೋಕನ್ ಏನು?',
      'ನನ್ನ ಮುಂದೆ ಎಷ್ಟು ಜನರಿದ್ದಾರೆ?',
      'ಸ್ಲಾಟ್ ಮರುಹೊಂದಿಸಿ',
      'ಸ್ಲಾಟ್ ರದ್ದುಮಾಡಿ',
      'ಬೆಳೆ ಸ್ಥಿತಿ ಏನು?',
      'ಪಾವತಿ ಸ್ಥಿತಿ ಏನು?',
      'ಸಹಾಯ ಬೇಕು'
    ]
  };

  const currentPrompts = quickPrompts[language] || quickPrompts.en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      askGenie(inputText);
      setInputText('');
    }
  };

  const handlePromptClick = (prompt: string) => {
    askGenie(prompt);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Expanded Genie Assistant Dialogue Window */}
      {isOpen && (
        <div
          className="mb-3 w-[calc(100vw-32px)] sm:w-96 bg-white border-2 border-agri-600 rounded-3xl shadow-2xl p-5 space-y-4 animate-fade-in text-slate-900 focus:outline-none"
          role="dialog"
          aria-label="Genie Voice Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-agri-700 text-white flex items-center justify-center text-xl shadow-sm border border-agri-600">
                🧞
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {language === 'te' ? 'జీనీ సహాయకుడు' : 'Genie Assistant'}
                  </h3>
                  <span className="text-[10px] bg-agri-100 text-agri-900 font-bold px-1.5 py-0.2 rounded uppercase">
                    Voice Guide
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'te' ? 'మీ భాషలో మాట్లాడండి' : 'Speak or type your question'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeGenie}
              className="w-8 h-8 rounded-full bg-warmgray-100 hover:bg-warmgray-200 text-slate-600 flex items-center justify-center transition-colors"
              title="Close Genie"
            >
              <X size={18} />
            </button>
          </div>

          {/* Active Message & Listening State Card */}
          <div className="bg-agri-50/80 border-2 border-agri-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="text-xl flex-shrink-0 mt-0.5">
                {isListening ? '🎙' : isSpeaking ? '🔊' : '💬'}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold text-agri-950 leading-relaxed">
                  {transcript || activeMessage}
                </p>
                {isListening && (
                  <div className="flex items-center gap-1.5 text-xs text-agri-700 font-semibold pt-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>
                      {language === 'te' ? 'వాయిస్ వింటున్నాము...' : 'Listening to voice...'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Microphone Central Button */}
            <div className="flex items-center justify-center pt-1">
              {speechRecognitionService.isSupported() ? (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all select-none ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-200 scale-105 animate-pulse'
                      : 'bg-agri-700 hover:bg-agri-800 text-white active:scale-95'
                  }`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  <span>
                    {isListening
                      ? language === 'te' ? 'ఆపండి (Tap to Stop)' : 'Stop Listening'
                      : language === 'te' ? 'మాట్లాడండి (Tap to Speak)' : 'Tap to Speak'}
                  </span>
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none">
                  <MicOff size={20} />
                  <span>
                    {language === 'te' ? 'వాయిస్ అందుబాటులో లేదు' : 'Voice input unavailable'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Clickable Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'te' ? 'త్వరిత ప్రశ్నలు (Quick Questions):' : 'Suggested questions:'}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {currentPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="text-left text-xs bg-warmgray-50 hover:bg-agri-100 text-slate-800 hover:text-agri-950 font-medium px-3 py-1.5 rounded-xl border border-slate-200 hover:border-agri-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Fallback Text Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === 'te' ? 'లేదా ఇక్కడ టైప్ చేయండి...' : 'Or type your question here...'
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-agri-600"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl bg-agri-700 hover:bg-agri-800 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
              title="Send"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Inactive / Closed Genie Guide Pill Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={openGenie}
          aria-label="Ask Genie Voice Guide"
          title="Ask Genie for help"
          id="floating-genie-btn"
          className="group relative flex items-center gap-3 bg-agri-800 hover:bg-agri-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-full shadow-2xl border-2 border-agri-500 hover:scale-105 active:scale-95 transition-all duration-200 select-none focus:outline-none focus:ring-4 focus:ring-agri-300"
        >
          {/* Gentle Breathing Aura */}
          <span className="absolute -inset-1 rounded-full bg-agri-400 opacity-30 group-hover:opacity-60 blur-sm animate-pulse-ring" />

          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-harvest-400 text-slate-950 flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 shadow">
            🧞
          </div>

          <div className="relative text-left pr-1">
            <div className="text-xs sm:text-sm font-black text-white leading-tight flex items-center gap-1.5">
              <span>{language === 'te' ? 'జీనీ సహాయకుడు' : 'Ask Genie'}</span>
              <Mic size={14} className="text-harvest-300" />
            </div>
            <div className="text-[10px] text-agri-200 font-semibold leading-tight">
              {language === 'te' ? 'వాయిస్ సహాయం' : 'Voice Guide'}
            </div>
          </div>
        </button>
      )}
    </div>
  );
};
