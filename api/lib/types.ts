export type ShiftType = "DAY" | "MID-DAY" | "EVENING" | "NIGHT" | "OFF";

export type NurseType = string;

export type WorkConditionType = 
  | "DAYTIME_ONLY"
  | "DAY_EVENING_ALTERNATE"
  | "NIGHT_ONLY"
  | "FLEXIBLE";

export interface NurseConfig {
  id: string;
  name: string;
  workCondition: WorkConditionType;
}

export interface ScheduleEntry {
  date: string; // ISO string format
  nurse: NurseType;
  shift: ShiftType;
}

export interface VacationDay {
  nurse: NurseType;
  date: string; // ISO string format
}

export interface SavedSchedule {
  _id?: string; // MongoDB ObjectId
  id: string;
  name: string;
  year: number;
  month: number;
  schedule: ScheduleEntry[];
  vacations: VacationDay[];
  manualEdits: Record<string, ShiftType>;
  nurseLabels: Record<NurseType, string>;
  nurseConfigs?: NurseConfig[]; // 간호사 설정도 함께 저장
  createdAt: string;
  updatedAt?: string;
}

