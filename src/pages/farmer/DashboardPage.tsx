import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Warehouse,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Ticket,
  Scale,
  CheckCircle2,
  History
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useProcurement } from '../../context/ProcurementContext';
import { useGenie } from '../../context/GenieContext';
import { PageContainer } from '../../components/common/PageContainer';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';

export const DashboardPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { farmer } = useAuth();
  const { pastBookings, activePlanAppointments } = useProcurement();
  const { openGenie } = useGenie();
  const navigate = useNavigate();

  const farmerName = farmer?.name || 'Ravi Kumar';
  const farmerId = farmer?.farmerId || 'FRM10234';

  const activeAppts = activePlanAppointments.filter(a => a.bookingStatus !== 'CANCELLED' && a.bookingStatus !== 'COMPLETED' && a.queueStatus !== 'COMPLETED');
  const hasActiveBooking = activeAppts.length > 0;
  const firstAppt = activeAppts[0];

  const welcomeOverview = language === 'te'
    ? `నమస్కారం ${farmerName}. ${hasActiveBooking && firstAppt ? `మీ తదుపరి సేకరణ తేదీ ${firstAppt.slotDate} ${firstAppt.slotTime}, కేంద్రం: ${firstAppt.centreName}.` : 'మీకు ప్రస్తుతం సక్రియ స్లాట్ లేదు. కొత్త స్లాట్ బుక్ చేసుకోవచ్చు.'}`
    : `Welcome ${farmerName}. ${hasActiveBooking && firstAppt ? `Your next visit is on ${firstAppt.slotDate} at ${firstAppt.slotTime}, Centre: ${firstAppt.centreName}.` : 'You have no active upcoming slot. You can book a slot below.'}`;

  const choice1Speech = hasActiveBooking
    ? (language === 'te' ? 'నా స్లాట్ నిర్వహణ. తేదీ మార్పు లేదా రద్దు చేయండి.' : 'Manage My Slot. View details, reschedule date, or cancel booking.')
    : (language === 'te' ? 'స్లాట్ బుక్ చేయండి. మీ పంటను తీసుకురావడానికి తేదీ మరియు కేంద్రం ఎంచుకోండి.' : 'Book Procurement Slot. Choose date, time, and centre to sell your crop.');

  const choice2Speech = language === 'te'
    ? 'నా పంట సేకరణ స్థితి. లైవ్ క్యూ లైన్, తూకం, తేమ మరియు బ్యాంక్ DBT జమ వివరాలు చూడండి.'
    : 'Track My Procurement. Check live queue turn, weighment and quality results, and bank DBT credit.';

  const choice3Speech = language === 'te'
    ? 'జీనీ వాయిస్ గైడ్. మీ భాషలో మాట్లాడి సహాయం పొందండి.'
    : 'Ask Genie Voice Guide. Speak in your language for instant navigation and pointer guidance.';

  return (
    <PageContainer maxWidth="3xl">
      {/* 1. Farmer Greeting & Compact Next Visit Summary */}
      <div className="bg-white border-2 border-agri-600 rounded-3xl p-5 sm:p-7 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-agri-700 text-white flex items-center justify-center text-3xl font-black shadow-sm flex-shrink-0 border-2 border-agri-600">
              👨‍🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {language === 'te' ? `నమస్కారం, ${farmerName}` : `Welcome, ${farmerName}`}
                </h2>
                <VoiceSpeaker text={welcomeOverview} size="sm" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                <MapPin size={15} className="text-agri-700" />
                <span>{farmer?.village || 'Rampur'}, {farmer?.district || 'Kurnool'}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-agri-900 bg-agri-50 px-2 py-0.2 rounded border border-agri-200">
                  ID: {farmerId}
                </span>
              </p>
            </div>
          </div>

          {hasActiveBooking && (
            <div className="bg-harvest-100 border border-harvest-400 px-4 py-2 rounded-2xl text-right self-start sm:self-center shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-harvest-900 block">
                {language === 'te' ? 'యాక్టివ్ పంటలు' : 'Active Crops'}
              </span>
              <strong className="text-2xl font-black text-slate-950 font-mono">
                {activeAppts.length}
              </strong>
            </div>
          )}
        </div>

        {/* Next Visit Box (Only shown when booking is active / upcoming) */}
        {hasActiveBooking ? (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 pl-1">
              {language === 'te' ? 'మీ రాబోయే అపాయింట్‌మెంట్‌లు' : 'Your Upcoming Appointments'}
            </h3>
            {activeAppts.map(appt => (
              <div
                key={appt.id}
                id={`next-visit-summary-${appt.id}`}
                onClick={() => navigate('/farmer/manage-slot', { state: { cropMentioned: appt.cropId.split('_')[0] } })}
                className="bg-agri-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-agri-950 transition-colors shadow-md group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-harvest-400 text-slate-950 px-2 py-0.5 rounded uppercase">
                      {appt.cropIcon} {appt.cropName}
                    </span>
                    <span className="text-sm text-agri-200 font-medium">
                      ({appt.estimatedQuantityQuintals} Quintals)
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2 pt-1">
                    <Calendar size={18} className="text-harvest-400" />
                    <span>{appt.slotDate} • {appt.slotTime}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-agri-300">
                    <span className="flex items-center gap-1">
                      <Warehouse size={14} className="text-harvest-400" />
                      {appt.centreName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Ticket size={14} className="text-harvest-400" />
                      #{appt.tokenDisplay}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center font-bold text-xs sm:text-sm bg-white/10 group-hover:bg-white/20 px-3.5 py-2 rounded-xl border border-white/20 transition-colors">
                  <span>{language === 'te' ? 'స్లాట్ మార్చండి / రద్దు' : 'Manage Slot'}</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-warmgray-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎫</span>
              <span className="font-medium">
                {language === 'te'
                  ? 'ప్రస్తుతం సక్రియ బుకింగ్ లేదు. కొత్త స్లాట్ ఎంచుకోండి.'
                  : 'No active upcoming booking. Book a procurement slot below.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/farmer/book-slot')}
              className="text-agri-800 font-bold hover:underline self-start sm:self-center flex items-center gap-1"
            >
              <span>{language === 'te' ? 'స్లాట్ బుక్ చేయండి' : 'Book Slot Now'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. THE 3 PRIMARY CHOICES WITH SPEAKERS */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {/* CHOICE 1: Manage / Book Slot */}
        <div
          id="choice-manage-slot"
          onClick={() => navigate(hasActiveBooking ? '/farmer/manage-slot' : '/farmer/book-slot')}
          className="group p-6 sm:p-7 rounded-3xl bg-white border-2 border-agri-200 hover:border-agri-600 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 select-none focus:outline-none focus:ring-4 focus:ring-agri-300"
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-agri-100 text-agri-800 group-hover:bg-agri-700 group-hover:text-white flex items-center justify-center text-3xl font-bold flex-shrink-0 transition-colors">
              📅
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-agri-950 leading-snug">
                  {hasActiveBooking
                    ? (language === 'te' ? 'నా స్లాట్ నిర్వహణ (Manage Slot)' : 'Manage My Slot')
                    : (language === 'te' ? 'స్లాట్ బుక్ చేయండి (Book Slot)' : 'Book Procurement Slot')}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md">
                {hasActiveBooking
                  ? (language === 'te' ? 'తేదీ మార్పు (Reschedule) లేదా రద్దు (Cancel) చేయండి' : 'View slot details, reschedule date, or cancel booking')
                  : (language === 'te' ? 'మీ పంటను తీసుకురావడానికి తేదీ మరియు కేంద్రం ఎంచుకోండి' : 'Choose date, time, and centre to sell your crop')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <VoiceSpeaker
              text={choice1Speech}
              size="sm"
              label="Listen: Slot Option"
            />
            <div className="w-12 h-12 rounded-2xl bg-warmgray-50 group-hover:bg-agri-100 text-slate-700 group-hover:text-agri-900 flex items-center justify-center transition-colors">
              <ArrowRight size={22} />
            </div>
          </div>
        </div>

        {/* CHOICE 2: Track My Procurement */}
        <div
          id="choice-track-procurement"
          onClick={() => navigate('/farmer/queue')}
          className="group p-6 sm:p-7 rounded-3xl bg-white border-2 border-agri-200 hover:border-agri-600 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 select-none focus:outline-none focus:ring-4 focus:ring-agri-300"
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-civic-100 text-civic-800 group-hover:bg-civic-700 group-hover:text-white flex items-center justify-center text-3xl font-bold flex-shrink-0 transition-colors">
              🌾
            </div>
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-civic-950 leading-snug">
                {language === 'te' ? 'నా పంట సేకరణ స్థితి (Track Procurement)' : 'Track My Procurement'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md">
                {language === 'te'
                  ? 'లైవ్ క్యూ లైన్, తూకం, తేమ మరియు బ్యాంక్ DBT జమ వివరాలు చూడండి'
                  : 'Check live queue turn, weighment & quality results, and bank DBT credit'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <VoiceSpeaker
              text={choice2Speech}
              size="sm"
              label="Listen: Track Option"
            />
            <div className="w-12 h-12 rounded-2xl bg-warmgray-50 group-hover:bg-civic-100 text-slate-700 group-hover:text-civic-900 flex items-center justify-center transition-colors">
              <ArrowRight size={22} />
            </div>
          </div>
        </div>

        {/* CHOICE 3: Ask Genie Guide */}
        <div
          id="choice-ask-genie"
          onClick={openGenie}
          className="group p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-agri-800 to-agri-950 text-white border-2 border-agri-700 shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 select-none focus:outline-none focus:ring-4 focus:ring-agri-400"
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-harvest-400 text-slate-950 flex items-center justify-center text-3xl font-black flex-shrink-0 shadow-sm">
              🧞
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {language === 'te' ? 'జీనీని అడగండి (Ask Genie Guide)' : 'Ask Genie Voice Guide'}
                </h3>
                <span className="text-[10px] bg-harvest-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  Voice
                </span>
              </div>
              <p className="text-xs sm:text-sm text-agri-200 font-medium max-w-md">
                {language === 'te'
                  ? 'మీ భాషలో మాట్లాడి స్లాట్ మార్చడం, టోకెన్ లేదా పేమెంట్ వివరాలు అడగండి'
                  : 'Speak in your language for instant navigation and pointer guidance'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <VoiceSpeaker
              text={choice3Speech}
              size="sm"
              label="Listen: Genie Guide"
              className="bg-white/20 text-white hover:bg-white/30 border-white/30"
            />
            <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-white/20 text-white flex items-center justify-center transition-colors">
              <Sparkles size={22} className="text-harvest-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. NEW SMART TOOLS — Pre-Arrival, Multi-Crop, Crop Info */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Smart Tools</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Multi-Crop Plan summary (shown when active plan appointments exist) */}
        {activePlanAppointments.filter(a => a.bookingStatus !== 'CANCELLED').length > 0 && (
          <div
            id="my-procurement-plan-card"
            onClick={() => navigate('/farmer/my-plan')}
            className="bg-white border-2 border-agri-400 rounded-2xl p-4 cursor-pointer hover:border-agri-600 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-agri-700 text-white flex items-center justify-center text-2xl flex-shrink-0">
                  📋
                </div>
                <div>
                  <p className="font-black text-slate-900 text-base">
                    {language === 'te' ? 'నా ప్రొక్యూర్మెంట్ ప్లాన్' : 'My Procurement Plan'}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    {activePlanAppointments.filter(a => a.bookingStatus !== 'CANCELLED').length} {language === 'te' ? 'సక్రియ అపాయింట్మెంట్లు' : 'active appointments'}
                    {' · '}
                    {activePlanAppointments.filter(a => a.bookingStatus !== 'CANCELLED').map(a => a.cropIcon).join(' ')}
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-agri-700 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1.5">
              {activePlanAppointments.filter(a => a.bookingStatus !== 'CANCELLED').map(appt => (
                <div key={appt.id} className="flex items-center justify-between text-xs bg-agri-50 border border-agri-200 rounded-xl px-3 py-1.5">
                  <span className="font-bold text-slate-800">{appt.cropIcon} {appt.cropName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-agri-800">#{appt.tokenDisplay}</span>
                    <span className="text-slate-500">{appt.slotDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'smart-pre-arrival',
              icon: '🚗',
              label: language === 'te' ? 'ఇప్పుడు వెళ్లచ్చా?' : 'Should I Go Now?',
              sub: language === 'te' ? 'సెంటర్ లోడ్ మరియు వేచి ఉండే సమయం తెలుసుకోండి' : 'Check centre load & expected wait time before leaving',
              to: '/farmer/pre-arrival',
              color: 'border-green-300 hover:border-green-500 bg-green-50 hover:bg-green-100'
            },
            {
              id: 'smart-multi-crop',
              icon: '🌾',
              label: language === 'te' ? 'మల్టీ-క్రాప్ ప్లానర్' : 'Multi-Crop Planner',
              sub: language === 'te' ? 'వేర్వేరు పంటల ప్రొక్యూర్మెంట్ ప్లాన్ చేయండి' : 'Plan optimal centres for all your different crops',
              to: '/farmer/multi-crop',
              color: 'border-agri-300 hover:border-agri-500 bg-agri-50 hover:bg-agri-100'
            },
            {
              id: 'smart-crop-info',
              icon: '📋',
              label: language === 'te' ? 'పంట ధరలు & సమాచారం' : 'Crop Prices & Info',
              sub: language === 'te' ? 'MSP ధర, తేమ పరిమితి మరియు అందుబాటు కేంద్రాలు' : 'MSP rates, moisture limits, accepting centres',
              to: '/farmer/crop-info',
              color: 'border-harvest-300 hover:border-harvest-500 bg-harvest-50 hover:bg-harvest-100'
            }
          ].map(tool => (
            <button
              key={tool.id}
              id={tool.id}
              type="button"
              onClick={() => navigate(tool.to)}
              className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${tool.color} hover:shadow-sm select-none`}
            >
              <div className="text-2xl mb-2">{tool.icon}</div>
              <p className="font-black text-slate-900 text-sm leading-tight">{tool.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{tool.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 4. OPTIONAL PAST COMPLETED VISITS SUMMARY (Only if completed bookings exist) */}
      {pastBookings && pastBookings.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <History size={16} className="text-agri-700" />
              {language === 'te' ? 'గత పూర్తి చేసిన సేకరణలు' : 'Completed Procurement History'}
            </span>
            <span>{pastBookings.length} {pastBookings.length === 1 ? 'Record' : 'Records'}</span>
          </div>

          <div className="space-y-2.5">
            {pastBookings.slice(0, 2).map((b) => (
              <div
                key={b.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-700 shadow-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>{b.cropName}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.2 rounded-full font-bold">
                      ✓ Completed
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Token #{b.tokenDisplay || b.tokenNumber} • {b.slotDate} • {b.centreName}
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-agri-950">
                  ₹{(b.netPayableAmount || 112752).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
};


