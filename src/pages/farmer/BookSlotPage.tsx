import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Warehouse,
  CheckCircle2,
  Ticket,
  Plus,
  Minus,
  Sparkles,
  Zap
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProcurement } from '../../context/ProcurementContext';
import { useGenie } from '../../context/GenieContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CROPS } from '../../data/mockCrops';
import { MOCK_CENTRES } from '../../data/mockCentres';

export const BookSlotPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { bookSlot } = useProcurement();
  const { notifyManualInteraction, taskState } = useGenie();
  const navigate = useNavigate();

  // Initialize state based on task state if Genie filled it, otherwise default
  const [selectedCropId, setSelectedCropId] = useState(() => {
    if (taskState.crop) {
      const c = MOCK_CROPS.find(c => c.name.toLowerCase() === taskState.crop?.toLowerCase());
      if (c) return c.id;
    }
    return MOCK_CROPS[0].id;
  });
  
  const [quantity, setQuantity] = useState(taskState.quantity || 48.6);
  const [selectedCentreId, setSelectedCentreId] = useState(MOCK_CENTRES[0].id);
  const [selectedDate, setSelectedDate] = useState(taskState.date || '2026-09-03');
  const [selectedTime, setSelectedTime] = useState(taskState.time || '10:00 AM - 11:00 AM');
  
  // Sync when Genie updates the task state
  React.useEffect(() => {
    if (taskState.crop) {
      const c = MOCK_CROPS.find(c => c.name.toLowerCase() === taskState.crop?.toLowerCase());
      if (c && c.id !== selectedCropId) setSelectedCropId(c.id);
    }
    if (taskState.quantity && taskState.quantity !== quantity) {
      setQuantity(taskState.quantity);
    }
    if (taskState.centreName) {
      const c = MOCK_CENTRES.find(c => c.name.toLowerCase() === taskState.centreName?.toLowerCase());
      if (c && c.id !== selectedCentreId) setSelectedCentreId(c.id);
    }
    if (taskState.date && taskState.date !== selectedDate) {
      setSelectedDate(taskState.date);
    }
    if (taskState.time && taskState.time !== selectedTime) {
      setSelectedTime(taskState.time);
    }
  }, [taskState]);

  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const selectedCrop = MOCK_CROPS.find(c => c.id === selectedCropId) || MOCK_CROPS[0];
  const selectedCentre = MOCK_CENTRES.find(c => c.id === selectedCentreId) || MOCK_CENTRES[0];

  const handleCropSelect = (id: string) => {
    setSelectedCropId(id);
    const cropObj = MOCK_CROPS.find(c => c.id === id);
    if (cropObj) notifyManualInteraction('crop', cropObj.name);
  };

  const handleQuantityChange = (newQ: number) => {
    setQuantity(newQ);
    notifyManualInteraction('quantity', newQ);
  };

  const handleCentreSelect = (id: string) => {
    setSelectedCentreId(id);
    const centreObj = MOCK_CENTRES.find(c => c.id === id);
    if (centreObj) notifyManualInteraction('centreName', centreObj.name);
  };

  const handleDateSelect = (val: string) => {
    setSelectedDate(val);
    notifyManualInteraction('date', val);
  };

  const handleTimeSelect = (val: string) => {
    setSelectedTime(val);
    notifyManualInteraction('time', val);
  };

  const dateOptions = [
    { value: '2026-09-03', label: '3 September 2026', dateStr: 'Thu, 3 Sep', slotsLeft: '24 Slots Open' },
    { value: '2026-09-04', label: '4 September 2026', dateStr: 'Fri, 4 Sep', slotsLeft: '38 Slots Open' },
    { value: '2026-09-05', label: '5 September 2026', dateStr: 'Sat, 5 Sep', slotsLeft: '45 Slots Open' }
  ];

  const timeOptions = [
    { value: '10:00 AM - 11:00 AM', label: '10:00 AM - 11:00 AM (Recommended)', icon: '☀️' },
    { value: '11:00 AM - 12:00 PM', label: '11:00 AM - 12:00 PM (Midday)', icon: '🌤️' },
    { value: '02:00 PM - 03:00 PM', label: '02:00 PM - 03:00 PM (Afternoon)', icon: '🌅' }
  ];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const booking = bookSlot({
      cropId: selectedCrop.id,
      cropName: selectedCrop.nativeNames[language] || selectedCrop.name,
      estimatedQuantityQuintals: quantity,
      centreId: selectedCentre.id,
      centreName: selectedCentre.name,
      slotDate: selectedDate,
      slotTime: selectedTime
    });

    setGeneratedToken(booking.tokenDisplay || `A${booking.tokenNumber}`);
    setIsSuccess(true);
  };

  if (isSuccess && generatedToken) {
    return (
      <PageContainer maxWidth="lg">
        <div className="bg-white border-2 border-agri-600 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-20 h-20 bg-agri-100 text-agri-700 rounded-full flex items-center justify-center mx-auto text-4xl border-3 border-agri-500 animate-bounce">
            🎉
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {t('book_slot.success_token_title')}
              </h2>
              <VoiceSpeaker
                text={`${t('book_slot.success_token_title')}. ${t('book_slot.token_generated_text')} ${generatedToken}.`}
                size="md"
              />
            </div>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {selectedCentre.name}
            </p>
          </div>

          {/* Big Token Number Display */}
          <div className="bg-gradient-to-br from-agri-800 to-agri-950 text-white rounded-3xl p-6 sm:p-8 space-y-3 shadow-inner">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-harvest-300">
              {t('book_slot.token_generated_text')}
            </span>
            <div className="text-6xl sm:text-7xl font-black tracking-tight text-harvest-400 font-mono">
              #{generatedToken}
            </div>
            <div className="pt-2 border-t border-agri-700/80 text-xs sm:text-sm text-agri-100 flex flex-wrap justify-around gap-2 font-semibold">
              <span>📅 {selectedDate}</span>
              <span>⏰ {selectedTime}</span>
              <span>🌾 {selectedCrop.nativeNames[language] || selectedCrop.name} ({quantity} Qt)</span>
            </div>
          </div>

          <PrimaryButton
            onClick={() => navigate('/farmer/queue')}
            size="lg"
            variant="primary"
            icon={<Ticket size={22} />}
          >
            {t('book_slot.view_token_btn')}
          </PrimaryButton>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={t('book_slot.title')}
      subtitle={t('book_slot.subtitle')}
      showBackButton={true}
      backTo="/farmer/dashboard"
      maxWidth="3xl"
    >
      <form id="book-slot-container" onSubmit={handleConfirm} className="space-y-6">
        {/* 1. Crop Selection */}
        <div id="select-crop-section" className="bg-white border-2 border-agri-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {t('book_slot.select_crop')}
            </h3>
            <VoiceSpeaker translationKey="book_slot.select_crop" size="sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MOCK_CROPS.map((crop) => {
              const isSelected = selectedCropId === crop.id;
              const cropName = crop.nativeNames[language] || crop.name;
              const cropSpeech = language === 'te'
                ? `${cropName}. ప్రభుత్వ మద్దతు ధర క్వింటాలుకు ₹${crop.mspPerQuintal.toLocaleString('en-IN')}.`
                : language === 'hi'
                ? `${cropName}. सरकारी एमएसपी दर प्रति क्विंटल ₹${crop.mspPerQuintal.toLocaleString('en-IN')}।`
                : language === 'ta'
                ? `${cropName}. அரசு விலை குவிண்டாலுக்கு ₹${crop.mspPerQuintal.toLocaleString('en-IN')}.`
                : language === 'kn'
                ? `${cropName}. ಬೆಂಬಲ ಬೆಲೆ ಕ್ವಿಂಟಾಲ್‌ಗೆ ₹${crop.mspPerQuintal.toLocaleString('en-IN')}.`
                : `${cropName}. MSP ₹${crop.mspPerQuintal.toLocaleString('en-IN')} per quintal.`;

              return (
                <div
                  key={crop.id}
                  onClick={() => handleCropSelect(crop.id)}
                  role="button"
                  tabIndex={0}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-2 cursor-pointer select-none transition-all ${
                    isSelected
                      ? 'border-agri-600 bg-agri-50 ring-2 ring-agri-400 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-agri-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{crop.icon}</span>
                    <div>
                      <div className="text-sm sm:text-base text-slate-900 leading-snug">{cropName}</div>
                      <div className="text-xs text-agri-800 font-bold">
                        MSP: ₹{crop.mspPerQuintal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <VoiceSpeaker
                    text={cropSpeech}
                    size="sm"
                    label={`Listen: ${cropName}`}
                    className="flex-shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Crop Quantity */}
        <div id="quantity-section" className="bg-white border-2 border-agri-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {t('book_slot.enter_quantity')}
            </h3>
            <VoiceSpeaker
              text={`${t('book_slot.enter_quantity')}: ${quantity} ${language === 'te' ? 'క్వింటాళ్లు' : 'Quintals'}`}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => handleQuantityChange(Math.max(5, Math.round((quantity - 5) * 10) / 10))}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-warmgray-100 hover:bg-warmgray-200 text-slate-900 font-black text-2xl flex items-center justify-center border-2 border-slate-300 active:scale-95 transition-transform"
              title="Decrease 5 Quintals"
            >
              <Minus size={22} />
            </button>

            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-agri-950 font-mono">
                {quantity}
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
                Quintals ({language === 'te' ? 'క్వింటాళ్లు' : language === 'hi' ? 'क्विंटल' : 'Quintals'})
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleQuantityChange(Math.round((quantity + 5) * 10) / 10)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-agri-100 hover:bg-agri-200 text-agri-900 font-black text-2xl flex items-center justify-center border-2 border-agri-300 active:scale-95 transition-transform"
              title="Increase 5 Quintals"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>

        {/* 3. Procurement Centre & Smart Capacity Recommendation */}
        <div id="select-centre-section" className="bg-white border-2 border-agri-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {t('book_slot.select_centre')}
              </h3>
              <span className="text-[10px] bg-agri-100 text-agri-900 font-bold px-2 py-0.5 rounded-full uppercase">
                Smart Capacity
              </span>
            </div>
            <VoiceSpeaker translationKey="book_slot.select_centre" size="sm" />
          </div>

          <div className="space-y-2.5">
            {MOCK_CENTRES.map((centre, idx) => {
              const isSelected = selectedCentreId === centre.id;
              const isRecommended = idx === 0;

              const centreSpeech = language === 'te'
                ? `${centre.name}. ${centre.mandal}. దూరం ${centre.distanceKm} కిలోమీటర్లు. సగటు వేచి ఉండే సమయం ${centre.averageWaitMins} నిమిషాలు.`
                : language === 'hi'
                ? `${centre.name}। ${centre.mandal}। दूरी ${centre.distanceKm} किलोमीटर। प्रतीक्षा समय ${centre.averageWaitMins} मिनट।`
                : language === 'ta'
                ? `${centre.name}. ${centre.mandal}. தூரம் ${centre.distanceKm} கி.மீ. காத்திருப்பு நேரம் ${centre.averageWaitMins} நிமிடங்கள்.`
                : language === 'kn'
                ? `${centre.name}. ${centre.mandal}. ದೂರ ${centre.distanceKm} ಕಿಲೋಮೀಟರ್. ಕಾಯುವ ಸಮಯ ${centre.averageWaitMins} ನಿಮಿಷಗಳು.`
                : `${centre.name}, ${centre.mandal}. ${centre.distanceKm} kilometers away. Average wait ${centre.averageWaitMins} minutes.`;

              return (
                <div
                  key={centre.id}
                  onClick={() => handleCentreSelect(centre.id)}
                  role="button"
                  tabIndex={0}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                    isSelected
                      ? 'border-agri-600 bg-agri-50 ring-2 ring-agri-400 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-agri-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Warehouse size={22} className={isSelected ? 'text-agri-700' : 'text-slate-500'} />
                    <div>
                      <div className="text-sm sm:text-base text-slate-900 font-bold flex items-center gap-2">
                        <span>{centre.name}</span>
                        {isRecommended && (
                          <span className="text-[10px] bg-harvest-400 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {centre.mandal} • <strong className="text-agri-800">{centre.distanceKm} km away</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-civic-100 text-civic-900 font-bold px-2 py-1 rounded">
                      Wait: ~{centre.averageWaitMins}m
                    </span>
                    <VoiceSpeaker
                      text={centreSpeech}
                      size="sm"
                      label={`Listen: ${centre.name}`}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Date & Time Window */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div id="select-date-section" className="bg-white border-2 border-agri-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {t('book_slot.select_date')}
              </h3>
              <VoiceSpeaker translationKey="book_slot.select_date" size="sm" />
            </div>

            <div className="space-y-2">
              {dateOptions.map((opt) => {
                const isSelected = selectedDate === opt.value;
                const dateSpeech = language === 'te'
                  ? `తేదీ ${opt.label}. ${opt.slotsLeft}.`
                  : language === 'hi'
                  ? `तारीख ${opt.label}। ${opt.slotsLeft}।`
                  : language === 'ta'
                  ? `தேதி ${opt.label}.`
                  : language === 'kn'
                  ? `ದಿನಾಂಕ ${opt.label}.`
                  : `Date ${opt.label}. ${opt.slotsLeft}.`;

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleDateSelect(opt.value)}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-agri-600 bg-agri-50 font-bold ring-1 ring-agri-400'
                        : 'border-slate-200 hover:border-agri-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs sm:text-sm text-slate-900 font-semibold">{opt.label}</div>
                      <span className="text-[11px] text-agri-700 font-bold">{opt.slotsLeft}</span>
                    </div>

                    <VoiceSpeaker
                      text={dateSpeech}
                      size="sm"
                      label={`Listen: ${opt.label}`}
                      className="flex-shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div id="select-time-section" className="bg-white border-2 border-agri-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {t('book_slot.select_time')}
              </h3>
              <VoiceSpeaker translationKey="book_slot.select_time" size="sm" />
            </div>

            <div className="space-y-2">
              {timeOptions.map((opt) => {
                const isSelected = selectedTime === opt.value;
                const timeSpeech = language === 'te'
                  ? `సమయం ${opt.label}.`
                  : language === 'hi'
                  ? `समय ${opt.label}।`
                  : language === 'ta'
                  ? `நேரம் ${opt.label}.`
                  : language === 'kn'
                  ? `ಸಮಯ ${opt.label}.`
                  : `Time window ${opt.label}.`;

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleTimeSelect(opt.value)}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-agri-600 bg-agri-50 font-bold ring-1 ring-agri-400'
                        : 'border-slate-200 hover:border-agri-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{opt.icon}</span>
                      <div className="text-xs sm:text-sm text-slate-900 font-semibold">{opt.label}</div>
                    </div>

                    <VoiceSpeaker
                      text={timeSpeech}
                      size="sm"
                      label={`Listen: ${opt.label}`}
                      className="flex-shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div id="confirm-booking-btn">
          <PrimaryButton
            type="submit"
            size="lg"
            variant="primary"
            icon={<CheckCircle2 size={22} />}
            voiceKey="book_slot.confirm_btn"
          >
            {t('book_slot.confirm_btn')}
          </PrimaryButton>
        </div>
      </form>
    </PageContainer>
  );
};

