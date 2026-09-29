import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2, AlertCircle, XCircle, ArrowRight, Clock,
  MapPin, Warehouse, Leaf, Info
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProcurement } from '../../context/ProcurementContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CENTRES } from '../../data/mockCentres';
import { MOCK_CENTRE_OPERATIONS } from '../../data/mockCentreOperations';
import type { PreArrivalCheck, PreArrivalDecision } from '../../types';

const computePreArrival = (
  centreId: string,
  farmersAhead: number,
  estimatedWaitMins: number,
  cropId: string
): PreArrivalCheck => {
  const centre = MOCK_CENTRES.find(c => c.id === centreId);
  const ops = MOCK_CENTRE_OPERATIONS[centreId];

  const cropAccepted = centre?.acceptedCropIds.includes(cropId) ?? true;
  const centreAvailable = centre?.operationalStatus !== 'OFFLINE';
  const isHighLoad = centre?.operationalStatus === 'HIGH_LOAD';
  const isAttention = centre?.operationalStatus === 'ATTENTION';

  const checklist = {
    slotConfirmed: true,
    cropAccepted,
    quantityRecorded: true,
    centreAvailable,
    withinSlotTime: true
  };

  let decision: PreArrivalDecision = 'GO_NOW';
  const reasons: string[] = [];
  let recommendedArrivalTime: string | undefined;
  let alternativeCentreId: string | undefined;
  let alternativeCentreName: string | undefined;
  let alternativeSlotTime: string | undefined;

  if (!cropAccepted) {
    decision = 'CONSIDER_ALTERNATIVE';
    reasons.push('This centre does not accept your crop. You need to go to a different centre.');
    // Find alternative
    const alt = MOCK_CENTRES.find(c => c.id !== centreId && c.acceptedCropIds.includes(cropId) && c.operationalStatus === 'NORMAL');
    if (alt) {
      alternativeCentreId = alt.id;
      alternativeCentreName = alt.name;
      alternativeSlotTime = '11:00 AM';
    }
  } else if (!centreAvailable) {
    decision = 'CONSIDER_ALTERNATIVE';
    reasons.push('This centre is currently offline. Please contact the helpline or choose another centre.');
  } else if (isHighLoad && farmersAhead > 8) {
    decision = 'WAIT';
    reasons.push(`Centre is under high load. Currently ${farmersAhead} farmers ahead of you.`);
    reasons.push('Recommended: Arrive after the peak period for a shorter wait.');
    recommendedArrivalTime = ops?.overloadWarningTime ? '2:00 PM' : '12:30 PM';
    // Suggest alternative
    const alt = MOCK_CENTRES.find(c => c.id !== centreId && c.operationalStatus === 'NORMAL' && c.acceptedCropIds.includes(cropId));
    if (alt) {
      alternativeCentreId = alt.id;
      alternativeCentreName = alt.name;
      alternativeSlotTime = '11:00 AM';
    }
  } else if (isAttention && farmersAhead > 5) {
    decision = 'WAIT';
    reasons.push(`Centre load is high. ${farmersAhead} farmers are ahead. Estimated wait: ~${estimatedWaitMins} minutes.`);
    recommendedArrivalTime = '12:00 PM';
  } else if (farmersAhead <= 3) {
    decision = 'GO_NOW';
    reasons.push(`Only ${farmersAhead} farmers ahead of you. Centre load is normal.`);
    reasons.push('Good time to arrive. Your expected wait time is short.');
  } else {
    decision = 'GO_NOW';
    reasons.push(`${farmersAhead} farmers ahead. Centre is operating normally.`);
    reasons.push(`Estimated wait: ~${estimatedWaitMins} minutes.`);
  }

  return {
    decision,
    reasons,
    recommendedArrivalTime,
    alternativeCentreId,
    alternativeCentreName,
    alternativeSlotTime,
    centreLoadStatus: centre?.operationalStatus ?? 'NORMAL',
    estimatedWaitMins,
    queueCount: farmersAhead,
    checklist
  };
};

const DECISION_CONFIG = {
  GO_NOW: {
    icon: '✅',
    color: 'border-green-400 bg-green-50',
    headerColor: 'bg-green-600',
    textColor: 'text-green-800',
    label: { en: 'GO NOW — Good Time to Leave', te: 'ఇప్పుడే వెళ్లండి — సరైన సమయం' }
  },
  WAIT: {
    icon: '⏳',
    color: 'border-harvest-400 bg-harvest-50',
    headerColor: 'bg-harvest-500',
    textColor: 'text-harvest-900',
    label: { en: 'WAIT — Centre is Busy', te: 'వేచి ఉండండి — సెంటర్ బిజీగా ఉంది' }
  },
  CONSIDER_ALTERNATIVE: {
    icon: '↩️',
    color: 'border-red-300 bg-red-50',
    headerColor: 'bg-red-600',
    textColor: 'text-red-800',
    label: { en: 'CONSIDER ALTERNATIVE CENTRE', te: 'వేరే సెంటర్ పరిశీలించండి' }
  }
};

