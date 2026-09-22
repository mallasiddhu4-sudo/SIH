/**
 * Mock Centre Operations Data
 * ─────────────────────────────────────────────────────────────────────
 * SAMPLE DATA — For Demonstration / Prototype Only.
 * Not connected to live government procurement systems.
 * ─────────────────────────────────────────────────────────────────────
 */

import {
  CentreOperation,
  OperatorFarmerEntry,
  YearlyProcurementRecord,
  CropWiseProcurement,
  CentreUtilizationRecord
} from '../types';

// ─── Live Centre Queue for Centre A (ppc_101) ──────────────────────────────────

export const CENTRE_A_LIVE_QUEUE: OperatorFarmerEntry[] = [
  {
    token: 'A120',
    farmerName: 'Suresh Babu',
    farmerId: 'FRM10201',
    cropName: 'Paddy',
    bookedQuantityQuintals: 62,
    actualWeightQuintals: 60.5,
    moisturePercent: 13.8,
    qualityGrade: 'Grade A',
    queueStatus: 'COMPLETED',
    paymentStatus: 'DBT_PROCESSING',
    arrivalTime: '9:15 AM'
  },
  {
    token: 'A121',
    farmerName: 'Lakshmaiah Reddy',
    farmerId: 'FRM10202',
    cropName: 'Paddy',
    bookedQuantityQuintals: 45,
    actualWeightQuintals: 44.2,
    moisturePercent: 14.5,
    qualityGrade: 'Grade A',
    queueStatus: 'WEIGHING',
    paymentStatus: 'PENDING_APPROVAL',
    arrivalTime: '9:45 AM'
  },
  {
    token: 'A122',
    farmerName: 'Nirmala Devi',
    farmerId: 'FRM10203',
    cropName: 'Maize',
    bookedQuantityQuintals: 38,
    queueStatus: 'QUALITY_CHECK',
    paymentStatus: 'PENDING_APPROVAL',
    arrivalTime: '10:05 AM'
  },
  {
    token: 'A123',
    farmerName: 'Venkateswarlu Rao',
    farmerId: 'FRM10204',
    cropName: 'Paddy',
    bookedQuantityQuintals: 55,
    queueStatus: 'AT_GATE',
    paymentStatus: 'PENDING_APPROVAL',
    arrivalTime: '10:20 AM'
  },
  {
    token: 'A124',
    farmerName: 'Parvathi Amma',
    farmerId: 'FRM10205',
    cropName: 'Paddy',
    bookedQuantityQuintals: 72,
    queueStatus: 'BOOKED',
    paymentStatus: 'PENDING_APPROVAL'
  },
  {
    token: 'A125',
    farmerName: 'Krishnaiah Goud',
    farmerId: 'FRM10206',
    cropName: 'Maize',
    bookedQuantityQuintals: 40,
    queueStatus: 'BOOKED',
    paymentStatus: 'PENDING_APPROVAL'
  },
  {
    token: 'A126',
    farmerName: 'Satyavathi Devi',
    farmerId: 'FRM10207',
    cropName: 'Paddy',
    bookedQuantityQuintals: 50,
    queueStatus: 'BOOKED',
    paymentStatus: 'PENDING_APPROVAL'
  },
  {
    token: 'A127',
    farmerName: 'Ravi Kumar',
    farmerId: 'FRM10234',
    cropName: 'Paddy',
    bookedQuantityQuintals: 48.6,
    queueStatus: 'BOOKED',
    paymentStatus: 'PENDING_APPROVAL'
  }
];

// ─── Today's Centre Operations ──────────────────────────────────────────────────

export const MOCK_CENTRE_OPERATIONS: Record<string, CentreOperation> = {
  ppc_101: {
    centreId: 'ppc_101',
    date: '2026-09-19',
    farmersExpected: 42,
    farmersArrived: 28,
    farmersCompleted: 16,
    farmersWaiting: 8,
    expectedQuantityQuintals: 1850,
    processedQuantityQuintals: 680,
    queuePressure: 'MEDIUM',
    projectedArrivalsNext3h: 18,
    projectedQuantityNext3hQuintals: 740,
    farmerQueue: CENTRE_A_LIVE_QUEUE
  },
  ppc_102: {
    centreId: 'ppc_102',
    date: '2026-09-19',
    farmersExpected: 56,
    farmersArrived: 44,
    farmersCompleted: 22,
    farmersWaiting: 14,
    expectedQuantityQuintals: 2100,
    processedQuantityQuintals: 780,
    queuePressure: 'HIGH',
    overloadWarningTime: '12:30 PM',
    projectedArrivalsNext3h: 26,
    projectedQuantityNext3hQuintals: 980,
    farmerQueue: []
  },
  ppc_103: {
    centreId: 'ppc_103',
    date: '2026-09-19',
    farmersExpected: 18,
    farmersArrived: 10,
    farmersCompleted: 8,
    farmersWaiting: 2,
    expectedQuantityQuintals: 680,
    processedQuantityQuintals: 820,
    queuePressure: 'LOW',
    projectedArrivalsNext3h: 8,
    projectedQuantityNext3hQuintals: 320,
    farmerQueue: []
  },
  ppc_104: {
    centreId: 'ppc_104',
    date: '2026-09-19',
    farmersExpected: 38,
    farmersArrived: 26,
    farmersCompleted: 12,
    farmersWaiting: 9,
    expectedQuantityQuintals: 1420,
    processedQuantityQuintals: 420,
    queuePressure: 'HIGH',
    overloadWarningTime: '1:00 PM',
    projectedArrivalsNext3h: 14,
    projectedQuantityNext3hQuintals: 560,
    farmerQueue: []
  },
  ppc_105: {
    centreId: 'ppc_105',
    date: '2026-09-19',
    farmersExpected: 14,
    farmersArrived: 8,
    farmersCompleted: 7,
    farmersWaiting: 1,
    expectedQuantityQuintals: 520,
    processedQuantityQuintals: 650,
    queuePressure: 'LOW',
    projectedArrivalsNext3h: 6,
    projectedQuantityNext3hQuintals: 240,
    farmerQueue: []
  }
};

