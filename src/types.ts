export type ShiftType = "DAY" | "MID-DAY" | "EVENING" | "NIGHT" | "OFF";

// 기존 간호사 타입 유지 (A~H) + 동적 확장 가능
export type NurseType = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | string;

// 근무 조건 타입
export type WorkConditionType = 
  | "DAYTIME_ONLY" // 주간 전담 (A~D 타입): DAY, MID-DAY, OFF만 가능
  | "DAY_EVENING_ALTERNATE" // 주간/저녁 교대 (E, F 타입): 주 단위로 DAY/EVENING 교대
  | "NIGHT_ONLY" // 야간 전담 (G, H 타입): NIGHT, OFF만 가능
  | "FLEXIBLE"; // 유연 (모든 시간대 가능)

// 간호사 설정
export interface NurseConfig {
  id: string; // 간호사 ID
  name: string; // 간호사 이름
  workCondition: WorkConditionType; // 근무 조건
}

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
