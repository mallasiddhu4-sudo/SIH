/**
 * MyProcurementPlanPage.tsx
 *
 * Shows ALL confirmed multi-crop plan appointments, each with its own
 * token, queue status, procurement details, and payment status.
 * No appointment collapses or hides another.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket, Warehouse, Calendar, Clock, Scale, CheckCircle2,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, IndianRupee,
  Users, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProcurement } from '../../context/ProcurementContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import type { ProcurementPlanAppointment } from '../../types';

// ─── Queue step label ─────────────────────────────────────────────────────────

const QUEUE_LABEL: Record<string, string> = {
  BOOKED: '📅 Scheduled',
  AT_GATE: '🚛 At Gate',
  QUALITY_CHECK: '🔬 Quality Check',
  WEIGHING: '⚖️ Weighing',
  UNLOADING: '📦 Unloading',
  COMPLETED: '✅ Completed',
};

const PAYMENT_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  DBT_PROCESSING: 'DBT Processing',
  CREDITED_TO_BANK: '✅ Credited to Bank',
};

// ─── Single appointment card ──────────────────────────────────────────────────

interface AppointmentCardProps {
  appt: ProcurementPlanAppointment;
  idx: number;
  onRefresh: (id: string) => void;
  language: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appt, idx, onRefresh, language }) => {
  const [expanded, setExpanded] = useState(true);

  const tokenNum = appt.tokenNumber;
  const servingNum = parseInt(appt.currentServingToken.replace(/\D/g, ''), 10) || (tokenNum - 3);
  const farmersAhead = Math.max(0, tokenNum - servingNum);
  const waitMinutes = farmersAhead * 8;

  const isActive = appt.queueStatus !== 'COMPLETED' && appt.bookingStatus !== 'CANCELLED';
  const isScheduled = appt.queueStatus === 'BOOKED';
  const isCancelled = appt.bookingStatus === 'CANCELLED';

  const cardSpeech = language === 'te'
    ? `${appt.cropName} అపాయింట్మెంట్. టోకెన్ ${appt.tokenDisplay}. కేంద్రం ${appt.centreName.split('(')[0].trim()}. తేదీ ${appt.slotDate}. సమయం ${appt.slotTime}. ${isScheduled ? 'షెడ్యూల్ చేయబడింది.' : `${farmersAhead} మంది రైతులు ముందు ఉన్నారు. వేచి ఉండే సమయం ${waitMinutes} నిమిషాలు.`}`
    : `${appt.cropName} appointment. Token ${appt.tokenDisplay}. Centre ${appt.centreName.split('(')[0].trim()}. Date ${appt.slotDate}. Time ${appt.slotTime}. ${isScheduled ? 'Scheduled.' : `${farmersAhead} farmers ahead. Est. wait ${waitMinutes} minutes.`}`;

  return (
    <div className={`bg-white border-2 rounded-2xl overflow-hidden shadow-sm transition-all ${
      isCancelled ? 'border-slate-200 opacity-60'
      : appt.queueStatus === 'COMPLETED' ? 'border-green-300'
      : 'border-agri-300'
    }`}>
      {/* Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none ${
          isCancelled ? 'bg-slate-500' : 'bg-agri-800'
        } text-white`}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{appt.cropIcon}</span>
          <div className="min-w-0">
            <p className="font-black text-base leading-tight">{appt.cropName}</p>
            <p className="text-xs text-agri-300">
              Appt #{idx + 1} · {appt.estimatedQuantityQuintals} Qt
              {isCancelled ? ' · CANCELLED' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <VoiceSpeaker text={cardSpeech} size="sm" className="bg-white/20 text-white hover:bg-white/30 border-white/20" />
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Token pill — always visible */}
      <div className="bg-harvest-100 border-b border-harvest-300 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket size={18} className="text-harvest-700" />
          <div>
            <p className="text-[10px] font-black text-harvest-800 uppercase tracking-wide">
              {language === 'te' ? 'మీ టోకెన్' : 'Your Token'}
            </p>
            <p className="text-2xl font-black text-slate-950 font-mono leading-none">#{appt.tokenDisplay}</p>
          </div>
        </div>
        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
          appt.queueStatus === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-300'
          : isCancelled ? 'bg-slate-100 text-slate-600 border-slate-300'
          : isScheduled ? 'bg-blue-100 text-blue-800 border-blue-300'
          : 'bg-agri-100 text-agri-900 border-agri-300'
        }`}>
          {QUEUE_LABEL[appt.queueStatus] || appt.queueStatus}
        </span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Centre / Date / Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-start gap-2">
              <Warehouse size={14} className="text-agri-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Centre</p>
                <p className="font-bold text-slate-900 leading-tight">{appt.centreName.split('(')[0].trim()}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-start gap-2">
              <Calendar size={14} className="text-civic-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Date</p>
                <p className="font-bold text-slate-900">{appt.slotDate}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-start gap-2">
              <Clock size={14} className="text-harvest-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Time</p>
                <p className="font-bold text-slate-900">{appt.slotTime}</p>
              </div>
            </div>
          </div>

          {/* Live queue (shown only when not just scheduled) */}
          {!isScheduled && !isCancelled && (
            <div className="bg-agri-950 text-white rounded-2xl p-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-harvest-400" />
                <div>
                  <p className="text-[10px] text-agri-300 font-semibold">Farmers Ahead</p>
                  <p className="text-xl font-black text-white">{farmersAhead}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-harvest-400" />
                <div>
                  <p className="text-[10px] text-agri-300 font-semibold">Est. Wait</p>
                  <p className="text-xl font-black text-harvest-300">~{waitMinutes} min</p>
                </div>
              </div>
              <div className="col-span-2 text-xs text-agri-300">
                Serving now: <span className="font-black text-white">#{appt.currentServingToken}</span>
              </div>
            </div>
          )}

          {/* Scheduled info */}
          {isScheduled && !isCancelled && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs text-blue-800 font-semibold">
              <AlertCircle size={14} className="flex-shrink-0" />
              {language === 'te'
                ? 'ఈ అపాయింట్మెంట్ షెడ్యూల్ చేయబడింది. మీ స్లాట్ సమయంలో క్యూ లైవ్ అవుతుంది.'
                : 'This appointment is scheduled. Live queue will appear when your slot becomes active.'}
            </div>
          )}

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-warmgray-50 border border-slate-200 rounded-xl p-2.5">
              <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Expected Qty</p>
              <p className="font-black text-slate-900 text-base">{appt.estimatedQuantityQuintals} Qt</p>
            </div>
            <div className={`rounded-xl p-2.5 border ${appt.actualWeightQuintals !== undefined ? 'bg-agri-50 border-agri-200' : 'bg-slate-50 border-dashed border-slate-300'}`}>
              <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Actual Weight</p>
              <p className={`font-black text-base ${appt.actualWeightQuintals !== undefined ? 'text-agri-900' : 'text-slate-400'}`}>
                {appt.actualWeightQuintals !== undefined ? `${appt.actualWeightQuintals} Qt` : 'Not yet weighed'}
              </p>
            </div>
          </div>

          {/* Quality & Financial (if available) */}
          {appt.qualityGrade && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Quality Grade</p>
                <p className="font-bold text-slate-900">{appt.qualityGrade}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Moisture</p>
                <p className="font-bold text-slate-900">{appt.moisturePercent ?? '—'}%</p>
              </div>
            </div>
          )}

          {appt.grossAmount !== undefined && (
            <div className="bg-agri-800 text-white rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee size={18} className="text-harvest-400" />
                <div>
                  <p className="text-[10px] text-agri-300 font-semibold uppercase">Net Payable</p>
                  <p className="text-2xl font-black font-mono">₹{(appt.netPayableAmount || appt.grossAmount).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                appt.paymentStatus === 'CREDITED_TO_BANK' ? 'bg-green-400 text-slate-900'
                : appt.paymentStatus === 'DBT_PROCESSING' ? 'bg-blue-400 text-white'
                : 'bg-harvest-400 text-slate-900'
              }`}>
                {PAYMENT_LABEL[appt.paymentStatus]}
              </span>
            </div>
          )}

          {/* Payment status (plain) */}
          {appt.grossAmount === undefined && (
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-500 font-semibold">Payment Status</span>
              <span className="font-bold text-slate-700">{PAYMENT_LABEL[appt.paymentStatus]}</span>
            </div>
          )}

          {/* Refresh queue button */}
          {isActive && !isScheduled && (
            <button
              type="button"
              onClick={() => onRefresh(appt.id)}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2 px-4 rounded-xl border-2 border-agri-300 text-agri-700 hover:bg-agri-50 transition-colors"
            >
              <RefreshCw size={14} />
              {language === 'te' ? 'క్యూ రిఫ్రెష్ చేయండి' : 'Refresh Queue'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const MyProcurementPlanPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { activePlanAppointments, pastPlanAppointments, advancePlanAppointmentQueue } = useProcurement();

  const allActive = activePlanAppointments.filter(a => a.bookingStatus !== 'CANCELLED');
  const cancelled = activePlanAppointments.filter(a => a.bookingStatus === 'CANCELLED');
  const allPast = pastPlanAppointments;

  const overviewSpeech = language === 'te'
    ? `నా ప్రొక్యూర్మెంట్ ప్లాన్. మీకు ${allActive.length} సక్రియ అపాయింట్మెంట్లు ఉన్నాయి. ప్రతి పంటకు స్వతంత్ర టోకెన్ మరియు క్యూ ఉంది.`
    : `My Procurement Plan. You have ${allActive.length} active appointments. Each crop has its own independent token and queue.`;

  return (
    <PageContainer
      title={language === 'te' ? 'నా ప్రొక్యూర్మెంట్ ప్లాన్' : 'My Procurement Plan'}
      subtitle={language === 'te' ? 'మీ అన్ని పంట అపాయింట్మెంట్లు' : 'All your crop appointments'}
      showBackButton
      backTo="/farmer/dashboard"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-black text-slate-900 text-base">
                {allActive.length} {allActive.length === 1 ? 'Appointment' : 'Appointments'} Active
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'te' ? 'ప్రతి పంటకు స్వంత టోకెన్ ఉంది' : 'Each crop has its own token'}
              </p>
            </div>
          </div>
          <VoiceSpeaker text={overviewSpeech} size="sm" />
        </div>

        {/* No appointments */}
        {allActive.length === 0 && allPast.length === 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-4">
            <div className="text-5xl">🌾</div>
            <h3 className="text-xl font-bold text-slate-800">
              {language === 'te' ? 'ప్లాన్ అపాయింట్మెంట్లు లేవు' : 'No Plan Appointments Yet'}
            </h3>
            <p className="text-slate-600 text-sm">
              {language === 'te'
                ? 'మల్టీ-క్రాప్ ప్లానర్ ఉపయోగించి మీ పంటలను నిర్ధారించండి.'
                : 'Use the Multi-Crop Planner to create and confirm your crop appointments.'}
            </p>
            <PrimaryButton onClick={() => navigate('/farmer/multi-crop')}>
              🌾 {language === 'te' ? 'మల్టీ-క్రాప్ ప్లానర్' : 'Open Multi-Crop Planner'}
            </PrimaryButton>
          </div>
        )}

        {/* Active appointments */}
        {allActive.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-agri-700">
                Active Appointments ({allActive.length})
              </span>
              <div className="flex-1 h-px bg-agri-200" />
            </div>
            {allActive.map((appt, idx) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                idx={idx}
                onRefresh={advancePlanAppointmentQueue}
                language={language}
              />
            ))}
          </div>
        )}

        {/* Cancelled */}
        {cancelled.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Cancelled ({cancelled.length})
            </p>
            {cancelled.map((appt, idx) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                idx={idx}
                onRefresh={() => {}}
                language={language}
              />
            ))}
          </div>
        )}

        {/* Past completed */}
        {allPast.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">
              Completed History ({allPast.length})
            </p>
            {allPast.map((appt, idx) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                idx={idx}
                onRefresh={() => {}}
                language={language}
              />
            ))}
          </div>
        )}

        {/* Plan another button */}
        <div className="pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/farmer/multi-crop')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-dashed border-agri-300 text-agri-700 font-bold text-sm hover:bg-agri-50 transition-colors"
          >
            <span>+</span>
            {language === 'te' ? 'కొత్త ప్లాన్ చేయండి' : 'Plan Another Multi-Crop Booking'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </PageContainer>
  );
};
