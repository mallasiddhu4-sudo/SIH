import { LanguageCode } from '../types';

export interface IntentResult {
  intent: string;
  route?: string;
  guidanceSelector?: string;
  spokenResponses: Record<LanguageCode, string>;
  action?: 'OPEN_RESCHEDULE' | 'OPEN_CANCEL' | 'NONE';
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Multi-crop appointment editing extras */
  cropMentioned?: string | null;
  fieldHint?: 'centre' | 'date' | 'time';
}

// ─── Normalization Utilities ─────────────────────────────────────────────────────

/**
 * Normalize common Romanized Telugu patterns to a canonical form.
 * Handles typos, short forms, and variation in transliteration.
 */
function normalizeRomanizedTelugu(text: string): string {
  return text
    // Common word normalizations
    .replace(/\bekkada\b|\bekkada\b|\bikkada\b|\bekada\b/g, 'ekkada')
    .replace(/\bcheyali\b|\bcheyandi\b|\bcheyyali\b|\bchey\b/g, 'cheyali')
    .replace(/\bvellacha\b|\bvelthacha\b|\bvellachha\b/g, 'vellacha')
    .replace(/\bvellali\b|\bveltali\b|\bvella\b/g, 'vellali')
    .replace(/\beppudu\b|\beppdu\b|\bepudu\b/g, 'eppudu')
    .replace(/\bvastayi\b|\bvastaai\b|\bvastay\b|\bvasthaayi\b/g, 'vastayi')
    .replace(/\bentha\b|\bentho\b|\benthe\b/g, 'entha')
    .replace(/\bmandi\b|\bmandu\b/g, 'mandi')
    .replace(/\bunnaru\b|\bunaru\b|\bunnarru\b/g, 'unnaru')
    .replace(/\bmarchali\b|\bmarali\b|\bmaarchali\b/g, 'marchali')
    .replace(/\bpaddaya\b|\bpadindha\b|\bpadda\b/g, 'paddaya')
    .replace(/\bdabbulu\b|\bdabulu\b|\bdabblu\b/g, 'dabbulu')
    .replace(/\bpaisalu\b|\bpaisalu\b/g, 'paisalu')
    .replace(/\bslot\b|\bsalot\b|\bslott\b/g, 'slot')
    .replace(/\btoken\b|\btokan\b|\btoken\b/g, 'token')
    .replace(/\bcentre\b|\bcenter\b|\bcentar\b/g, 'centre')
    .replace(/\bbooking\b|\bbukking\b|\bbuking\b/g, 'booking')
    .replace(/\bcancel\b|\bcancle\b|\bkancil\b/g, 'cancel')
    .replace(/\breschedule\b|\brischedule\b|\breshcedule\b/g, 'reschedule')
    .replace(/\bpayment\b|\bpaymet\b|\bpeyment\b/g, 'payment')
    .replace(/\bstatus\b|\bstatus\b|\bstaatus\b/g, 'status');
}

/**
 * Main text normalizer — lowercases, strips punctuation, normalizes whitespace,
 * then applies Romanized Telugu normalization.
 */
