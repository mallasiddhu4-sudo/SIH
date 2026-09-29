import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Ticket,
  Users,
  Clock,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Scale,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProcurement } from '../../context/ProcurementContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CENTRES } from '../../data/mockCentres';
import { MOCK_CENTRE_OPERATIONS } from '../../data/mockCentreOperations';

export const QueueStatusPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { advanceQueue, activePlanAppointments } = useProcurement();
  const navigate = useNavigate();
  const location = useLocation();

  const activeAppts = activePlanAppointments.filter(a => a.bookingStatus !== 'CANCELLED');
  
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

  // Look up live centre load status for load-aware messaging
  const centre = MOCK_CENTRES.find(c => c.id === currentBooking?.centreId);
  const centreOps = currentBooking?.centreId ? MOCK_CENTRE_OPERATIONS[currentBooking.centreId] : undefined;
  const isHighLoad = centre?.operationalStatus === 'HIGH_LOAD';
  const isAttention = centre?.operationalStatus === 'ATTENTION';

  if (!currentBooking) {
    return (
      <PageContainer
        title={t('queue.title')}
        showBackButton={true}
        backTo="/farmer/dashboard"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Dynamic Crop Tabs */}
          {activeAppts.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
              {activeAppts.map(appt => (
                <button
                  key={appt.id}
                  onClick={() => setSelectedAppointmentId(appt.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border-2 ${
                    selectedAppointmentId === appt.id
                      ? 'bg-civic-900 border-civic-900 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-civic-300'
                  }`}
                >
                  <span>{appt.cropIcon}</span>
                  <span>{appt.cropName}</span>
                </button>
              ))}
            </div>
          )}


          {activeAppts.length === 0 && (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-4">
              <div className="text-5xl">🎫</div>
              <h3 className="text-xl font-bold text-slate-800">No active procurement slot found</h3>
              <p className="text-slate-600 text-sm">
                Please book a procurement slot to get your queue token.
              </p>
              <PrimaryButton onClick={() => navigate('/farmer/book-slot')}>
                {t('dashboard.card_book_slot')}
              </PrimaryButton>
            </div>
          )}
        </div>
      </PageContainer>
    );
  }


  const tokenNum = typeof currentBooking.tokenNumber === 'number'
    ? currentBooking.tokenNumber
    : parseInt(String(currentBooking.tokenNumber).replace(/\D/g, ''), 10) || 127;

  const servingNum = typeof currentBooking.currentServingToken === 'number'
    ? currentBooking.currentServingToken
    : parseInt(String(currentBooking.currentServingToken).replace(/\D/g, ''), 10) || 123;

  const farmersAhead = Math.max(0, tokenNum - servingNum);
  const waitMinutes = Math.max(0, farmersAhead * 8);

  const statusSpeech = language === 'te'
    ? `లైవ్ క్యూ స్థితి. మీ టోకెన్ నంబర్ ${currentBooking.tokenDisplay || currentBooking.tokenNumber}. ప్రస్తుతం సర్వ్ చేస్తున్న టోకెన్ ${currentBooking.currentServingToken}. మీ కంటే ముందు ${farmersAhead} మంది రైతులు ఉన్నారు. వేచి ఉండే సమయం దాదాపు ${waitMinutes} నిమిషాలు.`
    : `${t('queue.title')}. Your token is ${currentBooking.tokenDisplay || currentBooking.tokenNumber}. Serving now is ${currentBooking.currentServingToken}. ${farmersAhead} farmers ahead of you. Estimated wait time: ${waitMinutes} minutes.`;

  const steps = [
    { key: 'BOOKED', label: t('queue.status_booked'), icon: '📅' },
    { key: 'AT_GATE', label: t('queue.status_at_gate'), icon: '🚛' },
    { key: 'QUALITY_CHECK', label: t('queue.status_weighing'), icon: '⚖️' },
    { key: 'COMPLETED', label: t('queue.status_completed'), icon: '✅' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentBooking.queueStatus);

  return (
    <PageContainer
      title={t('queue.title')}
      subtitle={t('queue.subtitle')}
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
                    ? 'bg-civic-900 border-civic-900 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-civic-300'
                }`}
              >
                <span>{appt.cropIcon}</span>
                <span>{appt.cropName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Giant Live Queue Token Card */}
        <div
          id="token-display-card"
          className="bg-gradient-to-br from-agri-800 via-agri-900 to-agri-950 text-white border-2 border-agri-700 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-agri-700/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-harvest-400 text-slate-950 flex items-center justify-center text-2xl font-black">
                🎫
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-harvest-300">
                  {t('queue.your_token')}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {currentBooking.cropName} ({currentBooking.estimatedQuantityQuintals} Quintals)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <VoiceSpeaker text={statusSpeech} size="md" className="bg-white text-agri-900" />
            </div>
          </div>

          {/* Token Numbers Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Your Token */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-agri-200 block">
                {t('queue.your_token')}
              </span>
              <div className="text-5xl sm:text-6xl font-black text-harvest-400 font-mono tracking-tight">
                #{currentBooking.tokenDisplay || currentBooking.tokenNumber}
              </div>
              <span className="text-xs text-agri-200 font-semibold block">
                {currentBooking.slotDate} ({currentBooking.slotTime})
              </span>
            </div>

            {/* Serving Now */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-agri-200 block">
                {t('queue.serving_now')}
              </span>
              <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
                #{currentBooking.currentServingToken}
              </div>
              <span className="text-xs text-harvest-300 font-bold block animate-pulse">
                ● Currently on Weighbridge
              </span>
            </div>
          </div>

          {/* Quick Real-Time Metrics */}
          <div id="queue-metrics" className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-agri-950/60 rounded-xl p-3.5 flex items-center gap-3 border border-agri-800">
              <Users size={24} className="text-harvest-400 flex-shrink-0" />
              <div>
                <span className="text-[11px] text-agri-300 block font-semibold">
                  {t('queue.farmers_ahead')}
                </span>
                <strong className="text-lg sm:text-xl text-white font-black">
                  {farmersAhead} {farmersAhead === 1 ? 'Farmer' : 'Farmers'}
                </strong>
              </div>
            </div>

            <div className="bg-agri-950/60 rounded-xl p-3.5 flex items-center gap-3 border border-agri-800">
              <Clock size={24} className="text-harvest-400 flex-shrink-0" />
              <div>
                <span className="text-[11px] text-agri-300 block font-semibold">
                  {t('queue.est_wait_time')}
                </span>
                <strong className="text-lg sm:text-xl text-harvest-300 font-black">
                  ~{waitMinutes} {t('queue.minutes')}
                </strong>
              </div>
            </div>
          </div>

          {/* Location details */}
          <div className="text-xs sm:text-sm text-agri-200 flex items-center gap-2 pt-2 border-t border-agri-700/80">
            <MapPin size={16} className="text-harvest-400 flex-shrink-0" />
            <span><strong>Centre:</strong> {currentBooking.centreName}</span>
          </div>
        </div>

        {/* Live Step Progress Timeline */}
        <div id="procurement-stage-timeline" className="bg-white border-2 border-agri-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base sm:text-lg font-bold text-slate-900">
              {language === 'te' ? 'సేకరణ దశల పురోగతి' : 'Procurement Stage Progress'}
            </h4>
            <VoiceSpeaker text={language === 'te' ? 'సేకరణ దశల పురోగతి' : 'Procurement Stage Progress'} size="sm" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((step, idx) => {
              const isPast = idx < (currentStepIndex === -1 ? 0 : currentStepIndex);
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`p-3.5 rounded-2xl border-2 text-center space-y-1.5 transition-all ${
                    isCurrent
                      ? 'border-agri-600 bg-agri-50 ring-2 ring-agri-300 shadow-xs'
                      : isPast
                      ? 'border-agri-200 bg-warmgray-50'
                      : 'border-slate-200 bg-white opacity-50'
                  }`}
                >
                  <div className="text-2xl">{step.icon}</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    {step.label}
                  </div>
                  {isCurrent && (
                    <span className="inline-block bg-agri-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      In Progress
                    </span>
                  )}
                  {isPast && (
                    <span className="inline-block text-agri-700 text-[11px] font-bold">
                      ✓ Done
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Load-Aware Centre Status Notice */}
        {(isHighLoad || isAttention) && (
          <div className={`border-2 rounded-2xl p-4 flex items-start gap-3 text-sm font-semibold ${
            isHighLoad ? 'bg-red-50 border-red-300 text-red-800' : 'bg-harvest-50 border-harvest-400 text-harvest-900'
          }`}>
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                {isHighLoad
                  ? (language === 'te' ? '🔴 సెంటర్ ఇప్పుడు హై లోడ్‌లో ఉంది' : '🔴 Centre is currently under high load')
                  : (language === 'te' ? '⚠️ సెంటర్ బిజీగా ఉంది' : '⚠️ Centre is busy — higher than usual wait times')}
              </p>
              <p className="text-xs font-medium opacity-80">
                {centreOps?.farmersWaiting ?? ''} {language === 'te' ? 'రైతులు వేచి ఉన్నారు.' : 'farmers are currently waiting.'}
                {centreOps?.overloadWarningTime ? ` ${language === 'te' ? 'పీక్ లోడ్:' : 'Peak load expected around'} ${centreOps.overloadWarningTime}.` : ''}
              </p>
              <button
                type="button"
                onClick={() => navigate('/farmer/pre-arrival')}
                className={`inline-flex items-center gap-1.5 text-xs font-black underline underline-offset-2 ${
                  isHighLoad ? 'text-red-700 hover:text-red-900' : 'text-harvest-800 hover:text-harvest-950'
                } transition-colors`}
              >
                🚗 {language === 'te' ? 'ఇప్పుడు వెళ్లచ్చా? చెక్ చేయండి' : 'Should I go now? Run pre-arrival check'}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Farmer Advice Card */}
        <div className="bg-harvest-50 border-2 border-harvest-400 rounded-2xl p-4 flex items-start gap-3 text-slate-900 font-semibold text-sm">
          <AlertCircle size={22} className="text-harvest-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p>{t('queue.gate_advice')}</p>
            <p className="text-xs text-slate-600 font-normal">
              {language === 'te'
                ? 'మీ ఆధార్ కార్డు, బ్యాంక్ పాస్‌బుక్ వెంట ఉంచుకోండి.'
                : 'Keep your Aadhaar Card and Bank Passbook ready at the counter.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <PrimaryButton
            onClick={() => advanceQueue()}
            variant="outline"
            size="md"
            icon={<RefreshCw size={20} />}
          >
            {t('queue.refresh_btn')}
          </PrimaryButton>

          <PrimaryButton
            onClick={() => navigate('/farmer/procurement')}
            variant="primary"
            size="md"
            icon={<Scale size={20} />}
          >
            {t('dashboard.card_procurement')} &rarr;
          </PrimaryButton>
        </div>
      </div>
    </PageContainer>
  );
};

