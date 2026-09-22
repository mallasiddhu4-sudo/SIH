import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Warehouse, Users, ArrowRight } from 'lucide-react';
import { PageContainer } from '../../components/common/PageContainer';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import {
  HISTORICAL_PROCUREMENT,
  CROP_WISE_PROCUREMENT,
  CENTRE_UTILIZATION,
  MONTHLY_LOAD_DATA
} from '../../data/mockCentreOperations';

export const AdminAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'historical' | 'crops' | 'centres' | 'seasonal'>('historical');

  const maxQty = Math.max(...HISTORICAL_PROCUREMENT.map(r => r.totalQuantityQuintals));
  const maxCropQty = Math.max(...CROP_WISE_PROCUREMENT.map(r => r.quantityQuintals));
  const maxCentreUtil = 100;
  const maxMonthlyLoad = Math.max(...MONTHLY_LOAD_DATA.map(m => m.load));

  const summarySpeech = `Procurement Analytics Dashboard. Sample data for demonstration. ${HISTORICAL_PROCUREMENT.slice(-1)[0].year}: ${HISTORICAL_PROCUREMENT.slice(-1)[0].totalQuantityQuintals.toLocaleString()} quintals procured from ${HISTORICAL_PROCUREMENT.slice(-1)[0].farmerCount.toLocaleString()} farmers worth ${HISTORICAL_PROCUREMENT.slice(-1)[0].totalAmountCrore} crore rupees. Data from ${HISTORICAL_PROCUREMENT.length} years shown.`;

  const TABS = [
    { key: 'historical', label: '📅 Year-wise' },
    { key: 'crops', label: '🌾 Crop-wise' },
    { key: 'centres', label: '🏛️ Centre Utilization' },
    { key: 'seasonal', label: '📊 Seasonal Load' }
  ] as const;

  return (
    <PageContainer maxWidth="5xl">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 mb-6 border-2 border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-civic-700 flex items-center justify-center text-2xl">📊</div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider bg-harvest-700 text-harvest-100 px-2.5 py-0.5 rounded">
                SAMPLE DATA — For Demonstration Only
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">Procurement Analytics Dashboard</h2>
              <p className="text-xs text-slate-400">Historical procurement data — Kurnool & Nandyal Districts, AP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VoiceSpeaker text={summarySpeech} size="md" className="bg-white text-agri-900" />
            <Link to="/admin/department" className="inline-flex items-center gap-2 bg-agri-600 hover:bg-agri-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              Department View <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: '📦', label: 'Total (2022–26)', value: `${(HISTORICAL_PROCUREMENT.reduce((s, r) => s + r.totalQuantityQuintals, 0) / 1000).toFixed(0)}K Qt` },
          { icon: '👨‍🌾', label: 'Farmers Served', value: HISTORICAL_PROCUREMENT.reduce((s, r) => s + r.farmerCount, 0).toLocaleString() },
          { icon: '💰', label: 'Total Amount', value: `₹${HISTORICAL_PROCUREMENT.reduce((s, r) => s + r.totalAmountCrore, 0).toFixed(1)} Cr` },
          { icon: '🏛️', label: 'Active Centres', value: '18' }
        ].map(k => (
          <div key={k.label} className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-xl font-black text-slate-900">{k.value}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-agri-700 text-white shadow' : 'bg-white border border-slate-200 text-slate-700 hover:bg-agri-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: HISTORICAL */}
      {activeTab === 'historical' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-agri-700" />
            Year-wise Procurement (2022 – 2026)
          </h3>
          <div className="space-y-3">
            {HISTORICAL_PROCUREMENT.map(record => (
              <div key={record.year} className="space-y-1">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-700 w-16">{record.year}{record.year === 2026 ? ' *' : ''}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-agri-600 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                        style={{ width: `${(record.totalQuantityQuintals / maxQty) * 100}%` }}
                      >
                        <span className="text-[10px] font-black text-white">{(record.totalQuantityQuintals / 1000).toFixed(0)}K Qt</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-28">
                    <span className="text-agri-900 font-black">₹{record.totalAmountCrore} Cr</span>
                    <span className="block text-[10px] text-slate-400">{record.farmerCount.toLocaleString()} farmers</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 italic">* 2026 is partial data (current year, Kharif season ongoing)</p>
        </div>
      )}

      {/* TAB: CROP-WISE */}
      {activeTab === 'crops' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-harvest-700" />
            Crop-wise Procurement (Current Kharif 2026)
          </h3>
          <div className="space-y-3">
            {CROP_WISE_PROCUREMENT.map(crop => (
              <div key={crop.cropId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-800 w-24 flex items-center gap-1.5">
                    {crop.cropIcon} {crop.cropName}
                  </span>
                  <div className="flex-1 mx-3">
                    <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-harvest-500 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                        style={{ width: `${(crop.quantityQuintals / maxCropQty) * 100}%` }}
                      >
                        <span className="text-[9px] font-black text-white">{(crop.quantityQuintals / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-24 text-xs">
                    <span className="font-black text-slate-900">₹{crop.amountLakh}L</span>
                    <span className="block text-slate-400">{crop.centresCovered} centres</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: CENTRE UTILIZATION */}
      {activeTab === 'centres' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Warehouse size={18} className="text-civic-700" />
            Centre Utilization (Today)
          </h3>
          <div className="space-y-3">
            {CENTRE_UTILIZATION.map(cu => (
              <div key={cu.centreId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700 flex-shrink-0 w-36 truncate text-xs">{cu.centreName}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700 ${cu.utilizationPercent >= 90 ? 'bg-red-500' : cu.utilizationPercent >= 70 ? 'bg-harvest-500' : 'bg-agri-600'}`}
                        style={{ width: `${(cu.utilizationPercent / maxCentreUtil) * 100}%` }}
                      >
                        <span className="text-[9px] font-black text-white">{cu.utilizationPercent}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-24 text-xs">
                    <span className="font-black text-slate-900">{cu.quantityQuintals} Qt</span>
                    <span className="block text-slate-400">{cu.farmersServed} farmers</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 italic">Red = overloaded. Yellow = under attention. Green = normal. Today's data only.</p>
        </div>
      )}

      {/* TAB: SEASONAL LOAD */}
      {activeTab === 'seasonal' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-agri-700" />
            Monthly Procurement Load (Avg %, current season)
          </h3>
          <div className="flex items-end gap-1.5 h-36">
            {MONTHLY_LOAD_DATA.map(m => {
              const height = Math.max(8, (m.load / maxMonthlyLoad) * 100);
              const isCurrentMonth = m.month === 'Sep';
              return (
                <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                    <div
                      className={`w-full rounded-t-lg ${isCurrentMonth ? 'bg-harvest-500' : m.load >= 70 ? 'bg-red-400' : m.load >= 40 ? 'bg-agri-500' : 'bg-agri-200'} transition-all duration-700`}
                      style={{ height: `${height}%` }}
                      title={`${m.month}: ${m.load}%`}
                    />
                  </div>
                  <span className={`text-[9px] font-bold ${isCurrentMonth ? 'text-harvest-700' : 'text-slate-500'}`}>{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-harvest-500 inline-block" /> Current Month</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> High Load</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-agri-500 inline-block" /> Moderate</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-agri-200 inline-block" /> Low</span>
          </div>
          <p className="text-xs text-slate-400 italic">September–October is peak Kharif procurement season. Plan capacity accordingly.</p>
        </div>
      )}

      {/* Footer Nav */}
      <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-200">
        <Link to="/admin/simulation">
          <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-harvest-300 text-harvest-900 font-bold text-sm hover:bg-harvest-50 transition-colors">
            🔮 What-If Simulation <ArrowRight size={16} />
          </button>
        </Link>
        <Link to="/admin/department">
          <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-civic-300 text-civic-900 font-bold text-sm hover:bg-civic-50 transition-colors">
            📊 Department Dashboard <ArrowRight size={16} />
          </button>
        </Link>
      </div>
    </PageContainer>
  );
};
