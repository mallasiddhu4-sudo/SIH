import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Warehouse,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Ticket
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProcurement } from '../../context/ProcurementContext';
import { useVoice } from '../../context/VoiceContext';
import { useGenie } from '../../context/GenieContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CENTRES } from '../../data/mockCentres';

export const ManageSlotPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { activePlanAppointments, reschedulePlanAppointment, cancelPlanAppointment } = useProcurement();
  const { speak } = useVoice();
  const { activeAction, clearActiveAction } = useGenie();
  const navigate = useNavigate();
  const location = useLocation();

  const activeAppts = activePlanAppointments.filter(a => a.bookingStatus !== 'CANCELLED' && a.bookingStatus !== 'COMPLETED' && a.queueStatus !== 'COMPLETED');
  
  const initialCrop = location.state?.cropMentioned;
  const initialAppt = initialCrop 
    ? activeAppts.find(a => a.cropName.toLowerCase().includes(initialCrop) || a.cropId.toLowerCase().includes(initialCrop)) 
    : undefined;

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(initialAppt?.id || activeAppts[0]?.id);

  useEffect(() => {
    if (location.state?.cropMentioned) {
      const match = activeAppts.find(a => a.cropName.toLowerCase().includes(location.state.cropMentioned) || a.cropId.toLowerCase().includes(location.state.cropMentioned));
      if (match) setSelectedAppointmentId(match.id);
    }
  }, [location.state, activeAppts]);

  const currentBooking = activeAppts.find(a => a.id === selectedAppointmentId) || activeAppts[0];
  const isCancelled = currentBooking?.bookingStatus === 'CANCELLED';

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState('2026-09-04');
  const [selectedTime, setSelectedTime] = useState('10:00 AM - 11:00 AM');
  const [selectedCentreId, setSelectedCentreId] = useState(currentBooking?.centreId || 'ppc_101');
  const [toastMessage, setToastMessage] = useState('');

  // Handle Genie voice actions triggering modal
  useEffect(() => {
    if (activeAction === 'OPEN_RESCHEDULE') {
      setShowRescheduleModal(true);
      setShowCancelModal(false);
      clearActiveAction();
    } else if (activeAction === 'OPEN_CANCEL') {
      setShowCancelModal(true);
      setShowRescheduleModal(false);
      clearActiveAction();
    }
  }, [activeAction, clearActiveAction]);

  if (!currentBooking) {
    return (
      <PageContainer
        title={t('manage_slot.title') || 'Manage Procurement Slot'}
        showBackButton={true}
        backTo="/farmer/dashboard"
        maxWidth="lg"
      >
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-4">
          <div className="text-5xl">📅</div>
          <h3 className="text-xl font-bold text-slate-800">No active booking found</h3>
          <p className="text-slate-600 text-sm">Please book a slot to bring your crop to the procurement center.</p>
          <PrimaryButton onClick={() => navigate('/farmer/book-slot')}>
            {t('dashboard.card_book_slot')}
          </PrimaryButton>
        </div>
      </PageContainer>
    );
  }

  const alternativeSlots = [
    { date: '2026-09-04', dateLabel: '4 September 2026', time: '10:00 AM - 11:00 AM', label: 'Morning Slot' },
    { date: '2026-09-04', dateLabel: '4 September 2026', time: '11:00 AM - 12:00 PM', label: 'Midday Slot' },
    { date: '2026-09-05', dateLabel: '5 September 2026', time: '10:00 AM - 11:00 AM', label: 'Next Day Morning' },
    { date: '2026-09-05', dateLabel: '5 September 2026', time: '02:00 PM - 03:00 PM', label: 'Afternoon Slot' },
  ];

  const handleConfirmReschedule = () => {
    const centre = MOCK_CENTRES.find(c => c.id === selectedCentreId) || MOCK_CENTRES[0];
    reschedulePlanAppointment(currentBooking.id, selectedDate, selectedTime, centre.id, centre.name);
    setShowRescheduleModal(false);

    const successVoice = language === 'te'
      ? 'మీ స్లాట్ విజయవంతంగా మార్చబడింది.'
      : language === 'hi'
      ? 'आपका स्लॉट सफलतापूर्वक रीशेड्यूल कर दिया गया है।'
      : language === 'ta'
      ? 'உங்கள் ஸ்லாட் வெற்றிகரமாக மாற்றப்பட்டது.'
      : language === 'kn'
      ? 'ನಿಮ್ಮ ಸ್ಲಾಟ್ ಯಶಸ್ವಿಯಾಗಿ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.'
      : 'Your slot has been rescheduled successfully.';

    setToastMessage(successVoice);
    speak(successVoice, 'reschedule-success-voice', language);
  };

  const handleConfirmCancel = () => {
    cancelPlanAppointment(currentBooking.id);
    setShowCancelModal(false);

    const cancelVoice = language === 'te'
      ? 'మీ స్లాట్ రద్దు చేయబడింది.'
      : language === 'hi'
      ? 'आपका स्लॉट रद्द कर दिया गया है।'
      : language === 'ta'
      ? 'உங்கள் ஸ்லாட் ரத்து செய்யப்பட்டது.'
      : language === 'kn'
      ? 'ನಿಮ್ಮ ಸ್ಲಾಟ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.'
      : 'Your slot has been cancelled.';

    setToastMessage(cancelVoice);
    speak(cancelVoice, 'cancel-success-voice', language);
  };

  return (
    <PageContainer
      title={language === 'te' ? 'స్లాట్ నిర్వహణ' : 'Manage My Slot'}
      subtitle={language === 'te' ? 'తేదీ మార్పు లేదా రద్దు సులభంగా చేయవచ్చు' : 'View, reschedule or cancel your procurement booking'}
      showBackButton={true}
      backTo="/farmer/dashboard"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Dynamic Crop Tabs */}
        {activeAppts.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
            {activeAppts.map(appt => (
              <button
                key={appt.id}
                onClick={() => setSelectedAppointmentId(appt.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border-2 ${
                  selectedAppointmentId === appt.id
                    ? 'bg-agri-900 border-agri-900 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-agri-300'
                }`}
              >
                <span>{appt.cropIcon}</span>
                <span>{appt.cropName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-agri-700 text-white font-bold p-4 rounded-2xl flex items-center gap-3 shadow-md animate-fade-in">
            <CheckCircle2 size={24} className="text-harvest-400 flex-shrink-0" />
            <span className="text-sm sm:text-base">{toastMessage}</span>
          </div>
        )}

        {/* Current Booking Summary Card */}
        <div
          id="current-booking-card"
          className={`bg-white border-2 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 border-agri-600`}
        >
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm bg-agri-700 text-white`}>
                📅
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      currentBooking.bookingStatus === 'RESCHEDULED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-agri-100 text-agri-800'
                  }`}>
                    {currentBooking.bookingStatus === 'RESCHEDULED'
                      ? (language === 'te' ? 'తేదీ మార్చబడింది' : 'Rescheduled')
                      : (language === 'te' ? 'ధృవీకరించబడింది' : 'Confirmed')}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {currentBooking.cropName} ({currentBooking.estimatedQuantityQuintals} Quintals)
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Token</span>
              <strong className="text-2xl sm:text-3xl font-black text-agri-950 font-mono">
                #{currentBooking.tokenDisplay || currentBooking.tokenNumber}
              </strong>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-warmgray-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Warehouse size={16} className="text-agri-700" />
                {language === 'te' ? 'సేకరణ కేంద్రం' : 'Procurement Centre'}
              </span>
              <strong className="text-base sm:text-lg text-slate-900 block font-bold">
                {currentBooking.centreName}
              </strong>
            </div>

            <div className="bg-warmgray-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar size={16} className="text-agri-700" />
                {language === 'te' ? 'తేదీ మరియు సమయం' : 'Date & Time Window'}
              </span>
              <strong className="text-base sm:text-lg text-slate-900 block font-bold">
                {currentBooking.slotDate} ({currentBooking.slotTime})
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="reschedule-btn"
              onClick={() => setShowRescheduleModal(true)}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-agri-50 hover:bg-agri-100 text-agri-900 font-black text-base border-2 border-agri-400 flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-sm min-h-touch"
            >
              <RotateCcw size={20} />
              <span>{language === 'te' ? 'స్లాట్ మార్చండి (Reschedule)' : 'Reschedule Slot'}</span>
            </button>

            <button
              type="button"
              id="cancel-btn"
              onClick={() => setShowCancelModal(true)}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-white hover:bg-red-50 text-red-700 font-bold text-base border-2 border-red-200 hover:border-red-300 flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-sm min-h-touch"
            >
              <XCircle size={20} />
              <span>{language === 'te' ? 'స్లాట్ రద్దు చేయండి (Cancel)' : 'Cancel Slot'}</span>
            </button>
          </div>
        </div>

        {/* Quick Return */}
        <div className="flex justify-between items-center text-sm">
          <button
            type="button"
            onClick={() => navigate('/farmer/dashboard')}
            className="text-agri-800 font-bold hover:underline flex items-center gap-1.5"
          >
            &larr; {language === 'te' ? 'ముఖ్య పేజీకి తిరిగి వెళ్లండి' : 'Back to Home'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/farmer/queue')}
            className="text-agri-800 font-bold hover:underline flex items-center gap-1.5"
          >
            {language === 'te' ? 'లైవ్ క్యూ చూడండి' : 'View Live Queue'} &rarr;
          </button>
        </div>
      </div>

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-agri-600 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                <h3 className="text-xl font-black text-slate-900">
                  {language === 'te' ? 'కొత్త స్లాట్ సమయం ఎంచుకోండి' : 'Choose New Date & Slot'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 font-medium bg-warmgray-50 p-3.5 rounded-2xl border border-slate-200">
              <strong>{language === 'te' ? 'ప్రస్తుత బుకింగ్:' : 'Current booking:'}</strong> {currentBooking.slotDate} ({currentBooking.slotTime}) at {currentBooking.centreName}
            </div>

            {/* Alternative choices */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'te' ? 'అందుబాటులో ఉన్న కొత్త తేదీలు:' : 'Available Alternative Dates:'}
              </span>
              <div className="space-y-2">
                {alternativeSlots.map((opt, idx) => {
                  const isSelected = selectedDate === opt.date && selectedTime === opt.time;
                  const slotSpeech = language === 'te'
                    ? `స్లాట్ ${opt.dateLabel}, ${opt.time}.`
                    : language === 'hi'
                    ? `स्लॉट ${opt.dateLabel}, ${opt.time}।`
                    : language === 'ta'
                    ? `ஸ்லாட் ${opt.dateLabel}, ${opt.time}.`
                    : language === 'kn'
                    ? `ಸ್ಲಾಟ್ ${opt.dateLabel}, ${opt.time}.`
                    : `Slot ${opt.dateLabel}, ${opt.time}.`;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(opt.date);
                        setSelectedTime(opt.time);
                      }}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-agri-600 bg-agri-50 ring-2 ring-agri-400 font-bold'
                          : 'border-slate-200 hover:border-agri-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className={isSelected ? 'text-agri-700' : 'text-slate-400'} />
                        <div>
                          <div className="text-sm text-slate-900 font-bold">{opt.dateLabel}</div>
                          <div className="text-xs text-slate-500">{opt.time} ({opt.label})</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="text-xs font-black text-agri-700 bg-agri-100 px-2 py-0.5 rounded-full">
                            ✓ Selected
                          </span>
                        )}
                        <VoiceSpeaker
                          text={slotSpeech}
                          size="sm"
                          label={`Listen: ${opt.dateLabel}`}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="w-1/2 py-3 rounded-2xl border-2 border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
              >
                {language === 'te' ? 'రద్దు (Cancel)' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                className="w-1/2 py-3 rounded-2xl bg-agri-700 hover:bg-agri-800 text-white font-black shadow-md flex items-center justify-center gap-1.5"
              >
                <span>{language === 'te' ? 'స్లాట్ మార్చండి' : 'Confirm New Slot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-red-400 space-y-5 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-3xl font-black">
              ⚠️
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {language === 'te' ? 'స్లాట్ రద్దు చేయాలనుకుంటున్నారా?' : 'Do you want to cancel your slot?'}
                </h3>
                <VoiceSpeaker
                  text={language === 'te' ? 'స్లాట్ రద్దు చేయాలనుకుంటున్నారా? మీ టోకెన్ రద్దు చేయబడుతుంది.' : 'Do you want to cancel your slot? Your token will be cancelled.'}
                  size="sm"
                />
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                {language === 'te'
                  ? 'మీ టోకెన్ రద్దు చేయబడుతుంది. మీకు కావాలంటే తర్వాత మళ్లీ బుక్ చేసుకోవచ్చు.'
                  : 'Your token appointment will be cancelled. You can book again later.'}
              </p>
            </div>

            <div className="bg-warmgray-50 p-3.5 rounded-2xl text-xs sm:text-sm text-slate-700 font-semibold border border-slate-200">
              {currentBooking.cropName} • {currentBooking.slotDate} ({currentBooking.slotTime})
            </div>

            {/* Exactly 2 simple choices */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-1/2 py-3 rounded-2xl border-2 border-slate-300 text-slate-800 font-black hover:bg-slate-50 text-sm sm:text-base flex items-center justify-center gap-1"
              >
                <span>{language === 'te' ? 'స్లాట్ అలాగే ఉంచండి' : 'Keep Slot'}</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="w-1/2 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-md text-sm sm:text-base flex items-center justify-center gap-1"
              >
                <span>{language === 'te' ? 'స్లాట్ రద్దు చేయండి' : 'Cancel Slot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
