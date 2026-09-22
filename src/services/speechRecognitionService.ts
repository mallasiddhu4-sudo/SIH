import { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../locales/languages';

// SpeechRecognition type declarations for browser environments
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

class SpeechRecognitionService {
  private recognition: any = null;
  private isListeningActive: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        this.recognition = new SpeechRecognitionConstructor();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public start(languageCode: LanguageCode, callbacks: SpeechRecognitionCallbacks): boolean {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition is not supported in this browser.');
      return false;
    }

    try {
      this.stop(); // cancel any active session

      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
      this.recognition.lang = langInfo?.speechLocale || 'te-IN';

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        callbacks.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          callbacks.onResult?.(text, !!finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        console.warn('Speech recognition event warning:', event.error);
        callbacks.onError?.(event.error || 'Voice input error');
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        callbacks.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (e) {
      this.isListeningActive = false;
      callbacks.onError?.('Could not start voice recognition.');
      return false;
    }
  }

  public stop() {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore already stopped
      }
      this.isListeningActive = false;
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
