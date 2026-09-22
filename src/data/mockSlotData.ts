/**
 * Mock Slot Availability Data
 * ─────────────────────────────────────────────────────────────────────
 * SAMPLE DATA — For Demonstration / Prototype Only.
 * Defines which dates and time slots are available at each centre.
 * ─────────────────────────────────────────────────────────────────────
 */

export interface TimeSlot {
  time: string;           // e.g. "10:00 AM – 11:00 AM"
  isFull: boolean;        // true = no capacity, cannot book
  remainingSlots: number; // 0 when full
}

export interface DayAvailability {
  date: string;           // ISO date string e.g. "2026-09-22"
  label: string;          // human-readable e.g. "Mon, 22 Sep"
  isAvailable: boolean;   // false = centre closed or fully booked
  slots: TimeSlot[];
}

// Available time windows used across centres
const FULL_DAY_SLOTS: TimeSlot[] = [
  { time: '8:00 AM – 9:00 AM',   isFull: false, remainingSlots: 8 },
  { time: '9:00 AM – 10:00 AM',  isFull: false, remainingSlots: 5 },
  { time: '10:00 AM – 11:00 AM', isFull: false, remainingSlots: 6 },
  { time: '11:00 AM – 12:00 PM', isFull: true,  remainingSlots: 0 },
  { time: '12:00 PM – 1:00 PM',  isFull: true,  remainingSlots: 0 },
  { time: '2:00 PM – 3:00 PM',   isFull: false, remainingSlots: 4 },
  { time: '3:00 PM – 4:00 PM',   isFull: false, remainingSlots: 7 },
  { time: '4:00 PM – 5:00 PM',   isFull: false, remainingSlots: 3 },
];

const LATE_START_SLOTS: TimeSlot[] = [
  { time: '9:00 AM – 10:00 AM',  isFull: false, remainingSlots: 4 },
  { time: '10:00 AM – 11:00 AM', isFull: false, remainingSlots: 6 },
  { time: '11:00 AM – 12:00 PM', isFull: false, remainingSlots: 3 },
  { time: '2:00 PM – 3:00 PM',   isFull: true,  remainingSlots: 0 },
  { time: '3:00 PM – 4:00 PM',   isFull: false, remainingSlots: 5 },
  { time: '4:00 PM – 5:00 PM',   isFull: false, remainingSlots: 2 },
];

const HIGH_LOAD_SLOTS: TimeSlot[] = [
  { time: '8:00 AM – 9:00 AM',   isFull: true,  remainingSlots: 0 },
  { time: '9:00 AM – 10:00 AM',  isFull: true,  remainingSlots: 0 },
  { time: '10:00 AM – 11:00 AM', isFull: true,  remainingSlots: 0 },
  { time: '11:00 AM – 12:00 PM', isFull: true,  remainingSlots: 0 },
  { time: '12:00 PM – 1:00 PM',  isFull: true,  remainingSlots: 0 },
  { time: '2:00 PM – 3:00 PM',   isFull: false, remainingSlots: 2 },
  { time: '3:00 PM – 4:00 PM',   isFull: false, remainingSlots: 1 },
  { time: '4:00 PM – 5:00 PM',   isFull: false, remainingSlots: 3 },
];

function makeWeek(startOffset: number, baseSlots: TimeSlot[], closedDays: number[] = []): DayAvailability[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result: DayAvailability[] = [];
  const base = new Date('2026-09-21'); // prototype "today"
  for (let i = startOffset; i < startOffset + 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const isClosed = closedDays.includes(d.getDay());
    result.push({
      date: d.toISOString().split('T')[0],
      label: `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`,
      isAvailable: !isClosed,
      slots: isClosed ? [] : [...baseSlots.map(s => ({ ...s }))],
    });
  }
  return result;
}

// ─── Per-Centre Availability Calendar ───────────────────────────────────────────
// ppc_101 — Centre A: NORMAL load, Mon-Sat open
export const SLOT_DATA_PPC_101: DayAvailability[] = makeWeek(0, FULL_DAY_SLOTS, [0]); // closed Sunday

// ppc_102 — Centre B: HIGH LOAD, Mon-Sat open
export const SLOT_DATA_PPC_102: DayAvailability[] = makeWeek(0, HIGH_LOAD_SLOTS, [0]);

// ppc_103 — Centre C: NORMAL, Mon-Sun open (market yard)
export const SLOT_DATA_PPC_103: DayAvailability[] = makeWeek(0, FULL_DAY_SLOTS, []);

// ppc_104 — Centre D: ATTENTION, Mon-Fri open, closed weekends
export const SLOT_DATA_PPC_104: DayAvailability[] = makeWeek(0, LATE_START_SLOTS, [0, 6]);

// ppc_105 — Centre E: NORMAL, Mon-Sat open
export const SLOT_DATA_PPC_105: DayAvailability[] = makeWeek(0, FULL_DAY_SLOTS, [0]);

export const ALL_SLOT_DATA: Record<string, DayAvailability[]> = {
  ppc_101: SLOT_DATA_PPC_101,
  ppc_102: SLOT_DATA_PPC_102,
  ppc_103: SLOT_DATA_PPC_103,
  ppc_104: SLOT_DATA_PPC_104,
  ppc_105: SLOT_DATA_PPC_105,
};
