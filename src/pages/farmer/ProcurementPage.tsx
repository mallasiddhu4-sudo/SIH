import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Droplets,
  CheckCircle2,
  Package,
  IndianRupee,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProcurement } from '../../context/ProcurementContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';

export const ProcurementPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentBooking, pastBookings, activePlanAppointments, pastPlanAppointments } = useProcurement();
  const navigate = useNavigate();

  const allAppts = [...activePlanAppointments, ...pastPlanAppointments].filter(a => a.bookingStatus !== 'CANCELLED');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(allAppts[0]?.id);

  // Fallback to legacy single booking if no plan appointments exist
  const activeRecord = allAppts.find(a => a.id === selectedAppointmentId) || allAppts[0] || currentBooking || (pastBookings.length > 0 ? pastBookings[0] : null);

  if (!activeRecord) {
    return (
      <PageContainer
        title={t('procurement.title')}
        showBackButton={true}
        backTo="/farmer/dashboard"
        maxWidth="lg"
      >
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-4">
          <div className="text-5xl">🌾</div>
          <h3 className="text-xl font-bold text-slate-800">No procurement record found</h3>
          <PrimaryButton onClick={() => navigate('/farmer/book-slot')}>
            {t('dashboard.card_book_slot')}
          </PrimaryButton>
        </div>
      </PageContainer>
    );
  }

  const weight = activeRecord.actualWeightQuintals || activeRecord.estimatedQuantityQuintals;
  const moisture = activeRecord.moisturePercent || 14.2;
  const grade = activeRecord.qualityGrade || 'Grade A';
  const gross = activeRecord.grossAmount || (weight * 2320);

  const summarySpeech = language === 'te'
    ? `${t('procurement.title')}. ${activeRecord.cropName}. తూకం: ${weight} క్వింటాళ్లు. తేమ శాతం: ${moisture} శాతం. నాణ్యత గ్రేడ్: ${grade}. మొత్తం విలువ: ₹${gross.toLocaleString('en-IN')}.`
    : `${t('procurement.title')}. ${activeRecord.cropName}. Total Net Weight: ${weight} Quintals. Moisture level: ${moisture} percent. Quality Grade: ${grade}. Total Value: ${gross} Rupees.`;

  return (
    <PageContainer
      title={t('procurement.title')}
      subtitle={t('procurement.subtitle')}
      showBackButton={true}
      backTo="/farmer/dashboard"
    >
      <div className="space-y-6">
        {/* Dynamic Crop Tabs */}
        {allAppts.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
            {allAppts.map(appt => (
              <button
                key={appt.id}
                onClick={() => setSelectedAppointmentId(appt.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border-2 ${
                  selectedAppointmentId === appt.id || (!selectedAppointmentId && activeRecord.id === appt.id)
                    ? 'bg-agri-900 border-agri-900 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-agri-300'
                }`}
              >
                <span>{appt.cropIcon || '🌾'}</span>
                <span>{appt.cropName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Top Summary Card */}
        <div className="bg-white border-2 border-agri-600 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-agri-700 text-white flex items-center justify-center text-3xl font-black shadow-sm">
                🌾
              </div>
              <div>
                <span className="text-xs font-bold text-agri-800 uppercase tracking-wider">
                  Token #{activeRecord.tokenDisplay || activeRecord.tokenNumber} • {activeRecord.centreName}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {activeRecord.cropName}
                </h3>
              </div>
            </div>

            <VoiceSpeaker text={summarySpeech} size="md" />
          </div>

          {/* 4 Large Digital Metrics Cards */}
          <div id="procurement-metrics" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Moisture Check */}
            <div id="moisture-check-box" className="bg-agri-50 border-2 border-agri-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-agri-800 flex items-center gap-1.5">
                  <Droplets size={16} className="text-blue-600" />
                  {t('procurement.moisture_check')}
                </span>
                <VoiceSpeaker text={`${t('procurement.moisture_check')}: ${moisture}%`} size="sm" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-agri-950 font-mono">
                  {moisture}%
                </span>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  ✓ {t('procurement.moisture_status_good')}
                </span>
              </div>
            </div>

            {/* 2. Quality Grade */}
            <div className="bg-agri-50 border-2 border-agri-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-agri-800 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-agri-700" />
                  {t('procurement.quality_grade')}
                </span>
                <VoiceSpeaker text={`${t('procurement.quality_grade')}: ${grade}`} size="sm" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {grade}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Certified
                </span>
              </div>
            </div>

            {/* 3. Actual Weight */}
            <div id="weighment-metric-box" className="bg-warmgray-50 border-2 border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Scale size={16} className="text-slate-800" />
                  {t('procurement.total_quintals')}
                </span>
                <VoiceSpeaker text={`${t('procurement.total_quintals')}: ${weight} Quintals`} size="sm" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 font-mono">
                  {weight}
                </span>
                <span className="text-base font-bold text-slate-600">Quintals</span>
              </div>
            </div>

            {/* 4. Gunny Bags */}
            <div className="bg-warmgray-50 border-2 border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Package size={16} className="text-slate-800" />
                  {t('procurement.gunny_bags')}
                </span>
                <VoiceSpeaker text={`${t('procurement.gunny_bags')}: ${activeRecord.gunnyBagsCount || Math.round(weight * 2)} Bags`} size="sm" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 font-mono">
                  {activeRecord.gunnyBagsCount || Math.round(weight * 2)}
                </span>
                <span className="text-base font-bold text-slate-600">Bags</span>
              </div>
            </div>
          </div>

          {/* Total Value Banner */}
          <div className="bg-gradient-to-r from-agri-800 to-agri-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-harvest-300 block">
                {t('procurement.total_value')} (MSP: ₹2,320 / Qt)
              </span>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono">
                ₹{gross.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-agri-100 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-harvest-400" />
              <span>Certified by Officer at Center</span>
            </div>
          </div>
        </div>

        {/* Action Button to Next Step: Payment Status */}
        <PrimaryButton
          onClick={() => navigate('/farmer/payment')}
          size="lg"
          variant="primary"
          icon={<IndianRupee size={22} />}
        >
          {t('dashboard.card_payment')} &rarr;
        </PrimaryButton>
      </div>
    </PageContainer>
  );
};

