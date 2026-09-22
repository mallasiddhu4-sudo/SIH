import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, LanguageInfo } from '../types';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../locales/languages';
import { translations, getNestedTranslation } from '../locales';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string) => string;
  languages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
  hasSelectedLanguage: boolean;
  clearLanguageSelection: () => void;
}

const STORAGE_KEY = 'farmer_portal_lang_selection';
const SESSION_FLAG_KEY = 'farmer_portal_lang_session_active';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved as LanguageCode;
    }
    return DEFAULT_LANGUAGE;
  });

  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(() => {
    // Only true if user already selected/confirmed language in the current browser session
    return sessionStorage.getItem(SESSION_FLAG_KEY) === 'true';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    setHasSelectedLanguage(true);
    localStorage.setItem(STORAGE_KEY, lang);
    sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
    document.documentElement.lang = lang;
  };

  const clearLanguageSelection = () => {
    sessionStorage.removeItem(SESSION_FLAG_KEY);
    setHasSelectedLanguage(false);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (path: string): string => {
    const activeDict = translations[language] || translations[DEFAULT_LANGUAGE];
    const translated = getNestedTranslation(activeDict, path);
    if (translated === path && language !== 'en') {
      // Fallback to English dictionary if key is missing in target language
      return getNestedTranslation(translations.en, path);
    }
    return translated;
  };

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageInfo,
        hasSelectedLanguage,
        clearLanguageSelection
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
