import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, TrendingUp, Warehouse, Users, Clock } from 'lucide-react';
import { PageContainer } from '../../components/common/PageContainer';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CENTRES } from '../../data/mockCentres';
import { MOCK_CENTRE_OPERATIONS, DEPARTMENT_SUMMARY } from '../../data/mockCentreOperations';
import type { CentreOperationalStatus } from '../../types';

const LOAD_CONFIG: Record<CentreOperationalStatus, { label: string; badge: string; bar: string; bg: string; border: string }> = {
  NORMAL: {
    label: 'NORMAL',
    badge: '✅ Normal Load',
    bar: 'bg-green-500',
    bg: 'bg-green-50',
    border: 'border-green-300'
  },
  ATTENTION: {
    label: 'ATTENTION',
    badge: '⚠️ Attention',
    bar: 'bg-harvest-500',
    bg: 'bg-harvest-50',
    border: 'border-harvest-400'
  },
  HIGH_LOAD: {
    label: 'HIGH LOAD',
    badge: '🔴 High Load',
    bar: 'bg-red-500',
    bg: 'bg-red-50',
    border: 'border-red-300'
  },
  OFFLINE: {
    label: 'OFFLINE',
    badge: '⛔ Offline',
    bar: 'bg-slate-400',
    bg: 'bg-slate-100',
    border: 'border-slate-400'
  }
};

