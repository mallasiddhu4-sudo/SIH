/**
 * MultiCropPlannerPage.tsx — KisanX Multi-Crop Procurement Planner
 *
 * Flow:
 *   SELECT → CHECK → RECOMMEND → REVIEW → EDIT → CONFIRM
 *
 * Selection alone does NOT create a booking.
 * Only after the farmer explicitly presses CONFIRM PLAN are
 * independent ProcurementPlanAppointment records created (one per crop).
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Minus, Leaf, Warehouse, Calendar, Clock,
  CheckCircle2, AlertTriangle, XCircle, Edit2, X,
  ChevronDown, ChevronUp, ArrowRight, Info, Ticket,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProcurement } from '../../context/ProcurementContext';
import { PageContainer } from '../../components/common/PageContainer';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CROPS } from '../../data/mockCrops';
import { MOCK_CENTRES } from '../../data/mockCentres';
import type { CropPlanItem, ProcurementPlanAppointment } from '../../types';
import {
  getAvailableCentres,
  getAvailableDates,
  getAvailableTimes,
  validateAppointment,
  validateFullPlan,
  ValidationResult,
} from '../../services/multiCropPlanService';

// ─── Local types ──────────────────────────────────────────────────────────────

interface SelectedCrop {
  cropId: string;
  quantityQuintals: number;
}

type EditPanel = 'centre' | 'date' | 'time' | null;

interface EditState {
  cropId: string;
  panel: EditPanel;
}

// Step machine: SELECT → PLAN → REVIEW → CONFIRMED
type PlanStep = 'SELECT' | 'PLAN' | 'REVIEW' | 'CONFIRMED';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DATES = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'];
const TIMES = [
  '8:00 AM – 9:00 AM',
  '9:00 AM – 10:00 AM',
  '10:00 AM – 11:00 AM',
  '12:00 PM – 1:00 PM',
  '2:00 PM – 3:00 PM',
  '3:00 PM – 4:00 PM',
];

function recommendForCrop(
  cropId: string,
  idx: number
): Omit<CropPlanItem, 'cropId' | 'cropName' | 'cropIcon' | 'estimatedQuantityQuintals'> {
  const bestCentre =
    MOCK_CENTRES.find(c => c.acceptedCropIds.includes(cropId) && c.operationalStatus === 'NORMAL') ||
    MOCK_CENTRES.find(c => c.acceptedCropIds.includes(cropId)) ||
    MOCK_CENTRES[0];

  // Stagger times for multi-crop so crops don't clash by default
  const dateIdx = Math.min(idx, DATES.length - 1);
  const timeIdx = (idx * 2) % TIMES.length;

  return {
    recommendedCentreId: bestCentre.id,
    recommendedCentreName: bestCentre.name,
    recommendedDate: DATES[dateIdx],
    recommendedTime: TIMES[timeIdx],
    estimatedWaitMins: bestCentre.averageWaitMins,
    reason:
      bestCentre.operationalStatus === 'NORMAL'
        ? `${bestCentre.name.split('(')[0].trim()} has normal load and accepts this crop.`
        : `${bestCentre.name.split('(')[0].trim()} is the nearest centre accepting this crop.`,
    isEdited: false,
    isConfirmed: false,
  };
}

function generatePlan(selectedCrops: SelectedCrop[]): CropPlanItem[] {
  return selectedCrops.map((sc, idx) => {
    const crop = MOCK_CROPS.find(c => c.id === sc.cropId) || MOCK_CROPS[0];
    return {
      cropId: sc.cropId,
      cropName: crop.name,
      cropIcon: crop.icon,
      estimatedQuantityQuintals: sc.quantityQuintals,
      ...recommendForCrop(sc.cropId, idx),
    };
  });
}

function effectiveAppointment(item: CropPlanItem) {
  return {
    centreId: item.selectedCentreId ?? item.recommendedCentreId,
    centreName: item.selectedCentreName ?? item.recommendedCentreName,
    date: item.selectedDate ?? item.recommendedDate,
    time: item.selectedTime ?? item.recommendedTime,
  };
}

// ─── Status badges ────────────────────────────────────────────────────────────

function ValidationBadge({ result }: { result: ValidationResult }) {
  if (result.status === 'VALID') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
        <CheckCircle2 size={12} /> Available
      </span>
    );
  }
  if (result.status === 'WARNING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-harvest-800 bg-harvest-50 border border-harvest-300 rounded-full px-2.5 py-0.5">
        <AlertTriangle size={12} /> Conflict
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
      <XCircle size={12} /> Issue
    </span>
  );
}

function ChoiceBadge({ isEdited }: { isEdited: boolean }) {
  if (!isEdited) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-agri-100 text-agri-800 border border-agri-200 rounded-full px-2 py-0.5 uppercase tracking-wide">
        ⭐ KisanX Recommended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-civic-100 text-civic-800 border border-civic-200 rounded-full px-2 py-0.5 uppercase tracking-wide">
      ✏️ Your Choice
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const MultiCropPlannerPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { confirmMultiCropPlan } = useProcurement();

  // ── Crop selection
  const [selectedCrops, setSelectedCrops] = useState<SelectedCrop[]>([
    { cropId: MOCK_CROPS[0].id, quantityQuintals: 48 },
  ]);

  // ── Step machine
  const [step, setStep] = useState<PlanStep>('SELECT');

  // ── Generated plan (editable)
  const [plan, setPlan] = useState<CropPlanItem[] | null>(null);

  // ── Confirmed appointments (created by confirmMultiCropPlan())
  const [confirmedAppointments, setConfirmedAppointments] = useState<ProcurementPlanAppointment[]>([]);

  // ── Which card has edit panel open
  const [editState, setEditState] = useState<EditState | null>(null);

  // ── Validation results
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());

  // ── Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Crop selection handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const addCrop = () => {
    const unused = MOCK_CROPS.find(c => !selectedCrops.some(sc => sc.cropId === c.id));
    if (unused && selectedCrops.length < 5) {
      setSelectedCrops(prev => [...prev, { cropId: unused.id, quantityQuintals: 30 }]);
      setPlan(null);
      setStep('SELECT');
    }
  };

  const removeCrop = (idx: number) => {
    setSelectedCrops(prev => prev.filter((_, i) => i !== idx));
    setPlan(null);
    setStep('SELECT');
  };

  const updateCrop = (idx: number, field: 'cropId' | 'quantityQuintals', value: string | number) => {
    setSelectedCrops(prev => prev.map((sc, i) => (i === idx ? { ...sc, [field]: value } : sc)));
    setPlan(null);
    setStep('SELECT');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Generate plan → move to PLAN step
  // ─────────────────────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    const p = generatePlan(selectedCrops);
    setPlan(p);
    setStep('PLAN');
    setEditState(null);
    setValidationResults(validateFullPlan(p));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Edit helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const togglePanel = (cropId: string, panel: EditPanel) => {
    setEditState(prev =>
      prev?.cropId === cropId && prev.panel === panel ? null : { cropId, panel }
    );
  };

  const revalidate = useCallback((updatedPlan: CropPlanItem[]) => {
    setValidationResults(validateFullPlan(updatedPlan));
  }, []);

  const updatePlanItem = (
    cropId: string,
    updates: Partial<Pick<CropPlanItem, 'selectedCentreId' | 'selectedCentreName' | 'selectedDate' | 'selectedTime' | 'isEdited'>>
  ) => {
    setPlan(prev => {
      if (!prev) return prev;
      const next = prev.map(item => item.cropId === cropId ? { ...item, ...updates } : item);
      revalidate(next);
      return next;
    });
  };

  const handleCentreSelect = (cropId: string, centreId: string, centreName: string) => {
    updatePlanItem(cropId, {
      selectedCentreId: centreId,
      selectedCentreName: centreName,
      selectedDate: undefined,
      selectedTime: undefined,
      isEdited: true,
    });
    setEditState({ cropId, panel: 'date' });
    showToast('Centre updated. Now choose a date.', true);
  };

  const handleDateSelect = (cropId: string, date: string) => {
    updatePlanItem(cropId, { selectedDate: date, selectedTime: undefined, isEdited: true });
    setEditState({ cropId, panel: 'time' });
    showToast('Date updated. Now choose a time.', true);
  };

  const handleTimeSelect = (cropId: string, time: string) => {
    if (!plan) return;
    const item = plan.find(p => p.cropId === cropId);
    if (!item) return;
    const updated: CropPlanItem = { ...item, selectedTime: time, isEdited: true };
    const allUpdated = plan.map(p => (p.cropId === cropId ? updated : p));
    const result = validateAppointment(updated, allUpdated);
    if (result.status === 'INVALID') {
      showToast(result.message, false);
      return;
    }
    updatePlanItem(cropId, { selectedTime: time, isEdited: true });
    setEditState(null);
    showToast(result.status === 'WARNING' ? result.message : 'Appointment updated.', true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Move to REVIEW step
  // ─────────────────────────────────────────────────────────────────────────────

  const handleReview = () => {
    if (!plan) return;
    const hasErrors = Array.from(validationResults.values()).some(r => r.status === 'INVALID');
    if (hasErrors) {
      showToast('Please fix all issues before reviewing.', false);
      return;
    }
    setStep('REVIEW');
    setEditState(null);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // CONFIRM PLAN — creates real independent appointments
  // ─────────────────────────────────────────────────────────────────────────────

  const handleConfirmPlan = () => {
    if (!plan) return;
    const hasErrors = Array.from(validationResults.values()).some(r => r.status === 'INVALID');
    if (hasErrors) {
      showToast('Cannot confirm — some appointments have issues.', false);
      return;
    }

    // This is the only place appointments are actually created
    const appointments = confirmMultiCropPlan(plan);
    setConfirmedAppointments(appointments);
    setStep('CONFIRMED');
    showToast(`${appointments.length} crop appointments confirmed! Tokens assigned.`, true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Toast
  // ─────────────────────────────────────────────────────────────────────────────

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Inline edit panels
  // ─────────────────────────────────────────────────────────────────────────────

  const renderCentrePanel = (item: CropPlanItem) => {
    const centres = getAvailableCentres(item.cropId);
    const eff = effectiveAppointment(item);
    return (
      <div className="mt-3 border-t border-slate-200 pt-3 space-y-2 animate-fadeIn">
        <p className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <Warehouse size={13} /> {language === 'te' ? 'కేంద్రం ఎంచుకోండి' : 'Select Centre'}
        </p>
        {centres.map(c => {
          const isSelected = eff.centreId === c.centreId;
          return (
            <button
              key={c.centreId}
              type="button"
              onClick={() => c.isEligible && !c.isFull && handleCentreSelect(item.cropId, c.centreId, c.centreName)}
              disabled={!c.isEligible || c.isFull}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm
                ${isSelected
                  ? 'border-agri-600 bg-agri-50 ring-2 ring-agri-300'
                  : c.isEligible && !c.isFull
                  ? 'border-slate-200 bg-white hover:border-agri-400 hover:bg-agri-50 cursor-pointer'
                  : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`font-bold leading-tight text-sm ${c.isEligible && !c.isFull ? 'text-slate-900' : 'text-slate-500'}`}>
                    {c.isEligible ? '✅' : '❌'} {c.centreName.split('(')[0].trim()}
                  </p>
                  <p className={`text-xs mt-0.5 ${c.isEligible && !c.isFull ? 'text-slate-600' : 'text-slate-400'}`}>
                    {c.reason}
                    {c.isEligible && ` · ${c.distanceKm} km · ~${c.waitMins} min wait`}
                  </p>
                </div>
                {isSelected && <span className="text-agri-700 text-xs font-black flex-shrink-0">Selected ✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderDatePanel = (item: CropPlanItem) => {
    const eff = effectiveAppointment(item);
    const dates = getAvailableDates(eff.centreId);
    return (
      <div className="mt-3 border-t border-slate-200 pt-3 space-y-2 animate-fadeIn">
        <p className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <Calendar size={13} /> {language === 'te' ? 'తేదీ ఎంచుకోండి' : 'Select Date'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {dates.map(d => {
            const isSelected = eff.date === d.date;
            return (
              <button
                key={d.date}
                type="button"
                disabled={!d.isAvailable}
                onClick={() => d.isAvailable && handleDateSelect(item.cropId, d.date)}
                className={`py-2.5 px-3 rounded-xl border-2 text-center text-xs font-bold transition-all
                  ${isSelected
                    ? 'border-agri-600 bg-agri-50 ring-2 ring-agri-300 text-agri-900'
                    : d.isAvailable
                    ? 'border-slate-200 bg-white hover:border-agri-400 text-slate-800 cursor-pointer'
                    : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed line-through opacity-60'
                  }`}
              >
                {d.label}
                {!d.isAvailable && <span className="block text-[10px] font-normal mt-0.5">Closed</span>}
                {d.isAvailable && isSelected && <span className="block text-[10px] font-black mt-0.5 text-agri-700">✓ Selected</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimePanel = (item: CropPlanItem) => {
    const eff = effectiveAppointment(item);
    const slots = getAvailableTimes(eff.centreId, eff.date);
    return (
      <div className="mt-3 border-t border-slate-200 pt-3 space-y-2 animate-fadeIn">
        <p className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <Clock size={13} /> {language === 'te' ? 'సమయం ఎంచుకోండి' : 'Select Time'}
        </p>
        {slots.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            {language === 'te' ? 'ఈ తేదీకి స్లాట్లు అందుబాటులో లేవు.' : 'No slots available for this date. Change the date.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {slots.map(slot => {
              const isSelected = eff.time === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={slot.isFull}
                  onClick={() => !slot.isFull && handleTimeSelect(item.cropId, slot.time)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-center text-xs font-bold transition-all
                    ${isSelected
                      ? 'border-agri-600 bg-agri-50 ring-2 ring-agri-300 text-agri-900'
                      : slot.isFull
                      ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                      : 'border-slate-200 bg-white hover:border-agri-400 text-slate-800 cursor-pointer'
                    }`}
                >
                  <span className="block">{slot.time}</span>
                  {slot.isFull
                    ? <span className="block text-[10px] font-bold text-red-500 mt-0.5">Full</span>
                    : isSelected
                    ? <span className="block text-[10px] font-black text-agri-700 mt-0.5">✓ Selected</span>
                    : <span className="block text-[10px] text-green-600 font-semibold mt-0.5">{slot.remainingSlots} left</span>
                  }
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Editable plan card (PLAN step)
  // ─────────────────────────────────────────────────────────────────────────────

  const renderPlanCard = (item: CropPlanItem, idx: number) => {
    const eff = effectiveAppointment(item);
    const validation = validationResults.get(item.cropId);
    const isThisCardEditing = editState?.cropId === item.cropId;
    const centre = MOCK_CENTRES.find(c => c.id === eff.centreId);

    return (
      <div
        key={item.cropId}
        id={`crop-card-${item.cropId}`}
        className={`bg-white border-2 rounded-2xl overflow-hidden transition-all duration-200 ${
          validation?.status === 'INVALID'
            ? 'border-red-300 shadow-sm shadow-red-100'
            : validation?.status === 'WARNING'
            ? 'border-harvest-400 shadow-sm shadow-harvest-100'
            : 'border-agri-200'
        }`}
      >
        {/* Header */}
        <div className="bg-agri-800 text-white px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{item.cropIcon}</span>
            <div className="min-w-0">
              <p className="font-black text-base leading-tight">{item.cropName}</p>
              <p className="text-xs text-agri-300">{item.estimatedQuantityQuintals} Quintals</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <VoiceSpeaker
              text={`${item.cropName} appointment. Centre: ${eff.centreName.split('(')[0].trim()}. Date: ${eff.date}. Time: ${eff.time}.`}
              size="sm"
              className="bg-white/20 text-white hover:bg-white/30 border-white/20"
            />
            <span className="text-xs bg-harvest-400 text-slate-950 font-black px-2 py-0.5 rounded-full">#{idx + 1}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <ChoiceBadge isEdited={item.isEdited} />

          <div className="space-y-2">
            {/* Centre row */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Warehouse size={15} className="text-agri-700 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                    {language === 'te' ? 'కేంద్రం' : 'Centre'}
                  </p>
                  <p className="text-sm font-bold text-slate-900 leading-tight truncate">
                    {eff.centreName.split('(')[0].trim()}
                  </p>
                  {centre && (
                    <p className="text-[10px] text-slate-500 font-medium">{centre.distanceKm} km · {centre.operatingHours}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => togglePanel(item.cropId, 'centre')}
                className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                  editState?.cropId === item.cropId && editState.panel === 'centre'
                    ? 'bg-agri-700 text-white border-agri-700'
                    : 'bg-white text-agri-700 border-agri-300 hover:bg-agri-50'
                }`}
              >
                <Edit2 size={11} />
                {language === 'te' ? 'మార్చు' : 'Change'}
                {editState?.cropId === item.cropId && editState.panel === 'centre'
                  ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </div>

            {/* Date row */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar size={15} className="text-civic-700 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                    {language === 'te' ? 'తేదీ' : 'Date'}
                  </p>
                  <p className="text-sm font-bold text-slate-900">{eff.date}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => togglePanel(item.cropId, 'date')}
                className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                  editState?.cropId === item.cropId && editState.panel === 'date'
                    ? 'bg-agri-700 text-white border-agri-700'
                    : 'bg-white text-agri-700 border-agri-300 hover:bg-agri-50'
                }`}
              >
                <Edit2 size={11} />
                {language === 'te' ? 'మార్చు' : 'Change'}
                {editState?.cropId === item.cropId && editState.panel === 'date'
                  ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </div>

            {/* Time row */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={15} className="text-harvest-700 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                    {language === 'te' ? 'సమయం' : 'Time'}
                  </p>
                  <p className="text-sm font-bold text-slate-900">{eff.time}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => togglePanel(item.cropId, 'time')}
                className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                  editState?.cropId === item.cropId && editState.panel === 'time'
                    ? 'bg-agri-700 text-white border-agri-700'
                    : 'bg-white text-agri-700 border-agri-300 hover:bg-agri-50'
                }`}
              >
                <Edit2 size={11} />
                {language === 'te' ? 'మార్చు' : 'Change'}
                {editState?.cropId === item.cropId && editState.panel === 'time'
                  ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </div>
          </div>

          {/* Validation */}
          {validation && (
            <div className={`rounded-xl px-3 py-2.5 flex items-start gap-2 ${
              validation.status === 'VALID' ? 'bg-green-50 border border-green-200'
              : validation.status === 'WARNING' ? 'bg-harvest-50 border border-harvest-300'
              : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex-1">
                <ValidationBadge result={validation} />
                <p className="text-xs text-slate-700 font-medium mt-1">{validation.message}</p>
              </div>
              <VoiceSpeaker text={validation.message} size="sm" />
            </div>
          )}

          {/* Inline panels */}
          {isThisCardEditing && editState?.panel === 'centre' && renderCentrePanel(item)}
          {isThisCardEditing && editState?.panel === 'date'   && renderDatePanel(item)}
          {isThisCardEditing && editState?.panel === 'time'   && renderTimePanel(item)}

          {/* Recommendation reason */}
          {!item.isEdited && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex gap-1.5 items-start">
              <Info size={12} className="flex-shrink-0 mt-0.5 text-agri-600" />
              {item.reason}
            </p>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // REVIEW screen — summary before CONFIRM
  // ─────────────────────────────────────────────────────────────────────────────

  const renderReviewScreen = () => {
    if (!plan) return null;
    return (
      <div className="space-y-4">
        <div className="bg-agri-50 border-2 border-agri-300 rounded-2xl p-4">
          <h3 className="text-base font-black text-agri-900 mb-1">
            📋 {language === 'te' ? 'మీ ప్రొక్యూర్మెంట్ ప్లాన్ సమీక్షించండి' : 'Review Your Procurement Plan'}
          </h3>
          <p className="text-xs text-agri-700 font-medium">
            {language === 'te'
              ? 'దయచేసి అన్ని వివరాలు తనిఖీ చేయండి. నిర్ధారించిన తర్వాత, ప్రతి పంటకు స్వంత టోకెన్ సృష్టించబడుతుంది.'
              : 'Please review all details carefully. After confirming, each crop gets its own independent token and appointment.'}
          </p>
        </div>

        {plan.map((item, idx) => {
          const eff = effectiveAppointment(item);
          return (
            <div key={item.cropId} className="bg-white border-2 border-agri-200 rounded-2xl overflow-hidden">
              <div className="bg-agri-800 text-white px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">{item.cropIcon}</span>
                <div>
                  <p className="font-black text-base leading-tight">{item.cropName}</p>
                  <p className="text-xs text-agri-300">Appointment #{idx + 1}</p>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">
                    <Warehouse size={10} className="inline mr-1" />Centre
                  </p>
                  <p className="font-bold text-slate-900 text-xs leading-tight">{eff.centreName.split('(')[0].trim()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">
                    <Calendar size={10} className="inline mr-1" />Date
                  </p>
                  <p className="font-bold text-slate-900 text-xs">{eff.date}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">
                    <Clock size={10} className="inline mr-1" />Time
                  </p>
                  <p className="font-bold text-slate-900 text-xs">{eff.time}</p>
                </div>
                <div className="bg-agri-50 rounded-xl p-3 border border-agri-200">
                  <p className="text-[10px] text-agri-700 font-semibold uppercase tracking-wide mb-1">Expected Qty</p>
                  <p className="font-black text-agri-900 text-sm">{item.estimatedQuantityQuintals} Qt</p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStep('PLAN')}
            className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <Edit2 size={16} />
            {language === 'te' ? 'తిరిగి సవరించండి' : 'Go Back & Edit'}
          </button>
          <PrimaryButton
            onClick={handleConfirmPlan}
            size="lg"
            variant="primary"
            icon={<CheckCircle2 size={20} />}
          >
            {language === 'te' ? 'ప్లాన్ నిర్ధారించండి' : 'CONFIRM PLAN'}
          </PrimaryButton>
        </div>

        <p className="text-xs text-slate-500 italic px-1">
          ⚠️ {language === 'te'
            ? 'నిర్ధారించిన తర్వాత మాత్రమే అపాయింట్మెంట్లు సృష్టించబడతాయి. ఎంపిక మాత్రమే బుకింగ్ సృష్టించదు.'
            : 'Appointments are created ONLY after you press CONFIRM PLAN. Selection alone does not create a booking.'}
        </p>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // CONFIRMED screen — shows issued tokens
  // ─────────────────────────────────────────────────────────────────────────────

  const renderConfirmedScreen = () => {
    return (
      <div className="space-y-4">
        {/* Success banner */}
        <div className="bg-green-700 text-white rounded-2xl p-5 text-center space-y-2">
          <div className="text-4xl">✅</div>
          <h3 className="text-xl font-black">
            {language === 'te' ? 'ప్లాన్ నిర్ధారించబడింది!' : 'Plan Confirmed!'}
          </h3>
          <p className="text-sm text-green-100 font-medium">
            {language === 'te'
              ? `${confirmedAppointments.length} పంట అపాయింట్మెంట్లు స్వతంత్రంగా సృష్టించబడ్డాయి.`
              : `${confirmedAppointments.length} independent crop appointments created.`}
          </p>
        </div>

        {/* Appointment cards with tokens */}
        {confirmedAppointments.map((appt, idx) => (
          <div
            key={appt.id}
            className="bg-white border-2 border-green-300 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="bg-agri-800 text-white px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{appt.cropIcon}</span>
                <div>
                  <p className="font-black text-base leading-tight">{appt.cropName}</p>
                  <p className="text-xs text-agri-300">Appointment #{idx + 1}</p>
                </div>
              </div>
              <VoiceSpeaker
                text={`${appt.cropName} confirmed. Token ${appt.tokenDisplay}. Centre ${appt.centreName.split('(')[0].trim()}. Date ${appt.slotDate}. Time ${appt.slotTime}.`}
                size="sm"
                className="bg-white/20 text-white hover:bg-white/30 border-white/20"
              />
            </div>

            <div className="p-4 space-y-3">
              {/* Token badge */}
              <div className="bg-harvest-100 border-2 border-harvest-400 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket size={20} className="text-harvest-700" />
                  <div>
                    <p className="text-[10px] font-black text-harvest-800 uppercase tracking-wide">
                      {language === 'te' ? 'మీ టోకెన్' : 'Your Token'}
                    </p>
                    <p className="text-3xl font-black text-slate-950 font-mono">#{appt.tokenDisplay}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-green-700 bg-green-100 border border-green-300 rounded-full px-2.5 py-1">
                  ✓ CONFIRMED
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                  <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Centre</p>
                  <p className="font-bold text-slate-900 leading-tight">{appt.centreName.split('(')[0].trim()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                  <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Date & Time</p>
                  <p className="font-bold text-slate-900">{appt.slotDate}</p>
                  <p className="text-slate-600">{appt.slotTime}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                  <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Expected Qty</p>
                  <p className="font-bold text-slate-900">{appt.estimatedQuantityQuintals} Quintals</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                  <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Queue Status</p>
                  <p className="font-bold text-agri-800">Scheduled (BOOKED)</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <PrimaryButton
            onClick={() => navigate('/farmer/my-plan')}
            size="lg"
            variant="primary"
            icon={<ArrowRight size={20} />}
          >
            {language === 'te' ? 'నా ప్లాన్ చూడండి' : 'View My Procurement Plan'}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => {
              setStep('SELECT');
              setPlan(null);
              setConfirmedAppointments([]);
              setSelectedCrops([{ cropId: MOCK_CROPS[0].id, quantityQuintals: 48 }]);
            }}
            className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            {language === 'te' ? 'కొత్త ప్లాన్ చేయండి' : 'Plan Another'}
          </button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed
  // ─────────────────────────────────────────────────────────────────────────────

  const hasErrors = Array.from(validationResults.values()).some(r => r.status === 'INVALID');
  const hasWarnings = Array.from(validationResults.values()).some(r => r.status === 'WARNING');

  const pageTitle =
    step === 'CONFIRMED'
      ? (language === 'te' ? 'ప్లాన్ నిర్ధారించబడింది' : 'Plan Confirmed')
      : step === 'REVIEW'
      ? (language === 'te' ? 'ప్లాన్ సమీక్ష' : 'Review Plan')
      : (language === 'te' ? 'మల్టీ-క్రాప్ ప్రొక్యూర్మెంట్ ప్లానర్' : 'Multi-Crop Procurement Planner');

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <PageContainer
      title={pageTitle}
      subtitle={language === 'te' ? 'KisanX సిఫార్సు చేస్తుంది — మీరు మార్చవచ్చు — మీరు నిర్ధారిస్తారు' : 'KisanX recommends — you edit — you confirm'}
      showBackButton
      backTo="/farmer/dashboard"
      maxWidth="2xl"
    >
      <div id="multi-crop-selector" className="space-y-5">

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold border flex items-center gap-2 min-w-[260px] max-w-sm text-center transition-all ${
            toast.ok ? 'bg-green-700 text-white border-green-600' : 'bg-red-600 text-white border-red-500'
          }`}>
            {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* ── CONFIRMED: show token cards */}
        {step === 'CONFIRMED' && renderConfirmedScreen()}

        {/* ── REVIEW: show summary before confirm */}
        {step === 'REVIEW' && renderReviewScreen()}

        {/* ── SELECT / PLAN */}
        {(step === 'SELECT' || step === 'PLAN') && (
          <>
            {/* Info banner */}
            <div className="bg-agri-50 border border-agri-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-agri-800">
              <span className="text-2xl flex-shrink-0">🌾</span>
              <div>
                <p className="font-semibold">
                  {language === 'te'
                    ? 'KisanX మీకు ఉత్తమ కేంద్రం మరియు సమయాన్ని సిఫారసు చేస్తుంది. ఏ పంట అపాయింట్మెంట్ అయినా మార్చవచ్చు. CONFIRM PLAN నొక్కిన తర్వాత మాత్రమే బుకింగ్ సృష్టించబడుతుంది.'
                    : 'KisanX recommends the best centre and time for each crop. Edit any appointment freely. Bookings are created ONLY when you press CONFIRM PLAN.'}
                </p>
              </div>
            </div>

            {/* Crop selection */}
            <div className="space-y-3">
              {selectedCrops.map((sc, idx) => {
                const crop = MOCK_CROPS.find(c => c.id === sc.cropId) || MOCK_CROPS[0];
                const acceptingCentres = MOCK_CENTRES.filter(c => c.acceptedCropIds.includes(sc.cropId));
                return (
                  <div key={idx} className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-700 uppercase tracking-wide">
                        {language === 'te' ? `పంట ${idx + 1}` : `Crop ${idx + 1}`}
                      </span>
                      {selectedCrops.length > 1 && (
                        <button type="button" onClick={() => removeCrop(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors">
                          <Minus size={18} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          {language === 'te' ? 'పంట ఎంచుకోండి' : 'Select Crop'}
                        </label>
                        <select
                          value={sc.cropId}
                          onChange={e => updateCrop(idx, 'cropId', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-agri-400"
                        >
                          {MOCK_CROPS.map(c => (
                            <option key={c.id} value={c.id}
                              disabled={selectedCrops.some((x, i) => i !== idx && x.cropId === c.id)}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          {language === 'te' ? 'పరిమాణం (క్వింటాళ్లు)' : 'Quantity (Quintals)'}
                        </label>
                        <input
                          type="number" min={1} step={1} value={sc.quantityQuintals}
                          onChange={e => updateCrop(idx, 'quantityQuintals', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-agri-400"
                        />
                      </div>
                    </div>
                    {acceptingCentres.length > 0 ? (
                      <p className="text-xs text-green-700 font-semibold flex items-center gap-1.5">
                        <Leaf size={12} />
                        {language === 'te' ? 'అందుబాటు కేంద్రాలు:' : 'Available at:'} {acceptingCentres.map(c => c.name.split('(')[0].trim()).join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        {language === 'te' ? 'ఈ పంటకు సమీప కేంద్రాలు లేవు' : 'No nearby centres accept this crop currently'}
                      </p>
                    )}
                  </div>
                );
              })}

              {selectedCrops.length < 5 && (
                <button
                  type="button"
                  onClick={addCrop}
                  className="w-full py-3 border-2 border-dashed border-agri-300 rounded-2xl text-agri-700 font-bold text-sm hover:bg-agri-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {language === 'te' ? 'మరొక పంట జోడించండి' : 'Add Another Crop'}
                </button>
              )}
            </div>

            {/* Generate button */}
            <PrimaryButton onClick={handleGenerate} size="lg" variant="primary">
              📋 {language === 'te' ? 'ప్రొక్యూర్మెంట్ ప్లాన్ తయారు చేయండి' : 'Generate Procurement Plan'}
            </PrimaryButton>

            {/* ── PLAN step: editable appointment cards */}
            {step === 'PLAN' && plan && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">
                    {language === 'te' ? 'మీ ప్రొక్యూర్మెంట్ ప్లాన్' : 'Your Procurement Plan'}
                  </h3>
                  <VoiceSpeaker
                    text={`Multi-crop plan ready. ${plan.map(p => `${p.cropName}: ${p.estimatedQuantityQuintals} quintals at ${effectiveAppointment(p).centreName.split('(')[0].trim()} on ${effectiveAppointment(p).date} at ${effectiveAppointment(p).time}.`).join(' ')}`}
                    size="sm"
                    autoRead={true}
                  />
                </div>

                {/* Summary banners */}
                {hasErrors && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-2xl px-4 py-3 flex items-start gap-2 text-sm text-red-800 font-semibold">
                    <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black">{language === 'te' ? 'సమస్యలు ఉన్నాయి' : 'Some appointments have issues'}</p>
                      <p className="text-xs font-medium mt-0.5">{language === 'te' ? 'సేవ్ చేయడానికి ముందు అన్ని సమస్యలు పరిష్కరించండి.' : 'Please fix all issues before proceeding.'}</p>
                    </div>
                  </div>
                )}
                {!hasErrors && hasWarnings && (
                  <div className="bg-harvest-50 border-2 border-harvest-400 rounded-2xl px-4 py-3 flex items-start gap-2 text-sm text-harvest-900 font-semibold">
                    <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                    <p>{language === 'te' ? 'సమయ వైరుధ్యాలు ఉన్నాయి — సమయాలు మార్చండి.' : 'Time conflicts detected — please change times for conflicting appointments.'}</p>
                  </div>
                )}

                {/* Per-crop cards */}
                {plan.map((item, idx) => renderPlanCard(item, idx))}

                {/* REVIEW button */}
                <div className="pt-2 border-t border-slate-200">
                  <PrimaryButton
                    onClick={handleReview}
                    size="lg"
                    variant={hasErrors ? 'outline' : 'primary'}
                    icon={<ArrowRight size={20} />}
                  >
                    {language === 'te' ? 'ప్లాన్ సమీక్షించండి' : 'Review Plan →'}
                  </PrimaryButton>
                  <p className="text-xs text-slate-500 italic px-1 mt-2">
                    ⓘ {language === 'te'
                      ? 'సమీక్ష తర్వాత మీరు నిర్ధారిస్తేనే బుకింగ్ సృష్టించబడుతుంది.'
                      : 'Booking is created only after you review and confirm the plan.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
};
