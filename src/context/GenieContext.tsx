import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useVoice } from './VoiceContext';
import { useProcurement } from './ProcurementContext';
import { GuidanceTarget } from '../types';
import { speechRecognitionService } from '../services/speechRecognitionService';
import { matchGenieIntent, getAiGenieIntent } from '../services/genieIntentService';

interface GenieContextType {
  isOpen: boolean;
  isListening: boolean;
  transcript: string;
  activeMessage: string;
  guidanceTarget: GuidanceTarget | null;
  activeAction: 'OPEN_RESCHEDULE' | 'OPEN_CANCEL' | null;
  openGenie: () => void;
  closeGenie: () => void;
  startListening: () => void;
  stopListening: () => void;
  askGenie: (query: string) => void;
  triggerVisualGuidance: (selector: string, message: string, speechText?: string) => void;
  clearGuidance: () => void;
  clearActiveAction: () => void;
}

const GenieContext = createContext<GenieContextType | undefined>(undefined);

export const GenieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, t } = useLanguage();
  const { speak, stop: stopSpeaking } = useVoice();
  const { currentBooking, activePlanAppointments } = useProcurement();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeMessage, setActiveMessage] = useState('');
  const [guidanceTarget, setGuidanceTarget] = useState<GuidanceTarget | null>(null);
  const [activeAction, setActiveAction] = useState<'OPEN_RESCHEDULE' | 'OPEN_CANCEL' | null>(null);

  const guidanceTimerRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  const clearGuidance = () => {
    if (guidanceTimerRef.current) {
      clearTimeout(guidanceTimerRef.current);
      guidanceTimerRef.current = null;
    }
    setGuidanceTarget(null);
  };

  const clearActiveAction = () => {
    setActiveAction(null);
  };

  const openGenie = () => {
    setIsOpen(true);
    // Initial friendly prompt
    const greeting = language === 'te'
      ? 'నమస్కారం! నేను మీ డిజిటల్ సహాయకుడిని. మీకు ఏమి సహాయం కావాలి?'
      : language === 'hi'
        ? 'नमस्ते! मैं आपका डिजिटल सहायक हूँ। आपको क्या मदद चाहिए?'
        : language === 'ta'
          ? 'வணக்கம்! நான் உங்கள் டிஜிட்டல் உதவியாளர். உங்களுக்கு என்ன உதவி வேண்டும்?'
          : language === 'kn'
            ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಸಹಾಯಕ. ನಿಮಗೆ ಏನು ಸಹಾಯ ಬೇಕು?'
            : 'Hello! I am your Genie guide. How can I help you today?';

    setActiveMessage(greeting);
  };

  const closeGenie = () => {
    stopListening();
    setIsOpen(false);
    setIsListening(false);
  };

  const startListening = () => {
    if (!speechRecognitionService.isSupported()) {
      setActiveMessage(
        language === 'te'
          ? 'మైక్రోఫోన్ అందుబాటులో లేదు. దయచేసి క్రింద టైప్ చేయండి.'
          : 'Microphone is not supported in this browser. Please type below.'
      );
      return;
    }

    setTranscript('');
    transcriptRef.current = '';
    const hasErrorRef = { current: false };
    setIsListening(true);
    stopSpeaking();

    const success = speechRecognitionService.start(language, {
      onStart: () => {
        setIsListening(true);
        setActiveMessage(language === 'te' ? 'నేను వింటున్నాను... చెప్పండి 🎙' : 'Listening... speak now 🎙');
      },
      onResult: (text, isFinal) => {
        setTranscript(text);
        transcriptRef.current = text;
        if (isFinal) {
          setIsListening(false);
          askGenie(text);
        }
      },
      onError: (errorType, friendlyMsg) => {
        hasErrorRef.current = true;
        setIsListening(false);
        setActiveMessage(friendlyMsg);
      },
      onEnd: () => {
        setIsListening(false);
        if (transcriptRef.current === 'PROCESSING' || hasErrorRef.current) {
          return; // It ended because we manually stopped it after getting a final result, or an error occurred
        }
        
        // If it ended naturally but we captured speech that wasn't finalized, process it anyway.
        if (transcriptRef.current.trim()) {
          askGenie(transcriptRef.current);
        } else {
          setActiveMessage(language === 'te' ? 'నేను ఏమీ వినలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.' : 'I didn\'t hear anything. Please try again.');
        }
      }
    });

    if (!success) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    speechRecognitionService.stop();
    setIsListening(false);
  };

  const triggerVisualGuidance = (selector: string, message: string, speechText?: string) => {
    clearGuidance();
    setGuidanceTarget({ selector, message, speechText });

    if (speechText) {
      speak(speechText, 'genie-guidance-speech', language);
    }

    // Automatically fade guidance after 8 seconds
    guidanceTimerRef.current = setTimeout(() => {
      setGuidanceTarget(null);
    }, 8000);
  };

  const askGenie = async (query: string) => {
    if (!query || query.trim() === '') return;

    transcriptRef.current = 'PROCESSING'; // Prevent onEnd duplicate calls or false empty errors
    stopListening();
    stopSpeaking();

    // Show an 'understanding' state
    setActiveMessage(language === 'te' ? 'అర్థం చేసుకుంటున్నాను...' : 'Thinking...');

    const tokenStr = currentBooking?.tokenDisplay || 'A127';
    
    // Add multi-crop appointments to context so AI knows about individual crops
    let result = await getAiGenieIntent(query, language, location.pathname, {
      currentBooking,
      activePlanAppointments
    });

    if (!result) {
      // Fallback
      console.log('Falling back to deterministic Genie intent');
      result = matchGenieIntent(query, location.pathname, tokenStr);
    }

    const responseText = result.spokenResponses[language] || result.spokenResponses.en;
    setActiveMessage(responseText);

    // Speak response
    speak(responseText, 'genie-main-speech', language);

    // Handle navigation
    if (result.route && location.pathname !== result.route) {
      navigate(result.route, { state: { cropMentioned: result.cropMentioned } });
    }

    // Set action (e.g. open reschedule modal)
    if (result.action && result.action !== 'NONE') {
      setActiveAction(result.action);
    }

    // Trigger visual guidance overlay after slight navigation delay
    if (result.guidanceSelector) {
      setTimeout(() => {
        clearGuidance();
        setGuidanceTarget({ selector: result.guidanceSelector!, message: responseText });
        guidanceTimerRef.current = setTimeout(() => {
          setGuidanceTarget(null);
        }, 8000);
      }, 400);
    }

    // Close panel after a short delay so the farmer can see the page and guidance pointer
    setTimeout(() => {
      setIsOpen(false);
    }, 2200);
  };

  // Clear guidance on user navigation change unless just set
  useEffect(() => {
    // keep target active for small window
  }, [location.pathname]);

  return (
    <GenieContext.Provider
      value={{
        isOpen,
        isListening,
        transcript,
        activeMessage,
        guidanceTarget,
        activeAction,
        openGenie,
        closeGenie,
        startListening,
        stopListening,
        askGenie,
        triggerVisualGuidance,
        clearGuidance,
        clearActiveAction
      }}
    >
      {children}
    </GenieContext.Provider>
  );
};

export const useGenie = (): GenieContextType => {
  const context = useContext(GenieContext);
  if (!context) {
    throw new Error('useGenie must be used within a GenieProvider');
  }
  return context;
};
