import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Scale, CreditCard, RefreshCw, ArrowRight, CheckCircle2,
  Clock, Warehouse, Activity, BarChart3, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProcurement } from '../../context/ProcurementContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CENTRE_OPERATIONS, CENTRE_A_LIVE_QUEUE } from '../../data/mockCentreOperations';
import { MOCK_CENTRES } from '../../data/mockCentres';
import type { OperatorFarmerEntry } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  WEIGHING: 'bg-agri-100 text-agri-900 border-agri-300',
  QUALITY_CHECK: 'bg-blue-100 text-blue-800 border-blue-200',
  UNLOADING: 'bg-purple-100 text-purple-800 border-purple-200',
  AT_GATE: 'bg-harvest-100 text-harvest-900 border-harvest-300',
  BOOKED: 'bg-slate-100 text-slate-700 border-slate-200'
};

const PAYMENT_COLORS: Record<string, string> = {
  CREDITED_TO_BANK: 'bg-green-100 text-green-800',
  DBT_PROCESSING: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-harvest-100 text-harvest-900',
  PENDING_APPROVAL: 'bg-slate-100 text-slate-600'
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: '✓ Completed',
  WEIGHING: '⚖️ Weighing',
  QUALITY_CHECK: '🔬 Quality',
  UNLOADING: '📦 Unloading',
  AT_GATE: '🚛 At Gate',
  BOOKED: '📅 Booked'
};

interface FarmerRowProps {
  farmer: OperatorFarmerEntry;
  onSaveWeight: (token: string, weight: number, moisture: number, grade: 'Grade A' | 'Grade B' | 'Standard') => void;
}

