import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SlotBooking, QueueStep, PaymentStep, BookingStatus,
  ProcurementPlanAppointment, CropPlanItem
} from '../types';
import { INITIAL_MOCK_BOOKING } from '../data/mockFarmerData';
import { useAuth } from './AuthContext';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface ProcurementContextType {
  // ── Single booking (original flow) ──────────────────────────────────────
  currentBooking: SlotBooking | null;
  pastBookings: SlotBooking[];
  hasActiveBooking: boolean;
  isCancelled: boolean;
  bookSlot: (data: {
    cropId: string;
    cropName: string;
    estimatedQuantityQuintals: number;
    centreId: string;
    centreName: string;
    slotDate: string;
    slotTime: string;
  }) => SlotBooking;
  rescheduleSlot: (newDate: string, newTime: string, newCentreId?: string, newCentreName?: string) => SlotBooking | null;
  cancelSlot: () => void;
  completeBooking: (bookingId?: string) => void;
  advanceQueue: () => void;
  updateWeighment: (weightQuintals: number, moisturePercent: number, grade: 'Grade A' | 'Grade B' | 'Standard') => void;
  approvePayment: () => void;
  markPaymentCredited: () => void;
  resetDemoData: () => void;

  // ── Multi-crop plan appointments ─────────────────────────────────────────
  /** All active (not completed/cancelled) plan appointments */
  activePlanAppointments: ProcurementPlanAppointment[];
  /** All past completed plan appointments */
  pastPlanAppointments: ProcurementPlanAppointment[];
  /** Called when the farmer presses CONFIRM PLAN. Creates one appointment per crop. */
  confirmMultiCropPlan: (items: CropPlanItem[]) => ProcurementPlanAppointment[];
  /** Advance the queue for a specific plan appointment */
  advancePlanAppointmentQueue: (appointmentId: string) => void;
  /** Enter weighment data for a specific plan appointment (operator only) */
  updatePlanAppointmentWeighment: (
    appointmentId: string,
    weightQuintals: number,
    moisturePercent: number,
    grade: 'Grade A' | 'Grade B' | 'Standard'
  ) => void;
  /** Approve payment for a specific plan appointment */
  approvePlanAppointmentPayment: (appointmentId: string) => void;
  /** Mark payment credited for a specific plan appointment */
  markPlanAppointmentCredited: (appointmentId: string) => void;
  /** Cancel a single plan appointment */
  cancelPlanAppointment: (appointmentId: string) => void;
  /** Reschedule a single plan appointment */
  reschedulePlanAppointment: (
    appointmentId: string,
    newDate: string,
    newTime: string,
    newCentreId?: string,
    newCentreName?: string
  ) => void;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const BOOKING_STORAGE_KEY = 'farmer_portal_procurement_booking';
const PAST_BOOKINGS_STORAGE_KEY = 'farmer_portal_past_bookings';
const PLAN_APPT_STORAGE_KEY = 'farmer_portal_plan_appointments';
const PAST_PLAN_APPT_STORAGE_KEY = 'farmer_portal_past_plan_appointments';

// ─── Token counter (per-session unique incrementing pool) ─────────────────────

let _tokenSeed = 120 + Math.floor(Math.random() * 10);
function nextUniqueToken(): { num: number; display: string } {
  _tokenSeed += 1 + Math.floor(Math.random() * 5);
  return { num: _tokenSeed, display: `A${_tokenSeed}` };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { farmer } = useAuth();

  // ── Single booking state ─────────────────────────────────────────────────
  const [currentBooking, setCurrentBooking] = useState<SlotBooking | null>(() => {
    const saved = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.bookingStatus === 'COMPLETED' || parsed.queueStatus === 'COMPLETED')) {
          return null;
        }
        return parsed;
      } catch {
        return INITIAL_MOCK_BOOKING;
      }
    }
    return INITIAL_MOCK_BOOKING;
  });

  const [pastBookings, setPastBookings] = useState<SlotBooking[]>(() => {
    const saved = localStorage.getItem(PAST_BOOKINGS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  // ── Multi-crop plan appointment state ────────────────────────────────────
  const [activePlanAppointments, setActivePlanAppointments] = useState<ProcurementPlanAppointment[]>(() => {
    const saved = localStorage.getItem(PLAN_APPT_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  const [pastPlanAppointments, setPastPlanAppointments] = useState<ProcurementPlanAppointment[]>(() => {
    const saved = localStorage.getItem(PAST_PLAN_APPT_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  // ── Persistence ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentBooking && currentBooking.bookingStatus !== 'COMPLETED' && currentBooking.queueStatus !== 'COMPLETED') {
      localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(currentBooking));
    } else {
      localStorage.removeItem(BOOKING_STORAGE_KEY);
    }
  }, [currentBooking]);

  useEffect(() => {
    localStorage.setItem(PAST_BOOKINGS_STORAGE_KEY, JSON.stringify(pastBookings));
  }, [pastBookings]);

  useEffect(() => {
    localStorage.setItem(PLAN_APPT_STORAGE_KEY, JSON.stringify(activePlanAppointments));
  }, [activePlanAppointments]);

  useEffect(() => {
    localStorage.setItem(PAST_PLAN_APPT_STORAGE_KEY, JSON.stringify(pastPlanAppointments));
  }, [pastPlanAppointments]);

  // ── Single booking actions ────────────────────────────────────────────────

  const bookSlot = (data: {
    cropId: string;
    cropName: string;
    estimatedQuantityQuintals: number;
    centreId: string;
    centreName: string;
    slotDate: string;
    slotTime: string;
  }): SlotBooking => {
    const { num: nextTokenNum, display: tokenStr } = nextUniqueToken();
    const grossVal = data.estimatedQuantityQuintals * 2320;

    const newBooking: SlotBooking = {
      id: 'slot_bk_' + Math.floor(1000 + Math.random() * 9000),
      farmerId: farmer?.farmerId || 'FRM10234',
      farmerName: farmer?.name || 'Ravi Kumar',
      phone: farmer?.phone || '9876543210',
      cropId: data.cropId,
      cropName: data.cropName,
      estimatedQuantityQuintals: data.estimatedQuantityQuintals,
      centreId: data.centreId,
      centreName: data.centreName,
      slotDate: data.slotDate,
      slotTime: data.slotTime,
      tokenNumber: nextTokenNum,
      tokenDisplay: tokenStr,
      bookingTime: new Date().toLocaleString(),
      bookingStatus: 'CONFIRMED',
      queueStatus: 'BOOKED',
      currentServingToken: `A${Math.max(1, nextTokenNum - 4)}`,
      estimatedWaitMinutes: 25,
      moisturePercent: 14.2,
      qualityGrade: 'Grade A',
      actualWeightQuintals: data.estimatedQuantityQuintals,
      gunnyBagsCount: Math.round(data.estimatedQuantityQuintals * 2),
      grossAmount: grossVal,
      deductions: 0,
      netPayableAmount: grossVal,
      paymentStatus: 'PENDING_APPROVAL'
    };

    setCurrentBooking(newBooking);
    return newBooking;
  };

  const rescheduleSlot = (
    newDate: string,
    newTime: string,
    newCentreId?: string,
    newCentreName?: string
  ): SlotBooking | null => {
    if (!currentBooking) return null;
    const updated: SlotBooking = {
      ...currentBooking,
      slotDate: newDate,
      slotTime: newTime,
      centreId: newCentreId || currentBooking.centreId,
      centreName: newCentreName || currentBooking.centreName,
      bookingStatus: 'RESCHEDULED',
      bookingTime: new Date().toLocaleString()
    };
    setCurrentBooking(updated);
    return updated;
  };

  const cancelSlot = () => {
    if (!currentBooking) return;
    setCurrentBooking({ ...currentBooking, bookingStatus: 'CANCELLED' });
  };

  const completeBooking = (_bookingId?: string) => {
    if (!currentBooking) return;
    const completed: SlotBooking = {
      ...currentBooking,
      bookingStatus: 'COMPLETED',
      queueStatus: 'COMPLETED',
      paymentStatus: 'CREDITED_TO_BANK',
      paymentDate: currentBooking.paymentDate || new Date().toISOString().split('T')[0]
    };
    setPastBookings(prev => [completed, ...prev.filter(b => b.id !== completed.id)]);
    setCurrentBooking(null);
    localStorage.removeItem(BOOKING_STORAGE_KEY);
  };

  const advanceQueue = () => {
    if (!currentBooking) return;
    const currentNum = typeof currentBooking.currentServingToken === 'number'
      ? currentBooking.currentServingToken
      : parseInt(String(currentBooking.currentServingToken).replace(/\D/g, ''), 10) || 120;
    const farmerTokenNum = typeof currentBooking.tokenNumber === 'number'
      ? currentBooking.tokenNumber
      : parseInt(String(currentBooking.tokenNumber).replace(/\D/g, ''), 10) || 127;
    const nextServing = currentNum + 1;
    let nextStatus: QueueStep = currentBooking.queueStatus;
    if (nextServing >= farmerTokenNum) nextStatus = 'WEIGHING';
    else if (nextServing >= farmerTokenNum - 1) nextStatus = 'AT_GATE';
    else nextStatus = 'BOOKED';
    const waitMins = Math.max(0, (farmerTokenNum - nextServing) * 8);
    setCurrentBooking({
      ...currentBooking,
      currentServingToken: `A${nextServing}`,
      queueStatus: nextStatus,
      estimatedWaitMinutes: waitMins
    });
  };

  const updateWeighment = (
    weightQuintals: number,
    moisturePercent: number,
    grade: 'Grade A' | 'Grade B' | 'Standard'
  ) => {
    if (!currentBooking) return;
    const rate = grade === 'Grade A' ? 2320 : 2180;
    const gross = weightQuintals * rate;
    setCurrentBooking({
      ...currentBooking,
      actualWeightQuintals: weightQuintals,
      moisturePercent,
      qualityGrade: grade,
      gunnyBagsCount: Math.round(weightQuintals * 2),
      grossAmount: gross,
      netPayableAmount: gross,
      queueStatus: 'WEIGHING',
      paymentStatus: 'APPROVED'
    });
  };

  const approvePayment = () => {
    if (!currentBooking) return;
    setCurrentBooking({
      ...currentBooking,
      paymentStatus: 'DBT_PROCESSING',
      transactionRef: 'DBT-2026-AP-' + Math.floor(1000000 + Math.random() * 9000000),
      paymentDate: new Date().toISOString().split('T')[0]
    });
  };

  const markPaymentCredited = () => {
    if (!currentBooking) return;
    setCurrentBooking({
      ...currentBooking,
      paymentStatus: 'CREDITED_TO_BANK',
      transactionRef: currentBooking.transactionRef || ('DBT-2026-AP-' + Math.floor(1000000 + Math.random() * 9000000)),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentBankRef: 'NPCI/ACH/' + Math.floor(10000000 + Math.random() * 90000000)
    });
  };

  const resetDemoData = () => {
    setCurrentBooking(INITIAL_MOCK_BOOKING);
    setPastBookings([]);
    setActivePlanAppointments([]);
    setPastPlanAppointments([]);
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_BOOKING));
    localStorage.removeItem(PAST_BOOKINGS_STORAGE_KEY);
    localStorage.removeItem(PLAN_APPT_STORAGE_KEY);
    localStorage.removeItem(PAST_PLAN_APPT_STORAGE_KEY);
  };

  // ── Multi-crop plan actions ───────────────────────────────────────────────

  /**
   * Creates one independent ProcurementPlanAppointment per CropPlanItem.
   * Each appointment gets its OWN unique token.
   * Only called when the farmer explicitly presses CONFIRM PLAN.
   */
  const confirmMultiCropPlan = (items: CropPlanItem[]): ProcurementPlanAppointment[] => {
    const planId = 'plan_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const farmerId = farmer?.farmerId || 'FRM10234';
    const farmerName = farmer?.name || 'Ravi Kumar';
    const phone = farmer?.phone || '9876543210';
    const now = new Date().toLocaleString();

    const newAppointments: ProcurementPlanAppointment[] = items.map(item => {
      const { num: tokenNum, display: tokenDisplay } = nextUniqueToken();
      const centreId = item.selectedCentreId ?? item.recommendedCentreId;
      const centreName = item.selectedCentreName ?? item.recommendedCentreName;
      const slotDate = item.selectedDate ?? item.recommendedDate;
      const slotTime = item.selectedTime ?? item.recommendedTime;

      // Serving token is a few positions behind this appointment's token
      const servingOffset = 3 + Math.floor(Math.random() * 4);
      const servingTokenNum = Math.max(1, tokenNum - servingOffset);

      return {
        id: 'appt_' + Math.floor(10000 + Math.random() * 90000),
        planId,
        farmerId,
        farmerName,
        phone,
        cropId: item.cropId,
        cropName: item.cropName,
        cropIcon: item.cropIcon,
        estimatedQuantityQuintals: item.estimatedQuantityQuintals,
        centreId,
        centreName,
        slotDate,
        slotTime,
        bookingTime: now,
        bookingStatus: 'CONFIRMED' as BookingStatus,
        tokenNumber: tokenNum,
        tokenDisplay,
        queueStatus: 'BOOKED' as QueueStep,
        currentServingToken: `A${servingTokenNum}`,
        estimatedWaitMinutes: servingOffset * 8,
        paymentStatus: 'PENDING_APPROVAL' as PaymentStep
      };
    });

    setActivePlanAppointments(prev => [
      ...prev.filter(a => a.planId !== planId),
      ...newAppointments
    ]);

    return newAppointments;
  };

  const advancePlanAppointmentQueue = (appointmentId: string) => {
    setActivePlanAppointments(prev => prev.map(appt => {
      if (appt.id !== appointmentId) return appt;
      const currentNum = parseInt(appt.currentServingToken.replace(/\D/g, ''), 10) || 120;
      const farmerTokenNum = appt.tokenNumber;
      const nextServing = currentNum + 1;
      let nextStatus: QueueStep = appt.queueStatus;
      if (nextServing >= farmerTokenNum) nextStatus = 'WEIGHING';
      else if (nextServing >= farmerTokenNum - 1) nextStatus = 'AT_GATE';
      else nextStatus = 'BOOKED';
      const waitMins = Math.max(0, (farmerTokenNum - nextServing) * 8);
      return {
        ...appt,
        currentServingToken: `A${nextServing}`,
        queueStatus: nextStatus,
        estimatedWaitMinutes: waitMins
      };
    }));
  };

  const updatePlanAppointmentWeighment = (
    appointmentId: string,
    weightQuintals: number,
    moisturePercent: number,
    grade: 'Grade A' | 'Grade B' | 'Standard'
  ) => {
    setActivePlanAppointments(prev => prev.map(appt => {
      if (appt.id !== appointmentId) return appt;
      const rate = grade === 'Grade A' ? 2320 : 2180;
      const gross = weightQuintals * rate;
      return {
        ...appt,
        actualWeightQuintals: weightQuintals,
        moisturePercent,
        qualityGrade: grade,
        gunnyBagsCount: Math.round(weightQuintals * 2),
        grossAmount: gross,
        netPayableAmount: gross,
        queueStatus: 'WEIGHING' as QueueStep,
        paymentStatus: 'APPROVED' as PaymentStep
      };
    }));
  };

  const approvePlanAppointmentPayment = (appointmentId: string) => {
    setActivePlanAppointments(prev => prev.map(appt => {
      if (appt.id !== appointmentId) return appt;
      return {
        ...appt,
        paymentStatus: 'DBT_PROCESSING' as PaymentStep,
        transactionRef: 'DBT-2026-AP-' + Math.floor(1000000 + Math.random() * 9000000),
        paymentDate: new Date().toISOString().split('T')[0]
      };
    }));
  };

  const markPlanAppointmentCredited = (appointmentId: string) => {
    setActivePlanAppointments(prev => {
      const appt = prev.find(a => a.id === appointmentId);
      if (!appt) return prev;
      const completed: ProcurementPlanAppointment = {
        ...appt,
        bookingStatus: 'COMPLETED' as BookingStatus,
        queueStatus: 'COMPLETED' as QueueStep,
        paymentStatus: 'CREDITED_TO_BANK' as PaymentStep,
        paymentBankRef: 'NPCI/ACH/' + Math.floor(10000000 + Math.random() * 90000000),
        paymentDate: new Date().toISOString().split('T')[0]
      };
      setPastPlanAppointments(pp => [completed, ...pp.filter(a => a.id !== appointmentId)]);
      return prev.filter(a => a.id !== appointmentId);
    });
  };

  const cancelPlanAppointment = (appointmentId: string) => {
    setActivePlanAppointments(prev => prev.map(appt =>
      appt.id === appointmentId
        ? { ...appt, bookingStatus: 'CANCELLED' as BookingStatus }
        : appt
    ));
  };

  const reschedulePlanAppointment = (
    appointmentId: string,
    newDate: string,
    newTime: string,
    newCentreId?: string,
    newCentreName?: string
  ) => {
    setActivePlanAppointments(prev => prev.map(appt => {
      if (appt.id !== appointmentId) return appt;
      return {
        ...appt,
        slotDate: newDate,
        slotTime: newTime,
        centreId: newCentreId || appt.centreId,
        centreName: newCentreName || appt.centreName,
        bookingStatus: 'RESCHEDULED' as BookingStatus,
        bookingTime: new Date().toLocaleString()
      };
    }));
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const hasActiveBooking =
    !!currentBooking &&
    currentBooking.bookingStatus !== 'CANCELLED' &&
    currentBooking.bookingStatus !== 'COMPLETED' &&
    currentBooking.queueStatus !== 'COMPLETED';

  const isCancelled =
    !!currentBooking && currentBooking.bookingStatus === 'CANCELLED';

  return (
    <ProcurementContext.Provider
      value={{
        currentBooking,
        pastBookings,
        hasActiveBooking,
        isCancelled,
        bookSlot,
        rescheduleSlot,
        cancelSlot,
        completeBooking,
        advanceQueue,
        updateWeighment,
        approvePayment,
        markPaymentCredited,
        resetDemoData,
        activePlanAppointments,
        pastPlanAppointments,
        confirmMultiCropPlan,
        advancePlanAppointmentQueue,
        updatePlanAppointmentWeighment,
        approvePlanAppointmentPayment,
        markPlanAppointmentCredited,
        cancelPlanAppointment,
        reschedulePlanAppointment
      }}
    >
      {children}
    </ProcurementContext.Provider>
  );
};

export const useProcurement = (): ProcurementContextType => {
  const context = useContext(ProcurementContext);
  if (!context) {
    throw new Error('useProcurement must be used within a ProcurementProvider');
  }
  return context;
};
