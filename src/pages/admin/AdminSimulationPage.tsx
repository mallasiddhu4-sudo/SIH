import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sliders, AlertTriangle } from 'lucide-react';
import { PageContainer } from '../../components/common/PageContainer';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CENTRES } from '../../data/mockCentres';
import { MOCK_CENTRE_OPERATIONS } from '../../data/mockCentreOperations';
import type { CentreOperationalStatus, SimulationResult } from '../../types';

const LOAD_CONFIG: Record<CentreOperationalStatus, { bg: string; text: string; badge: string }> = {
  NORMAL: { bg: 'bg-green-50', text: 'text-green-800', badge: '✅ Normal' },
  ATTENTION: { bg: 'bg-harvest-50', text: 'text-harvest-900', badge: '⚠️ Attention' },
  HIGH_LOAD: { bg: 'bg-red-50', text: 'text-red-800', badge: '🔴 High Load' },
  OFFLINE: { bg: 'bg-slate-100', text: 'text-slate-700', badge: '⛔ Offline' }
};

const computeSimulation = (
  arrivalMultiplier: number,
  quantityMultiplier: number
): SimulationResult[] => {
  return MOCK_CENTRES.map(centre => {
    const ops = MOCK_CENTRE_OPERATIONS[centre.id];
    const projectedQueue = Math.round(ops.farmersWaiting * arrivalMultiplier);
    const projectedQty = Math.round(ops.expectedQuantityQuintals * quantityMultiplier);
    const projectedCapUtil = Math.min(100, Math.round((projectedQty / centre.dailyCapacityQuintals) * 100));
    const projectedWait = Math.round(centre.averageWaitMins * arrivalMultiplier * 0.8);

    let projectedLoad: CentreOperationalStatus;
    if (projectedCapUtil >= 95) projectedLoad = 'HIGH_LOAD';
    else if (projectedCapUtil >= 78) projectedLoad = 'ATTENTION';
    else projectedLoad = 'NORMAL';

    return {
      centreId: centre.id,
      centreName: centre.name.split('(')[0].trim(),
      baselineLoad: centre.operationalStatus,
      projectedLoad,
      projectedQueueCount: projectedQueue,
      projectedWaitMins: projectedWait,
      projectedCapacityUtilization: projectedCapUtil
    };
  });
};

