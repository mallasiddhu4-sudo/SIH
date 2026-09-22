import { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../locales/languages';

class VoiceService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length > 0) {
        this.voicesLoaded = true;
      }
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.voicesLoaded) {
      this.loadVoices();
    }
    return this.voices;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public speak(
    text: string,
    languageCode: LanguageCode,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      rate?: number;
    }
  ) {
    if (!this.isSupported() || !text || text.trim() === '') {
      options?.onEnd?.();
      return;
    }

    // Cancel ongoing speech
    this.stop();

    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    const targetLocale = langInfo?.speechLocale || 'en-IN';

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Set voice properties
    utterance.lang = targetLocale;
    utterance.rate = options?.rate || 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Find best matching voice
    const voices = this.getAvailableVoices();
    if (voices.length > 0) {
      // 1. Exact match e.g. 'te-IN'
      let matchingVoice = voices.find(v => v.lang.toLowerCase() === targetLocale.toLowerCase());
      
      // 2. Language prefix match e.g. 'te'
      if (!matchingVoice) {
        matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(languageCode));
      }

      // 3. Indian English fallback if regional Indian language voice not locally installed
      if (!matchingVoice) {
        matchingVoice = voices.find(v => v.lang.toLowerCase().includes('in'));
      }

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      console.warn('Speech synthesis notice:', e);
      options?.onEnd?.();
      options?.onError?.(e);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis execution failed:', e);
      options?.onEnd?.();
    }
  }
}

export const voiceService = new VoiceService();
