import React, { createContext, useContext, useState, useEffect } from 'react';
import { voiceService } from '../services/voiceService';
import { useLanguage } from './LanguageContext';

interface VoiceContextType {
  isSpeaking: boolean;
  activeSpeakerId: string | null;
  speak: (text: string, speakerId?: string, overrideLanguage?: string) => void;
  stop: () => void;
  isSupported: boolean;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // Stop speech when user navigates or changes language
  useEffect(() => {
    return () => {
      voiceService.stop();
      setIsSpeaking(false);
      setActiveSpeakerId(null);
    };
  }, [language]);

  const speak = (text: string, speakerId?: string, overrideLanguage?: string) => {
    if (!text || text.trim() === '') return;

    const id = speakerId || Math.random().toString(36).substring(7);

    // If currently speaking this exact item, clicking again acts as toggle to stop
    if (isSpeaking && activeSpeakerId === id) {
      voiceService.stop();
      setIsSpeaking(false);
      setActiveSpeakerId(null);
      return;
    }

    setActiveSpeakerId(id);
    setIsSpeaking(true);

    const targetLang = (overrideLanguage || language) as any;

    voiceService.speak(text, targetLang, {
      onStart: () => {
        setIsSpeaking(true);
        setActiveSpeakerId(id);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setActiveSpeakerId(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setActiveSpeakerId(null);
      }
    });
  };

  const stop = () => {
    voiceService.stop();
    setIsSpeaking(false);
    setActiveSpeakerId(null);
  };

  return (
    <VoiceContext.Provider
      value={{
        isSpeaking,
        activeSpeakerId,
        speak,
        stop,
        isSupported: voiceService.isSupported()
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