function normalizeQuery(rawQuery: string): string {
  return normalizeRomanizedTelugu(
    rawQuery
      .toLowerCase()
      .replace(/[?,.!।:;'"()\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Utility helper to match query against an array of keywords or substrings.
 */
function hasAny(query: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    const cleanedPattern = pattern.toLowerCase().trim();
    return query.includes(cleanedPattern);
  });
}

export function matchGenieIntent(
  rawQuery: string,
  currentRoute: string = '/',
  tokenDisplay: string = 'A127'
): IntentResult {
  const query = normalizeQuery(rawQuery);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. LOGIN INTENT
  // Telugu: లాగిన్ ఎక్కడ ఉంది, లాగిన్ చేయాలి, లాగిన్ ఎలా చేయాలి, నేను లాగిన్ అవ్వాలి
  // Romanized: login ekkada undi, login cheyali
  // Hindi: लॉगिन करना है, अकाउंट खोलना है
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'లాగిన్ ఎక్కడ', 'లాగిన్ చేయాలి', 'లాగిన్ ఎలా', 'లాగిన్ అవ్వాలి', 'లాగిన్ కావాలి',
      'అకౌంట్లోకి వెళ్లాలి', 'అకౌంట్ ఓపెన్', 'మొబైల్ నంబర్ ఎక్కడ', 'ఫోన్ నంబర్ ఎక్కడ',
      'పిన్ ఎక్కడ', 'లాగిన్', 'మొబైల్ నంబర్', 'ఫోన్ నంబర్',
      'login ekkada', 'login cheyali', 'login ela', 'login avvali', 'login kavali',
      'account open cheyali', 'na account loki', 'mobile number ekkada', 'pin ekkada',
      'phone number ekkada', 'login karo', 'apna account', 'mobile number kahan',
      'உள்நுழைவு', 'மொபைல் எண்', 'ಲಾಗಿನ್', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      'sign in', 'log in', 'phone number', 'mobile number'
    ])
  ) {
    return {
      intent: 'ENTER_MOBILE_NUMBER',
      route: '/login',
      guidanceSelector: '#mobile-input-container',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Enter your 10-digit mobile number and PIN here to log in.',
        te: 'ఇక్కడ మీ మొబైల్ నంబర్ మరియు పిన్ నమోదు చేసి లాగిన్ చేయండి.',
        hi: 'यहाँ अपना 10 अंकों का मोबाइल नंबर और पिन दर्ज करके लॉगिन करें।',
        ta: 'உங்கள் 10 இலக்க மொபைல் எண் மற்றும் பின்னை உள்ளிட்டு உள்நுழையவும்.',
        kn: 'ಇಲ್ಲಿ ನಿಮ್ಮ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಪಿನ್ ನಮೂದಿಸಿ ಲಾಗಿನ್ ಮಾಡಿ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. REGISTRATION INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'రిజిస్టర్ అవ్వాలి', 'రిజిస్ట్రేషన్ ఎలా', 'రిజిస్ట్రేషన్ చేయాలి', 'నమోదు కావాలి',
      'నమోదు చేయాలి', 'రైతు నమోదు', 'కొత్త అకౌంట్', 'అకౌంట్ ఎలా క్రియేట్', 'కొత్త రైతు',
      'రిజిస్టర్', 'registration cheyali', 'register ela', 'register ekkada',
      'new account create', 'kotha account kavali', 'farmer register', 'namodu cheyali',
      'naya account', 'panjikaran', 'பதிவு செய்ய', 'ಹೊಸ ನೋಂದಣಿ',
      'register', 'create account', 'sign up'
    ])
  ) {
    return {
      intent: 'REGISTER',
      route: '/register',
      guidanceSelector: '#register-form',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Enter your farmer details here to register.',
        te: 'కొత్త రైతు నమోదు కోసం మీ వివరాలు ఇక్కడ నమోదు చేయండి.',
        hi: 'यहाँ नए किसान पंजीकरण के लिए अपना विवरण दर्ज करें।',
        ta: 'புதிய விவசாயி பதிவுக்கு உங்கள் விவரங்களை இங்கே உள்ளிடவும்.',
        kn: 'ಹೊಸ ರೈತರ ನೋಂದಣಿಗಾಗಿ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PRE-ARRIVAL "CAN I GO NOW?" INTENT  ← NEW
  // Telugu: ఇప్పుడు నేను వెళ్లచ్చా, ఇప్పుడు వెళ్లచ్చా, ఇప్పుడు రావచ్చా
  // Romanized: ippudu vellacha, ippudu nenu vellacha, ippudu raavacha
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'ఇప్పుడు వెళ్లచ్చా', 'ఇప్పుడు నేను వెళ్లచ్చా', 'ఇప్పుడు రావచ్చా',
      'ఇప్పుడు సెంటర్కి వెళ్లచ్చా', 'వెళ్లచ్చా', 'రావచ్చా', 'ఇప్పుడు వెళ్లాలా',
      'ippudu vellacha', 'ippudu nenu vellacha', 'ippudu raavacha',
      'centre ki vellacha', 'vellacha', 'should i go', 'can i go now',
      'can i leave now', 'ippudu velali', 'ippudu centre ki',
      'abhi jana chahiye', 'abhi ja sakta hoon', 'ab jaaun kya',
      'ippudu pokaama', 'eppudu pokaama', 'ippo pogalama',
      'ippaga hog beku', 'can i go', 'is it time to go',
      'ready check', 'am i ready', 'should i leave'
    ])
  ) {
    return {
      intent: 'PRE_ARRIVAL_CHECK',
      route: '/farmer/pre-arrival',
      guidanceSelector: '#pre-arrival-decision',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Let me check if it is a good time to go to the centre.',
        te: 'ఇప్పుడు సెంటర్కి వెళ్లడం మంచిదా అని చెప్తాను.',
        hi: 'देखते हैं कि अभी केंद्र जाना सही रहेगा या नहीं।',
        ta: 'இப்போது மையம் செல்வது சரியா என்று சொல்கிறேன்.',
        kn: 'ಈಗ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಲು ಸರಿಯಾದ ಸಮಯವೇ ಎಂದು ಹೇಳುತ್ತೇನೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. WHICH CENTRE INTENT  ← NEW (separate from generic centres)
  // Telugu: ఏ సెంటర్కి వెళ్లాలి, ఏ కేంద్రం, ఏ సెంటర్
  // Romanized: ye centre ki vellali, yedda vellali
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'ఏ సెంటర్కి వెళ్లాలి', 'ఏ కేంద్రానికి వెళ్లాలి', 'ఏ సెంటర్',
      'ఏ కేంద్రం', 'సెంటర్ ఎక్కడికి వెళ్లాలి', 'ఏ సెంటర్కు',
      'ye centre ki vellali', 'ye centre', 'yedda vellali', 'ye kendra',
      'which centre', 'which center to go', 'which procurement centre',
      'konsa kendra', 'konsa centre jana chahiye', 'kaunsa kendra',
      'eng centre poganum', 'cual centro ir', 'yava kendra hogbeku'
    ])
  ) {
    return {
      intent: 'WHICH_CENTRE',
      route: '/farmer/book-slot',
      guidanceSelector: '#select-centre-section',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'I will show you available centres. Centre A is nearest with the shortest wait time.',
        te: 'నేను అందుబాటులో ఉన్న సెంటర్లు చూపిస్తాను. సెంటర్ A దగ్గరలో ఉంది మరియు తక్కువ వేచి ఉండే సమయం ఉంది.',
        hi: 'मैं उपलब्ध केंद्र दिखाता हूँ। केंद्र ए सबसे पास है और कम प्रतीक्षा समय है।',
        ta: 'கிடைக்கும் மையங்களை காட்டுகிறேன். மையம் ஏ அருகாமையில் குறைந்த காத்திருப்பு நேரத்துடன் உள்ளது.',
        kn: 'ಲಭ್ಯವಿರುವ ಕೇಂದ್ರಗಳನ್ನು ತೋರಿಸುತ್ತೇನೆ. ಕೇಂದ್ರ ಎ ಹತ್ತಿರದಲ್ಲಿದ್ದು ಕಡಿಮೆ ಕಾಯುವ ಸಮಯ ಇದೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. MY WEIGHT / QUANTITY INTENT  ← NEW
  // Telugu: నా పంట ఎంత బరువు, నేను ఎంత క్వాంటిటీ ఇచ్చాను
  // Romanized: na panta entha baruvu, na quantity entha
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'నా పంట ఎంత బరువు', 'నా బరువు ఎంత', 'నేను ఎంత క్వాంటిటీ', 'ఎంత క్వాంటిటీ ఇచ్చాను',
      'నా పంట ఎంత', 'తూకం ఏంటి', 'నా తూకం', 'ఎంత కిలోలు', 'ఎంత క్వింటాళ్లు',
      'na panta entha baruvu', 'na baruvu entha', 'na quantity entha',
      'na panta entha', 'tukam enti', 'na tukam', 'entha kgs', 'entha quintals',
      'how much crop', 'my weight', 'my quantity', 'how many quintals',
      'mera wajan', 'kitna wajan', 'kitni fasal', 'fasal kitni',
      'en edai', 'en payir edai', 'nanna bele yeshtu', 'thooka eshtu'
    ])
  ) {
    return {
      intent: 'MY_WEIGHT',
      route: '/farmer/procurement',
      guidanceSelector: '#weighment-metric-box',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Here you can see your booked quantity and the actual weighed quantity recorded by the centre.',
        te: 'ఇక్కడ మీరు బుక్ చేసిన పంట పరిమాణం మరియు కేంద్రం నమోదు చేసిన అసలు తూకం చూడవచ్చు.',
        hi: 'यहाँ आप बुक की गई मात्रा और केंद्र द्वारा दर्ज वास्तविक वजन देख सकते हैं।',
        ta: 'இங்கே முன்பதிவு செய்த அளவையும் மையம் பதிவு செய்த உண்மையான எடையையும் காணலாம்.',
        kn: 'ಇಲ್ಲಿ ನೀವು ಬುಕ್ ಮಾಡಿದ ಪ್ರಮಾಣ ಮತ್ತು ಕೇಂದ್ರ ದಾಖಲಿಸಿದ ನಿಜವಾದ ತೂಕ ನೋಡಬಹುದು.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. CENTRE STATUS INTENT  ← NEW
  // Telugu: సెంటర్ స్థితి, సెంటర్ బిజీగా ఉందా
  // Romanized: centre status, centre busy ga unda
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'సెంటర్ స్థితి', 'సెంటర్ బిజీగా ఉందా', 'సెంటర్ లో ఎంత లోడ్',
      'కేంద్రం స్థితి', 'ఇప్పుడు సెంటర్ ఎలా ఉంది',
      'centre status', 'centre busy ga unda', 'centre lo entha load',
      'centre load', 'centre capacity', 'centre khaali unda',
      'kendra ki sthiti', 'centre jam hai', 'kendra busy hai',
      'maiyam nilai', 'maiyam nirai', 'kendra sthithi enu'
    ])
  ) {
    return {
      intent: 'CENTRE_STATUS',
      route: '/farmer/pre-arrival',
      guidanceSelector: '#centre-load-indicator',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'I will show you the current centre load and queue status.',
        te: 'ఇప్పుడు సెంటర్ లోడ్ మరియు క్యూ స్థితి చూపిస్తాను.',
        hi: 'मैं अभी केंद्र के लोड और प्रतीक्षा स्थिति दिखाता हूँ।',
        ta: 'தற்போதைய மைய சுமை மற்றும் வரிசை நிலையை காட்டுகிறேன்.',
        kn: 'ಈಗಿನ ಕೇಂದ್ರ ಲೋಡ್ ಮತ್ತು ಕ್ಯೂ ಸ್ಥಿತಿ ತೋರಿಸುತ್ತೇನೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. MULTI-CROP PLAN INTENT  ← NEW
  // Telugu: నా రెండు పంటలు, రెండు పంటలు ఎక్కడ ఇవ్వాలి
  // Romanized: rendu pantalu ekkada ivvali, multi crop
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'రెండు పంటలు', 'రెండు రకాల పంటలు', 'మల్టిపుల్ పంటలు', 'పంటల ప్లాన్',
      'rendu pantalu', 'rendu rakala pantalu', 'multiple pantalu', 'panta plan',
      'multi crop', 'multiple crops', 'two crops', 'crop plan',
      'do fasal', 'kai fasal', 'anek fasal', 'do kism ki fasal',
      'rendu payir', 'payir thittam', 'anekaaneka bele', 'multi bele'
    ])
  ) {
    return {
      intent: 'MULTI_CROP_PLAN',
      route: '/farmer/multi-crop',
      guidanceSelector: '#multi-crop-selector',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'I will show you the multi-crop procurement plan for different crops.',
        te: 'వేర్వేరు పంటలకు ప్రొక్యూర్మెంట్ ప్లాన్ చూపిస్తాను.',
        hi: 'मैं आपको अलग-अलग फसलों की खरीद योजना दिखाता हूँ।',
        ta: 'வெவ்வேறு பயிர்களுக்கான கொள்முதல் திட்டம் காட்டுகிறேன்.',
        kn: 'ವಿವಿಧ ಬೆಳೆಗಳ ಖರೀದಿ ಯೋಜನೆ ತೋರಿಸುತ್ತೇನೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. CROP INFO / DIVERSIFICATION INTENT  ← NEW
  // Telugu: ఏ పంట మంచిది, మార్కెట్ ధర, పంట వివరాలు
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'ఏ పంట మంచిది', 'పంట ధర', 'మార్కెట్ ధర', 'ఎంత ధర', 'ఏ పంట వేయాలి',
      'పంట వివరాలు', 'ఎంఎస్పీ ఎంత', 'కనీస మద్దతు ధర',
      'ye panta manchidi', 'panta dhara', 'market dhara', 'msp entha',
      'panta vivharalu', 'crop price', 'msp rate', 'market price',
      'konsi fasal achhi', 'msp kya hai', 'fasal ka bhav',
      'enna payir nallathu', 'msp enna', 'yava bele mele', 'bele dhara'
    ])
  ) {
    return {
      intent: 'CROP_INFO',
      route: '/farmer/crop-info',
      guidanceSelector: '#crop-info-cards',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Here is crop availability and MSP price information.',
        te: 'ఇక్కడ పంట లభ్యత మరియు ఎంఎస్పీ ధర సమాచారం చూడవచ్చు.',
        hi: 'यहाँ फसल उपलब्धता और एमएसपी मूल्य जानकारी है।',
        ta: 'இங்கே பயிர் கிடைக்கும் தன்மை மற்றும் MSP விலை தகவல் உள்ளது.',
        kn: 'ಇಲ್ಲಿ ಬೆಳೆ ಲಭ್ಯತೆ ಮತ್ತು MSP ಬೆಲೆ ಮಾಹಿತಿ ಇದೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. ADMIN / CENTRE OPERATOR DASHBOARD INTENT  ← NEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'ఆపరేటర్ డాష్‌బోర్డ్', 'సెంటర్ ఆపరేటర్', 'అడ్మిన్ కన్సోల్', 'అడ్మిన్ పోర్టల్',
      'operator dashboard', 'centre operator', 'admin console', 'admin portal',
      'admin dashboard', 'centre dashboard', 'operator portal',
      'operator panal', 'kendra operator', 'adhikari',
      'centre management', 'weighment entry', 'actual weight entry'
    ])
  ) {
    return {
      intent: 'CENTRE_OPERATOR',
      route: '/centre/dashboard',
      guidanceSelector: '#centre-operator-panel',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Opening the Centre Operator Dashboard.',
        te: 'సెంటర్ ఆపరేటర్ డాష్‌బోర్డ్ తెరుస్తున్నాను.',
        hi: 'केंद्र ऑपरेटर डैशबोर्ड खोल रहे हैं।',
        ta: 'மைய இயக்குநர் டாஷ்போர்டு திறக்கிறோம்.',
        kn: 'ಕೇಂದ್ರ ಆಪರೇಟರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯುತ್ತಿದ್ದೇವೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. RESCHEDULE INTENT (Check before slot booking for priority)
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'స్లాట్ మార్చాలి', 'తేదీ మార్చాలి', 'సమయం మార్చాలి', 'రీషెడ్యూల్ చేయాలి',
      'ఈరోజు రాలేను', 'మరో రోజుకు మార్చాలి', 'మరో రోజు', 'ఇంకో టైం కావాలి',
      'ఇంకో టైం', 'వేరే రోజు వెళ్లాలి', 'వేరే తేదీ', 'స్లాట్ మార్పు',
      'తేదీ మార్పు', 'తేదీ మార్చు', 'రీషెడ్యూల్',
      'slot reschedule', 'date change', 'time change', 'eeroju raalenu',
      'maro roju kavali', 'maro roju marchali', 'reschedule cheyali',
      'inko time kavali', 'vere roju', 'postpone',
      'tareekh badalna', 'dusre din', 'slot maatru', 'thirumba maatru',
      'dinaankha badalisi', 'reschedule', 'change date', 'change time',
      'slot badlo', 'time badlo'
    ])
  ) {
    return {
      intent: 'RESCHEDULE_SLOT',
      route: '/farmer/manage-slot',
      guidanceSelector: '#reschedule-btn',
      action: 'OPEN_RESCHEDULE',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'You can choose a new date and time for your slot here.',
        te: 'మీ స్లాట్ను మరో తేదీకి లేదా సమయానికి ఇక్కడ మార్చుకోవచ్చు.',
        hi: 'यहाँ आप अपने स्लॉट के लिए नई तारीख और समय चुन सकते हैं।',
        ta: 'உங்கள் ஸ்லாட்டுக்கான புதிய தேதி மற்றும் நேரத்தை இங்கே மாற்றலாம்.',
        kn: 'ಇಲ್ಲಿ ನಿಮ್ಮ ಸ್ಲಾಟ್‌ಗಾಗಿ ಹೊಸ ದಿನಾಂಕ ಮತ್ತು ಸಮಯವನ್ನು ಮರುಹೊಂದಿಸಬಹುದು.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. CANCELLATION INTENT (Check before slot booking for priority)
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'క్యాన్సిల్ చేయాలి', 'రద్దు చేయాలి', 'రావడం కుదరదు', 'రావడం వీలుకాదు',
      'బుకింగ్ తీసేయండి', 'స్లాట్ వద్దు', 'బుకింగ్ రద్దు', 'స్లాట్ క్యాన్సిల్',
      'రద్దు చేయండి', 'రద్దు', 'క్యాన్సిల్',
      'slot cancel cheyali', 'booking cancel cheyali', 'slot vaddu', 'cancel cheyandi',
      'cancel chey', 'raavadam kudaradu', 'booking theeseyandi', 'slot cancel',
      'booking cancel', 'radd karna', 'slot nahi chahiye', 'slot rathu',
      'cancel pannanum', 'slot raddu', 'cancel slot', 'delete booking',
      'slot band karo', 'booking hatao'
    ])
  ) {
    return {
      intent: 'CANCEL_SLOT',
      route: '/farmer/manage-slot',
      guidanceSelector: '#cancel-btn',
      action: 'OPEN_CANCEL',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'You can cancel your booking confirmation here.',
        te: 'మీ బుకింగ్ రద్దు చేయాలనుకుంటే ఇక్కడ రద్దు చేయవచ్చు.',
        hi: 'यदि आप अपनी बुकिंग रद्द करना चाहते हैं तो यहाँ कर सकते हैं।',
        ta: 'உங்கள் பதிவை ரத்து செய்ய விரும்பினால் இங்கே ரத்து செய்யலாம்.',
        kn: 'ನಿಮ್ಮ ಬುಕಿಂಗ್ ಅನ್ನು ರದ್ದುಗೊಳಿಸಲು ಬಯಸಿದರೆ ಇಲ್ಲಿ ರದ್ದುಗೊಳಿಸಬಹುದು.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. PROCUREMENT CENTRES INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'సెంటర్లు ఎక్కడ', 'సెంటర్ ఎక్కడ', 'దగ్గరలో ఉన్న సెంటర్', 'దగ్గరలో సెంటర్',
      'ఏ సెంటర్కు వెళ్లాలి', 'పంట ఎక్కడ ఇవ్వాలి', 'ధాన్యం ఎక్కడ అమ్మాలి',
      'ధాన్యం ఎక్కడ', 'కొనుగోలు కేంద్రం ఎక్కడ', 'కొనుగోలు కేంద్రం',
      'సేకరణ కేంద్రాలు', 'సేకరణ కేంద్రం', 'ప్రొక్యూర్మెంట్ సెంటర్', 'సెంటర్లు',
      'procurement centre ekkada', 'nearest centre chupinchu', 'centre ekkadiki vellali',
      'panta ekkada ivvali', 'dhaanyam ekkada amali', 'centre ekkada', 'nearest centre',
      'konugolu kendram', 'daggara centre', 'kharid kendra kahan', 'paas ka centre',
      'kolmudhal maiyam engu', 'kharidi kendra ellide',
      'procurement centre', 'where is the centre', 'market yard', 'where to sell crop'
    ])
  ) {
    return {
      intent: 'PROCUREMENT_CENTRES',
      route: '/farmer/book-slot',
      guidanceSelector: '#select-centre-section',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Here are the nearest crop procurement centres and wait times.',
        te: 'మీకు దగ్గరలో ఉన్న ధాన్యం కొనుగోలు కేంద్రాల వివరాలు ఇక్కడ చూడండి.',
        hi: 'यहाँ आपके निकटतम फसल खरीद केंद्र और प्रतीक्षा समय हैं।',
        ta: 'உங்கள் அருகிலுள்ள கொள்முதல் மையங்கள் மற்றும் காத்திருப்பு நேரம் இங்கே உள்ளன.',
        kn: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಖರೀದಿ ಕೇಂದ್ರಗಳು ಮತ್ತು ಕಾಯುವ ಸಮಯ ಇಲ್ಲಿದೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. BOOKING / TOKEN INTENT (Check before generic slot booking)
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'టోకెన్ నంబర్ ఏంటి', 'టోకెన్ చూపించు', 'నాకు ఎప్పుడు వెళ్లాలి',
      'నా టోకెన్ ఎంత', 'నా టోకెన్ ఏంటి', 'నా టోకెన్ నంబర్', 'నా టోకెన్',
      'బుకింగ్ ఎక్కడ ఉంది', 'నా బుకింగ్ ఎక్కడ', 'నా బుకింగ్',
      'నా స్లాట్ ఏంటి', 'నా స్లాట్ ఎప్పుడు', 'టోకెన్ కార్డు', 'టోకెన్',
      'my token enti', 'token chupinchu', 'booking ekkada undi', 'na slot eppudu',
      'token number enti', 'na token', 'booking details', 'token kya hai',
      'mera token', 'token enna', 'enna token', 'nanna token',
      'my token', 'show token', 'token number', 'where is my booking', 'my appointment',
      'na procurement status chupinchu', 'na booking chupinchu'
    ])
  ) {
    return {
      intent: 'VIEW_TOKEN',
      route: '/farmer/queue',
      guidanceSelector: '#token-display-card',
      confidence: 'HIGH',
      spokenResponses: {
        en: `Your token number is ${tokenDisplay}. Here are your appointment details.`,
        te: `మీ టోకెన్ నంబర్ ${tokenDisplay}. మీ బుకింగ్ వివరాలు ఇక్కడ చూడండి.`,
        hi: `आपका टोकन नंबर ${tokenDisplay} है। आपकी बुकिंग का विवरण यहाँ है।`,
        ta: `உங்கள் டோக்கன் எண் ${tokenDisplay}. உங்கள் முன்பதிவு விவரங்கள் இங்கே உள்ளன.`,
        kn: `ನಿಮ್ಮ ಟೋಕನ್ ಸಂಖ್ಯೆ ${tokenDisplay}. ನಿಮ್ಮ ಬುಕಿಂಗ್ ವಿವರಗಳು ಇಲ್ಲಿವೆ.`
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. SLOT BOOKING INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'స్లాట్ బుక్ చేయాలి', 'స్లాట్ బుక్ చేయండి', 'స్లాట్ బుకింగ్', 'ఎప్పుడు వెళ్లాలి',
      'తేదీ ఎంచుకోవాలి', 'సమయం ఎంచుకోవాలి', 'పంట ఇవ్వడానికి టైం', 'బుకింగ్ ఎలా చేయాలి',
      'బుకింగ్ చేయాలి', 'కొత్త స్లాట్ కావాలి', 'కొత్త స్లాట్', 'స్లాట్ ఎక్కడ బుక్',
      'బుక్ చేయాలి', 'స్లాట్ బుక్',
      'slot book cheyali', 'time slot kavali', 'slot ekkada book', 'booking ela cheyali',
      'date select cheyali', 'time kavali', 'booking cheyali', 'slot book',
      'slot chahiye', 'slot book karna', 'tareekh chunna', 'slot book pannanum',
      'slot book maadi', 'book slot', 'new booking', 'book appointment',
      'slot lena', 'appoint lena', 'slot booking cheyandi'
    ])
  ) {
    return {
      intent: 'BOOK_SLOT',
      route: '/farmer/book-slot',
      guidanceSelector: '#select-crop-section',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Choose your crop, date, and time window here to book your slot.',
        te: 'ఇక్కడ మీ పంట, తేదీ మరియు సమయం ఎంచుకుని స్లాట్ బుక్ చేయండి.',
        hi: 'यहाँ अपनी फसल, तारीख और समय चुनकर स्लॉट बुक करें।',
        ta: 'உங்கள் பயிர், தேதி மற்றும் நேரத்தைத் தேர்வுசெய்து ஸ்லாட்டைப் பதிவு செய்யவும்.',
        kn: 'ನಿಮ್ಮ ಬೆಳೆ, ದಿನಾಂಕ ಮತ್ತು ಸಮಯವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. PROCUREMENT STATUS / WEIGHMENT / QUALITY INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'పంట పరిస్థితి ఏంటి', 'పంట తీసుకున్నారా', 'ప్రొక్యూర్ అయ్యిందా',
      'ప్రొక్యూర్మెంట్ స్టేటస్', 'కొనుగోలు పూర్తయ్యిందా', 'పంట స్టేటస్',
      'తూకం ఎంత వచ్చింది', 'తూకం ఎంత', 'తేమ శాతం ఎంత', 'తేమ ఎంత',
      'బరువు ఎంత', 'నాణ్యత గ్రేడ్', 'తూకం', 'తేమ', 'బస్తాలు',
      'na crop status enti', 'procurement complete ayyinda', 'na panta teesukunnara',
      'thukam entha', 'thema entha', 'panta status', 'procurement status',
      'weight entha', 'moisture entha', 'fasal ka status', 'vajan kitna hai',
      'nami kitni hai', 'payir nilai enna', 'edai ethanai', 'bele sthiti enu',
      'thooka eshtu', 'weighment', 'moisture', 'quality grade'
    ])
  ) {
    return {
      intent: 'PROCUREMENT_STATUS',
      route: '/farmer/procurement',
      guidanceSelector: '#procurement-metrics',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Here are your crop weighment, moisture level, and quality grade results.',
        te: 'మీ పంట తూకం మరియు నాణ్యత తనిఖీ వివరాలు ఇక్కడ చూడవచ్చు.',
        hi: 'यहाँ आपकी फसल की तौल, नमी और गुणवत्ता का विवरण है।',
        ta: 'உங்கள் பயிர் எடை, ஈரப்பதம் மற்றும் தர விவரங்கள் இங்கே உள்ளன.',
        kn: 'ಇಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆ ತೂಕ, ತೇವಾಂಶ ಮತ್ತು ಗುಣಮಟ್ಟದ ವಿವರಗಳಿವೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. QUEUE / WAITING INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'ముందు ఎంతమంది ఉన్నారు', 'ఎంతమంది ఉన్నారు', 'ఎంత సేపు వేచి ఉండాలి',
      'ఎంత సమయం పడుతుంది', 'నా వంతు ఎప్పుడు', 'నా టర్న్ ఎప్పుడు',
      'క్యూ పొజిషన్ ఎంత', 'క్యూ పొజిషన్', 'ఎంత టైం పడుతుంది',
      'ఇంకా ఎంత సమయం', 'క్యూలో నా నంబర్', 'క్యూ లైన్', 'క్యూ స్థితి', 'క్యూలో',
      'లైవ్ క్యూ', ' క్యూ', 'క్యూ ',
      'na mundu entha mandi', 'entha mandi unnaru', 'waiting time entha', 'na turn eppudu',
      'queue lo entha time', 'queue position entha', 'entha time paduthundi',
      'queue line', 'live queue', 'aage kitne kisan hai', 'kitna intezar karna padega',
      'meri baari kab aayegi', 'munnadi ethanai per', 'kaathirukkum neram',
      'en varisai eppo', 'mundhe eshtu jana iddhaare', 'eshtu samaya kaaybeku',
      'queue status', 'how many farmers ahead', 'waiting time', 'when is my turn',
      'kya mera number aaya', 'mere aage kitne hain'
    ])
  ) {
    return {
      intent: 'QUEUE_STATUS',
      route: '/farmer/queue',
      guidanceSelector: '#queue-metrics',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'There are 4 farmers ahead of you. Your turn will arrive shortly.',
        te: 'మీ ముందు 4 మంది రైతులు ఉన్నారు. మీ వంతు త్వరలో వస్తుంది.',
        hi: 'आपसे आगे 4 किसान हैं। आपकी बारी जल्द ही आएगी।',
        ta: 'உங்களுக்கு முன்னால் 4 விவசாயிகள் உள்ளனர். உங்கள் முறை விரைவில் வரும்.',
        kn: 'ನಿಮ್ಮ ಮುಂದೆ 4 ರೈತರಿದ್ದಾರೆ. ನಿಮ್ಮ ಸರದಿ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 17. PAYMENT / MONEY / DBT INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'డబ్బులు ఎప్పుడు వస్తాయి', 'డబ్బులు ఎప్పుడు', 'పేమెంట్ వచ్చిందా',
      'డబ్బులు ఎక్కడ ఉన్నాయి', 'డబ్బులు ఎక్కడ', 'పేమెంట్ స్టేటస్ ఏంటి',
      'పేమెంట్ స్టేటస్', 'ఎంత డబ్బు వస్తుంది', 'ఎంత డబ్బు', 'పేమెంట్ ఎప్పుడు',
      'ఖాతాలో డబ్బులు పడ్డాయా', 'ఖాతాలో పడ్డాయా', 'డీబీటీ ఎప్పుడు',
      'డీబీటీ స్టేటస్', 'డబ్బులు', 'చెల్లింపు', 'పైసలు', 'బ్యాంక్ ఖాతా',
      'payment vachinda', 'payment eppudu vastundi', 'payment eppudu',
      'na payment status enti', 'payment status', 'amount entha',
      'dabbulu eppudu vastayi', 'dabbulu eppudu', 'account lo paddaya',
      'dbt status enti', 'dbt eppudu', 'dabbulu ekkada', 'paisalu eppudu',
      'paise kab aayenge', 'payment aaya kya', 'khate me paise',
      'panam eppo varum', 'payment vandhucha', 'hana yaavaga baruththe',
      'payment bandhidha', 'when will money come', 'dbt status', 'bank credit',
      'bank lo paddaya', 'rupees eppudu', 'amount eppudu'
    ])
  ) {
    return {
      intent: 'PAYMENT_STATUS',
      route: '/farmer/payment',
      guidanceSelector: '#payment-amount-box',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Here are your Direct Benefit Transfer payment and bank credit details.',
        te: 'మీ పంట చెల్లింపు వివరాలు మరియు బ్యాంక్ జమ స్థితి ఇక్కడ చూడవచ్చు.',
        hi: 'यहाँ आपका डायरेक्ट बेनिफिट ट्रांसफर (DBT) भुगतान और बैंक जमा विवरण है।',
        ta: 'உங்கள் நேரடி வங்கி பண பரிமாற்ற விவரங்கள் இங்கே உள்ளன.',
        kn: 'ಇಲ್ಲಿ ನಿಮ್ಮ ನೇರ ನಗದು ವರ್ಗಾವಣೆ (DBT) ಪಾವತಿ ಮತ್ತು ಬ್ಯಾಂಕ್ ವಿವರಗಳಿವೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 18. HELP / CONTEXTUAL INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'సహాయం కావాలి', 'అర్థం కావడం లేదు', 'అర్థం కాలేదు', 'ఏం చేయాలి',
      'సహాయం చేయండి', 'ఇక్కడ ఏం చేయాలి', 'నాకు తెలియదు', 'ఎలా ఉపయోగించాలి',
      'ఎలా చేయాలి', 'సహాయం', 'హెల్ప్',
      'help kavali', 'naaku ardham kaavatledu', 'ardham kaledu', 'em cheyali',
      'ela use cheyali', 'help cheyandi', 'naaku theliyadu',
      'madad chahiye', 'samajh nahi aa raha', 'kya karna hai',
      'udhavi vendum', 'puriyavillai', 'sahaya beku', 'arthavaaglilla',
      'help me', 'what to do', 'i do not understand', 'how to use',
      'naaku ardam ledu', 'ela cheyali', 'guide me'
    ])
  ) {
    // Return contextual help based on current screen
    if (currentRoute === '/login') {
      return {
        intent: 'CONTEXT_HELP_LOGIN',
        route: '/login',
        guidanceSelector: '#mobile-input-container',
        confidence: 'HIGH',
        spokenResponses: {
          en: 'Enter your 10-digit mobile number and PIN here to log in.',
          te: 'ఇక్కడ మీ మొబైల్ నంబర్ మరియు పిన్ నమోదు చేసి లాగిన్ చేయండి.',
          hi: 'यहाँ अपना मोबाइल नंबर दर्ज करके लॉगिन करें।',
          ta: 'உங்கள் மொபைல் எண்ணை உள்ளிட்டு உள்நுழையவும்.',
          kn: 'ಇಲ್ಲಿ ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ ಲಾಗಿನ್ ಮಾಡಿ.'
        }
      };
    }
    if (currentRoute === '/farmer/queue') {
      return {
        intent: 'CONTEXT_HELP_QUEUE',
        route: '/farmer/queue',
        guidanceSelector: '#queue-metrics',
        confidence: 'HIGH',
        spokenResponses: {
          en: 'Here you can see your live queue token and estimated wait time.',
          te: 'ఇక్కడ లైవ్ క్యూలో మీ టోకెన్ నంబర్ మరియు సమయం చూడవచ్చు.',
          hi: 'यहाँ आप अपना लाइव टोकन और प्रतीक्षा समय देख सकते हैं।',
          ta: 'இங்கே உங்கள் நேரடி டோக்கன் மற்றும் காத்திருப்பு நேரத்தைக் காணலாம்.',
          kn: 'ಇಲ್ಲಿ ನಿಮ್ಮ ಲೈವ್ ಟೋಕನ್ ಮತ್ತು ಕಾಯುವ ಸಮಯವನ್ನು ನೋಡಬಹುದು.'
        }
      };
    }
    if (currentRoute === '/farmer/procurement') {
      return {
        intent: 'CONTEXT_HELP_PROCUREMENT',
        route: '/farmer/procurement',
        guidanceSelector: '#procurement-metrics',
        confidence: 'HIGH',
        spokenResponses: {
          en: 'Here you can check your crop weight and quality inspection results.',
          te: 'ఇక్కడ మీ పంట తూకం మరియు నాణ్యత వివరాలు చూడవచ్చు.',
          hi: 'यहाँ आप अपनी फसल का वजन और गुणवत्ता विवरण देख सकते हैं।',
          ta: 'இங்கே உங்கள் பயிர் எடை மற்றும் தர விவரங்களைக் காணலாம்.',
          kn: 'ಇಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆ ತೂಕ ಮತ್ತು ಗುಣಮಟ್ಟದ ವಿವರಗಳನ್ನು ನೋಡಬಹುದು.'
        }
      };
    }
    if (currentRoute === '/farmer/payment') {
      return {
        intent: 'CONTEXT_HELP_PAYMENT',
        route: '/farmer/payment',
        guidanceSelector: '#payment-amount-box',
        confidence: 'HIGH',
        spokenResponses: {
          en: 'Here you can check your bank payment credit details.',
          te: 'ఇక్కడ మీ బ్యాంక్ ఖాతా జమ వివరాలు చూడవచ్చు.',
          hi: 'यहाँ आप अपने बैंक भुगतान विवरण की जाँच कर सकते हैं।',
          ta: 'இங்கே உங்கள் வங்கி பண வரவு விவரங்களை சரிபார்க்கலாம்.',
          kn: 'ಇಲ್ಲಿ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಪಾವತಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಬಹುದು.'
        }
      };
    }
    if (currentRoute === '/farmer/book-slot') {
      return {
        intent: 'CONTEXT_HELP_BOOK',
        route: '/farmer/book-slot',
        guidanceSelector: '#select-crop-section',
        confidence: 'HIGH',
        spokenResponses: {
          en: 'Choose your crop, date, and time window here to book your slot.',
          te: 'ఇక్కడ మీ పంట, తేదీ మరియు సమయం ఎంచుకుని స్లాట్ బుక్ చేయండి.',
          hi: 'यहाँ फसल, तारीख और समय चुनकर स्लॉट बुक करें।',
          ta: 'இங்கே பயிர், தேதி மற்றும் நேரத்தைத் தேர்வுசெய்து முன்பதிவு செய்யவும்.',
          kn: 'ಇಲ್ಲಿ ಬೆಳೆ, ದಿನಾಂಕ ಮತ್ತು ಸಮಯವನ್ನು ಆರಿಸಿ ಬುಕ್ ಮಾಡಿ.'
        }
      };
    }
    if (currentRoute === '/farmer/pre-arrival') {
      return {
        intent: 'CONTEXT_HELP_PRE_ARRIVAL',
        route: '/farmer/pre-arrival',
        guidanceSelector: '#pre-arrival-decision',
        confidence: 'HIGH',
        spokenResponses: {
          en: 'This page tells you whether it is a good time to go to the centre.',
          te: 'ఈ పేజీ ఇప్పుడు సెంటర్కి వెళ్లడం మంచిదా అని చెప్తుంది.',
          hi: 'यह पेज बताता है कि अभी केंद्र जाना सही रहेगा या नहीं।',
          ta: 'இந்த பக்கம் இப்போது மையம் செல்வது சரியா என்று சொல்லும்.',
          kn: 'ಈ ಪುಟ ಈಗ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಲು ಸರಿಯಾದ ಸಮಯವೇ ಎಂದು ಹೇಳುತ್ತದೆ.'
        }
      };
    }
    // Default dashboard help
    return {
      intent: 'CONTEXT_HELP_DASHBOARD',
      route: '/farmer/dashboard',
      guidanceSelector: '#choice-manage-slot',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Here you can manage your visit, track live queue, or check payment.',
        te: 'ఇక్కడ మీ రాబోయే స్లాట్ చూడవచ్చు, లేదా క్యూ మరియు పేమెంట్ వివరాలు ఎంచుకోవచ్చు.',
        hi: 'यहाँ आप अपना स्लॉट देख सकते हैं, कतार या भुगतान ट्रैक कर सकते हैं।',
        ta: 'இங்கே உங்கள் ஸ்லாட், வரிசை அல்லது கட்டண விவரங்களை பார்க்கலாம்.',
        kn: 'ಇಲ್ಲಿ ನಿಮ್ಮ ಸ್ಲಾಟ್, ಸರದಿ ಅಥವಾ ಪಾವತಿ ವಿವರಗಳನ್ನು ನೋಡಬಹುದು.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 20. MULTI-CROP PLANNER INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'మల్టీ క్రాప్', 'అనేక పంటలు', 'వేర్వేరు పంటలు', 'రెండు పంటలు ప్లాన్', 'పంటల ప్లాన్',
      'multi crop', 'multiple crops', 'different crops', 'crop plan', 'planner',
      'crop planner', 'multiple slot', 'plan crops', 'various crops',
      'oka pata planning', 'rendu panta', 'anni pantalu'
    ])
  ) {
    return {
      intent: 'MULTI_CROP_PLANNER',
      route: '/farmer/multi-crop',
      guidanceSelector: '#multi-crop-selector',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Opening Multi-Crop Planner. Add your different crops and I will suggest the best centre and timing for each.',
        te: 'మల్టీ-క్రాప్ ప్లానర్ తెరిచాను. మీ వేర్వేరు పంటలు జోడించండి, ఏ సెంటర్లో అమ్మాలో చెప్తాను.',
        hi: 'मल्टी-क्रॉप प्लानर खुल रहा है। अपनी विभिन्न फसलें जोड़ें, मैं सुझाव दूंगा।',
        ta: 'மல்டி-க்ராப் பிளானர் திறக்கிறது. உங்கள் பயிர்களை சேர்க்கவும்.',
        kn: 'ಮಲ್ಟಿ-ಕ್ರಾಪ್ ಪ್ಲ್ಯಾನರ್ ತೆರೆಯುತ್ತಿದ್ದೇವೆ. ನಿಮ್ಮ ವಿಭಿನ್ನ ಬೆಳೆಗಳನ್ನು ಸೇರಿಸಿ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 21. CROP INFO / MSP INTENT
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'ఎంఎస్పీ ఎంత', 'మద్దతు ధర', 'పంట ధర', 'పంట సమాచారం', 'ఏ పంటకు ఎంత',
      'msp', 'support price', 'minimum support price', 'crop price', 'crop info',
      'crop rate', 'paddy price', 'wheat price', 'maize price', 'cotton price',
      'msp entha', 'panta dhara', 'panta ela undhi', 'government rate'
    ])
  ) {
    return {
      intent: 'CROP_INFO',
      route: '/farmer/crop-info',
      guidanceSelector: '#crop-info-cards',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Opening Crop Prices and MSP information. Here you can see government support prices for each crop.',
        te: 'పంట ధరలు మరియు MSP సమాచారం తెరిచాను. ప్రతి పంటకు ప్రభుత్వ మద్దతు ధర ఇక్కడ చూడవచ్చు.',
        hi: 'फसल दरें और MSP जानकारी खुल रही है। हर फसल का सरकारी समर्थन मूल्य यहाँ देखें।',
        ta: 'பயிர் விலைகள் மற்றும் MSP தகவல் திறக்கிறது.',
        kn: 'ಬೆಳೆ ದರಗಳು ಮತ್ತು MSP ಮಾಹಿತಿ ತೆರೆಯುತ್ತಿದ್ದೇವೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 22. CENTRE OPERATOR / ADMIN CONSOLE INTENTS
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'operator dashboard', 'centre console', 'centre dashboard', 'operator console',
      'centre operator', 'weighment entry', 'enter weight', 'actual weight',
      'sarkari', 'vrs', 'operator', 'ppc console', 'operator panel', 'centre panel'
    ])
  ) {
    return {
      intent: 'CENTRE_OPERATOR',
      route: '/centre/dashboard',
      guidanceSelector: '#centre-operator-panel',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Opening Centre Operator Dashboard. Here you can manage farmer queue and enter weighment data.',
        te: 'సెంటర్ ఆపరేటర్ డాష్‌బోర్డ్ తెరిచాను. రైతుల క్యూ మరియు తూకం డేటా ఇక్కడ నిర్వహించవచ్చు.',
        hi: 'केंद्र संचालक डैशबोर्ड खुल रहा है।',
        ta: 'மையம் செயல்பாட்டாளர் டாஷ்போர்டு திறக்கிறது.',
        kn: 'ಕೇಂದ್ರ ಆಪರೇಟರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯುತ್ತಿದ್ದೇವೆ.'
      }
    };
  }

  if (
    hasAny(query, [
      'department dashboard', 'department view', 'admin analytics', 'procurement analytics',
      'district dashboard', 'district view', 'all centres', 'total procurement',
      'analytics', 'department', 'centre intelligence', 'digital twin', 'simulation'
    ])
  ) {
    return {
      intent: 'DEPARTMENT_DASHBOARD',
      route: '/admin/department',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Opening Department Dashboard. Here you can see all centres, procurement totals, and load status.',
        te: 'డిపార్ట్‌మెంట్ డాష్‌బోర్డ్ తెరిచాను. అన్ని సేకరణ కేంద్రాల సమాచారం ఇక్కడ చూడవచ్చు.',
        hi: 'विभाग डैशबोर्ड खुल रहा है। सभी केंद्रों की जानकारी यहाँ देखें।',
        ta: 'துறை டாஷ்போர்டு திறக்கிறது.',
        kn: 'ಇಲಾಖೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯುತ್ತಿದ್ದೇವೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 23. HOME / DASHBOARD INTENT (was 19)
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      'హోమ్', 'ముఖ్య పేజీ', 'మొదటి పేజీ', 'హోం', 'డాష్‌బోర్డ్',
      'home', 'dashboard', 'main page', 'home page',
      'ghar', 'veedu', 'mane', 'mukhya page', 'first page',
      'main screen', 'go home', 'back to home'
    ])
  ) {
    return {
      intent: 'GO_HOME',
      route: '/farmer/dashboard',
      confidence: 'HIGH',
      spokenResponses: {
        en: 'Returning to Home.',
        te: 'ముఖ్య పేజీకి తీసుకువచ్చాను.',
        hi: 'मुख्य पेज पर वापस जा रहे हैं।',
        ta: 'முகப்பு பக்கத்திற்கு திரும்புகிறோம்.',
        kn: 'ಮುಖಪುಟಕ್ಕೆ ಮರಳುತ್ತಿದ್ದೇವೆ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 24. EDIT MULTI-CROP APPOINTMENT INTENT
  // Farmer wants to change centre / time / date for a specific crop appointment
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    hasAny(query, [
      // Telugu
      'సెంటర్ మార్చాలి', 'సెంటర్ మార్చు', 'వేరే సెంటర్', 'టైమ్ మార్చాలి', 'టైమ్ మార్చు',
      'స్లాట్ మార్చాలి', 'స్లాట్ టైమ్ మార్చాలి', 'అపాయింట్మెంట్ మార్చాలి',
      'తేదీ మార్చాలి', 'రేపు రావాలి', 'పంట స్లాట్',
      'పడ్డీ సెంటర్ మార్చాలి', 'మాజ్ సెంటర్ మార్చాలి',
      'పడ్డీ టైమ్ మార్చాలి', 'వేరే టైమ్ కావాలి',
      'పదిగంటల బదులు', 'పదకొండు గంటలకు', 'రెండు గంటలకు',
      // Romanized Telugu
      'centre marchali', 'centre marchu', 'centre change cheyali',
      'time marchali', 'time marchu', 'slot marchali', 'slot marchu',
      'slot time marchali', 'slot time change', 'slot change cheyali',
      'appointment marchali', 'na appointment marchali',
      'paddy centre change', 'paddy centre marchali',
      'paddy time marchali', 'paddy slot marchali',
      'maize centre change', 'groundnut centre', 'cotton centre change',
      'wheat centre change', 'vere centre kavali', 'vere time kavali',
      'tedi marchali', 'repu ravali',
      // English
      'change my centre', 'change centre', 'change my slot', 'change slot',
      'change my time', 'change time', 'move my appointment',
      'reschedule', 'change appointment', 'edit appointment',
      'change paddy centre', 'change paddy slot', 'change paddy time',
      'change maize centre', 'change groundnut centre', 'change cotton centre',
      'change wheat centre', 'different centre', 'another centre',
      'different time', 'another time', 'different slot',
      'change my booking time', 'switch centre', 'move to another centre',
      // Hindi
      'केंद्र बदलो', 'समय बदलो', 'स्लॉट बदलो', 'अपॉइंटमेंट बदलो',
      'दूसरा केंद्र', 'दूसरा समय', 'केंद्र बदलना है', 'समय बदलना है',
      // Tamil
      'மையம் மாற்று', 'நேரம் மாற்று', 'வேறு மையம்', 'வேறு நேரம்',
      // Kannada
      'ಕೇಂದ್ರ ಬದಲಿಸಿ', 'ಸಮಯ ಬದಲಿಸಿ', 'ಸ್ಲಾಟ್ ಬದಲಿಸಿ'
    ])
  ) {
    // Entity extraction: which crop?
    const cropMentioned =
      hasAny(query, ['paddy', 'padi', 'paddi', 'vari', 'పడ్డీ', 'వరి', 'rice']) ? 'paddy' :
      hasAny(query, ['maize', 'corn', 'మొక్కజొన్న', 'mokka jonna']) ? 'maize' :
      hasAny(query, ['groundnut', 'peanut', 'వేరుశనగ', 'pallelu']) ? 'groundnut' :
      hasAny(query, ['cotton', 'patti', 'పత్తి', 'patti']) ? 'cotton' :
      hasAny(query, ['wheat', 'goduma', 'గోధుమ']) ? 'wheat' :
      null;

    // Which field to change?
    const fieldHint =
      hasAny(query, ['centre', 'center', 'సెంటర్', 'kendra', 'మైం', 'மையம்', 'ಕೇಂದ್ರ', 'केंद्र']) ? 'centre' :
      hasAny(query, ['date', 'తేదీ', 'repu', 'రేపు', 'tedi', 'din', 'நாள்', 'ದಿನ']) ? 'date' :
      'time';

    const cropLabel = cropMentioned
      ? { paddy: 'Paddy', maize: 'Maize', groundnut: 'Groundnut', cotton: 'Cotton', wheat: 'Wheat' }[cropMentioned]
      : null;

    const guidanceSelector = cropMentioned ? `#crop-card-${cropMentioned}_common` : '#multi-crop-selector';

    return {
      intent: 'EDIT_MULTI_CROP_APPOINTMENT',
      route: '/farmer/multi-crop',
      guidanceSelector,
      confidence: 'HIGH',
      cropMentioned,
      fieldHint,
      spokenResponses: {
        en: cropLabel
          ? `Opening the ${cropLabel} appointment editor. You can change the ${fieldHint} there.`
          : 'Opening the Multi-Crop Planner so you can edit your appointment.',
        te: cropLabel
          ? `${cropLabel} అపాయింట్మెంట్ ఎడిటర్ తెరుస్తున్నాను. అక్కడ ${fieldHint === 'centre' ? 'కేంద్రం' : fieldHint === 'date' ? 'తేదీ' : 'సమయం'} మార్చవచ్చు.`
          : 'మల్టీ-క్రాప్ ప్లానర్ తెరుస్తున్నాను. అపాయింట్మెంట్ మార్చండి.',
        hi: cropLabel
          ? `${cropLabel} अपॉइंटमेंट एडिटर खोल रहे हैं। वहाँ ${fieldHint === 'centre' ? 'केंद्र' : fieldHint === 'date' ? 'तारीख' : 'समय'} बदलें।`
          : 'मल्टी-क्रॉप प्लानर खोल रहे हैं। अपना अपॉइंटमेंट बदलें।',
        ta: cropLabel
          ? `${cropLabel} சந்திப்பு திருத்தியை திறக்கிறோம். அங்கு ${fieldHint === 'centre' ? 'மையத்தை' : fieldHint === 'date' ? 'தேதியை' : 'நேரத்தை'} மாற்றலாம்.`
          : 'பல பயிர் திட்டமிடலை திறக்கிறோம். சந்திப்பை திருத்தலாம்.',
        kn: cropLabel
          ? `${cropLabel} ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಎಡಿಟರ್ ತೆರೆಯುತ್ತಿದ್ದೇವೆ. ಅಲ್ಲಿ ${fieldHint === 'centre' ? 'ಕೇಂದ್ರ' : fieldHint === 'date' ? 'ದಿನಾಂಕ' : 'ಸಮಯ'} ಬದಲಿಸಿ.`
          : 'ಮಲ್ಟಿ-ಕ್ರಾಪ್ ಪ್ಲಾನರ್ ತೆರೆಯುತ್ತಿದ್ದೇವೆ. ನಿಮ್ಮ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬದಲಿಸಿ.'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 20. Default Friendly Fallback (LOW confidence)
  // ─────────────────────────────────────────────────────────────────────────────
  return {
    intent: 'GENERAL_GUIDE',
    route: undefined, // Don't navigate randomly on low confidence
    confidence: 'LOW',
    spokenResponses: {
      en: 'I am here to guide you. You can ask about slot booking, token, queue, payment, or say "can I go now?" to check centre status.',
      te: 'నాకు పూర్తిగా అర్థం కాలేదు. స్లాట్, టోకెన్, క్యూ లేదా పేమెంట్ గురించి అడగండి. లేదా "ఇప్పుడు వెళ్లచ్చా?" అని అడగండి.',
      hi: 'मुझे पूरी तरह समझ नहीं आया। स्लॉट, टोकन, कतार या भुगतान के बारे में पूछें।',
      ta: 'என்னால் முழுவதும் புரியவில்லை. ஸ்லாட், டோக்கன், வரிசை அல்லது கட்டணம் பற்றி கேட்கலாம்.',
      kn: 'ನನಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ಸ್ಲಾಟ್, ಟೋಕನ್, ಸರದಿ ಅಥವಾ ಪಾವತಿಯ ಬಗ್ಗೆ ಕೇಳಬಹುದು.'
    }
  };
}
