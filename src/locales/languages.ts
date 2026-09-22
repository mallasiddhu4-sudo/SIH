import { LanguageCode, LanguageInfo } from '../types';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'te',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    greeting: 'నమస్కారం, రైతు ధాన్యం సేకరణ పోర్టల్‌కు స్వాగతం.',
    speechLocale: 'te-IN',
    subtext: 'సులభమైన పంట సేకరణ'
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    greeting: 'Welcome to Farmer Procurement Portal.',
    speechLocale: 'en-IN',
    subtext: 'Simple crop procurement'
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    greeting: 'नमस्ते, किसान खरीद पोर्टल में आपका स्वागत है।',
    speechLocale: 'hi-IN',
    subtext: 'किसानों के लिए आसान फसल खरीद'
  },
  {
    code: 'ta',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    greeting: 'வணக்கம், விவசாயிகள் கொள்முதல் போர்ட்டலுக்கு வரவேற்கிறோம்.',
    speechLocale: 'ta-IN',
    subtext: 'எளிய பயிர் கொள்முதல்'
  },
  {
    code: 'kn',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    greeting: 'ನಮಸ್ಕಾರ, ರೈತ ಖರೀದಿ ಪೋರ್ಟಲ್‌ಗೆ ಸುಸ್ವಾಗತ.',
    speechLocale: 'kn-IN',
    subtext: 'ಸರಳ ಬೆಳೆ ಖರೀದಿ'
  }
];

export const DEFAULT_LANGUAGE: LanguageCode = 'te';
