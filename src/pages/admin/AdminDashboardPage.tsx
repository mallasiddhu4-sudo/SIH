import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Scale,
  CreditCard,
  RefreshCw,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProcurement } from '../../context/ProcurementContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';

export const AdminDashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const {
    currentBooking,
    advanceQueue,
    updateWeighment,
    approvePayment,
    markPaymentCredited,
    completeBooking,
    resetDemoData
  } = useProcurement();

  const [weight, setWeight] = useState(currentBooking?.actualWeightQuintals || 48.6);
  const [moisture, setMoisture] = useState(currentBooking?.moisturePercent || 14.2);
  const [grade, setGrade] = useState<'Grade A' | 'Grade B' | 'Standard'>(currentBooking?.qualityGrade || 'Grade A');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAdvance = () => {
    advanceQueue();
    showToast('Queue advanced to next token!');
  };

  const handleSaveWeighment = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeighment(Number(weight), Number(moisture), grade);
    showToast('Weighment & quality inspection recorded!');
  };

  const handleApprovePayment = () => {
    approvePayment();
    showToast('DBT payment approved for release!');
  };

  const handleMarkCredited = () => {
    markPaymentCredited();
    showToast('Payment marked as Credited to Farmer Bank Account!');
  };

  const handleCompleteBooking = () => {
    completeBooking();
    showToast('Procurement completed & moved to History (Removed from Active)!');
  };

  const handleReset = () => {
    resetDemoData();
    showToast('Demo data reset to initial state!');
  };

  return (
    <PageContainer maxWidth="4xl">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-6 space-y-4 border-2 border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-civic-700 text-white flex items-center justify-center text-3xl font-black">
              🛠️
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider bg-civic-800 text-civic-200 px-2.5 py-0.5 rounded">
                SIH Hackathon Evaluator Console
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                {t('admin.title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {t('admin.officer_name')}
              </p>
            </div>
          </div>

          <Link
            to="/farmer/dashboard"
            className="inline-flex items-center gap-2 bg-agri-600 hover:bg-agri-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            <span>View Farmer Portal</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
          💡 <strong>Evaluator Note:</strong> Use the controls below to simulate real-time operations by procurement center staff (calling tokens, weighing crops, releasing DBT). Changes immediately reflect on the farmer's portal.
        </p>

        {toast && (
          <div className="bg-green-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm animate-fade-in flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{toast}</span>
          </div>
        )}
      </div>

      {/* Simulator Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 1. Live Queue Controller */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-agri-800 font-bold">
            <Users size={22} />
            <h3 className="text-lg text-slate-900">Queue Simulator</h3>
          </div>

          <div className="space-y-2 text-sm text-slate-700 bg-warmgray-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between">
              <span>Farmer Token:</span>
              <strong className="font-mono text-base text-agri-900">#{currentBooking?.tokenDisplay || currentBooking?.tokenNumber || 'A127'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Currently Serving:</span>
              <strong className="font-mono text-base text-harvest-600">#{currentBooking?.currentServingToken || 'A123'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Stage:</span>
              <strong className="text-xs uppercase bg-agri-100 text-agri-900 px-2 py-0.5 rounded">
                {currentBooking?.queueStatus || 'BOOKED'}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdvance}
            className="w-full py-3 px-4 rounded-xl bg-civic-700 hover:bg-civic-800 text-white font-bold text-sm shadow transition-colors"
          >
            📢 {t('admin.advance_queue')} (+1)
          </button>
        </div>

        {/* 2. Weighment & Quality Recorder */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-agri-800 font-bold">
            <Scale size={22} />
            <h3 className="text-lg text-slate-900">Record Weighment</h3>
          </div>

          <form onSubmit={handleSaveWeighment} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Net Weight (Quintals)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Moisture %</label>
              <input
                type="number"
                step="0.1"
                value={moisture}
                onChange={(e) => setMoisture(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Quality Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="Grade A">Grade A (High Quality)</option>
                <option value="Grade B">Grade B (Fair Quality)</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm shadow transition-colors"
            >
              💾 Save Weighment & Certify
            </button>
          </form>
        </div>

        {/* 3. DBT Payment Approval */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-agri-800 font-bold">
            <CreditCard size={22} />
            <h3 className="text-lg text-slate-900">DBT Bank Approval</h3>
          </div>

          <div className="space-y-2 text-sm text-slate-700 bg-warmgray-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between">
              <span>Amount:</span>
              <strong className="font-mono text-base text-slate-900">
                ₹{(currentBooking?.netPayableAmount || 112752).toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <strong className="text-xs uppercase bg-harvest-100 text-harvest-900 px-2 py-0.5 rounded font-bold">
                {currentBooking?.paymentStatus || 'PENDING'}
              </strong>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleApprovePayment}
              className="w-full py-2.5 px-4 rounded-xl bg-harvest-500 hover:bg-harvest-600 text-slate-950 font-bold text-sm shadow transition-colors"
            >
              ⚡ Approve DBT Payment
            </button>

            <button
              type="button"
              onClick={handleMarkCredited}
              className="w-full py-2.5 px-4 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm shadow transition-colors"
            >
              ✅ Mark Credited to Bank
            </button>

            <button
              type="button"
              onClick={handleCompleteBooking}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow transition-colors"
            >
              🏁 Mark Completed & Archive
            </button>
          </div>
        </div>
      </div>

      {/* Reset & Quick Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-red-700 hover:text-red-800 font-semibold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl border border-red-200 transition-colors"
        >
          <RefreshCw size={16} />
          <span>Reset All Demo State</span>
        </button>

        <Link to="/farmer/dashboard">
          <PrimaryButton variant="primary" size="md" fullWidth={false}>
            Return to Farmer Dashboard &rarr;
          </PrimaryButton>
        </Link>
      </div>
    </PageContainer>
  );
};

