import { LanguageCode } from '../types';

export interface AiIntentResponse {
  intent: string;
  entities: { crop?: string; quantity?: string; centre?: string; date?: string; time?: string; token?: string; };
  language: string;
  responseText: string;
  confidence: number;
  needsClarification: boolean;
}

export interface IntentResult {
  intent: string;
  route?: string;
  guidanceSelector?: string;
  spokenResponses: Record<LanguageCode, string>;
  action?: 'OPEN_RESCHEDULE' | 'OPEN_CANCEL' | 'NONE';
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  cropMentioned?: string | null;
  fieldHint?: 'centre' | 'date' | 'time';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONCEPT & ENTITY DICTIONARIES (5 LANGUAGES)
// ─────────────────────────────────────────────────────────────────────────────

const CONCEPTS = {
  ACTION_BOOK: ['book', 'reserve', 'schedule', 'buk', 'padivu'],
  ACTION_CHANGE: ['change', 'modify', 'move', 'shift', 'march', 'badal', 'maatru', 'maath', 'badalis', 'vere'],
  ACTION_CANCEL: ['cancel', 'remove', 'rathu', 'radd', 'cancle'],
  ACTION_SHOW: ['show', 'display', 'open', 'chupinch', 'choopinch', 'dikha', 'kaatu', 'toris', 'cheppu', 'batao', 'tell'],
  ACTION_GO: ['go', 'leave', 'travel', 'vell', 'ja', 'pog', 'hog', 'raval'],
  TIME_NOW: ['now', 'ippud', 'abhi', 'ippodh', 'ippov', 'ig'],
  TIME_WHEN: ['when', 'eppud', 'epud', 'kab', 'eppo', 'yavag'],
  LOC_WHERE: ['where', 'which', 'ekkad', 'ekad', 'kahan', 'kaun', 'enge', 'enth', 'elli', 'yav'],
  SLOT: ['slot', 'booking', 'appointment', 'time', 'samay', 'neram', 'tedi', 'date', 'roju', 'din'],
  CENTRE: ['centre', 'center', 'kendra', 'maiyam'],
  TOKEN: ['token', 'number', 'sankhya', 'enn'],
  QUEUE: ['queue', 'line', 'mandi', 'log', 'per', 'jana', 'ahead', 'mundu', 'aage', 'mun', 'munde'],
  STATUS: ['status', 'sthithi', 'nilai', 'stithi', 'position']
};

const CROPS = {
  paddy: ['paddy', 'rice', 'vari', 'paddi', 'dhan', 'nel', 'akki', 'పడ్డీ', 'వరి'],
  cotton: ['cotton', 'patti', 'kapas', 'paruthi', 'hatti', 'పత్తి'],
  maize: ['maize', 'corn', 'mokka jonna', 'maka', 'makka', 'makkajola', 'jola', 'మొక్కజొన్న'],
  groundnut: ['groundnut', 'peanut', 'verusanaga', 'pallelu', 'moongfali', 'verkadalai', 'kadalekai', 'వేరుశనగ'],
  wheat: ['wheat', 'goduma', 'gehu', 'godhumai', 'godhi', 'గోధుమ']
};

const NUMBERS: Record<number, string[]> = {
  1: ['one', 'oka', 'okati', 'ek', 'onru', 'ondu'],
  2: ['two', 'rendu', 'iddaru', 'do', 'dono', 'both', 'irandu', 'eradu', 'erad'],
  3: ['three', 'moodu', 'teen', 'moondru', 'muru']
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. NORMALIZATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function normalizeQuery(raw: string) {
  let q = raw.toLowerCase().replace(/[?,.!।:;'"()\-]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Telugu romanized mapping
  q = q.replace(/\b(eppudu|epudu|epdu)\b/g, 'eppud');
  q = q.replace(/\b(ippudu|ipudu|ippude)\b/g, 'ippud');
  q = q.replace(/\b(ekkada|ekada|ekkadiki)\b/g, 'ekkad');
  q = q.replace(/\b(vellacha|vellala|vellali|vellocchu|velacha)\b/g, 'vell');
  q = q.replace(/\b(marchali|marchu|maarchali|marchandi)\b/g, 'march');
  q = q.replace(/\b(cheyali|cheyyali|cheyi|cheyyi)\b/g, 'chey');
  q = q.replace(/\b(chupinchu|choopinchu|chuupinchu)\b/g, 'chupinch');
  
  // Hindi romanized
  q = q.replace(/\b(badalna|badlo|badal)\b/g, 'badal');
  q = q.replace(/\b(dikhao|dikhau)\b/g, 'dikha');
  q = q.replace(/\b(jana|jaun|jaunga|ja)\b/g, 'ja');
  q = q.replace(/\b(kaunse|konsa)\b/g, 'kaun');
  
  // Tamil romanized
  q = q.replace(/\b(pogalama|poganum|poga)\b/g, 'pog');
  q = q.replace(/\b(maathanum|maatru)\b/g, 'maath');
  q = q.replace(/\b(rendu|irandu)\b/g, 'rendu');
  
  // Kannada romanized
  q = q.replace(/\b(hogabahuda|hogabeku|hogu)\b/g, 'hog');
  q = q.replace(/\b(badalisabeku|badalisi)\b/g, 'badalis');
  q = q.replace(/\b(torisi)\b/g, 'toris');
  q = q.replace(/\b(eradu|erad)\b/g, 'erad');
  
  return q;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ENTITY EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractEntities(q: string) {
  let cropMentioned: string | null = null;
  let fieldHint: 'centre' | 'date' | 'time' | undefined = undefined;
  let count: number | undefined = undefined;

  for (const [crop, words] of Object.entries(CROPS)) {
    if (words.some(w => q.includes(w))) { cropMentioned = crop; break; }
  }
  
  if (q.includes('centre') || q.includes('center') || q.includes('kendra') || q.includes('maiyam') || q.includes('సెంటర్') || q.includes('केंद्र') || q.includes('மையம்') || q.includes('ಕೇಂದ್ರ')) fieldHint = 'centre';
  else if (q.includes('date') || q.includes('tedi') || q.includes('din') || q.includes('roju') || q.includes('repu') || q.includes('naal') || q.includes('తేదీ') || q.includes('రేపు')) fieldHint = 'date';
  else if (q.includes('time') || q.includes('samay') || q.includes('neram') || q.includes('సమయం') || q.includes('நேரம்') || q.includes('ಸಮಯ')) fieldHint = 'time';

  for (const numStr in NUMBERS) {
    if (NUMBERS[numStr].some(w => q.includes(w))) { count = parseInt(numStr, 10); break; }
  }

  return { cropMentioned, fieldHint, count };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONCEPT MATCHING
// ─────────────────────────────────────────────────────────────────────────────

function checkConcepts(q: string) {
  // Use regex with word boundaries to prevent "reschedule" matching "schedule"
  const has = (key: keyof typeof CONCEPTS) => CONCEPTS[key].some(word => {
    // If it's a non-English script, boundary might not work as expected, but for 'schedule' vs 'reschedule' it's English.
    return new RegExp(`(?:^|\\W)${word}(?:\\W|$)`, 'i').test(q);
  });
  
  return {
    isBook: has('ACTION_BOOK'),
    isChange: has('ACTION_CHANGE') || q.includes('reschedule') || q.includes('రీషెడ్యూల్') || q.includes('रीशेड्यूल'),
    isCancel: has('ACTION_CANCEL'),
    isShow: has('ACTION_SHOW'),
    isGo: has('ACTION_GO'),
    isTimeNow: has('TIME_NOW'),
    isTimeWhen: has('TIME_WHEN'),
    isLocWhere: has('LOC_WHERE'),
    isSlot: has('SLOT'),
    isCentre: has('CENTRE'),
    isToken: has('TOKEN'),
    isQueue: has('QUEUE'),
    isStatus: has('STATUS')
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. INTENT DETECTION & MAPPING
// ─────────────────────────────────────────────────────────────────────────────

export function matchGenieIntent(
  rawQuery: string,
  currentRoute: string = '/',
  tokenDisplay: string = 'A127'
): IntentResult {
  const query = normalizeQuery(rawQuery);
  const entities = extractEntities(query);
  const c = checkConcepts(query);
  
  let intent = 'UNKNOWN';
  let confidence: 'HIGH'|'MEDIUM'|'LOW' = 'LOW';

  // 1. ARRIVAL_DECISION (Should I go now? When should I go?)
  // Covers: ippudu vellacha, nenu eppudu vellali, should i go, abhi jana chahiye, eppo poganum, iga hogabahuda
  if (c.isGo && (c.isTimeNow || c.isTimeWhen || query.includes('should i') || query.includes('can i') || query.includes('వెళ్లచ్చా') || query.includes('వెళ్లాలా') || query.includes('వెళ్లాలి') || query.includes('जाना चाहिए') || query.includes('போகலாமா') || query.includes('ಹೋಗಬಹುದಾ'))) {
    intent = 'ARRIVAL_DECISION';
    confidence = 'HIGH';
  }
  // 2. WHERE_SHOULD_I_GO
  else if (c.isGo && (c.isLocWhere || query.includes('ఎక్కడికి') || query.includes('ఏ సెంటర్') || query.includes('कौन से'))) {
    intent = 'WHERE_SHOULD_I_GO';
    confidence = 'HIGH';
  }
  // 3. CANCEL_MULTIPLE_APPOINTMENTS & CANCEL_APPOINTMENT
  else if (c.isCancel || query.includes('रद्द') || query.includes('ரத்து') || query.includes('ರದ್ದು')) {
    if (entities.count === 2 || query.includes('all') || query.includes('both') || query.includes('dono') || query.includes('రెండు')) {
      intent = 'CANCEL_MULTIPLE_APPOINTMENTS';
    } else {
      intent = 'CANCEL_APPOINTMENT';
    }
    confidence = 'HIGH';
  }
  // 4. SHOW MULTI_CROP_PLAN
  else if ((c.isShow || query.includes('చూపించు') || query.includes('दिखाओ')) && (entities.count === 2 || query.includes('both') || query.includes('dono') || query.includes('రెండు'))) {
    intent = 'SHOW_MY_PROCUREMENT_PLAN';
    confidence = 'HIGH';
  }
  // 5. CHANGE / RESCHEDULE
  else if (c.isChange || query.includes('మార్చు') || query.includes('మార్చాలి') || query.includes('बदलना') || query.includes('மாற்று') || query.includes('ಬದಲಿಸು')) {
    intent = 'RESCHEDULE';
    if (entities.fieldHint === 'centre') intent = 'CHANGE_CENTRE';
    if (entities.fieldHint === 'date') intent = 'CHANGE_DATE';
    if (entities.fieldHint === 'time') intent = 'CHANGE_TIME';
    confidence = 'HIGH';
  }
  // 6. BOOK
  else if (c.isBook || query.includes('బుక్')) {
    intent = 'BOOK_SLOT';
    confidence = 'HIGH';
  }
  // 7. SHOW STATUS (Token, Queue, Procurement, Crop)
  else if (c.isShow || query.includes('చూపించు') || query.includes('दिखाओ') || query.includes('காட்டு') || query.includes('ತೋರಿಸಿ') || query.includes('cheppu') || query.includes('batao') || query.includes('tell')) {
    if (c.isToken || query.includes('టోకెన్') || query.includes('टोकन')) intent = 'SHOW_TOKEN';
    else if (c.isQueue || query.includes('క్యూ') || query.includes('ముందు') || query.includes('munde') || query.includes('mun')) intent = 'SHOW_QUEUE';
    else if (query.includes('payment') || query.includes('dabbulu') || query.includes('paisalu') || query.includes('paise')) intent = 'SHOW_PAYMENT_STATUS';
    else if (c.isStatus) intent = 'SHOW_PROCUREMENT_STATUS';
    else if (query.includes('crop') || query.includes('panta') || query.includes('fasal') || query.includes('పంట')) intent = 'SHOW_CROP_INFO';
    else if (entities.cropMentioned || c.isSlot) intent = 'SHOW_APPOINTMENT';
    confidence = 'HIGH';
  }

  // Fallbacks for short ambiguous queries
  if (intent === 'UNKNOWN') {
    if (c.isQueue || query.includes('ahead') || query.includes('mandi') || query.includes('log')) {
      intent = 'SHOW_QUEUE';
      confidence = 'MEDIUM';
    } else if (c.isToken) {
      intent = 'SHOW_TOKEN';
      confidence = 'MEDIUM';
    } else if (c.isSlot) {
      intent = 'SHOW_APPOINTMENT';
      confidence = 'MEDIUM';
    } else if (c.isCentre) {
      intent = 'WHERE_SHOULD_I_GO';
      confidence = 'MEDIUM';
    }
  }

  return mapIntentToResult(intent, entities, confidence);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MAP INTENT TO UI ACTIONS & SPOKEN RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

function mapIntentToResult(intent: string, entities: any, confidence: string): IntentResult {
  let route = '/';
  let guidanceSelector = '';
  let action: 'OPEN_RESCHEDULE' | 'OPEN_CANCEL' | 'NONE' = 'NONE';
  let spokenResponses: Record<LanguageCode, string> = {
    en: 'I am here to help.',
    te: 'నేను మీకు సహాయం చేస్తాను.',
    hi: 'मैं आपकी मदद के लिए यहाँ हूँ।',
    ta: 'நான் உங்களுக்கு உதவ இருக்கிறேன்.',
    kn: 'ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ.'
  };

  const cropName = entities.cropMentioned 
    ? entities.cropMentioned.charAt(0).toUpperCase() + entities.cropMentioned.slice(1) 
    : '';

  switch (intent) {
    case 'ARRIVAL_DECISION':
    case 'GO_NOW':
    case 'WAIT':
      route = '/farmer/pre-arrival';
      guidanceSelector = '#pre-arrival-decision';
      spokenResponses = {
        en: 'Checking if you should go to the centre now...',
        te: 'ఇప్పుడు సెంటర్ కి వెళ్లచ్చా లేదా అని చెక్ చేస్తున్నాను...',
        hi: 'जाँच कर रहे हैं कि क्या आपको अभी केंद्र जाना चाहिए...',
        ta: 'நீங்கள் இப்போது மையத்திற்குச் செல்ல வேண்டுமா என்று சரிபார்க்கிறோம்...',
        kn: 'ನೀವು ಈಗ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಬೇಕೇ ಎಂದು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇವೆ...'
      };
      break;
      
    case 'WHERE_SHOULD_I_GO':
      route = '/farmer/book-slot';
      guidanceSelector = '#select-centre-section';
      spokenResponses = {
        en: 'Let me show you the recommended procurement centres.',
        te: 'మీకు అనుకూలమైన కొనుగోలు కేంద్రాలను చూపిస్తున్నాను.',
        hi: 'मैं आपको अनुशंसित खरीद केंद्र दिखाता हूँ।',
        ta: 'பரிந்துரைக்கப்பட்ட கொள்முதல் மையங்களை உங்களுக்குக் காட்டுகிறேன்.',
        kn: 'ನಾನು ನಿಮಗೆ ಶಿಫಾರಸು ಮಾಡಿದ ಖರೀದಿ ಕೇಂದ್ರಗಳನ್ನು ತೋರಿಸುತ್ತೇನೆ.'
      };
      break;

    case 'BOOK_SLOT':
      route = '/farmer/book-slot';
      spokenResponses = {
        en: 'Opening the slot booking page.',
        te: 'స్లాట్ బుకింగ్ పేజీని తెరుస్తున్నాను.',
        hi: 'स्लॉट बुकिंग पृष्ठ खोल रहे हैं।',
        ta: 'ஸ்லாட் முன்பதிவு பக்கத்தை திறக்கிறது.',
        kn: 'ಸ್ಲಾಟ್ ಬುಕಿಂಗ್ ಪುಟವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.'
      };
      break;

    case 'CHANGE_CENTRE':
    case 'CHANGE_DATE':
    case 'CHANGE_TIME':
    case 'RESCHEDULE':
      route = '/farmer/manage-slot';
      action = 'OPEN_RESCHEDULE';
      if (entities.cropMentioned) {
        guidanceSelector = `#crop-card-${entities.cropMentioned}_common`;
      }
      spokenResponses = {
        en: `Opening the ${cropName} reschedule window. You can change your slot here.`,
        te: `${cropName} స్లాట్ మార్చుకునే విండోని తెరుస్తున్నాను. ఇక్కడ మీరు మార్పులు చేయవచ్చు.`,
        hi: `${cropName} स्लॉट बदलने की विंडो खोल रहे हैं।`,
        ta: `${cropName} சந்திப்பு திருத்தியை திறக்கிறோம்.`,
        kn: `${cropName} ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಎಡಿಟರ್ ತೆರೆಯುತ್ತಿದ್ದೇವೆ.`
      };
      break;

    case 'CANCEL_APPOINTMENT':
      route = '/farmer/manage-slot';
      action = 'OPEN_CANCEL';
      spokenResponses = {
        en: `Opening the cancellation window for ${cropName || 'your slot'}.`,
        te: `${cropName || 'మీ స్లాట్'} క్యాన్సిల్ చేయడానికి విండోని తెరుస్తున్నాను.`,
        hi: `${cropName || 'आपका स्लॉट'} रद्द करने की विंडो खोल रहे हैं।`,
        ta: `${cropName || 'உங்கள் ஸ்லாட்'} ரத்து விண்டோ திறக்கிறது.`,
        kn: `${cropName || 'ನಿಮ್ಮ ಸ್ಲಾಟ್'} ರದ್ದತಿ ವಿಂಡೋ ತೆರೆಯುತ್ತಿದೆ.`
      };
      break;
      
    case 'CANCEL_MULTIPLE_APPOINTMENTS':
      route = '/farmer/manage-slot';
      spokenResponses = {
        en: 'You want to cancel multiple slots. Please select each slot and cancel it.',
        te: 'మీరు రెండు స్లాట్లు క్యాన్సిల్ చేయాలనుకుంటున్నారు. దయచేసి నిర్ధారించండి.',
        hi: 'आप कई स्लॉट रद्द करना चाहते हैं। कृपया पुष्टि करें।',
        ta: 'நீங்கள் பல ஸ்லாட்டுகளை ரத்து செய்ய விரும்புகிறீர்கள்.',
        kn: 'ನೀವು ಬಹು ಸ್ಲಾಟ್ಗಳನ್ನು ರದ್ದುಗೊಳಿಸಲು ಬಯಸುತ್ತೀರಿ.'
      };
      break;

    case 'SHOW_APPOINTMENT':
    case 'SHOW_MY_PROCUREMENT_PLAN':
      route = '/farmer/my-plan';
      spokenResponses = {
        en: `Showing your ${cropName ? cropName + ' ' : ''}procurement plan.`,
        te: `మీ ${cropName ? cropName + ' ' : ''}మల్టీ-క్రాప్ ప్లాన్ చూపిస్తున్నాను.`,
        hi: `आपका ${cropName ? cropName + ' ' : ''}मल्टी-क्रॉप प्लान दिखा रहे हैं।`,
        ta: `உங்கள் ${cropName ? cropName + ' ' : ''}திட்டத்தை காட்டுகிறோம்.`,
        kn: `ನಿಮ್ಮ ${cropName ? cropName + ' ' : ''}ಯೋಜನೆಯನ್ನು ತೋರಿಸುತ್ತಿದ್ದೇವೆ.`
      };
      break;

    case 'SHOW_QUEUE':
      route = '/farmer/queue';
      spokenResponses = {
        en: 'Showing your live queue status and how many people are ahead of you.',
        te: 'మీ లైవ్ క్యూ స్థితి చూపిస్తున్నాను. మీ ముందు ఎంత మంది ఉన్నారో తెలుసుకోండి.',
        hi: 'आपकी लाइव कतार स्थिति दिखा रहे हैं।',
        ta: 'உங்கள் நேரடி வரிசை நிலையை காட்டுகிறோம்.',
        kn: 'ನಿಮ್ಮ ಲೈವ್ ಕ್ಯೂ ಸ್ಥಿತಿಯನ್ನು ತೋರಿಸುತ್ತಿದ್ದೇವೆ.'
      };
      break;

    case 'SHOW_TOKEN':
      route = '/farmer/queue';
      spokenResponses = {
        en: 'Showing your token details.',
        te: 'మీ టోకెన్ వివరాలు చూపిస్తున్నాను.',
        hi: 'आपका टोकन दिखा रहे हैं।',
        ta: 'உங்கள் டோக்கனை காட்டுகிறோம்.',
        kn: 'ನಿಮ್ಮ ಟೋಕನ್ ತೋರಿಸುತ್ತಿದ್ದೇವೆ.'
      };
      break;

    case 'SHOW_PROCUREMENT_STATUS':
      route = '/farmer/procurement';
      spokenResponses = {
        en: 'Showing your procurement and weighing status.',
        te: 'మీ కొనుగోలు మరియు తూకం స్థితి చూపిస్తున్నాను.',
        hi: 'आपकी खरीद स्थिति दिखा रहे हैं।',
        ta: 'உங்கள் கொள்முதல் நிலையை காட்டுகிறோம்.',
        kn: 'ನಿಮ್ಮ ಖರೀದಿ ಸ್ಥಿತಿಯನ್ನು ತೋರಿಸುತ್ತಿದ್ದೇವೆ.'
      };
      break;

    case 'SHOW_PAYMENT_STATUS':
      route = '/farmer/procurement';
      spokenResponses = {
        en: 'Showing your payment and DBT transfer status.',
        te: 'మీ డబ్బులు మరియు బ్యాంకు బదిలీ వివరాలు చూపిస్తున్నాను.',
        hi: 'आपका भुगतान स्थिति दिखा रहे हैं।',
        ta: 'உங்கள் கட்டண நிலையை காட்டுகிறோம்.',
        kn: 'ನಿಮ್ಮ ಪಾವತಿ ಸ್ಥಿತಿಯನ್ನು ತೋರಿಸುತ್ತಿದ್ದೇವೆ.'
      };
      break;
      
    case 'SHOW_CROP_INFO':
      route = '/farmer/crop-info';
      spokenResponses = {
        en: `Showing information about ${cropName || 'your crops'}.`,
        te: `${cropName || 'మీ పంట'} గురించి సమాచారం చూపిస్తున్నాను.`,
        hi: `${cropName || 'आपकी फसल'} की जानकारी दिखा रहे हैं।`,
        ta: `${cropName || 'உங்கள் பயிர்'} பற்றிய தகவல்.`,
        kn: `${cropName || 'ನಿಮ್ಮ ಬೆಳೆ'} ಮಾಹಿತಿಯನ್ನು ತೋರಿಸುತ್ತಿದ್ದೇವೆ.`
      };
      break;

    default:
      route = '/farmer/dashboard';
      spokenResponses = {
        en: 'I am here to guide you. You can ask about slot booking, token, queue, payment, or say "can I go now?"',
        te: 'నాకు పూర్తిగా అర్థం కాలేదు. స్లాట్, టోకెన్, క్యూ లేదా పేమెంట్ గురించి అడగండి. లేదా "ఇప్పుడు వెళ్లచ్చా?" అని అడగండి.',
        hi: 'मुझे पूरी तरह समझ नहीं आया। स्लॉट, टोकन, कतार या भुगतान के बारे में पूछें।',
        ta: 'என்னால் முழுவதும் புரியவில்லை. ஸ்லாட், டோக்கன், வரிசை அல்லது கட்டணம் பற்றி கேட்கலாம்.',
        kn: 'ನನಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ಸ್ಲಾಟ್, ಟೋಕನ್, ಸರದಿ ಅಥವಾ ಪಾವತಿಯ ಬಗ್ಗೆ ಕೇಳಬಹುದು.'
      };
  }

  return {
    intent,
    route,
    guidanceSelector,
    spokenResponses,
    action: action,
    confidence: confidence as 'HIGH' | 'MEDIUM' | 'LOW',
    cropMentioned: entities.cropMentioned,
    fieldHint: entities.fieldHint
  };
}

export async function getAiGenieIntent(
  query: string,
  language: string,
  currentRoute: string = '/',
  currentContext: any = {}
): Promise<IntentResult | null> {
  try {
    const res = await fetch('/.netlify/functions/genie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, language, currentPage: currentRoute, currentContext })
    });
    
    if (res.ok) {
      const data = await res.json();
      return {
        intent: data.intent,
        route: '', // To be determined by the task engine
        spokenResponses: {
          en: data.responseText,
          te: data.responseText,
          hi: data.responseText,
          ta: data.responseText,
          kn: data.responseText
        },
        action: 'NONE',
        confidence: data.confidence > 0.7 ? 'HIGH' : 'MEDIUM',
        cropMentioned: data.entities?.crop,
        fieldHint: undefined,
        // Also attach the raw entities for the task engine
        _rawEntities: data.entities,
        _needsClarification: data.needsClarification
      } as IntentResult & { _rawEntities?: any, _needsClarification?: boolean };
    }
  } catch (err) {
    console.error("AI Genie Intent failed, using fallback:", err);
  }
  
  return matchGenieIntent(query, currentRoute);
}
