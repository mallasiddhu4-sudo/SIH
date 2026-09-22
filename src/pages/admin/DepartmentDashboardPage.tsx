import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Warehouse, BarChart3, Activity } from 'lucide-react';
import { PageContainer } from '../../components/common/PageContainer';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CENTRES } from '../../data/mockCentres';
import { MOCK_CENTRE_OPERATIONS, DEPARTMENT_SUMMARY, CROP_WISE_PROCUREMENT } from '../../data/mockCentreOperations';
import type { CentreOperationalStatus } from '../../types';

const LOAD_CONFIG: Record<CentreOperationalStatus, { dot: string; bg: string; border: string; text: string }> = {
  NORMAL: { dot: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  ATTENTION: { dot: 'bg-harvest-500', bg: 'bg-harvest-50', border: 'border-harvest-300', text: 'text-harvest-900' },
  HIGH_LOAD: { dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
  OFFLINE: { dot: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700' }
};

export const DepartmentDashboardPage: React.FC = () => {
  const summarySpeech = `Department Dashboard. ${DEPARTMENT_SUMMARY.activeCentres} active procurement centres today. ${DEPARTMENT_SUMMARY.farmersScheduledToday} farmers scheduled. ${DEPARTMENT_SUMMARY.farmersCompletedToday} completed. ${DEPARTMENT_SUMMARY.highLoadCentres} centres under high load. Average utilization: ${DEPARTMENT_SUMMARY.averageUtilizationPercent}%.`;

  const capacityGapCentres = MOCK_CENTRES.filter(c => c.operationalStatus === 'HIGH_LOAD' || c.operationalStatus === 'ATTENTION');

  return (
    <PageContainer maxWidth="5xl">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 mb-6 border-2 border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-civic-700 flex items-center justify-center text-2xl">🏛️</div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider bg-civic-800 text-civic-200 px-2.5 py-0.5 rounded">
                Department / District Level View
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">Procurement Control Dashboard</h2>
              <p className="text-xs text-slate-400">Kurnool &amp; Nandyal Districts — Andhra Pradesh | Kharif 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VoiceSpeaker text={summarySpeech} size="md" className="bg-white text-agri-900" />
            <Link to="/admin/analytics" className="inline-flex items-center gap-2 bg-agri-600 hover:bg-agri-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              Analytics <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {[
          { icon: '🏛️', v: DEPARTMENT_SUMMARY.totalCentres, l: 'Total Centres', sub: `${DEPARTMENT_SUMMARY.activeCentres} active today` },
          { icon: '👨‍🌾', v: DEPARTMENT_SUMMARY.farmersScheduledToday, l: 'Farmers Today', sub: 'Scheduled' },
          { icon: '✅', v: DEPARTMENT_SUMMARY.farmersCompletedToday, l: 'Completed', sub: 'Today' },
          { icon: '📦', v: `${DEPARTMENT_SUMMARY.completedTodayQuintals.toLocaleString()} Qt`, l: 'Procured Today', sub: 'Quintals' },
          { icon: '🔴', v: DEPARTMENT_SUMMARY.highLoadCentres, l: 'High Load', sub: 'Centres' },
          { icon: '📊', v: `${DEPARTMENT_SUMMARY.averageUtilizationPercent}%`, l: 'Avg Utilization', sub: 'All centres' }
        ].map(k => (
          <div key={k.l} className="bg-white border-2 border-slate-200 rounded-2xl p-3 text-center shadow-sm">
            <div className="text-xl mb-0.5">{k.icon}</div>
            <div className="text-lg font-black text-slate-900">{k.v}</div>
            <div className="text-[11px] font-bold text-slate-700">{k.l}</div>
            <div className="text-[10px] text-slate-400">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Centre Status Map */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Activity size={16} /> All Centres — Live Status
          </h3>
          <div className="space-y-3">
            {MOCK_CENTRES.map(centre => {
              const ops = MOCK_CENTRE_OPERATIONS[centre.id];
              const cfg = LOAD_CONFIG[centre.operationalStatus];
              const utilPct = Math.round((ops.expectedQuantityQuintals / centre.dailyCapacityQuintals) * 100);
              return (
                <div key={centre.id} className={`${cfg.bg} border-2 ${cfg.border} rounded-2xl p-4 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${cfg.dot} flex-shrink-0`} />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{centre.name}</p>
                        <p className="text-xs text-slate-500">{centre.mandal}, {centre.district} • {centre.agency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.border} border ${cfg.text}`}>
                        {centre.operationalStatus.replace('_', ' ')}
                      </span>
                      <Link to="/centre/dashboard">
                        <button type="button" className="text-xs text-agri-700 hover:text-agri-900 font-bold">
                          View →
                        </button>
                      </Link>
                    </div>
                  </div>
                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="text-slate-500">Expected</p>
                      <p className="font-black text-slate-900">{ops.farmersExpected}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Waiting</p>
                      <p className={`font-black ${ops.farmersWaiting > 10 ? 'text-red-700' : 'text-slate-900'}`}>{ops.farmersWaiting}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Done</p>
                      <p className="font-black text-green-700">{ops.farmersCompleted}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Utilization</p>
                      <p className={`font-black ${utilPct >= 90 ? 'text-red-700' : utilPct >= 70 ? 'text-harvest-700' : 'text-green-700'}`}>{utilPct}%</p>
                    </div>
                  </div>
                  {/* Capacity Bar */}
                  <div className="h-2 bg-white/70 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.dot}`}
                      style={{ width: `${Math.min(100, utilPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Side Panels */}
        <div className="space-y-4">
          {/* Crop-wise Today */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-harvest-700" />
              Crop-wise (Current Season)
            </h4>
            {CROP_WISE_PROCUREMENT.map(crop => (
              <div key={crop.cropId} className="flex items-center gap-2 text-xs">
                <span className="text-lg flex-shrink-0">{crop.cropIcon}</span>
                <div className="flex-1">
                  <div className="flex justify-between font-semibold mb-0.5">
                    <span>{crop.cropName}</span>
                    <span className="text-slate-500">{(crop.quantityQuintals / 1000).toFixed(1)}K Qt</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full bg-harvest-500 rounded-full" style={{ width: `${(crop.quantityQuintals / 70000) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Capacity Gap / Alerts */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Warehouse size={16} className="text-red-600" />
              Capacity Alerts
            </h4>
            {capacityGapCentres.length > 0 ? (
              <div className="space-y-2">
                {capacityGapCentres.map(c => {
                  const ops = MOCK_CENTRE_OPERATIONS[c.id];
                  const pct = Math.round((ops.expectedQuantityQuintals / c.dailyCapacityQuintals) * 100);
                  return (
                    <div key={c.id} className={`${c.operationalStatus === 'HIGH_LOAD' ? 'bg-red-50 border-red-200' : 'bg-harvest-50 border-harvest-200'} border rounded-xl p-3 text-xs`}>
                      <p className="font-bold text-slate-900">{c.name.split('(')[0].trim()}</p>
                      <p className={`font-semibold ${c.operationalStatus === 'HIGH_LOAD' ? 'text-red-700' : 'text-harvest-800'}`}>
                        {pct}% capacity • {ops.farmersWaiting} waiting
                      </p>
                      {ops.overloadWarningTime && (
                        <p className="text-slate-500">⏰ Overload risk at {ops.overloadWarningTime}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-green-700 font-semibold">✅ All centres within safe capacity</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Quick Access</h4>
            {[
              { to: '/centre/intelligence', label: '🧠 Centre Intelligence', color: 'border-civic-300 text-civic-900' },
              { to: '/admin/simulation', label: '🔮 What-If Simulation', color: 'border-harvest-300 text-harvest-900' },
              { to: '/admin/analytics', label: '📊 Analytics Dashboard', color: 'border-agri-300 text-agri-900' },
              { to: '/centre/dashboard', label: '🏛️ Operator Console', color: 'border-slate-300 text-slate-700' },
            ].map(link => (
              <Link key={link.to} to={link.to}>
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 ${link.color} hover:opacity-80 transition-opacity text-sm font-bold`}>
                  <span>{link.label}</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