export const AdminSimulationPage: React.FC = () => {
  const [arrivalIncrease, setArrivalIncrease] = useState(20); // % increase
  const [quantityIncrease, setQuantityIncrease] = useState(15);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const handleSimulate = () => {
    const arrMult = 1 + arrivalIncrease / 100;
    const qtyMult = 1 + quantityIncrease / 100;
    setResults(computeSimulation(arrMult, qtyMult));
    setHasSimulated(true);
  };

  const highLoadCount = results.filter(r => r.projectedLoad === 'HIGH_LOAD').length;
  const attentionCount = results.filter(r => r.projectedLoad === 'ATTENTION').length;

  const simSpeech = hasSimulated
    ? `Simulation result. With ${arrivalIncrease}% more farmer arrivals: ${highLoadCount} centres projected at high load, ${attentionCount} at attention. ${results.filter(r => r.projectedLoad === 'NORMAL').length} centres remain normal.`
    : 'What-If Simulation. Adjust sliders and run to see projected centre load impact.';

  return (
    <PageContainer maxWidth="4xl">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 mb-6 border-2 border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-harvest-700 flex items-center justify-center text-2xl">🔮</div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider bg-harvest-700 text-harvest-100 px-2.5 py-0.5 rounded">
                SIMULATION — Not Real Data
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">What-If Scenario Simulator</h2>
              <p className="text-xs text-slate-400">Adjust parameters to see projected impact on centre capacity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VoiceSpeaker text={simSpeech} size="md" className="bg-white text-agri-900" />
            <Link to="/admin/analytics" className="inline-flex items-center gap-2 bg-agri-600 hover:bg-agri-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              Analytics <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 mb-6 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sliders size={20} className="text-civic-700" />
          Adjust Scenario Parameters
        </h3>

        {/* Arrival Increase Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-slate-700">
              Farmer Arrival Increase
            </label>
            <span className="text-lg font-black text-agri-900 bg-agri-50 border border-agri-200 px-3 py-0.5 rounded-lg">
              +{arrivalIncrease}%
            </span>
          </div>
          <input
            type="range" min={0} max={80} step={5}
            value={arrivalIncrease}
            onChange={e => { setArrivalIncrease(Number(e.target.value)); setHasSimulated(false); }}
            className="w-full h-3 bg-slate-200 rounded-full accent-agri-700 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>+0% (Baseline)</span>
            <span>+80% (Surge)</span>
          </div>
        </div>

        {/* Quantity Increase Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-slate-700">
              Procurement Quantity Increase
            </label>
            <span className="text-lg font-black text-harvest-900 bg-harvest-50 border border-harvest-200 px-3 py-0.5 rounded-lg">
              +{quantityIncrease}%
            </span>
          </div>
          <input
            type="range" min={0} max={60} step={5}
            value={quantityIncrease}
            onChange={e => { setQuantityIncrease(Number(e.target.value)); setHasSimulated(false); }}
            className="w-full h-3 bg-slate-200 rounded-full accent-harvest-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>+0% (Same)</span>
            <span>+60% (Bumper crop)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSimulate}
          className="w-full py-3.5 px-6 rounded-2xl bg-agri-700 hover:bg-agri-800 text-white font-black text-base transition-colors shadow-md"
        >
          🔮 Run Simulation
        </button>
      </div>

      {/* Simulation Results */}
      {hasSimulated && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'High Load', count: highLoadCount, color: 'border-red-300 bg-red-50 text-red-800', icon: '🔴' },
              { label: 'Attention', count: attentionCount, color: 'border-harvest-300 bg-harvest-50 text-harvest-900', icon: '⚠️' },
              { label: 'Normal', count: results.filter(r => r.projectedLoad === 'NORMAL').length, color: 'border-green-300 bg-green-50 text-green-800', icon: '✅' }
            ].map(s => (
              <div key={s.label} className={`border-2 ${s.color} rounded-2xl p-4 text-center`}>
                <div className="text-2xl">{s.icon}</div>
                <div className="text-2xl font-black mt-1">{s.count}</div>
                <div className="text-xs font-bold mt-0.5">{s.label}</div>
                <div className="text-[10px] opacity-70">centres</div>
              </div>
            ))}
          </div>

          {/* High Load Warning */}
          {highLoadCount > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3 text-red-800">
              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Action Required: {highLoadCount} centre{highLoadCount > 1 ? 's' : ''} will be overloaded</p>
                <p className="text-xs mt-0.5">Consider opening temporary procurement points, increasing capacity at Centre C (Nandyal) or Centre E (Adoni) which have the most available headroom.</p>
              </div>
            </div>
          )}

          {/* Per-Centre Results */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-600">Centre-by-Centre Projection</h3>
            {results.map(r => {
              const cfg = LOAD_CONFIG[r.projectedLoad];
              const baseCfg = LOAD_CONFIG[r.baselineLoad];
              const worsened = r.projectedLoad !== r.baselineLoad;
              return (
                <div key={r.centreId} className={`${cfg.bg} border-2 ${r.projectedLoad === 'HIGH_LOAD' ? 'border-red-300' : r.projectedLoad === 'ATTENTION' ? 'border-harvest-400' : 'border-green-300'} rounded-2xl p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{r.centreName}</p>
                      {worsened && (
                        <p className="text-[10px] font-bold text-red-600">
                          ↑ Changed from {r.baselineLoad.replace('_', ' ')} → {r.projectedLoad.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-semibold">Baseline: {baseCfg.badge}</span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border`}>
                        {cfg.badge}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                    <div className="text-center">
                      <p className="text-slate-500">Projected Queue</p>
                      <p className="font-black text-slate-900 text-base">{r.projectedQueueCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Est. Wait</p>
                      <p className="font-black text-slate-900 text-base">~{r.projectedWaitMins} min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Capacity Used</p>
                      <p className={`font-black text-base ${r.projectedCapacityUtilization >= 95 ? 'text-red-700' : r.projectedCapacityUtilization >= 80 ? 'text-harvest-700' : 'text-green-700'}`}>
                        {r.projectedCapacityUtilization}%
                      </p>
                    </div>
                  </div>
                  {/* Capacity bar */}
                  <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.projectedCapacityUtilization >= 95 ? 'bg-red-500' : r.projectedCapacityUtilization >= 80 ? 'bg-harvest-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, r.projectedCapacityUtilization)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 italic">This is a simulation based on current data extrapolation. Actual results may differ.</p>
        </div>
      )}

      {/* Footer Nav */}
      <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-200">
        <Link to="/admin/analytics">
          <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
            📊 Analytics Dashboard
          </button>
        </Link>
        <Link to="/admin/department">
          <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-civic-300 text-civic-900 font-bold text-sm hover:bg-civic-50 transition-colors">
            📋 Department Dashboard
          </button>
        </Link>
      </div>
    </PageContainer>
  );
};
