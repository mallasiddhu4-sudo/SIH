export type LanguageCode = 'te' | 'en' | 'hi' | 'ta' | 'kn';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  greeting: string;
  speechLocale: string;
  subtext: string;
}

export interface Crop {
  id: string;
  name: string;
  nativeNames: Record<LanguageCode, string>;
  mspPerQuintal: number;
  icon: string;
  faqMoistureMax: number;
}

export type CentreOperationalStatus = 'NORMAL' | 'ATTENTION' | 'HIGH_LOAD' | 'OFFLINE';

export interface ProcurementCentre {
  id: string;
  name: string;
  mandal: string;
  district: string;
  state: string;
  distanceKm: number;
  contactNumber: string;
  // Queue & capacity
  currentQueueCount: number;
  averageWaitMins: number;
  dailyCapacityQuintals: number;
  // Enhanced for smart coordination
  processingRateQuintalsPerHour: number;
  currentScheduledQuantityQuintals: number;
  processedQuantityQuintals: number;
  acceptedCropIds: string[];
  operationalStatus: CentreOperationalStatus;
  operatingHours: string;
  agency: string;
}

export type QueueStep = 'BOOKED' | 'AT_GATE' | 'QUALITY_CHECK' | 'WEIGHING' | 'UNLOADING' | 'COMPLETED';
export type PaymentStep = 'PENDING_APPROVAL' | 'APPROVED' | 'DBT_PROCESSING' | 'CREDITED_TO_BANK';
export type BookingStatus = 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  farmerId: string; // e.g., FRM10234
  village: string;
  district: string;
  bankAccountMasked: string;
  bankName: string;
  ifscMasked: string;
}

export interface SlotBooking {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  cropId: string;
  cropName: string;
  estimatedQuantityQuintals: number;
  centreId: string;
  centreName: string;
  slotDate: string;
  slotTime: string;
  tokenNumber: number | string;
  tokenDisplay: string; // e.g., 'A127'
  bookingTime: string;
  bookingStatus: BookingStatus;
  
  // Dynamic live progress
  queueStatus: QueueStep;
  currentServingToken: number | string;
  estimatedWaitMinutes: number;
  
  // Procurement results — operator-entered, not farmer-entered
  moisturePercent?: number;
  qualityGrade?: 'Grade A' | 'Grade B' | 'Standard';
  /** Estimated quantity entered by farmer at booking */
  // estimatedQuantityQuintals already defined above
  /** Final actual weighed quantity entered ONLY by centre operator */
  actualWeightQuintals?: number;
  gunnyBagsCount?: number;
  grossAmount?: number;
  deductions?: number;
  netPayableAmount?: number;
  
  // Payment status
  paymentStatus: PaymentStep;
  transactionRef?: string;
  paymentDate?: string;
  paymentBankRef?: string;
}

export interface GuidanceTarget {
  selector: string;
  message: string;
  speechText?: string;
  actionHint?: string;
}

// ─── Centre Operations / Digital Twin ─────────────────────────────────────────

export interface CentreOperation {
  centreId: string;
  date: string;
  farmersExpected: number;
  farmersArrived: number;
  farmersCompleted: number;
  farmersWaiting: number;
  expectedQuantityQuintals: number;
  processedQuantityQuintals: number;
  queuePressure: 'LOW' | 'MEDIUM' | 'HIGH';
  overloadWarningTime?: string; // e.g. "12:30 PM"
  projectedArrivalsNext3h: number;
  projectedQuantityNext3hQuintals: number;
  // Live farmer queue
  farmerQueue: OperatorFarmerEntry[];
}

export interface OperatorFarmerEntry {
  token: string;
  farmerName: string;
  farmerId: string;
  cropName: string;
  bookedQuantityQuintals: number;
  actualWeightQuintals?: number;
  moisturePercent?: number;
  qualityGrade?: 'Grade A' | 'Grade B' | 'Standard';
  queueStatus: QueueStep;
  paymentStatus: PaymentStep;
  arrivalTime?: string;
}

// ─── Multi-Crop Procurement Plan ───────────────────────────────────────────────

export interface CropPlanItem {
  cropId: string;
  cropName: string;
  cropIcon: string;
  estimatedQuantityQuintals: number;
  // ── System recommendation (read-only, never mutated after generation) ──
  recommendedCentreId: string;
  recommendedCentreName: string;
  recommendedDate: string;
  recommendedTime: string;
  estimatedWaitMins: number;
  reason: string;
  // ── Farmer override (undefined = use recommendation) ─────────────────
  selectedCentreId?: string;
  selectedCentreName?: string;
  selectedDate?: string;
  selectedTime?: string;
  isEdited: boolean;       // true once farmer changes any field
  isConfirmed: boolean;    // true after "Save Changes"
}

export interface MultiCropPlan {
  farmerId: string;
  createdAt: string;
  items: CropPlanItem[];
}

// ─── Admin Analytics ────────────────────────────────────────────────────────────

export interface YearlyProcurementRecord {
  year: number;
  totalQuantityQuintals: number;
  totalAmountCrore: number;
  farmerCount: number;
  centreCount: number;
}

export interface CropWiseProcurement {
  cropId: string;
  cropName: string;
  cropIcon: string;
  quantityQuintals: number;
  amountLakh: number;
  centresCovered: number;
}

export interface CentreUtilizationRecord {
  centreId: string;
  centreName: string;
  utilizationPercent: number;
  farmersServed: number;
  quantityQuintals: number;
}

// ─── What-If Simulation ─────────────────────────────────────────────────────────

export interface SimulationResult {
  centreId: string;
  centreName: string;
  baselineLoad: CentreOperationalStatus;
  projectedLoad: CentreOperationalStatus;
  projectedQueueCount: number;
  projectedWaitMins: number;
  projectedCapacityUtilization: number;
}

// ─── Pre-Arrival Intelligence ───────────────────────────────────────────────────

export type PreArrivalDecision = 'GO_NOW' | 'WAIT' | 'CONSIDER_ALTERNATIVE';

export interface PreArrivalCheck {
  decision: PreArrivalDecision;
  reasons: string[];
  recommendedArrivalTime?: string;
  alternativeCentreId?: string;
  alternativeCentreName?: string;
  alternativeSlotTime?: string;
  centreLoadStatus: CentreOperationalStatus;
  estimatedWaitMins: number;
  queueCount: number;
  checklist: {
    slotConfirmed: boolean;
    cropAccepted: boolean;
    quantityRecorded: boolean;
    centreAvailable: boolean;
    withinSlotTime: boolean;
  };
}
