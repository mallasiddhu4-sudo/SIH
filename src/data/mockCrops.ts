import { Crop } from '../types';

export const MOCK_CROPS: Crop[] = [
  {
    id: 'paddy_common',
    name: 'Paddy (Common / Grade-A)',
    nativeNames: {
      en: 'Paddy (Grade-A)',
      te: 'వరి ధాన్యం (గ్రేడ్-ఎ)',
      hi: 'धान (ग्रेड-ए)',
      ta: 'நெல் (கிரேடு-ஏ)',
      kn: 'ಭತ್ತ (ಗ್ರೇಡ್-ಎ)'
    },
    mspPerQuintal: 2320,
    icon: '🌾',
    faqMoistureMax: 17
  },
  {
    id: 'cotton_long',
    name: 'Cotton (Long Staple)',
    nativeNames: {
      en: 'Cotton (Kapas)',
      te: 'పత్తి (పత్తి కాయలు)',
      hi: 'कपास (कपास)',
      ta: 'பருத்தி',
      kn: 'ಹತ್ತಿ'
    },
    mspPerQuintal: 7521,
    icon: '☁️',
    faqMoistureMax: 12
  },
  {
    id: 'maize',
    name: 'Maize (Corn)',
    nativeNames: {
      en: 'Maize / Corn',
      te: 'మొక్కజొన్న',
      hi: 'मक्का',
      ta: 'மக்காச்சோளம்',
      kn: 'ಮೆಕ್ಕೆಜೋಳ'
    },
    mspPerQuintal: 2225,
    icon: '🌽',
    faqMoistureMax: 14
  },
  {
    id: 'groundnut',
    name: 'Groundnut (in Pod)',
    nativeNames: {
      en: 'Groundnut (Pods)',
      te: 'వేరుశనగ కాయలు',
      hi: 'मूंगफली',
      ta: 'நிலக்கடலை',
      kn: 'ಕಡಲೆಕಾಯಿ'
    },
    mspPerQuintal: 6783,
    icon: '🥜',
    faqMoistureMax: 9
  },
  {
    id: 'wheat',
    name: 'Wheat (Common)',
    nativeNames: {
      en: 'Wheat (Gehun)',
      te: 'గోధుమలు',
      hi: 'गेहूं',
      ta: 'கோதுமை',
      kn: 'ಗೋಧಿ'
    },
    mspPerQuintal: 2425,
    icon: '🌱',
    faqMoistureMax: 12
  }
];