const FarmerRow: React.FC<FarmerRowProps> = ({ farmer, onSaveWeight }) => {
  const [expanded, setExpanded] = useState(false);
  const [weight, setWeight] = useState(farmer.actualWeightQuintals || farmer.bookedQuantityQuintals);
  const [moisture, setMoisture] = useState(farmer.moisturePercent || 14.2);
  const [grade, setGrade] = useState<'Grade A' | 'Grade B' | 'Standard'>(farmer.qualityGrade || 'Grade A');

  const canEnterWeight = farmer.queueStatus !== 'BOOKED' && farmer.queueStatus !== 'COMPLETED';
  const difference = farmer.actualWeightQuintals !== undefined
    ? (farmer.actualWeightQuintals - farmer.bookedQuantityQuintals).toFixed(1)
    : null;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
      {/* Row Header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none ${
          farmer.queueStatus === 'COMPLETED' ? 'bg-green-50' :
          farmer.queueStatus === 'WEIGHING' ? 'bg-agri-50' :
          farmer.queueStatus === 'AT_GATE' ? 'bg-harvest-50' : 'bg-white'
        }`}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-14 text-center">
          <span className="font-mono font-black text-agri-900 text-sm">{farmer.token}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{farmer.farmerName}</p>
          <p className="text-xs text-slate-500">{farmer.cropName} • Booked: {farmer.bookedQuantityQuintals} Qt</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {farmer.actualWeightQuintals !== undefined && (
            <span className="text-xs font-bold text-slate-900 font-mono bg-white border border-agri-200 px-2 py-0.5 rounded-lg">
              Actual: {farmer.actualWeightQuintals} Qt
            </span>
          )}
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[farmer.queueStatus] || STATUS_COLORS['BOOKED']}`}>
            {STATUS_LABELS[farmer.queueStatus] || farmer.queueStatus}
          </span>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div className="border-t border-slate-100 bg-white px-4 pt-3 pb-4 space-y-3">
          {/* Booked vs Actual Comparison */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-center">
              <span className="block text-slate-500 font-semibold mb-0.5">Booked Qty</span>
              <span className="font-black text-slate-800 text-base">{farmer.bookedQuantityQuintals} Qt</span>
            </div>
            <div className={`rounded-xl p-2.5 border text-center ${farmer.actualWeightQuintals !== undefined ? 'bg-agri-50 border-agri-200' : 'bg-slate-50 border-dashed border-slate-300'}`}>
              <span className="block text-slate-500 font-semibold mb-0.5">Actual Weight</span>
              <span className={`font-black text-base ${farmer.actualWeightQuintals !== undefined ? 'text-agri-900' : 'text-slate-400'}`}>
                {farmer.actualWeightQuintals !== undefined ? `${farmer.actualWeightQuintals} Qt` : 'Not yet'}
              </span>
            </div>
            <div className={`rounded-xl p-2.5 border text-center ${difference !== null && parseFloat(difference) < 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className="block text-slate-500 font-semibold mb-0.5">Difference</span>
              <span className={`font-black text-base ${difference !== null && parseFloat(difference) < 0 ? 'text-red-700' : 'text-slate-600'}`}>
                {difference !== null ? `${parseFloat(difference) >= 0 ? '+' : ''}${difference}` : '—'}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-center">
              <span className="block text-slate-500 font-semibold mb-0.5">Payment</span>
              <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${PAYMENT_COLORS[farmer.paymentStatus] || 'bg-slate-100 text-slate-600'}`}>
                {farmer.paymentStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Actual Weight Entry (Operator Action) */}
          {canEnterWeight && (
            <div className="bg-agri-50 border-2 border-agri-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-black text-agri-900 uppercase tracking-wider flex items-center gap-1.5">
                <Scale size={14} />
                Enter Actual Weighed Quantity
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Net Weight (Qt)</label>
                  <input
                    type="number" step="0.1" value={weight}
                    onChange={e => setWeight(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-agri-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-agri-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Moisture %</label>
                  <input
                    type="number" step="0.1" value={moisture}
                    onChange={e => setMoisture(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-agri-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-agri-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Grade</label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-agri-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agri-400"
                  >
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { onSaveWeight(farmer.token, weight, moisture, grade); setExpanded(false); }}
                className="w-full py-2 px-4 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm transition-colors"
              >
                💾 Save Actual Weight & Certify
              </button>
            </div>
          )}

          {farmer.moisturePercent && (
            <p className="text-xs text-slate-500">
              Moisture: <strong>{farmer.moisturePercent}%</strong> • Grade: <strong>{farmer.qualityGrade}</strong>
              {farmer.arrivalTime && ` • Arrived: ${farmer.arrivalTime}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const CentreOperatorPage: React.FC = () => {
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

  const centre = MOCK_CENTRES[0];
  const ops = MOCK_CENTRE_OPERATIONS['ppc_101'];
  const [farmerQueue, setFarmerQueue] = useState(CENTRE_A_LIVE_QUEUE);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'procurement' | 'overview'>('overview');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleSaveWeight = (
    token: string,
    weight: number,
    moisture: number,
    grade: 'Grade A' | 'Grade B' | 'Standard'
  ) => {
    // Update local queue display
    setFarmerQueue(prev =>
      prev.map(f =>
        f.token === token
          ? { ...f, actualWeightQuintals: weight, moisturePercent: moisture, qualityGrade: grade }
          : f
      )
    );
    // If it's the demo farmer, also update ProcurementContext
    if (token === (currentBooking?.tokenDisplay)) {
      updateWeighment(weight, moisture, grade);
    }
    showToast(`✓ Actual weight saved for Token ${token}: ${weight} Qt`);
  };

  const utilization = Math.round((ops.expectedQuantityQuintals / centre.dailyCapacityQuintals) * 100);
  const capacityLeft = Math.max(0, centre.dailyCapacityQuintals - ops.expectedQuantityQuintals);
  const loadStatus = centre.operationalStatus;

  const loadColors = {
    NORMAL: 'bg-green-100 border-green-300 text-green-800',
    ATTENTION: 'bg-harvest-100 border-harvest-400 text-harvest-900',
    HIGH_LOAD: 'bg-red-100 border-red-300 text-red-800',
    OFFLINE: 'bg-slate-200 border-slate-400 text-slate-700'
  };

  const loadLabels = {
    NORMAL: '✅ NORMAL LOAD',
    ATTENTION: '⚠️ ATTENTION',
    HIGH_LOAD: '🔴 HIGH LOAD',
    OFFLINE: '⛔ OFFLINE'
  };

  return (
    <PageContainer maxWidth="5xl">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-6 space-y-4 border-2 border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-civic-700 text-white flex items-center justify-center text-3xl font-black">
              🏛️
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider bg-civic-800 text-civic-200 px-2.5 py-0.5 rounded">
                Centre Operator Dashboard
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">{centre.name}</h2>
              <p className="text-xs text-slate-400">{centre.mandal}, {centre.district} • {centre.agency} • {centre.operatingHours}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`text-xs font-black uppercase px-3 py-1.5 rounded-xl border-2 ${loadColors[loadStatus]}`}>
              {loadLabels[loadStatus]}
            </div>
            <Link
              to="/farmer/dashboard"
              className="inline-flex items-center gap-2 bg-agri-600 hover:bg-agri-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <span>Farmer Portal</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {toast && (
          <div className="bg-green-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={18} />
            <span>{toast}</span>
          </div>
        )}
      </div>

      {/* Today's Operations Overview Bar */}
      <div id="centre-operator-panel" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Expected Today", value: ops.farmersExpected, icon: '📋', color: 'border-slate-300' },
          { label: "Arrived", value: ops.farmersArrived, icon: '🚛', color: 'border-civic-300' },
          { label: "Completed", value: ops.farmersCompleted, icon: '✅', color: 'border-green-300' },
          { label: "Waiting", value: ops.farmersWaiting, icon: '⏳', color: `${loadStatus === 'HIGH_LOAD' ? 'border-red-400 bg-red-50' : 'border-harvest-300'}` }
        ].map(stat => (
          <div key={stat.label} className={`bg-white border-2 ${stat.color} rounded-2xl p-4 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stat.value}</div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Capacity Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 mb-6 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warehouse size={20} className="text-agri-700" />
            <span className="font-bold text-slate-900">Daily Capacity Utilization</span>
            <VoiceSpeaker text={`Daily capacity: ${ops.expectedQuantityQuintals} of ${centre.dailyCapacityQuintals} quintals scheduled. ${utilization}% utilized. ${capacityLeft} quintals remaining.`} size="sm" />
          </div>
          <span className={`text-sm font-black ${utilization >= 90 ? 'text-red-700' : utilization >= 70 ? 'text-harvest-700' : 'text-green-700'}`}>
            {utilization}% Used
          </span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${utilization >= 90 ? 'bg-red-500' : utilization >= 70 ? 'bg-harvest-500' : 'bg-agri-600'}`}
            style={{ width: `${Math.min(100, utilization)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 font-semibold">
          <span>Scheduled: {ops.expectedQuantityQuintals} Qt of {centre.dailyCapacityQuintals} Qt</span>
          <span>Remaining Capacity: {capacityLeft} Qt</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['overview', 'queue', 'procurement'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-agri-700 text-white shadow'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-agri-50'
            }`}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'queue' ? '👥 Farmer Queue' : '⚖️ Procurement Ops'}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Crop Load Breakdown */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-agri-700" />
              Crop Load (Expected Today)
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Paddy', qty: 1240, color: 'bg-agri-600' },
                { name: 'Maize', qty: 610, color: 'bg-harvest-500' }
              ].map(crop => (
                <div key={crop.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{crop.name}</span>
                    <span>{crop.qty} Qt</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${crop.color} rounded-full`}
                      style={{ width: `${Math.min(100, (crop.qty / centre.dailyCapacityQuintals) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processing Rate & Projection */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-civic-700" />
              Processing Rate & Projection
            </h3>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Processing Rate</span>
                <strong className="font-mono text-agri-900">{centre.processingRateQuintalsPerHour} Qt/hr</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Processed Today</span>
                <strong className="font-mono">{ops.processedQuantityQuintals} Qt</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Remaining (Processing)</span>
                <strong className="font-mono">{ops.expectedQuantityQuintals - ops.processedQuantityQuintals} Qt</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Expected next 3h arrivals</span>
                <strong className="font-mono">{ops.projectedArrivalsNext3h} farmers</strong>
              </div>
              <div className="flex justify-between">
                <span>Projected next 3h qty</span>
                <strong className="font-mono text-harvest-700">{ops.projectedQuantityNext3hQuintals} Qt</strong>
              </div>
            </div>
            {ops.overloadWarningTime && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-red-700">
                <AlertTriangle size={16} />
                High load expected around {ops.overloadWarningTime}. Consider pace controls.
              </div>
            )}
          </div>

          {/* Quick Admin Controls (existing simulator) */}
          <div className="md:col-span-2 bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={20} className="text-agri-700" />
              Demo Farmer Queue Control (Ravi Kumar — Token {currentBooking?.tokenDisplay || 'A127'})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button type="button" onClick={() => { advanceQueue(); showToast('Queue advanced!'); }}
                className="py-2.5 px-4 rounded-xl bg-civic-700 hover:bg-civic-800 text-white font-bold text-sm transition-colors">
                📢 Advance Queue (+1)
              </button>
              <button type="button" onClick={() => { approvePayment(); showToast('DBT Payment Approved!'); }}
                className="py-2.5 px-4 rounded-xl bg-harvest-500 hover:bg-harvest-600 text-slate-950 font-bold text-sm transition-colors">
                ⚡ Approve DBT Payment
              </button>
              <button type="button" onClick={() => { markPaymentCredited(); showToast('Marked as Credited!'); }}
                className="py-2.5 px-4 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm transition-colors">
                ✅ Mark Bank Credited
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { completeBooking(); showToast('Procurement completed & archived.'); }}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors">
                🏁 Mark Completed
              </button>
              <button type="button" onClick={() => { resetDemoData(); showToast('Demo data reset.'); }}
                className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-sm transition-colors flex items-center gap-2">
                <RefreshCw size={16} /> Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FARMER QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-700">
              {farmerQueue.length} Farmers Today • {farmerQueue.filter(f => f.queueStatus !== 'COMPLETED').length} Active
            </p>
            <p className="text-xs text-slate-500 italic">Click any row to expand details & enter weight</p>
          </div>
          {farmerQueue.map(farmer => (
            <FarmerRow
              key={farmer.token}
              farmer={farmer}
              onSaveWeight={handleSaveWeight}
            />
          ))}
        </div>
      )}

      {/* TAB: PROCUREMENT OPS (existing simulator, cleaner UI) */}
      {activeTab === 'procurement' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Queue Control */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-agri-800 font-bold">
              <Users size={22} />
              <h3 className="text-lg text-slate-900">Queue Control</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-700 bg-warmgray-50 p-3.5 rounded-xl border">
              <div className="flex justify-between">
                <span>Demo Farmer Token:</span>
                <strong className="font-mono text-agri-900">#{currentBooking?.tokenDisplay || 'A127'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Currently Serving:</span>
                <strong className="font-mono text-harvest-600">#{currentBooking?.currentServingToken || 'A123'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Queue Status:</span>
                <strong className="text-xs uppercase bg-agri-100 text-agri-900 px-2 py-0.5 rounded">
                  {currentBooking?.queueStatus || 'BOOKED'}
                </strong>
              </div>
            </div>
            <button type="button" onClick={() => { advanceQueue(); showToast('Queue advanced!'); }}
              className="w-full py-3 rounded-xl bg-civic-700 hover:bg-civic-800 text-white font-bold text-sm transition-colors">
              📢 Call Next Token
            </button>
          </div>

          {/* Enter Actual Weight */}
          <div className="bg-white border-2 border-agri-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-agri-800 font-bold">
              <Scale size={22} />
              <h3 className="text-lg text-slate-900">Enter Actual Weight</h3>
            </div>
            <div className="bg-agri-50 border border-agri-200 rounded-xl p-3 text-xs text-agri-800 font-semibold">
              📌 Farmer booked: <strong>{currentBooking?.estimatedQuantityQuintals || 48.6} Quintals</strong>
              <br />Enter the actual weighed quantity below.
            </div>
            <ActualWeightForm onSave={(w, m, g) => { updateWeighment(w, m, g); showToast(`Actual weight saved: ${w} Qt`); }} currentBooking={currentBooking} />
          </div>

          {/* DBT Payment */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-agri-800 font-bold">
              <CreditCard size={22} />
              <h3 className="text-lg text-slate-900">DBT Payment</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-700 bg-warmgray-50 p-3.5 rounded-xl border">
              <div className="flex justify-between">
                <span>Amount:</span>
                <strong className="font-mono">₹{(currentBooking?.netPayableAmount || 112752).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className="text-xs uppercase bg-harvest-100 text-harvest-900 px-2 py-0.5 rounded font-bold">
                  {currentBooking?.paymentStatus || 'PENDING'}
                </strong>
              </div>
            </div>
            <div className="space-y-2">
              <button type="button" onClick={() => { approvePayment(); showToast('DBT Approved!'); }}
                className="w-full py-2.5 rounded-xl bg-harvest-500 hover:bg-harvest-600 text-slate-950 font-bold text-sm transition-colors">
                ⚡ Approve DBT Payment
              </button>
              <button type="button" onClick={() => { markPaymentCredited(); showToast('Marked Credited!'); }}
                className="w-full py-2.5 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm transition-colors">
                ✅ Mark Credited to Bank
              </button>
              <button type="button" onClick={() => { completeBooking(); showToast('Completed & Archived.'); }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors">
                🏁 Complete & Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-200">
        <Link to="/centre/intelligence">
          <PrimaryButton variant="outline" size="md">
            🧠 Centre Intelligence
          </PrimaryButton>
        </Link>
        <Link to="/admin/department">
          <PrimaryButton variant="outline" size="md">
            📊 Department Dashboard
          </PrimaryButton>
        </Link>
        <Link to="/admin/dashboard">
          <PrimaryButton variant="outline" size="md">
            🛠️ Legacy Admin Console
          </PrimaryButton>
        </Link>
      </div>
    </PageContainer>
  );
};

// Helper sub-component for Actual Weight Form
const ActualWeightForm: React.FC<{
  onSave: (w: number, m: number, g: 'Grade A' | 'Grade B' | 'Standard') => void;
  currentBooking: any;
}> = ({ onSave, currentBooking }) => {
  const [weight, setWeight] = useState(currentBooking?.actualWeightQuintals || 48.6);
  const [moisture, setMoisture] = useState(currentBooking?.moisturePercent || 14.2);
  const [grade, setGrade] = useState<'Grade A' | 'Grade B' | 'Standard'>('Grade A');

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(weight, moisture, grade); }} className="space-y-3">
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">Actual Net Weight (Quintals)</label>
        <input type="number" step="0.1" value={weight} onChange={e => setWeight(Number(e.target.value))}
          className="w-full px-3 py-2 border border-agri-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-agri-400" />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">Moisture %</label>
        <input type="number" step="0.1" value={moisture} onChange={e => setMoisture(Number(e.target.value))}
          className="w-full px-3 py-2 border border-agri-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-agri-400" />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">Quality Grade</label>
        <select value={grade} onChange={e => setGrade(e.target.value as any)}
          className="w-full px-3 py-2 border border-agri-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agri-400">
          <option value="Grade A">Grade A (High Quality)</option>
          <option value="Grade B">Grade B (Fair)</option>
          <option value="Standard">Standard</option>
        </select>
      </div>
      <button type="submit" className="w-full py-2.5 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm transition-colors">
        💾 Save & Certify
      </button>
    </form>
  );
};
