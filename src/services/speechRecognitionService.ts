import { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../locales/languages';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorType: string, friendlyMessage: string) => void;
  onEnd?: () => void;
}

const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  'not-allowed': {
    en: 'Please allow microphone access and try again.',
    te: 'మైక్రోఫోన్ అనుమతి ఇవ్వండి, మళ్లీ ప్రయత్నించండి.',
    hi: 'माइक्रोफ़ोन की अनुमति दें और फिर प्रयास करें।',
    ta: 'மைக்ரோஃபோன் அனுமதியை வழங்கி மீண்டும் முயற்சிக்கவும்.',
    kn: 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನೀಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
  },
  'no-speech': {
    en: 'I could not hear your voice. Please try again.',
    te: 'నేను ఏమీ వినలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.',
    hi: 'मुझे कुछ सुनाई नहीं दिया। कृपया फिर से प्रयास करें।',
    ta: 'நீங்கள் பேசுவது கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.',
    kn: 'ನನಗೆ ಏನೂ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
  },
  'audio-capture': {
    en: 'Microphone is not available. Check your device and try again.',
    te: 'మైక్రోఫోన్ అందుబాటులో లేదు. మీ పరికరాన్ని తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
    hi: 'माइक्रोफ़ोन उपलब्ध नहीं है। कृपया अपना डिवाइस जांचें।',
    ta: 'மைக்ரோஃபோன் கிடைக்கவில்லை. உங்கள் சாதனத்தை சரிபார்க்கவும்.',
    kn: 'ಮೈಕ್ರೊಫೋನ್ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಾಧನವನ್ನು ಪರಿಶೀಲಿಸಿ.'
  },
  'network': {
    en: 'Network error. Please check your internet connection.',
    te: 'నెట్‌వర్క్ లోపం. దయచేసి మీ ఇంటర్నెట్‌ను తనిఖీ చేయండి.',
    hi: 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।',
    ta: 'நெட்வொர்க் பிழை. உங்கள் இணைய இணைப்பை சரிபார்க்கவும்.',
    kn: 'ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.'
  },
  'default': {
    en: 'An error occurred with voice recognition.',
    te: 'వాయిస్ గుర్తింపులో లోపం ఏర్పడింది.',
    hi: 'वॉयस रिकग्निशन में एक त्रुटि हुई।',
    ta: 'குரல் அங்கீகாரத்தில் பிழை ஏற்பட்டது.',
    kn: 'ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆಯಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ.'
  }
};

class SpeechRecognitionService {
  private recognition: any = null;
  private isListeningActive: boolean = false;
  private currentLanguage: string = 'en';

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
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

  private getErrorMessage(errorType: string, lang: string): string {
    const errorMap = ERROR_MESSAGES[errorType] || ERROR_MESSAGES['default'];
    return errorMap[lang] || errorMap['en'];
  }

  public start(languageCode: LanguageCode, callbacks: SpeechRecognitionCallbacks): boolean {
    if (!this.recognition) {
      callbacks.onError?.('not-supported', 'Voice input is not supported in this browser. You can type instead.');
      return false;
    }

    // Do not restart if already listening
    if (this.isListeningActive) {
      return true;
    }

    this.currentLanguage = languageCode;
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    this.recognition.lang = langInfo?.speechLocale || 'te-IN';

    // Set up clear event listeners, overwriting old ones
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
      const friendlyMsg = this.getErrorMessage(event.error, this.currentLanguage);
      console.warn('Speech recognition event warning:', event.error);
      callbacks.onError?.(event.error, friendlyMsg);
    };

    this.recognition.onend = () => {
      this.isListeningActive = false;
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (e) {
      this.isListeningActive = false;
      // If we hit an InvalidStateError, the browser thinks it's already running. Try to stop and clean up.
      try {
        this.recognition.stop();
      } catch (err) {}
      callbacks.onError?.('start-failed', this.getErrorMessage('default', this.currentLanguage));
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

  public abort() {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.abort();
      } catch (e) {}
      this.isListeningActive = false;
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
