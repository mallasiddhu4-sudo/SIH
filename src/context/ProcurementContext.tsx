import React, { createContext, useContext, useState, useEffect } from 'react';
import { SlotBooking, QueueStep, PaymentStep, BookingStatus } from '../types';
import { INITIAL_MOCK_BOOKING } from '../data/mockFarmerData';
import { useAuth } from './AuthContext';

interface ProcurementContextType {
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
}

const BOOKING_STORAGE_KEY = 'farmer_portal_procurement_booking';
const PAST_BOOKINGS_STORAGE_KEY = 'farmer_portal_past_bookings';

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { farmer } = useAuth();

  const [currentBooking, setCurrentBooking] = useState<SlotBooking | null>(() => {
    const saved = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If parsed booking is already completed, do not load as active current booking
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
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

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

  const bookSlot = (data: {
    cropId: string;
    cropName: string;
    estimatedQuantityQuintals: number;
    centreId: string;
    centreName: string;
    slotDate: string;
    slotTime: string;
  }): SlotBooking => {
    const nextTokenNum = Math.floor(120 + Math.random() * 20);
    const tokenStr = `A${nextTokenNum}`;
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

    const cancelled: SlotBooking = {
      ...currentBooking,
      bookingStatus: 'CANCELLED'
    };

    setCurrentBooking(cancelled);
  };

  const completeBooking = (bookingId?: string) => {
    const bookingToComplete = currentBooking;
    if (!bookingToComplete) return;

    const completed: SlotBooking = {
      ...bookingToComplete,
      bookingStatus: 'COMPLETED',
      queueStatus: 'COMPLETED',
      paymentStatus: 'CREDITED_TO_BANK',
      paymentDate: bookingToComplete.paymentDate || new Date().toISOString().split('T')[0]
    };

    // Move to past bookings
    setPastBookings(prev => [completed, ...prev.filter(b => b.id !== completed.id)]);
    
    // Clear from active current booking
    setCurrentBooking(null);
    localStorage.removeItem(BOOKING_STORAGE_KEY);
  };

  const advanceQueue = () => {
    if (!currentBooking) return;
    
    // Parse serving token
    const currentNum = typeof currentBooking.currentServingToken === 'number'
      ? currentBooking.currentServingToken
      : parseInt(String(currentBooking.currentServingToken).replace(/\D/g, ''), 10) || 120;
    
    const farmerTokenNum = typeof currentBooking.tokenNumber === 'number'
      ? currentBooking.tokenNumber
      : parseInt(String(currentBooking.tokenNumber).replace(/\D/g, ''), 10) || 127;

    const nextServing = currentNum + 1;
    let nextStatus: QueueStep = currentBooking.queueStatus;

    if (nextServing >= farmerTokenNum) {
      nextStatus = 'WEIGHING';
    } else if (nextServing >= farmerTokenNum - 1) {
      nextStatus = 'AT_GATE';
    } else {
      nextStatus = 'BOOKED';
    }

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
      moisturePercent: moisturePercent,
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
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_BOOKING));
    localStorage.removeItem(PAST_BOOKINGS_STORAGE_KEY);
  };

  const hasActiveBooking = !!currentBooking && currentBooking.bookingStatus !== 'CANCELLED' && currentBooking.bookingStatus !== 'COMPLETED' && currentBooking.queueStatus !== 'COMPLETED';
  const isCancelled = !!currentBooking && currentBooking.bookingStatus === 'CANCELLED';

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
        resetDemoData
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

