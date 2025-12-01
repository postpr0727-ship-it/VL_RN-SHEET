import type { SavedSchedule, ScheduleEntry, VacationDay, ShiftType, NurseType } from "../types";

const STORAGE_KEY = "savedSchedules";

export function saveSchedule(
  name: string,
  year: number,
  month: number,
  schedule: ScheduleEntry[],
  vacations: VacationDay[],
  manualEdits: Record<string, ShiftType>,
  nurseLabels: Record<NurseType, string>
): SavedSchedule {
  const savedSchedule: SavedSchedule = {
    id: `${year}-${month}-${Date.now()}`,
    name,
    year,
    month,
    schedule,
    vacations,
    manualEdits,
    nurseLabels,
    createdAt: new Date().toISOString(),
  };

  const saved = getSavedSchedules();
  saved.push(savedSchedule);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

  return savedSchedule;
}

export function getSavedSchedules(): SavedSchedule[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedSchedule[];
  } catch {
    return [];
  }
}

export function deleteSavedSchedule(id: string): void {
  const saved = getSavedSchedules();
  const filtered = saved.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function loadSchedule(id: string): SavedSchedule | null {
  const saved = getSavedSchedules();
  const found = saved.find((s) => s.id === id);
  
  if (!found) return null;

  // Date 객체 복원
  const schedule: ScheduleEntry[] = found.schedule.map((entry) => ({
    ...entry,
    date: new Date(entry.date),
  }));

  const vacations: VacationDay[] = found.vacations.map((vacation) => ({
    ...vacation,
    date: new Date(vacation.date),
  }));

  return {
    ...found,
    schedule,
    vacations,
  };
}

