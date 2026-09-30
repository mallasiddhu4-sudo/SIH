import { useState, useCallback, useRef } from 'react';
import { MOCK_CROPS } from '../data/mockCrops';
import { MOCK_CENTRES } from '../data/mockCentres';

export interface GenieTaskState {
  task:
    | 'BOOK_SLOT'
    | 'CANCEL'
    | 'RESCHEDULE'
    | 'SHOW_TOKEN'
    | 'SHOW_QUEUE'
    | 'SHOW_PROCUREMENT'
    | 'SHOW_PAYMENT'
    | 'ARRIVAL_DECISION'
    | 'CROP_INFORMATION'
    | 'NONE';
  step: string;
  crop?: string;
  appointmentId?: string;
  quantity?: number; // Internal unit: Quintals
  centreId?: string;
  centreName?: string;
  date?: string;
  time?: string;
  awaitingConfirmation?: boolean;
}

// ─── Time normalizer ─────────────────────────────────────────────────────────
// Maps spoken time expressions to the exact slot strings used in the app.
// Also handles ordinal "first slot", "second slot" etc.
const AVAILABLE_TIMES = [
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '02:00 PM - 03:00 PM',
];

function parseTimeFromQuery(q: string): string | undefined {
  const lower = q.toLowerCase();

  // Ordinal slot references
  if (/(first|1st|morning|subah|udayam|beligge)\s*(slot)?/.test(lower)) return AVAILABLE_TIMES[0];
  if (/(second|2nd|midday|noon|madhyanha|mandaram|madyahna)\s*(slot)?/.test(lower)) return AVAILABLE_TIMES[1];
  if (/(third|3rd|afternoon|evening|sayam|sayankala|aparahna)\s*(slot)?/.test(lower)) return AVAILABLE_TIMES[2];

  // Hour-based matching
  if (/\b(10\s*(am|a\.m)|ten\s*am|10\s*o'?clock\s*am)\b/.test(lower)) return AVAILABLE_TIMES[0];
  if (/\b(11\s*(am|a\.m)|eleven\s*am|11\s*o'?clock)\b/.test(lower)) return AVAILABLE_TIMES[1];
  if (/\b(2\s*(pm|p\.m)|two\s*pm|14:00|2\s*o'?clock)\b/.test(lower)) return AVAILABLE_TIMES[2];
  if (/\b(12\s*(pm|noon)|twelve\s*pm)\b/.test(lower)) return AVAILABLE_TIMES[1];

  // Telugu/Hindi/Tamil/Kannada spoken times
  if (/పదకొండు|11 గంటలు/.test(q)) return AVAILABLE_TIMES[1];
  if (/పది గంటలు|10 గంటలు/.test(q)) return AVAILABLE_TIMES[0];
  if (/రెండు గంటలు|2 గంటలు/.test(q)) return AVAILABLE_TIMES[2];
  if (/ग्यारह|11 बजे/.test(q)) return AVAILABLE_TIMES[1];
  if (/दस बजे|10 बजे/.test(q)) return AVAILABLE_TIMES[0];

  return undefined;
}

// ─── Date normalizer ──────────────────────────────────────────────────────────
const AVAILABLE_DATES = ['2026-09-03', '2026-09-04', '2026-09-05'];

function parseDateFromQuery(q: string): string | undefined {
  const lower = q.toLowerCase();
  if (/tomorrow|kal|repu|nale/.test(lower)) return AVAILABLE_DATES[1];
  if (/day after|day after tomorrow/.test(lower)) return AVAILABLE_DATES[2];
  if (/sep.*3|3.*sep|today/.test(lower)) return AVAILABLE_DATES[0];
  if (/sep.*4|4.*sep/.test(lower)) return AVAILABLE_DATES[1];
  if (/sep.*5|5.*sep/.test(lower)) return AVAILABLE_DATES[2];
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────

export function useGenieTaskEngine(
  speak: (text: string) => void,
  navigate: (path: string, state?: any) => void,
  procurementActions: any
) {
  const [taskState, setTaskState] = useState<GenieTaskState>({ task: 'NONE', step: 'IDLE' });

  // FIX (Bug A): A ref always holds the current state synchronously,
  // so processIntent never reads a stale closure snapshot.
  const taskStateRef = useRef<GenieTaskState>({ task: 'NONE', step: 'IDLE' });

  const updateTaskState = (newState: GenieTaskState) => {
    taskStateRef.current = newState;
    setTaskState(newState);
  };

  const notifyManualInteraction = useCallback((field: string, value: any) => {
    const current = taskStateRef.current;
    if (current.task === 'NONE') return;
    const updated = { ...current, [field]: value };
    updateTaskState(updated);
  }, []);

  const resetTask = () => {
    const idle: GenieTaskState = { task: 'NONE', step: 'IDLE' };
    updateTaskState(idle);
  };

  const processIntent = async (intentData: any, language: string) => {
    const intent = intentData.intent;
    const rawEntities = intentData._rawEntities || {};
    const q = intentData.rawQuery || '';
    const qLower = q.toLowerCase();

    // FIX (Bug A): Read from ref, not from potentially stale state closure
    let currentState = { ...taskStateRef.current };

    const isYes =
      qLower.includes('yes') || qLower.includes('confirm') || qLower.includes('ok') ||
      q.includes('అవును') || q.includes('हाँ') || q.includes('உறுதி') || q.includes('ಹೌದు') ||
      qLower === 'y';

    // ── Entity capture (FIX Bug 1-B / 2-A) ──────────────────────────────────
    // Try to extract time and date from raw query FIRST (local parser),
    // then fall back to whatever the AI returned.
    const parsedTime = parseTimeFromQuery(q);
    const parsedDate = parseDateFromQuery(q);

    if (currentState.task !== 'NONE') {
      // FIX: Capture crop even when AI returns UNKNOWN/SHOW_CROP_INFO
      const cropFromEntities = rawEntities.crop || intentData.cropMentioned;
      if (cropFromEntities) currentState.crop = cropFromEntities;

      // FIX (2-A): Use local parser first, then AI entity
      if (parsedTime) currentState.time = parsedTime;
      else if (rawEntities.time) currentState.time = rawEntities.time;

      if (parsedDate) currentState.date = parsedDate;
      else if (rawEntities.date) currentState.date = rawEntities.date;

      if (rawEntities.centre || intentData.centre) {
        currentState.centreName = rawEntities.centre || intentData.centre;
      }
      if (rawEntities.quantity) {
        const val = parseFloat(rawEntities.quantity);
        if (!isNaN(val)) currentState.quantity = val;
      }

      // FIX (2-B): Detect time intent from spoken value, not just the word "time"
      if (currentState.task === 'RESCHEDULE') {
        if (parsedTime || intent === 'CHANGE_TIME' || /\btime\b/.test(qLower) || q.includes('samay') || q.includes('సమయం')) {
          currentState.step = 'ASK_TIME';
        }
        if (parsedDate || intent === 'CHANGE_DATE' || /\bdate\b/.test(qLower) || q.includes('roju') || q.includes('తేదీ')) {
          currentState.step = 'ASK_DATE';
        }
        if (intent === 'CHANGE_CENTRE' || /\bcentre\b/.test(qLower) || q.includes('సెంటర్') || q.includes('kendra')) {
          currentState.step = 'ASK_CENTRE';
        }
      }

      // Guard: only allow switching tasks for an explicit cancel request
      if (!(currentState.awaitingConfirmation && isYes)) {
        if (intent === 'CANCEL_APPOINTMENT') {
          currentState = { task: 'CANCEL', step: 'SELECT_APPOINTMENT' };
        }
      }
    } else {
      // ── Start a new task ──────────────────────────────────────────────────
      if (intent === 'BOOK_SLOT') {
        currentState = { ...currentState, task: 'BOOK_SLOT', step: 'GATHER_INFO' };
        if (rawEntities.crop) currentState.crop = rawEntities.crop;
        if (parsedTime) currentState.time = parsedTime;
        if (parsedDate) currentState.date = parsedDate;
      } else if (intent === 'CANCEL_APPOINTMENT') {
        currentState = { ...currentState, task: 'CANCEL', step: 'SELECT_APPOINTMENT' };
        if (rawEntities.crop) currentState.crop = rawEntities.crop;
      } else if (
        intent === 'RESCHEDULE' || intent === 'CHANGE_CENTRE' ||
        intent === 'CHANGE_DATE' || intent === 'CHANGE_TIME'
      ) {
        currentState = { ...currentState, task: 'RESCHEDULE', step: 'GATHER_INFO' };
        if (rawEntities.crop) currentState.crop = rawEntities.crop;
        if (parsedTime) { currentState.time = parsedTime; currentState.step = 'ASK_TIME'; }
        if (parsedDate) { currentState.date = parsedDate; currentState.step = 'ASK_DATE'; }
        if (intent === 'CHANGE_CENTRE') currentState.step = 'ASK_CENTRE';
      } else if (intent === 'SHOW_QUEUE') {
        currentState = { ...currentState, task: 'SHOW_QUEUE', step: 'REPORT' };
        if (rawEntities.crop) currentState.crop = rawEntities.crop;
      } else if (intent === 'SHOW_TOKEN') {
        currentState = { ...currentState, task: 'SHOW_TOKEN', step: 'REPORT' };
        if (rawEntities.crop) currentState.crop = rawEntities.crop;
      } else if (intent === 'SHOW_CROP_INFO') {
        currentState = { ...currentState, task: 'CROP_INFORMATION', step: 'REPORT' };
        if (rawEntities.crop) currentState.crop = rawEntities.crop;
      } else if (intent === 'ARRIVAL_DECISION') {
        currentState = { ...currentState, task: 'ARRIVAL_DECISION', step: 'REPORT' };
        if (rawEntities.crop) currentState.crop = rawEntities.crop;
      }
    }

    return await executeTask(currentState, language, intentData, procurementActions, navigate, speak, isYes);
  };

  const executeTask = async (
    state: GenieTaskState,
    language: string,
    intentData: any,
    pActions: any,
    nav: any,
    spk: any,
    isYes: boolean
  ) => {
    const { activePlanAppointments } = pActions;

    const getAppointment = (crop?: string) => {
      if (crop) {
        return activePlanAppointments.find(
          (a: any) => a.cropName.toLowerCase().includes(crop.toLowerCase())
        );
      }
      return activePlanAppointments.filter(
        (a: any) => a.bookingStatus !== 'CANCELLED' && a.bookingStatus !== 'COMPLETED'
      )[0];
    };

    let responseText = intentData.responseText || 'I am processing your request.';
    let route = intentData.route || '/';
    let guidanceSelector = intentData.guidanceSelector || '';
    let action: 'OPEN_RESCHEDULE' | 'OPEN_CANCEL' | 'NONE' = 'NONE';
    let isComplete = false;

    switch (state.task) {

      // ── BOOK_SLOT ──────────────────────────────────────────────────────────
      case 'BOOK_SLOT': {
        route = '/farmer/book-slot';
        nav(route, { state: { target: 'book-slot' } });

        if (!state.crop) {
          state.step = 'ASK_CROP';
          updateTaskState(state);
          return { responseText: 'Which crop would you like to sell?', route, guidanceSelector: '#select-crop-section', action, task: state.task, step: state.step, isComplete };
        }
        if (!state.quantity) {
          state.step = 'ASK_QUANTITY';
          updateTaskState(state);
          return { responseText: `How much ${state.crop} do you want to sell? Please specify the amount in quintals.`, route, guidanceSelector: '#quantity-section', action, task: state.task, step: state.step, isComplete };
        }
        if (!state.centreName) {
          state.step = 'ASK_CENTRE';
          updateTaskState(state);
          return { responseText: `Which centre would you like to use for ${state.crop}?`, route, guidanceSelector: '#select-centre-section', action, task: state.task, step: state.step, isComplete };
        }
        if (!state.date) {
          state.step = 'ASK_DATE';
          updateTaskState(state);
          return { responseText: `What date would you like?`, route, guidanceSelector: '#select-date-section', action, task: state.task, step: state.step, isComplete };
        }

        if (state.awaitingConfirmation && isYes) {
          const cropObj = MOCK_CROPS.find(c => c.name.toLowerCase() === state.crop?.toLowerCase()) || MOCK_CROPS[0];
          const booking = pActions.bookSlot({
            cropId: cropObj.id,
            cropName: cropObj.name,
            estimatedQuantityQuintals: state.quantity,
            centreId: MOCK_CENTRES[0].id,
            centreName: MOCK_CENTRES[0].name,
            slotDate: state.date || '2026-09-03',
            slotTime: state.time || AVAILABLE_TIMES[0]
          });
          resetTask();
          nav('/farmer/dashboard');
          return { responseText: `Your ${state.crop} slot is booked! Your token is ${booking.tokenDisplay}.`, route: '/farmer/dashboard', guidanceSelector: '', action: 'NONE', task: 'NONE', step: 'IDLE', isComplete: true };
        }

        if (!state.awaitingConfirmation) {
          state.awaitingConfirmation = true;
          updateTaskState(state);
          return { responseText: `You want to sell ${state.quantity} quintals of ${state.crop} on ${state.date}. Shall I confirm this booking?`, route, guidanceSelector: '#confirm-booking-btn', action, task: state.task, step: state.step, isComplete };
        }
        break;
      }

      // ── RESCHEDULE ─────────────────────────────────────────────────────────
      case 'RESCHEDULE': {
        route = '/farmer/manage-slot';
        nav(route, { state: { crop: state.crop, target: 'reschedule' } });

        // Ask which crop if ambiguous
        if (!state.crop && activePlanAppointments.filter((a: any) => a.bookingStatus !== 'CANCELLED').length > 1) {
          state.step = 'ASK_CROP';
          updateTaskState(state);
          return { responseText: 'Which crop slot do you want to reschedule?', route, guidanceSelector: '', action: 'OPEN_RESCHEDULE', task: state.task, step: state.step, isComplete: false };
        }

        const apptR = getAppointment(state.crop);
        if (!apptR) {
          resetTask();
          return { responseText: "I couldn't find an active appointment to reschedule.", route, guidanceSelector: '', action: 'NONE', task: 'NONE', step: 'IDLE', isComplete: true };
        }
        state.crop = apptR.cropName;

        // Ask what to change if we don't know yet
        if (!state.date && !state.time && !state.centreName && state.step !== 'ASK_TIME' && state.step !== 'ASK_DATE' && state.step !== 'ASK_CENTRE') {
          state.step = 'ASK_CHANGE_TYPE';
          updateTaskState(state);
          return { responseText: `Your ${state.crop} slot is selected. What would you like to change — date, time, or centre?`, route, guidanceSelector: '', action: 'OPEN_RESCHEDULE', task: state.task, step: state.step, isComplete: false };
        }

        // Ask for the actual value if step is set but value missing
        if (state.step === 'ASK_TIME' && !state.time) {
          updateTaskState(state);
          return { responseText: `What new time would you like? Available: 10 AM, 11 AM, or 2 PM.`, route, guidanceSelector: '', action: 'OPEN_RESCHEDULE', task: state.task, step: state.step, isComplete: false };
        }
        if (state.step === 'ASK_DATE' && !state.date) {
          updateTaskState(state);
          return { responseText: `What new date would you like? Available: September 3, 4, or 5.`, route, guidanceSelector: '', action: 'OPEN_RESCHEDULE', task: state.task, step: state.step, isComplete: false };
        }
        if (state.step === 'ASK_CENTRE' && !state.centreName) {
          updateTaskState(state);
          return { responseText: 'Which new centre would you like?', route, guidanceSelector: '', action: 'OPEN_RESCHEDULE', task: state.task, step: state.step, isComplete: false };
        }

        // Confirm
        if (state.awaitingConfirmation && isYes) {
          const newDate = state.date || apptR.slotDate;
          const newTime = state.time || apptR.slotTime;
          const centre = state.centreName
            ? MOCK_CENTRES.find(c => c.name.toLowerCase().includes(state.centreName!.toLowerCase())) || MOCK_CENTRES[0]
            : MOCK_CENTRES.find(c => c.id === apptR.centreId) || MOCK_CENTRES[0];

          // FIX: correct call signature for reschedulePlanAppointment
          pActions.reschedulePlanAppointment(apptR.id, newDate, newTime, centre.id, centre.name);
          resetTask();
          nav('/farmer/my-plan');
          return { responseText: `Your ${state.crop} slot has been rescheduled to ${newTime} on ${newDate}.`, route: '/farmer/my-plan', guidanceSelector: '', action: 'NONE', task: 'NONE', step: 'IDLE', isComplete: true };
        }

        if (!state.awaitingConfirmation) {
          state.awaitingConfirmation = true;
          updateTaskState(state);
          const changeSummary = [
            state.date ? `date: ${state.date}` : '',
            state.time ? `time: ${state.time}` : '',
            state.centreName ? `centre: ${state.centreName}` : ''
          ].filter(Boolean).join(', ');
          return { responseText: `I'll change your ${state.crop} slot (${changeSummary}). Shall I confirm?`, route, guidanceSelector: '', action: 'OPEN_RESCHEDULE', task: state.task, step: state.step, isComplete: false };
        }
        break;
      }

      // ── CANCEL ─────────────────────────────────────────────────────────────
      case 'CANCEL': {
        const apptToCancel = getAppointment(state.crop);
        if (!apptToCancel) {
          resetTask();
          return { responseText: "I couldn't find an active appointment to cancel.", route, guidanceSelector, action: 'NONE', task: 'NONE', step: 'IDLE', isComplete: true };
        }

        if (!state.awaitingConfirmation) {
          state.awaitingConfirmation = true;
          updateTaskState(state);
          // FIX (Bug 3-B): Return OPEN_CANCEL so ManageSlotPage opens the modal
          return {
            responseText: `Are you sure you want to cancel your ${apptToCancel.cropName} booking on ${apptToCancel.slotDate}?`,
            route: '/farmer/manage-slot',
            guidanceSelector: '#cancel-btn',
            action: 'OPEN_CANCEL' as const,
            task: state.task,
            step: state.step,
            isComplete: false
          };
        }

        if (isYes) {
          pActions.cancelPlanAppointment(apptToCancel.id);
          resetTask();
          nav('/farmer/my-plan');
          return { responseText: `Your ${apptToCancel.cropName} booking has been cancelled.`, route: '/farmer/my-plan', guidanceSelector, action: 'NONE', task: 'NONE', step: 'IDLE', isComplete: true };
        }

        // User said no — abort cancel
        resetTask();
        return { responseText: `Okay, keeping your ${apptToCancel.cropName} booking unchanged.`, route: '/farmer/manage-slot', guidanceSelector, action: 'NONE', task: 'NONE', step: 'IDLE', isComplete: true };
      }

      // ── SHOW_QUEUE ─────────────────────────────────────────────────────────
      case 'SHOW_QUEUE': {
        const apptQ = getAppointment(state.crop);
        resetTask();
        if (!apptQ) return { responseText: "You don't have any active appointments to check the queue for.", route, guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
        const centreQ = MOCK_CENTRES.find(c => c.id === apptQ.centreId) || MOCK_CENTRES[0];
        return { responseText: `There are ${centreQ.currentQueueCount} farmers ahead of you for your ${apptQ.cropName} booking.`, route: '/farmer/queue', guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
      }

      // ── SHOW_TOKEN ─────────────────────────────────────────────────────────
      case 'SHOW_TOKEN': {
        const apptT = getAppointment(state.crop);
        resetTask();
        if (!apptT) return { responseText: "I couldn't find any active token.", route, guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
        return { responseText: `Your token for ${apptT.cropName} is ${apptT.tokenDisplay}.`, route: '/farmer/queue', guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
      }

      // ── CROP_INFORMATION ───────────────────────────────────────────────────
      case 'CROP_INFORMATION': {
        resetTask();
        const targetCrop = state.crop || intentData.cropMentioned;
        if (targetCrop) {
          const cropObj = MOCK_CROPS.find(c => c.name.toLowerCase() === targetCrop.toLowerCase());
          if (cropObj) {
            return { responseText: `The current MSP for ${cropObj.name} is ₹${cropObj.mspPerQuintal} per quintal.`, route: '/farmer/crop-info', guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
          }
        }
        // Show all crop prices
        const priceList = MOCK_CROPS.map(c => `${c.name}: ₹${c.mspPerQuintal}`).join(', ');
        return { responseText: `Current MSP rates — ${priceList}.`, route: '/farmer/crop-info', guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
      }

      // ── ARRIVAL_DECISION ───────────────────────────────────────────────────
      case 'ARRIVAL_DECISION': {
        const apptA = getAppointment(state.crop || intentData.cropMentioned);
        resetTask();
        if (!apptA) return { responseText: "I couldn't find an active appointment to check.", route: '/farmer/pre-arrival', guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
        const apptDate = new Date(apptA.slotDate);
        const today = new Date();
        const isToday = apptDate.toDateString() === today.toDateString();
        const centreA = MOCK_CENTRES.find(c => c.id === apptA.centreId) || MOCK_CENTRES[0];

        if (isToday) {
          if (centreA.currentQueueCount > 20) {
            return { responseText: `WAIT. Your slot for ${apptA.cropName} is today but there are ${centreA.currentQueueCount} farmers ahead. Wait a while before leaving.`, route: '/farmer/pre-arrival', guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
          }
          return { responseText: `GO NOW. Your slot for ${apptA.cropName} is today and the queue is short (${centreA.currentQueueCount} ahead).`, route: '/farmer/pre-arrival', guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
        } else if (apptDate < today) {
          return { responseText: `RESCHEDULE. Your ${apptA.cropName} slot was on ${apptA.slotDate} which has passed. Please reschedule.`, route: '/farmer/pre-arrival', guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
        }
        return { responseText: `WAIT. Your ${apptA.cropName} slot is on ${apptA.slotDate}, which is not today.`, route: '/farmer/pre-arrival', guidanceSelector, action, task: 'NONE', step: 'IDLE', isComplete: true };
      }

      // ── DEFAULT ────────────────────────────────────────────────────────────
      default: {
        resetTask();
        if (intentData.route && intentData.route !== '/') nav(intentData.route);
        return { responseText: intentData.responseText || 'I am here to help.', route: intentData.route, guidanceSelector: intentData.guidanceSelector, action: intentData.action || 'NONE', task: 'NONE', step: 'IDLE', isComplete: true };
      }
    }

    updateTaskState(state);
    return { responseText: intentData.responseText || 'I am processing your request.', route, guidanceSelector, action, task: state.task, step: state.step, isComplete };
  };

  return { taskState, notifyManualInteraction, processIntent, resetTask };
}
