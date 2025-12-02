import type { NurseConfig } from "../types";

const STORAGE_KEY = "nurseConfigs";

/**
 * localStorage에서 간호사 설정 목록 불러오기
 */
export function loadNurseConfigs(): NurseConfig[] {
  if (typeof window === "undefined") return getDefaultNurses();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as NurseConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("간호사 설정 불러오기 실패:", error);
  }

  return getDefaultNurses();
}

/**
 * localStorage에 간호사 설정 목록 저장하기
 */
export function saveNurseConfigs(nurses: NurseConfig[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nurses));
  } catch (error) {
    console.error("간호사 설정 저장 실패:", error);
  }
}

/**
 * 기본 간호사 설정 (기존 A~H)
 */
export function getDefaultNurses(): NurseConfig[] {
  return [
    { id: "A", name: "A 간호사", workCondition: "DAYTIME_ONLY" },
    { id: "B", name: "B 간호사", workCondition: "DAYTIME_ONLY" },
    { id: "C", name: "C 간호사", workCondition: "DAYTIME_ONLY" },
    { id: "D", name: "D 간호사", workCondition: "DAYTIME_ONLY" },
    { id: "E", name: "E 간호사", workCondition: "DAY_EVENING_ALTERNATE" },
    { id: "F", name: "F 간호사", workCondition: "DAY_EVENING_ALTERNATE" },
    { id: "G", name: "G 간호사", workCondition: "NIGHT_ONLY" },
    { id: "H", name: "H 간호사", workCondition: "NIGHT_ONLY" },
  ];
}


