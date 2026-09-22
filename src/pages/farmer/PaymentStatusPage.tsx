import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  CheckCircle2,
  Building2,
  Printer,
  Smartphone,
  Clock
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useProcurement } from '../../context/ProcurementContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';

export const PaymentStatusPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { farmer } = useAuth();
  const { currentBooking, pastBookings } = useProcurement();
  const navigate = useNavigate();

  const activeRecord = currentBooking || (pastBookings.length > 0 ? pastBookings[0] : null);

  if (!activeRecord) {
    return (
      <PageContainer
        title={t('payment.title')}
        showBackButton={true}
        backTo="/farmer/dashboard"
        maxWidth="lg"
      >
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-4">
          <div className="text-5xl">💰</div>
          <h3 className="text-xl font-bold text-slate-800">No payment record found</h3>
          <PrimaryButton onClick={() => navigate('/farmer/book-slot')}>
            {t('dashboard.card_book_slot')}
          </PrimaryButton>
        </div>
      </PageContainer>
    );
  }

  const amount = activeRecord.netPayableAmount || 112752;
  const isCredited = activeRecord.paymentStatus === 'CREDITED_TO_BANK';

  const paymentSpeech = language === 'te'
    ? `${t('payment.title')}. మొత్తం చెల్లింపు మొత్తం: ₹${amount.toLocaleString('en-IN')}. స్థితి: ${isCredited ? 'బ్యాంక్ ఖాతాలో జమ అయింది' : 'డిబిటి ప్రాసెసింగ్ లో ఉంది'}. బ్యాంక్: ${farmer?.bankName || 'State Bank of India'}. ఖాతా: ${farmer?.bankAccountMasked || '•••• 4589'}.`
    : `${t('payment.title')}. Total MSP Amount: ${amount} Rupees. Status: ${isCredited ? 'Credited to Bank Account' : 'DBT Processing'}. Bank: ${farmer?.bankName || 'State Bank of India'}. Account: ${farmer?.bankAccountMasked || '•••• 4589'}.`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer
      title={t('payment.title')}
      subtitle={t('payment.subtitle')}
      showBackButton={true}
      backTo="/farmer/dashboard"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Giant Payment Status Card */}
        <div className="bg-white border-2 border-agri-600 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-agri-700 text-white flex items-center justify-center text-3xl font-black shadow-sm">
                💰
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Direct Benefit Transfer (DBT)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {t('payment.total_amount_earned')}
                </h3>
              </div>
            </div>

            <VoiceSpeaker text={paymentSpeech} size="md" />
          </div>

          {/* Big Amount and Credit Status Badge */}
          <div id="payment-amount-box" className="bg-gradient-to-br from-agri-50 to-agri-100 border-2 border-agri-300 rounded-3xl p-6 text-center space-y-3">
            <span className="text-xs font-bold text-agri-800 uppercase tracking-widest block">
              Net Payable MSP Value
            </span>
            <div className="text-5xl sm:text-6xl font-black text-agri-950 font-mono tracking-tight">
              ₹{amount.toLocaleString('en-IN')}
            </div>

            <div className="pt-2">
              {isCredited ? (
                <span className="inline-flex items-center gap-2 bg-green-700 text-white font-bold text-sm sm:text-base px-4 py-1.5 rounded-full shadow-sm">
                  <CheckCircle2 size={20} />
                  <span>{t('payment.status_credited')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-harvest-500 text-slate-950 font-black text-sm sm:text-base px-4 py-1.5 rounded-full shadow-sm">
                  <Clock size={20} />
                  <span>{t('payment.status_processing')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Bank & DBT Details Table */}
          <div id="bank-details-grid" className="bg-warmgray-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={18} className="text-agri-700" />
              Direct Beneficiary Account Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">{t('payment.bank_name')}</span>
                <strong className="text-slate-900 font-bold">{farmer?.bankName || 'State Bank of India'}</strong>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">{t('payment.account_no')}</span>
                <strong className="text-slate-900 font-mono font-bold">{farmer?.bankAccountMasked || '•••• •••• 4589'}</strong>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">{t('payment.ref_id')}</span>
                <strong className="text-slate-900 font-mono text-xs">{activeRecord.transactionRef || 'DBT-2026-AP-9941829'}</strong>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">{t('payment.credited_on')}</span>
                <strong className="text-slate-900 font-bold">{activeRecord.paymentDate || '2026-09-03'}</strong>
              </div>
            </div>
          </div>

          {/* SMS Notification Banner */}
          <div className="bg-civic-50 border border-civic-300 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-civic-900 font-medium">
            <Smartphone size={20} className="text-civic-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong>SMS Token & Payment Receipt:</strong>
              <p>{t('payment.sms_notice')}</p>
            </div>
          </div>
        </div>

        {/* Print Receipt Action */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <PrimaryButton
            type="button"
            onClick={handlePrint}
            variant="outline"
            size="md"
            icon={<Printer size={20} />}
          >
            {t('payment.receipt_btn')}
          </PrimaryButton>

          <PrimaryButton
            type="button"
            onClick={() => navigate('/farmer/dashboard')}
            variant="primary"
            size="md"
          >
            Back to Dashboard
          </PrimaryButton>
        </div>
      </div>
    </PageContainer>
  );
};

