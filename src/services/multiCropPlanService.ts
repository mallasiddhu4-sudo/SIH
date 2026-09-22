/**
 * Multi-Crop Plan Service — Pure validation & logic layer
 * ─────────────────────────────────────────────────────────────────────
 * All functions are pure (no side-effects, no React imports).
 * Used by MultiCropPlannerPage to validate edits in real-time.
 * ─────────────────────────────────────────────────────────────────────
 */
import type { CropPlanItem } from '../types';
import { MOCK_CENTRES } from '../data/mockCentres';
import { ALL_SLOT_DATA, DayAvailability, TimeSlot } from '../data/mockSlotData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ValidationStatus = 'VALID' | 'INVALID' | 'WARNING';

export interface ValidationResult {
  status: ValidationStatus;
  message: string; // Shown to farmer — no technical jargon
}

export interface ConflictInfo {
  conflictingCropName: string;
  conflictingTime: string;
}

// ─── Centre Eligibility ───────────────────────────────────────────────────────

/**
 * Returns true if the given centre accepts the given crop.
 */
export function isCropAcceptedAt(centreId: string, cropId: string): boolean {
  const centre = MOCK_CENTRES.find(c => c.id === centreId);
  return centre ? centre.acceptedCropIds.includes(cropId) : false;
}

/**
 * Returns all centres sorted by: eligible first, then by load (NORMAL → ATTENTION → HIGH_LOAD → OFFLINE).
 * Each entry carries eligibility and a reason string.
 */
export function getAvailableCentres(cropId: string): Array<{
  centreId: string;
  centreName: string;
  distanceKm: number;
  status: string;
  isEligible: boolean;
  isFull: boolean;
  reason: string;
  waitMins: number;
}> {
  const loadOrder: Record<string, number> = { NORMAL: 0, ATTENTION: 1, HIGH_LOAD: 2, OFFLINE: 3 };

  return MOCK_CENTRES
    .map(c => {
      const eligible = c.acceptedCropIds.includes(cropId);
      const offline = c.operationalStatus === 'OFFLINE';
      const dayData = ALL_SLOT_DATA[c.id] ?? [];
      const todayData = dayData[0];
      const hasAnySlot = todayData?.isAvailable && todayData.slots.some(s => !s.isFull);

      let reason = '';
      if (!eligible) reason = 'Not accepting this crop';
      else if (offline) reason = 'Centre is offline';
      else if (!hasAnySlot) reason = 'No slots available today';
      else if (c.operationalStatus === 'HIGH_LOAD') reason = 'High load — long wait expected';
      else if (c.operationalStatus === 'ATTENTION') reason = 'Busy — some delay expected';
      else reason = 'Available';

      return {
        centreId: c.id,
        centreName: c.name,
        distanceKm: c.distanceKm,
        status: c.operationalStatus,
        isEligible: eligible && !offline,
        isFull: eligible && !hasAnySlot,
        reason,
        waitMins: c.averageWaitMins,
      };
    })
    .sort((a, b) => {
      // Eligible before ineligible
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      // Within eligible: by load
      return (loadOrder[a.status] ?? 3) - (loadOrder[b.status] ?? 3);
    });
}

// ─── Date & Time Availability ─────────────────────────────────────────────────

/**
 * Returns the 7-day availability calendar for the given centre.
 */
export function getAvailableDates(centreId: string): DayAvailability[] {
  return ALL_SLOT_DATA[centreId] ?? [];
}

/**
 * Returns time slots for a specific centre + date combination.
 */
export function getAvailableTimes(centreId: string, date: string): TimeSlot[] {
  const dayData = ALL_SLOT_DATA[centreId] ?? [];
  const day = dayData.find(d => d.date === date);
  return day?.slots ?? [];
}

// ─── Conflict Detection ───────────────────────────────────────────────────────

/**
 * Gets the effective date and time for a plan item (farmer override or recommendation).
 */
function effectiveDateTime(item: CropPlanItem): { date: string; time: string } {
  return {
    date: item.selectedDate ?? item.recommendedDate,
    time: item.selectedTime ?? item.recommendedTime,
  };
}

/**
 * Detects if any two items in the plan have the same date AND overlapping time.
 * Returns the conflicting crop name and time if found, null if no conflict.
 */
export function detectConflict(item: CropPlanItem, allItems: CropPlanItem[]): ConflictInfo | null {
  const { date, time } = effectiveDateTime(item);
  const others = allItems.filter(o => o.cropId !== item.cropId);
  for (const other of others) {
    const { date: oDate, time: oTime } = effectiveDateTime(other);
    if (oDate === date && oTime === time) {
      return { conflictingCropName: other.cropName, conflictingTime: oTime };
    }
  }
  return null;
}

// ─── Full Appointment Validation ──────────────────────────────────────────────

/**
 * Validates all aspects of a single appointment in context of the full plan.
 * Returns the first failing check (priority order: eligibility > availability > capacity > conflict).
 */
export function validateAppointment(
  item: CropPlanItem,
  allItems: CropPlanItem[]
): ValidationResult {
  const centreId = item.selectedCentreId ?? item.recommendedCentreId;
  const date     = item.selectedDate   ?? item.recommendedDate;
  const time     = item.selectedTime   ?? item.recommendedTime;

  // 1. Crop eligibility at centre
  if (!isCropAcceptedAt(centreId, item.cropId)) {
    return {
      status: 'INVALID',
      message: `This centre does not accept ${item.cropName}. Please choose another centre.`,
    };
  }

  // 2. Centre operational status
  const centre = MOCK_CENTRES.find(c => c.id === centreId);
  if (centre?.operationalStatus === 'OFFLINE') {
    return {
      status: 'INVALID',
      message: 'This centre is currently offline. Please choose another centre.',
    };
  }

  // 3. Date availability
  const dayData = getAvailableDates(centreId).find(d => d.date === date);
  if (!dayData || !dayData.isAvailable) {
    return {
      status: 'INVALID',
      message: 'This centre is not available on the selected date. Please choose another date.',
    };
  }

  // 4. Slot availability
  const slot = dayData.slots.find(s => s.time === time);
  if (!slot) {
    return {
      status: 'INVALID',
      message: 'The selected time slot is not available. Please choose another time.',
    };
  }
  if (slot.isFull) {
    return {
      status: 'INVALID',
      message: 'This slot is full. Please choose another time.',
    };
  }

  // 5. Conflict with another crop in the same plan
  const conflict = detectConflict(item, allItems);
  if (conflict) {
    return {
      status: 'WARNING',
      message: `This appointment conflicts with your ${conflict.conflictingCropName} appointment at the same time (${conflict.conflictingTime}). Please choose a different time.`,
    };
  }

  // All checks passed
  return {
    status: 'VALID',
    message: 'Available — appointment is confirmed.',
  };
}

/**
 * Validates all items in the plan and returns per-item results.
 */
export function validateFullPlan(items: CropPlanItem[]): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();
  for (const item of items) {
    results.set(item.cropId, validateAppointment(item, items));
  }
  return results;
}