export const PreArrivalPage: React.FC = () => {
  const { language } = useLanguage();
  const { activePlanAppointments } = useProcurement();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<PreArrivalCheck | null>(null);

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

  // Reset checked state when changing tabs
  useEffect(() => {
    setChecked(false);
    setResult(null);
  }, [selectedAppointmentId]);

  const farmerToken = currentBooking?.tokenNumber;
  const servingToken = currentBooking?.currentServingToken;
  const tokenNum = typeof farmerToken === 'number' ? farmerToken : parseInt(String(farmerToken || '127').replace(/\D/g, '')) || 127;
  const servingNum = typeof servingToken === 'number' ? servingToken : parseInt(String(servingToken || '123').replace(/\D/g, '')) || 123;
  const farmersAhead = Math.max(0, tokenNum - servingNum);
  const estimatedWaitMins = farmersAhead * 8;

  const centre = MOCK_CENTRES.find(c => c.id === currentBooking?.centreId) || MOCK_CENTRES[0];

  const handleCheck = () => {
    const r = computePreArrival(
      currentBooking?.centreId || 'ppc_101',
      farmersAhead,
      estimatedWaitMins,
      currentBooking?.cropId || 'paddy_common'
    );
    setResult(r);
    setChecked(true);
  };

  const decisionSpeech = result
    ? `Pre-arrival check. Decision: ${result.decision === 'GO_NOW' ? (language === 'te' ? 'ఇప్పుడే వెళ్లండి' : 'Go now. Good time.') : result.decision === 'WAIT' ? (language === 'te' ? 'వేచి ఉండండి' : 'Wait a while. Centre is busy.') : (language === 'te' ? 'వేరే సెంటర్ వెళ్లండి' : 'Consider an alternative centre.')}. ${result.reasons.join('. ')}`
    : language === 'te'
      ? 'ఇప్పుడు వెళ్లచ్చా? చెక్ నొక్కి తెలుసుకోండి.'
      : 'Should I go now? Tap Check to find out if it is a good time.';

  return (
    <PageContainer
      title={language === 'te' ? 'ఇప్పుడు వెళ్లచ్చా? — Ready Check' : 'Pre-Arrival Readiness Check'}
      subtitle={language === 'te' ? 'సెంటర్కి బయలుదేరే ముందు ఒక్కసారి చెక్ చేయండి' : 'Check before leaving — know the best time to arrive at the centre'}
      showBackButton
      backTo="/farmer/dashboard"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Dynamic Crop Tabs */}
        {activeAppts.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
            {activeAppts.map(appt => (
              <button
                key={appt.id}
                onClick={() => setSelectedAppointmentId(appt.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border-2 ${
                  selectedAppointmentId === appt.id
                    ? 'bg-blue-900 border-blue-900 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                <span>{appt.cropIcon}</span>
                <span>{appt.cropName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Info Panel */}
        {currentBooking ? (
          <div className="bg-white border-2 border-agri-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="text-2xl">🎫</span>
              <span>Token #{currentBooking.tokenDisplay || currentBooking.tokenNumber}</span>
              <VoiceSpeaker text={decisionSpeech} size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Leaf size={15} className="text-agri-700" />
                <span>{currentBooking.cropName} — {currentBooking.estimatedQuantityQuintals} Qt</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={15} className="text-agri-700" />
                <span className="truncate">{currentBooking.centreName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={15} className="text-agri-700" />
                <span>Slot: {currentBooking.slotDate}, {currentBooking.slotTime}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Warehouse size={15} className="text-agri-700" />
                <span>Load: <span className={`font-bold ${centre.operationalStatus === 'HIGH_LOAD' ? 'text-red-700' : centre.operationalStatus === 'ATTENTION' ? 'text-harvest-700' : 'text-green-700'}`}>
                  {centre.operationalStatus.replace('_', ' ')}
                </span></span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700">
              <span className="text-slate-500">Farmers Ahead:</span> <strong>{farmersAhead}</strong>
              <span className="mx-3 text-slate-300">|</span>
              <span className="text-slate-500">Est. Wait:</span> <strong>~{estimatedWaitMins} min</strong>
            </div>
          </div>
        ) : (
          <div className="bg-harvest-50 border-2 border-harvest-300 rounded-2xl p-5 text-center space-y-3">
            <div className="text-3xl">📋</div>
            <p className="font-bold text-harvest-900">
              {language === 'te' ? 'సక్రియ స్లాట్ బుకింగ్ లేదు. ముందు స్లాట్ బుక్ చేయండి.' : 'No active slot. Please book a slot first.'}
            </p>
            <PrimaryButton onClick={() => navigate('/farmer/book-slot')}>
              {language === 'te' ? 'స్లాట్ బుక్ చేయండి' : 'Book a Slot'}
            </PrimaryButton>
          </div>
        )}

        {/* Readiness Checklist */}
        {currentBooking && (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              {language === 'te' ? 'సిద్ధత తనిఖీ జాబితా' : 'Readiness Checklist'}
            </h3>
            <div className="space-y-2">
              {[
                { check: true, label: language === 'te' ? 'స్లాట్ నిర్ధారించబడింది' : 'Slot confirmed', key: 'slot' },
                {
                  check: centre.acceptedCropIds.includes(currentBooking.cropId || 'paddy_common'),
                  label: language === 'te' ? `మీ పంట (${currentBooking.cropName}) ఈ సెంటర్‌లో అంగీకరించబడింది` : `Your crop (${currentBooking.cropName}) accepted at this centre`,
                  key: 'crop'
                },
                { check: true, label: language === 'te' ? 'అంచనా పరిమాణం నమోదు చేయబడింది' : 'Estimated quantity recorded', key: 'qty' },
                {
                  check: centre.operationalStatus !== 'OFFLINE',
                  label: language === 'te' ? 'సెంటర్ పనిచేస్తోంది' : 'Centre is operational',
                  key: 'centre'
                },
                {
                  check: centre.operationalStatus === 'NORMAL',
                  label: language === 'te' ? `సెంటర్ లోడ్: ${centre.operationalStatus.replace('_', ' ')}` : `Centre load status: ${centre.operationalStatus.replace('_', ' ')}`,
                  key: 'load'
                }
              ].map(item => (
                <div key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border ${item.check ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {item.check
                    ? <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                    : <XCircle size={18} className="text-red-600 flex-shrink-0" />}
                  <span className={`text-sm font-semibold ${item.check ? 'text-green-800' : 'text-red-800'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Check Button */}
        {currentBooking && !checked && (
          <PrimaryButton
            onClick={handleCheck}
            size="lg"
            variant="primary"
          >
            {language === 'te' ? '🔍 ఇప్పుడు వెళ్లచ్చా? — చెక్ చేయండి' : '🔍 Check — Should I Go Now?'}
          </PrimaryButton>
        )}

        {/* Decision Result */}
        {checked && result && (
          <div id="pre-arrival-decision" className={`border-2 ${DECISION_CONFIG[result.decision].color} rounded-3xl overflow-hidden`}>
            {/* Decision Header */}
            <div className={`${DECISION_CONFIG[result.decision].headerColor} text-white p-5 flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{DECISION_CONFIG[result.decision].icon}</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider opacity-80">Genie Recommendation</p>
                  <h3 className="text-lg sm:text-xl font-black">
                    {language === 'te'
                      ? DECISION_CONFIG[result.decision].label.te
                      : DECISION_CONFIG[result.decision].label.en}
                  </h3>
                </div>
              </div>
              <VoiceSpeaker text={decisionSpeech} size="md" className="bg-white/20 text-white hover:bg-white/30" autoRead={true} />
            </div>

            {/* Reasons */}
            <div className="p-5 space-y-3">
              {result.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                  <Info size={16} className="flex-shrink-0 mt-0.5 text-slate-500" />
                  <span>{reason}</span>
                </div>
              ))}

              {result.recommendedArrivalTime && (
                <div className="bg-white border border-harvest-300 rounded-xl p-3 flex items-center gap-2 text-sm font-bold text-harvest-900">
                  <Clock size={16} />
                  <span>Recommended arrival time: <strong>{result.recommendedArrivalTime}</strong></span>
                </div>
              )}

              {result.alternativeCentreName && (
                <div className="bg-white border border-blue-200 rounded-xl p-3 text-sm font-semibold text-slate-800 space-y-1">
                  <p className="flex items-center gap-2 font-bold text-blue-800">
                    <Warehouse size={16} />
                    Alternative Centre
                  </p>
                  <p className="text-slate-700">{result.alternativeCentreName}</p>
                  {result.alternativeSlotTime && (
                    <p className="text-xs text-slate-500">Suggested time: {result.alternativeSlotTime}</p>
                  )}
                </div>
              )}

              {/* Queue Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-semibold">Farmers Ahead</p>
                  <p className="text-2xl font-black text-slate-900">{result.queueCount}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-semibold">Est. Wait Time</p>
                  <p className="text-2xl font-black text-slate-900">~{result.estimatedWaitMins} min</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <PrimaryButton
                  onClick={() => navigate('/farmer/queue')}
                  variant="primary"
                  icon={<ArrowRight size={18} />}
                >
                  {language === 'te' ? 'క్యూ స్టేటస్ చూడండి' : 'View Live Queue'}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => { setChecked(false); setResult(null); }}
                  className="px-4 py-3 rounded-2xl border-2 border-slate-300 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  {language === 'te' ? 'మళ్ళీ చెక్ చేయండి' : 'Check Again'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Genie Reminder */}
        <div className="bg-agri-50 border border-agri-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-agri-800">
          <span className="text-2xl">🧞</span>
          <span className="font-semibold">
            {language === 'te'
              ? '"ఇప్పుడు వెళ్లచ్చా?" అని జీనీని అడగండి — అది మీకు ఈ పేజీకి తీసుకువస్తుంది.'
              : 'Say "Can I go now?" to Genie — it will bring you to this page instantly.'}
          </span>
        </div>
      </div>
    </PageContainer>
  );
};