// ─── Historical Procurement Data (SAMPLE DATA) ─────────────────────────────────

export const HISTORICAL_PROCUREMENT: YearlyProcurementRecord[] = [
  { year: 2022, totalQuantityQuintals: 142800, totalAmountCrore: 33.2, farmerCount: 2840, centreCount: 12 },
  { year: 2023, totalQuantityQuintals: 168400, totalAmountCrore: 39.1, farmerCount: 3210, centreCount: 14 },
  { year: 2024, totalQuantityQuintals: 195200, totalAmountCrore: 45.3, farmerCount: 3680, centreCount: 16 },
  { year: 2025, totalQuantityQuintals: 228600, totalAmountCrore: 53.0, farmerCount: 4220, centreCount: 18 },
  { year: 2026, totalQuantityQuintals: 104800, totalAmountCrore: 24.4, farmerCount: 2050, centreCount: 18 } // current year, partial
];

export const CROP_WISE_PROCUREMENT: CropWiseProcurement[] = [
  { cropId: 'paddy_common', cropName: 'Paddy', cropIcon: '🌾', quantityQuintals: 68400, amountLakh: 1587, centresCovered: 18 },
  { cropId: 'groundnut', cropName: 'Groundnut', cropIcon: '🥜', quantityQuintals: 14200, amountLakh: 963, centresCovered: 10 },
  { cropId: 'maize', cropName: 'Maize', cropIcon: '🌽', quantityQuintals: 12800, amountLakh: 285, centresCovered: 12 },
  { cropId: 'cotton_long', cropName: 'Cotton', cropIcon: '☁️', quantityQuintals: 6600, amountLakh: 496, centresCovered: 8 },
  { cropId: 'wheat', cropName: 'Wheat', cropIcon: '🌱', quantityQuintals: 2800, amountLakh: 68, centresCovered: 6 }
];

export const CENTRE_UTILIZATION: CentreUtilizationRecord[] = [
  { centreId: 'ppc_101', centreName: 'Centre A (Rampur)', utilizationPercent: 68, farmersServed: 28, quantityQuintals: 680 },
  { centreId: 'ppc_102', centreName: 'Centre B (Kothapalli)', utilizationPercent: 94, farmersServed: 44, quantityQuintals: 780 },
  { centreId: 'ppc_103', centreName: 'Centre C (Nandyal)', utilizationPercent: 33, farmersServed: 10, quantityQuintals: 820 },
  { centreId: 'ppc_104', centreName: 'Centre D (Gooty)', utilizationPercent: 93, farmersServed: 26, quantityQuintals: 420 },
  { centreId: 'ppc_105', centreName: 'Centre E (Adoni)', utilizationPercent: 23, farmersServed: 8, quantityQuintals: 650 }
];

// ─── Seasonal Load Patterns (Monthly averages for current Kharif season) ────────

export const MONTHLY_LOAD_DATA = [
  { month: 'Jan', load: 12 },
  { month: 'Feb', load: 8 },
  { month: 'Mar', load: 6 },
  { month: 'Apr', load: 4 },
  { month: 'May', load: 3 },
  { month: 'Jun', load: 5 },
  { month: 'Jul', load: 18 },
  { month: 'Aug', load: 62 },
  { month: 'Sep', load: 88 },  // Peak Kharif season
  { month: 'Oct', load: 76 },
  { month: 'Nov', load: 45 },
  { month: 'Dec', load: 22 }
];

// ─── Department-Level Summary ───────────────────────────────────────────────────

export const DEPARTMENT_SUMMARY = {
  totalCentres: 18,
  activeCentres: 5,
  farmersScheduledToday: 168,
  farmersCompletedToday: 65,
  expectedProcurementTodayQuintals: 6570,
  completedTodayQuintals: 3350,
  highLoadCentres: 2,
  normalCentres: 2,
  attentionCentres: 1,
  offlineCentres: 0,
  averageUtilizationPercent: 62
};
