import { isSameDay } from "date-fns";
import { getHolidays as fetchHolidaysFromAPI, loadHolidaysFromCache, saveHolidaysToCache } from "./holidayApi";

// 한국 공휴일 정의
export interface Holiday {
  month: number;
  day: number;
  name: string;
}

const HOLIDAY_DEFINITIONS: Record<number, Holiday[]> = {
  2024: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 9, name: "설날" },
    { month: 2, day: 10, name: "설날" },
    { month: 2, day: 11, name: "설날" },
    { month: 2, day: 12, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 4, day: 10, name: "국회의원선거" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 6, name: "어린이날 대체공휴일" },
    { month: 5, day: 15, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 9, day: 16, name: "추석" },
    { month: 9, day: 17, name: "추석" },
    { month: 9, day: 18, name: "추석" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2025: [
    { month: 1, day: 1, name: "신정" },
    { month: 1, day: 28, name: "설날" },
    { month: 1, day: 29, name: "설날" },
    { month: 1, day: 30, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 6, name: "대체공휴일" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 5, name: "추석" },
    { month: 10, day: 6, name: "추석" },
    { month: 10, day: 7, name: "추석" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2026: [
    { month: 1, day: 1, name: "신정" },
    { month: 1, day: 27, name: "설날" },
    { month: 1, day: 28, name: "설날" },
    { month: 1, day: 29, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 4, day: 30, name: "부처님오신날" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 9, day: 24, name: "추석" },
    { month: 9, day: 25, name: "추석" },
    { month: 9, day: 26, name: "추석" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2027: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 15, name: "설날" },
    { month: 2, day: 16, name: "설날" },
    { month: 2, day: 17, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 15, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 5, name: "추석" },
    { month: 10, day: 6, name: "추석" },
    { month: 10, day: 7, name: "추석" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2028: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 6, name: "설날" },
    { month: 2, day: 7, name: "설날" },
    { month: 2, day: 8, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 6, name: "어린이날 대체공휴일" },
    { month: 5, day: 10, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 9, day: 21, name: "추석" },
    { month: 9, day: 22, name: "추석" },
    { month: 9, day: 23, name: "추석" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 5, name: "대체공휴일" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2029: [
    { month: 1, day: 1, name: "신정" },
    { month: 1, day: 24, name: "설날" },
    { month: 1, day: 25, name: "설날" },
    { month: 1, day: 26, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 4, day: 29, name: "부처님오신날" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 7, name: "대체공휴일" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 9, name: "한글날" },
    { month: 10, day: 10, name: "추석" },
    { month: 10, day: 11, name: "추석" },
    { month: 10, day: 12, name: "추석" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2030: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 11, name: "설날" },
    { month: 2, day: 12, name: "설날" },
    { month: 2, day: 13, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 6, name: "어린이날 대체공휴일" },
    { month: 5, day: 17, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 9, day: 29, name: "추석" },
    { month: 9, day: 30, name: "추석" },
    { month: 10, day: 1, name: "추석" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2031: [
    { month: 1, day: 1, name: "신정" },
    { month: 1, day: 31, name: "설날" },
    { month: 2, day: 1, name: "설날" },
    { month: 2, day: 2, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 16, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 9, day: 18, name: "추석" },
    { month: 9, day: 19, name: "추석" },
    { month: 9, day: 20, name: "추석" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2032: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 19, name: "설날" },
    { month: 2, day: 20, name: "설날" },
    { month: 2, day: 21, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 6, name: "어린이날 대체공휴일" },
    { month: 5, day: 5, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 5, name: "추석" },
    { month: 10, day: 6, name: "추석" },
    { month: 10, day: 7, name: "추석" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2033: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 8, name: "설날" },
    { month: 2, day: 9, name: "설날" },
    { month: 2, day: 10, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 4, day: 26, name: "부처님오신날" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 9, day: 24, name: "추석" },
    { month: 9, day: 25, name: "추석" },
    { month: 9, day: 26, name: "추석" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2034: [
    { month: 1, day: 1, name: "신정" },
    { month: 1, day: 28, name: "설날" },
    { month: 1, day: 29, name: "설날" },
    { month: 1, day: 30, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 15, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 12, name: "추석" },
    { month: 10, day: 13, name: "추석" },
    { month: 10, day: 14, name: "추석" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2035: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 16, name: "설날" },
    { month: 2, day: 17, name: "설날" },
    { month: 2, day: 18, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 6, name: "어린이날 대체공휴일" },
    { month: 5, day: 4, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 10, day: 1, name: "추석" },
    { month: 10, day: 2, name: "추석" },
    { month: 10, day: 3, name: "추석" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2036: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 5, name: "설날" },
    { month: 2, day: 6, name: "설날" },
    { month: 2, day: 7, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 4, day: 22, name: "부처님오신날" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 9, day: 19, name: "추석" },
    { month: 9, day: 20, name: "추석" },
    { month: 9, day: 21, name: "추석" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2037: [
    { month: 1, day: 1, name: "신정" },
    { month: 1, day: 24, name: "설날" },
    { month: 1, day: 25, name: "설날" },
    { month: 1, day: 26, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 11, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 8, name: "추석" },
    { month: 10, day: 9, name: "추석" },
    { month: 10, day: 10, name: "추석" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2038: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 12, name: "설날" },
    { month: 2, day: 13, name: "설날" },
    { month: 2, day: 14, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 4, day: 30, name: "부처님오신날" },
    { month: 5, day: 7, name: "대체공휴일" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 9, day: 27, name: "추석" },
    { month: 9, day: 28, name: "추석" },
    { month: 9, day: 29, name: "추석" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2039: [
    { month: 1, day: 1, name: "신정" },
    { month: 2, day: 1, name: "설날" },
    { month: 2, day: 2, name: "설날" },
    { month: 2, day: 3, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 19, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 15, name: "추석" },
    { month: 10, day: 16, name: "추석" },
    { month: 10, day: 17, name: "추석" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
  2040: [
    { month: 1, day: 1, name: "신정" },
    { month: 1, day: 21, name: "설날" },
    { month: 1, day: 22, name: "설날" },
    { month: 1, day: 23, name: "설날" },
    { month: 3, day: 1, name: "삼일절" },
    { month: 5, day: 5, name: "어린이날" },
    { month: 5, day: 8, name: "부처님오신날" },
    { month: 6, day: 6, name: "현충일" },
    { month: 8, day: 15, name: "광복절" },
    { month: 10, day: 3, name: "개천절" },
    { month: 10, day: 4, name: "추석" },
    { month: 10, day: 5, name: "추석" },
    { month: 10, day: 6, name: "추석" },
    { month: 10, day: 9, name: "한글날" },
    { month: 12, day: 25, name: "크리스마스" },
  ],
};

const holidayCache = new Map<number, Array<{ date: Date; name: string }>>();
const loadingYears = new Set<number>(); // 로딩 중인 연도 추적

/**
 * 공휴일 데이터를 가져오는 함수 (API 우선, 없으면 기본값 사용)
 */
async function loadHolidaysForYear(year: number): Promise<Array<{ date: Date; name: string }>> {
  // 1. 캐시 확인 (API 캐시)
  const cachedApi = loadHolidaysFromCache(year);
  if (cachedApi && cachedApi.length > 0) {
    const converted = cachedApi.map(({ month, day, name }) => ({
      date: new Date(year, month - 1, day),
      name,
    }));
    holidayCache.set(year, converted);
    return converted;
  }

  // 2. API 호출 시도 (이미 로딩 중이면 기본값 반환)
  if (!loadingYears.has(year)) {
    loadingYears.add(year);
    
    try {
      const apiHolidays = await fetchHolidaysFromAPI(year);
      if (apiHolidays.length > 0) {
        const converted = apiHolidays.map(({ month, day, name }) => ({
          date: new Date(year, month - 1, day),
          name,
        }));
        holidayCache.set(year, converted);
        saveHolidaysToCache(year, apiHolidays);
        loadingYears.delete(year);
        return converted;
      }
    } catch (error) {
      console.error(`공휴일 API 호출 실패 (${year}년):`, error);
    }
    
    loadingYears.delete(year);
  }

  // 3. 기본값 반환 (하드코딩된 공휴일)
  const defs = HOLIDAY_DEFINITIONS[year] ?? [];
  const converted = defs.map(({ month, day, name }) => ({
    date: new Date(year, month - 1, day),
    name,
  }));
  holidayCache.set(year, converted);
  return converted;
}

/**
 * 공휴일 목록 가져오기 (동기 - 즉시 반환)
 */
export function getHolidayDates(year: number): Array<{ date: Date; name: string }> {
  // 캐시에 있으면 즉시 반환
  if (holidayCache.has(year)) {
    return holidayCache.get(year)!;
  }

  // 캐시에 없으면 기본값으로 초기화하고, 백그라운드에서 API 호출
  const defs = HOLIDAY_DEFINITIONS[year] ?? [];
  const converted = defs.map(({ month, day, name }) => ({
    date: new Date(year, month - 1, day),
    name,
  }));
  holidayCache.set(year, converted);

  // 백그라운드에서 API로 최신 데이터 가져오기 시도
  loadHolidaysForYear(year).then((apiHolidays) => {
    if (apiHolidays.length > 0) {
      holidayCache.set(year, apiHolidays);
      // 캐시가 업데이트되면 이벤트 발생 (선택사항)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("holidaysUpdated", { detail: { year } }));
      }
    }
  }).catch(() => {
    // API 실패 시 기본값 유지
  });

  return converted;
}

export function isHoliday(date: Date): boolean {
  const holidays = getHolidayDates(date.getFullYear());
  return holidays.some((holiday) => isSameDay(holiday.date, date));
}

export function getHolidayName(date: Date): string | null {
  const holidays = getHolidayDates(date.getFullYear());
  const holiday = holidays.find((h) => isSameDay(h.date, date));
  return holiday ? holiday.name : null;
}

export function isWeekendOrHoliday(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6 || isHoliday(date);
}

