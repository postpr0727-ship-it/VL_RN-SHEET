export type ShiftType = "DAY" | "MID-DAY" | "EVENING" | "NIGHT" | "OFF";

export type NurseType = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export interface ScheduleEntry {
  date: Date;
  nurse: NurseType;
  shift: ShiftType;
}

export interface NurseInfo {
  id: NurseType;
  type: "ABCD" | "EF" | "GH";
}

export interface VacationDay {
  nurse: NurseType;
  date: Date;
}

export interface SavedSchedule {
  id: string;
  name: string;
  year: number;
  month: number;
  schedule: ScheduleEntry[];
  vacations: VacationDay[];
  manualEdits: Record<string, ShiftType>;
  nurseLabels: Record<NurseType, string>;
  createdAt: string;
}
