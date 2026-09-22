import { FarmerProfile, SlotBooking } from '../types';

export const DEFAULT_MOCK_FARMER: FarmerProfile = {
  id: 'farmer_001',
  name: 'Ravi Kumar',
  phone: '9876543210',
  farmerId: 'FRM10234',
  village: 'Rampur Village',
  district: 'Kurnool',
  bankAccountMasked: '•••• •••• 4589',
  bankName: 'State Bank of India (Kurnool Rural Branch)',
  ifscMasked: 'SBIN0004589'
};

export const INITIAL_MOCK_BOOKING: SlotBooking = {
  id: 'slot_bk_8912',
  farmerId: 'FRM10234',
  farmerName: 'Ravi Kumar',
  phone: '9876543210',
  cropId: 'paddy_common',
  cropName: 'Paddy',
  estimatedQuantityQuintals: 48.6,
  centreId: 'ppc_101',
  centreName: 'Procurement Centre A',
  slotDate: '2026-09-03',
  slotTime: '10:00 AM - 11:00 AM',
  tokenNumber: 127,
  tokenDisplay: 'A127',
  bookingTime: '2026-08-30 09:30 AM',
  bookingStatus: 'CONFIRMED',
  
  queueStatus: 'QUALITY_CHECK',
  currentServingToken: 'A123',
  estimatedWaitMinutes: 25,
  
  moisturePercent: 14.2,
  qualityGrade: 'Grade A',
  actualWeightQuintals: 48.6,
  gunnyBagsCount: 97,
  grossAmount: 112752, // 48.6 * 2320
  deductions: 0,
  netPayableAmount: 112752,
  
  paymentStatus: 'DBT_PROCESSING',
  transactionRef: 'DBT-2026-AP-9941829',
  paymentDate: '2026-09-03',
  paymentBankRef: 'NPCI/ACH/89201948'
};

