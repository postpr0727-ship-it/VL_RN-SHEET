// 간단한 음력-양력 변환 및 한국 음력 공휴일 계산
// 정확한 계산을 위해 더 복잡한 알고리즘이 필요하지만, 
// 주요 공휴일(설날, 추석, 부처님오신날)의 대략적인 날짜를 계산

/**
 * 음력 1월 1일(설날)의 양력 날짜 계산 (근사치)
 * 실제로는 매우 복잡한 계산이 필요하므로, 
 * 각 연도별로 알려진 날짜를 매핑하는 것이 더 정확함
 */
export function getLunarNewYear(year: number): Date {
  // 음력 설날은 매년 양력 1월 말~2월 초 사이에 위치
  // 정확한 계산은 복잡하므로, 알려진 패턴을 사용
  
  const patterns: Record<number, { month: number; day: number }> = {
    2024: { month: 2, day: 10 },
    2025: { month: 1, day: 29 },
    2026: { month: 2, day: 17 },
    2027: { month: 2, day: 6 },
    2028: { month: 1, day: 26 },
    2029: { month: 2, day: 13 },
    2030: { month: 2, day: 3 },
    2031: { month: 1, day: 23 },
    2032: { month: 2, day: 11 },
    2033: { month: 1, day: 31 },
    2034: { month: 2, day: 19 },
    2035: { month: 2, day: 8 },
    2036: { month: 1, day: 28 },
    2037: { month: 2, day: 15 },
    2038: { month: 2, day: 4 },
    2039: { month: 1, day: 24 },
    2040: { month: 2, day: 12 },
  };
  
  if (patterns[year]) {
    const { month, day } = patterns[year];
    return new Date(year, month - 1, day);
  }
  
  // 기본값 (1월 말)
  return new Date(year, 0, 25);
}

/**
 * 음력 8월 15일(추석)의 양력 날짜 계산 (근사치)
 */
export function getChuseok(year: number): Date {
  const patterns: Record<number, { month: number; day: number }> = {
    2024: { month: 9, day: 17 },
    2025: { month: 10, day: 6 },
    2026: { month: 9, day: 25 },
    2027: { month: 10, day: 14 },
    2028: { month: 9, day: 22 },
    2029: { month: 10, day: 11 },
    2030: { month: 9, day: 30 },
    2031: { month: 9, day: 19 },
    2032: { month: 10, day: 7 },
    2033: { month: 9, day: 26 },
    2034: { month: 10, day: 13 },
    2035: { month: 10, day: 2 },
    2036: { month: 9, day: 20 },
    2037: { month: 10, day: 9 },
    2038: { month: 9, day: 28 },
    2039: { month: 10, day: 15 },
    2040: { month: 10, day: 5 },
  };
  
  if (patterns[year]) {
    const { month, day } = patterns[year];
    return new Date(year, month - 1, day);
  }
  
  // 기본값 (9월 중순)
  return new Date(year, 8, 15);
}

/**
 * 음력 4월 8일(부처님오신날)의 양력 날짜 계산 (근사치)
 */
export function getBuddhaBirthday(year: number): Date {
  const patterns: Record<number, { month: number; day: number }> = {
    2024: { month: 5, day: 15 },
    2025: { month: 5, day: 5 },
    2026: { month: 4, day: 30 },
    2027: { month: 5, day: 15 },
    2028: { month: 5, day: 10 },
    2029: { month: 4, day: 29 },
    2030: { month: 5, day: 17 },
    2031: { month: 5, day: 16 },
    2032: { month: 5, day: 5 },
    2033: { month: 4, day: 26 },
    2034: { month: 5, day: 15 },
    2035: { month: 5, day: 4 },
    2036: { month: 4, day: 22 },
    2037: { month: 5, day: 11 },
    2038: { month: 4, day: 30 },
    2039: { month: 5, day: 19 },
    2040: { month: 5, day: 8 },
  };
  
  if (patterns[year]) {
    const { month, day } = patterns[year];
    return new Date(year, month - 1, day);
  }
  
  // 기본값 (5월 초)
  return new Date(year, 4, 15);
}

/**
 * 한국 음력 공휴일 목록 반환
 */
export function getLunarHolidays(year: number): Array<{ date: Date; name: string }> {
  const holidays: Array<{ date: Date; name: string }> = [];
  
  // 설날 (3일 연휴)
  const seollal = getLunarNewYear(year);
  holidays.push(
    { date: new Date(seollal.getFullYear(), seollal.getMonth(), seollal.getDate() - 1), name: "설날" },
    { date: seollal, name: "설날" },
    { date: new Date(seollal.getFullYear(), seollal.getMonth(), seollal.getDate() + 1), name: "설날" },
  );
  
  // 추석 (3일 연휴)
  const chuseok = getChuseok(year);
  holidays.push(
    { date: new Date(chuseok.getFullYear(), chuseok.getMonth(), chuseok.getDate() - 1), name: "추석" },
    { date: chuseok, name: "추석" },
    { date: new Date(chuseok.getFullYear(), chuseok.getMonth(), chuseok.getDate() + 1), name: "추석" },
  );
  
  // 부처님오신날
  const buddhaBirthday = getBuddhaBirthday(year);
  holidays.push({ date: buddhaBirthday, name: "부처님오신날" });
  
  return holidays;
}

