import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useVoice } from './VoiceContext';
import { useProcurement } from './ProcurementContext';
import { GuidanceTarget } from '../types';
import { speechRecognitionService } from '../services/speechRecognitionService';
import { getAiGenieIntent, matchGenieIntent } from '../services/genieIntentService';
import { useGenieTaskEngine, GenieTaskState } from '../hooks/useGenieTaskEngine';

interface GenieContextType {
  isOpen: boolean;
  isListening: boolean;
  transcript: string;
  activeMessage: string;
  guidanceTarget: GuidanceTarget | null;
  activeAction: 'OPEN_RESCHEDULE' | 'OPEN_CANCEL' | null;
  taskState: GenieTaskState;
  openGenie: () => void;
  closeGenie: () => void;
  startListening: () => void;
  stopListening: () => void;
  askGenie: (query: string) => void;
  triggerVisualGuidance: (selector: string, message: string, speechText?: string) => void;
  clearGuidance: () => void;
  clearActiveAction: () => void;
  notifyManualInteraction: (field: string, value: any) => void;
}

const GenieContext = createContext<GenieContextType | undefined>(undefined);

export const GenieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, t } = useLanguage();
  const { speak, stop: stopSpeaking } = useVoice();
  const procurement = useProcurement();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeMessage, setActiveMessage] = useState('');
  const [guidanceTarget, setGuidanceTarget] = useState<GuidanceTarget | null>(null);
  const [activeAction, setActiveAction] = useState<'OPEN_RESCHEDULE' | 'OPEN_CANCEL' | null>(null);
  const [shouldResumeListening, setShouldResumeListening] = useState(false);

  const guidanceTimerRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  // FIX (Bug 4): Track whether the user manually pressed Stop so onEnd does not re-process.
  const manualStopRef = useRef<boolean>(false);

  const { taskState, notifyManualInteraction, processIntent, resetTask } = useGenieTaskEngine(
    speak,
    navigate,
    procurement
  );

  const { isSpeaking } = useVoice();

  // Phase 7: Automatically resume listening when Genie finishes speaking during a multi-turn task
  useEffect(() => {
    if (!isSpeaking && shouldResumeListening && isOpen && !isListening) {
      // Small timeout to avoid instantly picking up trailing TTS audio if any
      const timer = setTimeout(() => {
        if (shouldResumeListening && isOpen && !isListening) {
          startListening();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSpeaking, shouldResumeListening, isOpen, isListening]);

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
    setShouldResumeListening(false);
    const greeting = language === 'te' ? 'నమస్కారం! నేను మీ డిజిటల్ సహాయకుడిని. మీకు ఏమి సహాయం కావాలి?' : 'Hello! I am your Genie guide. How can I help you today?';
    setActiveMessage(greeting);
    resetTask();
  };

  const closeGenie = () => {
    stopListening();
    setIsOpen(false);
    setIsListening(false);
    setShouldResumeListening(false);
    resetTask();
  };

  const startListening = () => {
    if (!speechRecognitionService.isSupported()) {
      setActiveMessage('Microphone is not supported in this browser. Please type below.');
      return;
    }

    // FIX (Bug 4): Clear the manual-stop flag whenever we intentionally start listening.
    manualStopRef.current = false;
    setTranscript('');
    transcriptRef.current = '';
    stopSpeaking();
    
    const success = speechRecognitionService.start(language, {
      onStart: () => {
        setIsListening(true);
        setActiveMessage(language === 'te' ? 'నేను వింటున్నాను... చెప్పండి 🎙' : 'Listening... speak now 🎙');
      },
      onResult: (text, isFinal) => {
        // FIX (Bug 4-A): If user pressed Stop, ignore any results that trickle in.
        if (manualStopRef.current) return;
        setTranscript(text);
        transcriptRef.current = text;
        if (isFinal) {
          setIsListening(false);
          askGenie(text);
        }
      },
      onError: (errorType, friendlyMsg) => {
        setIsListening(false);
        setActiveMessage(friendlyMsg);
      },
      onEnd: () => {
        setIsListening(false);
        // FIX (Bug 4-A): If user manually stopped, do NOT re-process the partial transcript.
        if (manualStopRef.current) {
          manualStopRef.current = false;
          return;
        }
        if (transcriptRef.current === 'PROCESSING') return;
        if (transcriptRef.current.trim()) {
          askGenie(transcriptRef.current);
        } else {
          setActiveMessage('I didn\'t hear anything. Please try again.');
        }
      }
    });

    if (!success) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    // FIX (Bug 4-A): Mark as manual stop BEFORE calling stop() so onEnd handler sees it.
    manualStopRef.current = true;
    speechRecognitionService.stop();
    setIsListening(false);
    // FIX (Bug 4-B): Prevent the useEffect from restarting the mic after user pressed Stop.
    setShouldResumeListening(false);
  };

  const triggerVisualGuidance = (selector: string, message: string, speechText?: string) => {
    clearGuidance();
    setGuidanceTarget({ selector, message, speechText });
    if (speechText) speak(speechText, 'genie-guidance-speech', language);
    guidanceTimerRef.current = setTimeout(() => setGuidanceTarget(null), 8000);
  };

  const askGenie = async (query: string) => {
    if (!query || query.trim() === '') return;
    transcriptRef.current = 'PROCESSING';
    stopListening();
    stopSpeaking();
    setActiveMessage(language === 'te' ? 'అర్థం చేసుకుంటున్నాను...' : 'Thinking...');

    let result = await getAiGenieIntent(query, language, location.pathname, {
      currentBooking: procurement.currentBooking,
      activePlanAppointments: procurement.activePlanAppointments
    });

    if (!result) {
      result = matchGenieIntent(query, location.pathname);
    }
    
    // Pass rawQuery for yes/no confirmation detection
    const intentData = { ...result, rawQuery: query };
    const taskResult = await processIntent(intentData, language);
    
    setActiveMessage(taskResult.responseText);
    speak(taskResult.responseText, 'genie-main-speech', language);
    
    if (taskResult.action && taskResult.action !== 'NONE') {
      setActiveAction(taskResult.action);
    }
    
    // Trigger visual guidance if available and close panel
    if (taskResult.guidanceSelector) {
      setTimeout(() => {
        clearGuidance();
        setGuidanceTarget({ selector: taskResult.guidanceSelector!, message: taskResult.responseText });
        guidanceTimerRef.current = setTimeout(() => setGuidanceTarget(null), 8000);
      }, 400);
    }

    // PART 1: DO NOT CLOSE GENIE DURING A TASK
    // If the task engine is awaiting information or confirmation, we must NOT close the Genie.
    // We only close if the action is completed or cancelled (i.e. task goes back to NONE/IDLE).
    if (taskResult.task === 'NONE' || taskResult.step === 'IDLE' || taskResult.isComplete) {
      setShouldResumeListening(false);
      setTimeout(() => {
        setIsOpen(false);
      }, 2200);
    } else {
      // Phase 7: Resume listening for multi-turn tasks
      setShouldResumeListening(true);
    }
  };

  return (
    <GenieContext.Provider
      value={{
        isOpen, isListening, transcript, activeMessage, guidanceTarget, activeAction, taskState,
        openGenie, closeGenie, startListening, stopListening, askGenie, triggerVisualGuidance, clearGuidance, clearActiveAction, notifyManualInteraction
      }}
    >
      {children}
    </GenieContext.Provider>
  );
};

export const useGenie = (): GenieContextType => {
  const context = useContext(GenieContext);
  if (!context) throw new Error('useGenie must be used within a GenieProvider');
  return context;
};
