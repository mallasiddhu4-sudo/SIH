import { LanguageCode } from '../types';
import en from './en.json';
import te from './te.json';
import hi from './hi.json';
import ta from './ta.json';
import kn from './kn.json';

export const translations: Record<LanguageCode, any> = {
  en,
  te,
  hi,
  ta,
  kn
};

export const getNestedTranslation = (obj: any, path: string): string => {
  if (!obj || !path) return path;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
};

export * from './languages';
