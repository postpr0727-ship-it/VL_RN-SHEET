import type { SavedSchedule, ScheduleEntry, VacationDay, ShiftType, NurseType, NurseConfig } from "../types";
import { getSchedules, getSchedule, saveScheduleToAPI, deleteScheduleFromAPI } from "./api";

const STORAGE_KEY = "savedSchedules";

// API 응답에서 Date 객체로 변환하는 헬퍼 함수
function transformScheduleFromAPI(schedule: any): SavedSchedule {
  const scheduleEntries: ScheduleEntry[] = schedule.schedule.map((entry: any) => ({
    ...entry,
    date: new Date(entry.date),
  }));

  const vacations: VacationDay[] = schedule.vacations.map((vacation: any) => ({
    ...vacation,
    date: new Date(vacation.date),
  }));

  return {
    ...schedule,
    schedule: scheduleEntries,
    vacations,
  };
}

// API에서 저장할 때 Date를 string으로 변환하는 헬퍼 함수
function transformScheduleToAPI(schedule: SavedSchedule): any {
  return {
    ...schedule,
    schedule: schedule.schedule.map((entry) => ({
      ...entry,
      date: entry.date instanceof Date ? entry.date.toISOString() : entry.date,
    })),
    vacations: schedule.vacations.map((vacation) => ({
      ...vacation,
      date: vacation.date instanceof Date ? vacation.date.toISOString() : vacation.date,
    })),
  };
}


// localStorage fallback
function getSavedSchedulesFromLocalStorage(): SavedSchedule[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as SavedSchedule[];
    
    // Date 객체 복원
    return parsed.map((schedule) => {
      const scheduleEntries: ScheduleEntry[] = schedule.schedule.map((entry) => ({
        ...entry,
        date: new Date(entry.date),
      }));

      const vacations: VacationDay[] = schedule.vacations.map((vacation) => ({
        ...vacation,
        date: new Date(vacation.date),
      }));

      return {
        ...schedule,
        schedule: scheduleEntries,
        vacations,
      };
    });
  } catch {
    return [];
  }
}

export async function saveSchedule(
  name: string,
  year: number,
  month: number,
  schedule: ScheduleEntry[],
  vacations: VacationDay[],
  manualEdits: Record<string, ShiftType>,
  nurseLabels: Record<NurseType, string>,
  nurseConfigs?: NurseConfig[]
): Promise<SavedSchedule> {
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

  try {
    // API를 통해 저장 시도
    const apiData = transformScheduleToAPI(savedSchedule);
    if (nurseConfigs) {
      apiData.nurseConfigs = nurseConfigs;
    }
    const result = await saveScheduleToAPI(apiData);
    console.log('✅ API 저장 성공:', result);
    return transformScheduleFromAPI(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('❌ API 저장 실패, localStorage로 fallback:', errorMessage);
    console.error('상세 오류:', error);
    
    // 사용자에게 알림 (선택사항 - 너무 자주 뜨면 주석 처리)
    // alert(`⚠️ Firebase 연결 실패\n\n근무표는 이 브라우저에만 저장됩니다.\n다른 브라우저에서는 보이지 않습니다.\n\n오류: ${errorMessage}`);
    
    // localStorage로 fallback
    const saved = getSavedSchedulesFromLocalStorage();
    saved.push(savedSchedule);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return savedSchedule;
  }
}

export async function getSavedSchedules(): Promise<SavedSchedule[]> {
  try {
    // API에서 가져오기 시도
    const schedules = await getSchedules() as SavedSchedule[];
    console.log('✅ API 조회 성공:', schedules.length, '개');
    return schedules.map(transformScheduleFromAPI);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('❌ API 조회 실패, localStorage로 fallback:', errorMessage);
    console.error('상세 오류:', error);
    // localStorage로 fallback
    return getSavedSchedulesFromLocalStorage();
  }
}

export async function deleteSavedSchedule(id: string): Promise<void> {
  try {
    // API에서 삭제 시도
    await deleteScheduleFromAPI(id);
  } catch (error) {
    console.warn('API 삭제 실패, localStorage로 fallback:', error);
    // localStorage로 fallback
    const saved = getSavedSchedulesFromLocalStorage();
    const filtered = saved.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

export async function loadSchedule(id: string): Promise<SavedSchedule | null> {
  try {
    // API에서 가져오기 시도
    const schedule = await getSchedule(id);
    return transformScheduleFromAPI(schedule);
  } catch (error) {
    console.warn('API 조회 실패, localStorage로 fallback:', error);
    // localStorage로 fallback
    const saved = getSavedSchedulesFromLocalStorage();
    const found = saved.find((s) => s.id === id);
    return found || null;
  }
}