export const CentreIntelligencePage: React.FC = () => {
  const [selectedCentreId, setSelectedCentreId] = useState<string>('ppc_101');

  const selectedCentre = MOCK_CENTRES.find(c => c.id === selectedCentreId) || MOCK_CENTRES[0];
  const selectedOps = MOCK_CENTRE_OPERATIONS[selectedCentreId];
  const cfg = LOAD_CONFIG[selectedCentre.operationalStatus];

  const utilizationPct = Math.round(
    (selectedOps.expectedQuantityQuintals / selectedCentre.dailyCapacityQuintals) * 100
  );
  const remainingCapacity = Math.max(0, selectedCentre.dailyCapacityQuintals - selectedOps.expectedQuantityQuintals);
  const hoursToFull = remainingCapacity / selectedCentre.processingRateQuintalsPerHour;

  const summaryText = `Centre Intelligence. ${selectedCentre.name}. Status: ${selectedCentre.operationalStatus}. ${selectedOps.farmersWaiting} farmers waiting. ${utilizationPct}% capacity used. Processing rate: ${selectedCentre.processingRateQuintalsPerHour} quintals per hour.`;

  return (
    <PageContainer maxWidth="5xl">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 mb-6 border-2 border-slate-800 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-civic-700 text-white flex items-center justify-center text-2xl font-black">🧠</div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider bg-civic-800 text-civic-200 px-2.5 py-0.5 rounded">
                Centre Intelligence / Digital Twin
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">Live Operations Monitor</h2>
              <p className="text-xs text-slate-400">Real-time centre load, queue pressure &amp; projection — Sample Data</p>
            </div>
          </div>
          <VoiceSpeaker text={summaryText} size="md" className="bg-white text-agri-900" />
        </div>

        {/* Dept Summary Strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-700">
          {[
            { v: DEPARTMENT_SUMMARY.activeCentres, l: 'Active Centres' },
            { v: DEPARTMENT_SUMMARY.farmersScheduledToday, l: 'Farmers Today' },
            { v: DEPARTMENT_SUMMARY.farmersCompletedToday, l: 'Completed' },
            { v: DEPARTMENT_SUMMARY.highLoadCentres, l: 'High Load' },
            { v: DEPARTMENT_SUMMARY.attentionCentres, l: 'Attention' },
            { v: `${DEPARTMENT_SUMMARY.averageUtilizationPercent}%`, l: 'Avg Utilization' }
          ].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-lg font-black text-white">{s.v}</div>
              <div className="text-[10px] text-slate-400">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Centre Selector (Pressure Map) */}
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
          <Activity size={16} /> Centre Pressure Map — Click to Inspect
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_CENTRES.map(centre => {
            const ops = MOCK_CENTRE_OPERATIONS[centre.id];
            const c = LOAD_CONFIG[centre.operationalStatus];
            const pct = Math.round((ops.expectedQuantityQuintals / centre.dailyCapacityQuintals) * 100);
            const isSelected = centre.id === selectedCentreId;
            return (
              <button
                key={centre.id}
                type="button"
                onClick={() => setSelectedCentreId(centre.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${c.bg} ${c.border} ${isSelected ? 'ring-4 ring-agri-400 shadow-md' : 'hover:shadow-sm opacity-90 hover:opacity-100'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-tight">{centre.name.split('(')[0].trim()}</p>
                    <p className="text-xs text-slate-500">{centre.mandal}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.bg} ${c.border} border text-slate-800`}>
                    {c.badge}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mb-1.5">
                  <Users size={12} /> {ops.farmersWaiting} waiting
                  <Clock size={12} className="ml-1" /> ~{centre.averageWaitMins} min
                </div>
                <div className="h-2 bg-white/80 rounded-full overflow-hidden">
                  <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{pct}% capacity used</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Centre Deep View */}
      <div className={`${cfg.bg} border-2 ${cfg.border} rounded-3xl p-6 space-y-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900">{selectedCentre.name}</h3>
            <p className="text-sm text-slate-600">{selectedCentre.mandal}, {selectedCentre.district} • {selectedCentre.agency}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-xl border-2 ${cfg.bg} ${cfg.border} text-slate-800`}>
              {cfg.badge}
            </span>
            <VoiceSpeaker text={summaryText} size="sm" />
          </div>
        </div>

        {/* Overload Warning */}
        {selectedOps.overloadWarningTime && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-center gap-3 text-red-800 font-bold text-sm">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>
              High load expected around <strong>{selectedOps.overloadWarningTime}</strong>.
              Consider redirecting farmers to Centre C (Nandyal) — currently at low load.
            </span>
          </div>
        )}

        {/* 6-metric Digital Twin */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: '👨‍🌾', label: 'Farmers Expected', value: selectedOps.farmersExpected, sub: 'Today' },
            { icon: '🚛', label: 'Farmers Arrived', value: selectedOps.farmersArrived, sub: 'On-site' },
            { icon: '⏳', label: 'Farmers Waiting', value: selectedOps.farmersWaiting, sub: 'In queue' },
            { icon: '✅', label: 'Completed', value: selectedOps.farmersCompleted, sub: 'Today' },
            { icon: '📦', label: 'Processed', value: `${selectedOps.processedQuantityQuintals} Qt`, sub: 'Quintals' },
            { icon: '⏱️', label: 'Avg Wait', value: `${selectedCentre.averageWaitMins} min`, sub: 'Current' }
          ].map(m => (
            <div key={m.label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-white shadow-sm">
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-2xl font-black text-slate-900">{m.value}</div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">{m.label}</div>
              <div className="text-[10px] text-slate-500">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Capacity Bar */}
        <div className="bg-white/80 rounded-2xl p-4 border border-white space-y-2">
          <div className="flex justify-between text-sm font-bold text-slate-700">
            <span className="flex items-center gap-1.5"><Warehouse size={16} /> Capacity Utilization</span>
            <span className={utilizationPct >= 90 ? 'text-red-700' : utilizationPct >= 70 ? 'text-harvest-700' : 'text-green-700'}>
              {utilizationPct}%
            </span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${cfg.bar} rounded-full transition-all duration-700`}
              style={{ width: `${Math.min(100, utilizationPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-semibold">
            <span>Scheduled: {selectedOps.expectedQuantityQuintals} Qt / {selectedCentre.dailyCapacityQuintals} Qt</span>
            <span>Remaining: {remainingCapacity} Qt</span>
          </div>
        </div>

        {/* Next 3-Hour Projection */}
        <div className="bg-white/80 rounded-2xl p-4 border border-white space-y-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-civic-700" />
            Next 3-Hour Projection
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Expected Arrivals</p>
              <p className="text-lg font-black text-slate-900">{selectedOps.projectedArrivalsNext3h} Farmers</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Expected Quantity</p>
              <p className="text-lg font-black text-slate-900">{selectedOps.projectedQuantityNext3hQuintals} Qt</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Hrs to Full Capacity</p>
              <p className={`text-lg font-black ${hoursToFull < 2 ? 'text-red-700' : 'text-slate-900'}`}>
                {hoursToFull > 24 ? '24+ hrs' : `~${hoursToFull.toFixed(1)} hrs`}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Queue Pressure</p>
              <p className={`text-sm font-black uppercase ${selectedOps.queuePressure === 'HIGH' ? 'text-red-700' : selectedOps.queuePressure === 'MEDIUM' ? 'text-harvest-700' : 'text-green-700'}`}>
                {selectedOps.queuePressure}
              </p>
            </div>
          </div>
        </div>

        {/* Accepted Crops */}
        <div className="bg-white/80 rounded-2xl p-4 border border-white">
          <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-2">Crops Accepted at This Centre</p>
          <div className="flex flex-wrap gap-2">
            {selectedCentre.acceptedCropIds.map(cropId => (
              <span key={cropId} className="bg-agri-100 text-agri-900 border border-agri-200 rounded-full px-3 py-1 text-xs font-bold capitalize">
                {cropId.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-200">
        <Link to="/centre/dashboard">
          <button type="button" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-agri-300 text-agri-900 font-bold text-sm hover:bg-agri-50 transition-colors">
            🏛️ Operator Dashboard <ArrowRight size={16} />
          </button>
        </Link>
        <Link to="/admin/department">
          <button type="button" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-civic-300 text-civic-900 font-bold text-sm hover:bg-civic-50 transition-colors">
            📊 Department View <ArrowRight size={16} />
          </button>
        </Link>
      </div>
    </PageContainer>
  );
};
