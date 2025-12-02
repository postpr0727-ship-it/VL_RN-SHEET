import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import type {
  ShiftType,
  NurseType,
  ScheduleEntry,
  VacationDay,
  NurseConfig,
  WorkConditionType,
} from "../types";
import { isWeekendOrHoliday } from "./holidays";

// 평일 근무 인원 요구사항
const WEEKDAY_REQUIREMENTS: Record<ShiftType, number> = {
  DAY: 2,
  "MID-DAY": 2,
  EVENING: 1,
  NIGHT: 1,
  OFF: 0,
};

// 주말/공휴일 근무 인원 요구사항
const WEEKEND_REQUIREMENTS: Record<ShiftType, number> = {
  DAY: 1,
  "MID-DAY": 0,
  EVENING: 1,
  NIGHT: 1,
  OFF: 0,
};

// 근무 조건에 따라 가능한 근무 유형 결정
function getPossibleShifts(
  workCondition: WorkConditionType,
  isWeekend: boolean,
): ShiftType[] {
  switch (workCondition) {
    case "DAYTIME_ONLY":
      // 주간 전담: 평일은 DAY, MID-DAY, OFF / 주말은 DAY, EVENING, OFF
      return isWeekend
        ? ["DAY", "EVENING", "OFF"]
        : ["DAY", "MID-DAY", "OFF"];
    case "NIGHT_ONLY":
      // 야간 전담: NIGHT, OFF만
      return ["NIGHT", "OFF"];
    case "DAY_EVENING_ALTERNATE":
      // 주간/저녁 교대: 평일은 DAY, EVENING, OFF / 주말은 OFF만
      return isWeekend ? ["OFF"] : ["DAY", "EVENING", "OFF"];
    case "FLEXIBLE":
    default:
      // 유연: 모든 시간대 가능
      return isWeekend
        ? ["DAY", "EVENING", "NIGHT", "OFF"]
        : ["DAY", "MID-DAY", "EVENING", "NIGHT", "OFF"];
  }
}

interface NurseStats {
  offCount: number;
  weekdayOffCount: number;
  weekendOffCount: number;
  lastShift?: ShiftType;
  lastTwoShifts?: ShiftType[]; // 최근 2일간의 근무 패턴
  shiftCounts: Map<ShiftType, number>; // 각 근무 시간대별 횟수
  consecutiveSameShift: number; // 같은 근무 시간대 연속 횟수
}

// 주 번호 계산 (월의 첫 주를 기준으로)
function getWeekNumber(date: Date, monthStart: Date): number {
  const daysDiff = Math.floor(
    (date.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.floor(daysDiff / 7);
}

// 연속적인 주 번호 계산 (월요일을 기준으로 주를 계산)
// 전역 기준점(2020-01-06 월요일)을 사용하여 연도 경계를 넘어서도 연속적인 주 번호 보장
function getContinuousWeekNumber(date: Date): number {
  // 날짜를 복사 (원본 수정 방지)
  const d = new Date(date);
  // 요일 구하기 (0=일요일, 1=월요일, ..., 6=토요일)
  const dayOfWeek = d.getDay();
  // 월요일까지의 일수 계산 (월요일이 0일)
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  // 해당 주의 월요일로 이동
  d.setDate(d.getDate() - daysToMonday);
  // 전역 기준점: 2020년 1월 6일 월요일 (임의의 월요일)
  const baseMonday = new Date(2020, 0, 6); // 2020-01-06은 월요일
  // 기준 월요일과 해당 주의 월요일 사이의 일수 차이
  const daysDiff = Math.floor(
    (d.getTime() - baseMonday.getTime()) / (1000 * 60 * 60 * 24),
  );
  // 주 번호 계산 (음수도 가능하므로 절대값 사용하지 않음)
  return Math.floor(daysDiff / 7);
}

export function generateSchedule(
  year: number,
  month: number,
  vacations: VacationDay[] = [],
  nurseConfigs: NurseConfig[] = [],
): ScheduleEntry[] {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // 간호사 설정이 없으면 기본 설정 사용
  const nurses = nurseConfigs.length > 0 
    ? nurseConfigs.map((c) => c.id as NurseType)
    : (["A", "B", "C", "D", "E", "F", "G", "H"] as NurseType[]);

  // 간호사별 설정 맵 생성
  const nurseConfigMap = new Map<string, NurseConfig>();
  if (nurseConfigs.length > 0) {
    nurseConfigs.forEach((config) => {
      nurseConfigMap.set(config.id, config);
    });
  }

  // 기본 설정도 맵에 추가 (하위 호환성)
  if (nurseConfigs.length === 0) {
    [
      { id: "A", name: "A 간호사", workCondition: "DAYTIME_ONLY" as WorkConditionType },
      { id: "B", name: "B 간호사", workCondition: "DAYTIME_ONLY" as WorkConditionType },
      { id: "C", name: "C 간호사", workCondition: "DAYTIME_ONLY" as WorkConditionType },
      { id: "D", name: "D 간호사", workCondition: "DAYTIME_ONLY" as WorkConditionType },
      { id: "E", name: "E 간호사", workCondition: "DAY_EVENING_ALTERNATE" as WorkConditionType },
      { id: "F", name: "F 간호사", workCondition: "DAY_EVENING_ALTERNATE" as WorkConditionType },
      { id: "G", name: "G 간호사", workCondition: "NIGHT_ONLY" as WorkConditionType },
      { id: "H", name: "H 간호사", workCondition: "NIGHT_ONLY" as WorkConditionType },
    ].forEach((config) => {
      nurseConfigMap.set(config.id, config);
    });
  }

  const schedule: ScheduleEntry[] = [];
  const nurseStats = new Map<NurseType, NurseStats>();

  // 통계 초기화
  nurses.forEach((nurse) => {
    nurseStats.set(nurse, {
      offCount: 0,
      weekdayOffCount: 0,
      weekendOffCount: 0,
      shiftCounts: new Map<ShiftType, number>(),
      consecutiveSameShift: 0,
    });
  });

  const getNightAllowance = (nurse: NurseType) => {
    const stats = nurseStats.get(nurse);
    if (!stats) return 3;
    const allowance = 3 - (stats.consecutiveSameShift ?? 0);
    return Math.max(0, allowance);
  };

  const selectNightBlockLength = (
    remaining: number,
    preferred: number,
  ): number => {
    if (remaining <= 2) return 2;
    if (remaining === 3) return 3;
    let length = preferred;
    if (length > remaining) {
      length = remaining === 3 ? 3 : 2;
    }
    if (remaining - length === 1) {
      length = 3;
    }
    if (length < 2 || length > 3) {
      length = remaining % 2 === 0 ? 2 : 3;
    }
    if (length > remaining) {
      length = remaining >= 3 ? 3 : 2;
    }
    return length;
  };

  const monthlyNightCounts = new Map<NurseType, number>([
    ["G", 0],
    ["H", 0],
  ]);
  const nightsInMonth = days.length;
  let gNightTarget = Math.floor(nightsInMonth / 2);
  let hNightTarget = nightsInMonth - gNightTarget;
  if ((year + month) % 2 === 0) {
    [gNightTarget, hNightTarget] = [hNightTarget, gNightTarget];
  }
  const monthlyNightTargets = new Map<NurseType, number>([
    ["G", gNightTarget],
    ["H", hNightTarget],
  ]);
  let nightBlockNurse: NurseType | null = null;
  let nightBlockDaysLeft = 0;
  let nightBlockNextLength = 2;
  let nightBlockPreferredNurse: NurseType =
    gNightTarget >= hNightTarget ? "G" : "H";
  let nextNightBlockNurse: NurseType = nightBlockPreferredNurse;

  // 연차 적용
  const vacationSet = new Set(
    vacations.map((v) => `${v.nurse}-${format(v.date, "yyyy-MM-dd")}`),
  );

  // 주 단위로 OFF 강제 배정을 위한 추적
  const weeklyOffTarget = new Map<NurseType, number>(); // 각 간호사별 주당 OFF 목표
  const weeklyOffCount = new Map<NurseType, number>(); // 각 간호사별 현재 주의 OFF 횟수
  let currentWeek = -1;

  // E, F 간호사의 주 단위 shift 캐시 (주 번호를 키로 하여 한 주의 모든 평일에 동일한 shift 보장)
  const efWeeklyShiftCache = new Map<number, { eShift: ShiftType; fShift: ShiftType }>();

  // E, F 간호사 주 단위 shift 결정 함수
  // 고정 기준점: 2025년 12월 1일이 속한 주에서 E가 EVENING으로 시작
  // 그 이후 주 단위로 자동으로 번갈아가며 배정
  const getEFWeeklyShift = (continuousWeekNumber: number): { eShift: ShiftType; fShift: ShiftType } => {
    if (efWeeklyShiftCache.has(continuousWeekNumber)) {
      return efWeeklyShiftCache.get(continuousWeekNumber)!;
    }
    // 고정 기준점: 2025년 12월 1일이 속한 주 번호
    // 이 기준점에서 E가 EVENING으로 시작
    const baseDecemberWeek = getContinuousWeekNumber(new Date(2025, 11, 1)); // 2025년 12월 1일
    // 기준 주와의 차이에 따라 E의 shift 결정
    // 기준 주에서 E가 EVENING이므로, 주 번호 차이가 짝수면 E는 EVENING, 홀수면 E는 DAY
    const weekDiff = continuousWeekNumber - baseDecemberWeek;
    // 주 번호 차이가 짝수면 E는 EVENING, 홀수면 DAY
    // weekDiff % 2 === 0 → E=EVENING, weekDiff % 2 === 1 → E=DAY
    const eShift: ShiftType = (weekDiff % 2 === 0) ? "EVENING" : "DAY";
    const fShift: ShiftType = (weekDiff % 2 === 0) ? "DAY" : "EVENING"; // F는 E와 반대
    const shift = { eShift, fShift };
    efWeeklyShiftCache.set(continuousWeekNumber, shift);
    return shift;
  };

  // 각 날짜별로 근무표 생성
  for (const day of days) {
    const isWeekendOrHolidayDay = isWeekendOrHoliday(day);
    // requirements를 복사해서 사용 (원본 수정 방지)
    const baseRequirements = isWeekendOrHolidayDay
      ? WEEKEND_REQUIREMENTS
      : WEEKDAY_REQUIREMENTS;
    const requirements = { ...baseRequirements };
    const weekNumber = getWeekNumber(day, startDate);

    // 주가 바뀌면 OFF 카운트 초기화
    if (weekNumber !== currentWeek) {
      currentWeek = weekNumber;
      // A~D, G~H 간호사는 주당 2회 OFF 목표
      for (const nurse of ["A", "B", "C", "D", "G", "H"] as NurseType[]) {
        weeklyOffTarget.set(nurse, 2);
        weeklyOffCount.set(nurse, 0);
      }
      // E, F는 주말/공휴일에만 OFF이므로 목표 없음
    }

    // E, F 간호사는 격주로 DAY/EVENING을 고정 패턴으로 번갈아 근무
    // 연속적인 주 번호를 사용하여 월 경계에서도 패턴이 유지되도록 함
    // 한 주의 모든 평일에 동일한 shift를 보장하기 위해 캐시 사용
    const continuousWeekNumber = getContinuousWeekNumber(day);
    const { eShift: eWeekShift, fShift: fWeekShift } = getEFWeeklyShift(continuousWeekNumber);

    // 해당 날짜의 근무 배정
    const dayAssignments = new Map<ShiftType, NurseType[]>();
    Object.keys(requirements).forEach((shift) => {
      dayAssignments.set(shift as ShiftType, []);
    });

    // 연차가 있는 간호사는 OFF로 설정
    const assignedNurses = new Set<NurseType>();

    for (const nurse of nurses) {
      const vacationKey = `${nurse}-${format(day, "yyyy-MM-dd")}`;
      if (vacationSet.has(vacationKey)) {
        schedule.push({ date: new Date(day), nurse, shift: "OFF" });
        assignedNurses.add(nurse);
        const stats = nurseStats.get(nurse)!;
        stats.offCount++;
        if (isWeekendOrHolidayDay) {
          stats.weekendOffCount++;
        } else {
          stats.weekdayOffCount++;
        }
        // 주 단위 OFF 카운트 업데이트 (E, F 제외)
        if (nurse !== "E" && nurse !== "F") {
          const currentWeeklyOff = weeklyOffCount.get(nurse) || 0;
          weeklyOffCount.set(nurse, currentWeeklyOff + 1);
        }
        // 연차도 통계에 반영
        const offCount = stats.shiftCounts.get("OFF") || 0;
        stats.shiftCounts.set("OFF", offCount + 1);
        const prevShift = stats.lastShift;
        stats.lastShift = "OFF";
        if (prevShift === "OFF") {
          stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
        } else {
          stats.consecutiveSameShift = 0;
        }
        if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
        stats.lastTwoShifts.push("OFF");
        if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
      }
    }

    // E, F 간호사 처리
    // 평일: DAY/EVENING 번갈아 근무 (OFF 불가)
    // 주말/공휴일: 무조건 OFF
    if (isWeekendOrHolidayDay) {
      // 주말/공휴일에는 무조건 OFF
      if (!assignedNurses.has("E")) {
        schedule.push({ date: new Date(day), nurse: "E", shift: "OFF" });
        assignedNurses.add("E");
        const stats = nurseStats.get("E")!;
        stats.offCount++;
        stats.weekendOffCount++;
        // 통계 업데이트
        const offCount = stats.shiftCounts.get("OFF") || 0;
        stats.shiftCounts.set("OFF", offCount + 1);
        const prevShift = stats.lastShift;
        stats.lastShift = "OFF";
        if (prevShift === "OFF") {
          stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
        } else {
          stats.consecutiveSameShift = 0;
        }
        if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
        stats.lastTwoShifts.push("OFF");
        if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
      }
      if (!assignedNurses.has("F")) {
        schedule.push({ date: new Date(day), nurse: "F", shift: "OFF" });
        assignedNurses.add("F");
        const stats = nurseStats.get("F")!;
        stats.offCount++;
        stats.weekendOffCount++;
        // 통계 업데이트
        const offCount = stats.shiftCounts.get("OFF") || 0;
        stats.shiftCounts.set("OFF", offCount + 1);
        const prevShift = stats.lastShift;
        stats.lastShift = "OFF";
        if (prevShift === "OFF") {
          stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
        } else {
          stats.consecutiveSameShift = 0;
        }
        if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
        stats.lastTwoShifts.push("OFF");
        if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
      }
    } else {
      // 평일에는 E, F는 OFF가 될 수 없음 (무조건 DAY 또는 EVENING)
      // 이는 배정 로직에서 처리됨
    }

    const getNightRemaining = (nurse: NurseType) =>
      (monthlyNightTargets.get(nurse) ?? nightsInMonth) -
      (monthlyNightCounts.get(nurse) ?? 0);

    const assignNightShift = (nurse: NurseType) => {
      const allowance = getNightAllowance(nurse);
      if (allowance <= 0) {
        return false;
      }
      const stats = nurseStats.get(nurse)!;
      const prevShift = stats.lastShift;
      const previousCount = stats.consecutiveSameShift || 0;
      const nextCount = prevShift === "NIGHT" ? previousCount + 1 : 1;
      if (nextCount > 3) {
        return false;
      }
      const nightAssignments = dayAssignments.get("NIGHT") || [];
      nightAssignments.push(nurse);
      dayAssignments.set("NIGHT", nightAssignments);
      assignedNurses.add(nurse);
      schedule.push({ date: new Date(day), nurse, shift: "NIGHT" });
      stats.lastShift = "NIGHT";
      stats.consecutiveSameShift = nextCount;
      const count = stats.shiftCounts.get("NIGHT") || 0;
      stats.shiftCounts.set("NIGHT", count + 1);
      if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
      stats.lastTwoShifts.push("NIGHT");
      if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
      const monthlyCount = monthlyNightCounts.get(nurse) ?? 0;
      monthlyNightCounts.set(nurse, monthlyCount + 1);
      return true;
    };

    // NIGHT 근무는 G/H가 2~3일씩 연속으로 수행
    const nightAssignments = dayAssignments.get("NIGHT") || [];
    if (nightAssignments.length === 0) {
      const nightCandidates = ["G", "H"] as NurseType[];
      const availableNight = nightCandidates.filter(
        (n) => !assignedNurses.has(n),
      );

      let nightAssigned = false;
      if (
        nightBlockDaysLeft > 0 &&
        nightBlockNurse &&
        availableNight.includes(nightBlockNurse)
      ) {
        const allowance = getNightAllowance(nightBlockNurse);
        if (allowance > 0) {
          if (assignNightShift(nightBlockNurse)) {
            nightBlockDaysLeft = Math.max(
              0,
              Math.min(nightBlockDaysLeft - 1, allowance - 1),
            );
            nightAssigned = true;
          }
        } else {
          nightBlockNurse = null;
          nightBlockDaysLeft = 0;
        }
      }

      if (!nightAssigned) {
        const primary: NurseType = nextNightBlockNurse;
        const secondary: NurseType = primary === "G" ? "H" : "G";
        const candidatesOrdered: NurseType[] = [primary, secondary];
        let selectedNurse: NurseType | null = null;
        let blockLength = nightBlockNextLength;

        for (const candidate of candidatesOrdered) {
          if (!availableNight.includes(candidate)) continue;
          const remaining = getNightRemaining(candidate);
          if (remaining < 2) continue;
          blockLength = selectNightBlockLength(remaining, nightBlockNextLength);
          selectedNurse = candidate;
          break;
        }

        if (!selectedNurse) {
          for (const candidate of candidatesOrdered) {
            if (!availableNight.includes(candidate)) continue;
            const remaining = getNightRemaining(candidate);
            const allowance = getNightAllowance(candidate);
            const capacity = Math.min(remaining, allowance);
            if (capacity < 2) continue;
            blockLength = selectNightBlockLength(
              capacity,
              nightBlockNextLength,
            );
            blockLength = Math.min(blockLength, capacity);
            selectedNurse = candidate;
            break;
          }
        }

        if (selectedNurse) {
          if (assignNightShift(selectedNurse)) {
            nightBlockNurse = selectedNurse;
            nightBlockNextLength = nightBlockNextLength === 2 ? 3 : 2;
            nightBlockDaysLeft = Math.max(0, blockLength - 1);
            nextNightBlockNurse = selectedNurse === "G" ? "H" : "G";
            nightAssigned = true;
          } else {
            selectedNurse = null;
          }
        } else {
          nightBlockNurse = null;
          nightBlockDaysLeft = 0;
        }
      }
    }

    // 평일에는 E, F 간호사를 먼저 배정 (무조건 근무해야 함)
    if (!isWeekendOrHolidayDay) {
      // E 간호사 배정 (평일에는 무조건 주간 패턴에 맞게 배정)
      if (!assignedNurses.has("E")) {
        const eShift = eWeekShift;
        const eAssignments = dayAssignments.get(eShift) || [];
        // E는 평일에 무조건 근무해야 하므로, 인원이 충족되어도 배정
        eAssignments.push("E");
        assignedNurses.add("E");
        schedule.push({ date: new Date(day), nurse: "E", shift: eShift });
        const stats = nurseStats.get("E")!;

        // 통계 업데이트
        const prevShift = stats.lastShift;
        stats.lastShift = eShift;
        if (prevShift === eShift) {
          stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
        } else {
          stats.consecutiveSameShift = 0;
        }
        const eCount = stats.shiftCounts.get(eShift) || 0;
        stats.shiftCounts.set(eShift, eCount + 1);
        if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
        stats.lastTwoShifts.push(eShift);
        if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();

        dayAssignments.set(eShift, eAssignments);
      }

      // F 간호사 배정 (평일에는 무조건 주간 패턴에 맞게 배정)
      if (!assignedNurses.has("F")) {
        const fShift = fWeekShift;
        const fAssignments = dayAssignments.get(fShift) || [];
        // F는 평일에 무조건 근무해야 하므로, 인원이 충족되어도 배정
        fAssignments.push("F");
        assignedNurses.add("F");
        schedule.push({ date: new Date(day), nurse: "F", shift: fShift });
        const stats = nurseStats.get("F")!;

        // 통계 업데이트
        const prevShift = stats.lastShift;
        stats.lastShift = fShift;
        if (prevShift === fShift) {
          stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
        } else {
          stats.consecutiveSameShift = 0;
        }
        const fCount = stats.shiftCounts.get(fShift) || 0;
        stats.shiftCounts.set(fShift, fCount + 1);
        if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
        stats.lastTwoShifts.push(fShift);
        if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();

        dayAssignments.set(fShift, fAssignments);
      }
    }

    // 각 근무 시간대별로 인원 배정
    for (const [shift, requiredCount] of Object.entries(requirements)) {
      if (shift === "OFF" || requiredCount === 0) continue;

      const shiftType = shift as ShiftType;
      const currentAssignments = dayAssignments.get(shiftType) || [];

      // 필요한 인원만큼 배정
      while (currentAssignments.length < requiredCount) {
        let bestNurse: NurseType | null = null;
        let bestScore = -Infinity;

        for (const nurse of nurses) {
          if (assignedNurses.has(nurse)) continue;

          // 간호사 설정에 따라 가능한 근무 유형 결정
          const config = nurseConfigMap.get(nurse);
          const possibleShifts = config
            ? getPossibleShifts(config.workCondition, isWeekendOrHolidayDay)
            : isWeekendOrHolidayDay
            ? ["DAY", "EVENING", "NIGHT", "OFF"]
            : ["DAY", "MID-DAY", "EVENING", "NIGHT", "OFF"];

          if (!possibleShifts.includes(shiftType)) continue;

          // E, F 간호사는 주간 패턴 고려 (평일만, OFF 불가)
          if (nurse === "E" && !isWeekendOrHolidayDay) {
            // 평일에는 주간 패턴에 맞는 근무만 가능 (OFF 절대 불가)
            if (shiftType === "OFF") continue; // OFF는 절대 불가
            if (shiftType !== eWeekShift) continue;
          }
          if (nurse === "F" && !isWeekendOrHolidayDay) {
            // 평일에는 주간 패턴에 맞는 근무만 가능 (OFF 절대 불가)
            if (shiftType === "OFF") continue; // OFF는 절대 불가
            if (shiftType !== fWeekShift) continue;
          }

          // E, F는 주말/공휴일에만 OFF 가능
          if (
            (nurse === "E" || nurse === "F") &&
            !isWeekendOrHolidayDay &&
            shiftType === "OFF"
          ) {
            continue; // 평일에 OFF는 절대 불가
          }

          const stats = nurseStats.get(nurse)!;

          // 점수 계산: 다양성과 공평성을 모두 고려
          let score = 0;

          // 1. OFF 횟수 (목표는 주당 2회) - E, F는 제외
          // E, F는 주말/공휴일에만 OFF를 받으므로 주당 2회 목표는 적용하지 않음
          if (nurse !== "E" && nurse !== "F") {
            // 주 단위 OFF 목표 확인
            const weeklyTarget = weeklyOffTarget.get(nurse) || 2;
            const weeklyCurrent = weeklyOffCount.get(nurse) || 0;
            const weeklyOffDifference = weeklyCurrent - weeklyTarget;

            // 주 단위 OFF가 부족하면 매우 큰 보너스 (OFF를 받아야 함)
            if (shiftType === "OFF") {
              if (weeklyOffDifference < 0) {
                // 부족한 만큼 매우 큰 보너스
                score += Math.abs(weeklyOffDifference) * 200; // 매우 큰 보너스
              } else if (weeklyOffDifference >= weeklyTarget) {
                // 이미 목표를 달성했으면 페널티
                score -= 100;
              }
            } else {
              // 근무를 할 때: 주 단위 OFF가 부족하면 페널티
              if (weeklyOffDifference < 0) {
                score -= Math.abs(weeklyOffDifference) * 100;
              }
            }

            // A~D 간호사는 OFF 분배가 더 중요하므로 가중치 증가
            if (
              nurse === "A" ||
              nurse === "B" ||
              nurse === "C" ||
              nurse === "D"
            ) {
              if (shiftType === "OFF" && weeklyOffDifference < 0) {
                score += Math.abs(weeklyOffDifference) * 300; // 매우 큰 보너스
              }
            }
          }

          // 2. 주말/평일 OFF 균형 (A~D 간호사는 주말 OFF가 중요)
          if (
            nurse === "A" ||
            nurse === "B" ||
            nurse === "C" ||
            nurse === "D"
          ) {
            // A~D는 평일에는 OFF를 가질 수 없으므로 주말 OFF가 중요
            if (isWeekendOrHolidayDay) {
              // 주말/공휴일: OFF 횟수가 적을수록 좋음 (공평하게 분배)
              score -= stats.weekendOffCount * 15; // 기존 8에서 15로 증가
              // 다른 간호사보다 주말 OFF가 적으면 보너스
              const avgWeekendOff =
                Array.from(nurseStats.values())
                  .filter((s) => s.weekendOffCount !== undefined)
                  .reduce((sum, s) => sum + s.weekendOffCount, 0) /
                nurseStats.size;
              if (stats.weekendOffCount < avgWeekendOff) {
                score += 10;
              }
            }
          } else {
            // 다른 간호사들
            if (isWeekendOrHolidayDay) {
              score -= stats.weekendOffCount * 8;
              score += stats.weekdayOffCount * 5;
            } else {
              score -= stats.weekdayOffCount * 8;
              score += stats.weekendOffCount * 5;
            }
          }

          // 3. 연속 근무 방지 (강화) - 같은 근무 시간대를 연속으로 하면 큰 페널티
          if (stats.lastShift === shiftType) {
            score -= 30; // 기존 10에서 30으로 증가
            // 연속 횟수가 많을수록 더 큰 페널티
            if (stats.consecutiveSameShift > 0) {
              score -= stats.consecutiveSameShift * 20;
            }
          } else {
            // 다른 근무 시간대로 바뀌면 보너스
            score += 10;
          }

          // 4. 근무 시간대 다양성 점수 (같은 근무 시간대를 너무 많이 하지 않도록)
          const currentShiftCount = stats.shiftCounts.get(shiftType) || 0;
          const totalShifts = Array.from(stats.shiftCounts.values()).reduce(
            (a, b) => a + b,
            0,
          );
          if (totalShifts > 0) {
            const shiftRatio = currentShiftCount / totalShifts;
            // 한 근무 시간대에 집중되면 페널티
            if (shiftRatio > 0.5) {
              score -= (shiftRatio - 0.5) * 50;
            }
          }

          // 5. 최근 패턴 다양성 (최근 2일간 같은 패턴이면 페널티)
          if (stats.lastTwoShifts && stats.lastTwoShifts.length >= 2) {
            const lastTwo = stats.lastTwoShifts;
            if (lastTwo[0] === lastTwo[1] && lastTwo[0] === shiftType) {
              score -= 25; // 3일 연속 같은 근무 시간대면 큰 페널티
            }
          }

          // 6. 랜덤 요소 추가 (약간의 랜덤성으로 다양성 확보)
          const randomFactor = Math.random() * 5 - 2.5; // -2.5 ~ +2.5
          score += randomFactor;

          // 7. A, B, C, D 간호사의 DAY/MID-DAY 다양성
          if (
            (nurse === "A" ||
              nurse === "B" ||
              nurse === "C" ||
              nurse === "D") &&
            !isWeekendOrHolidayDay
          ) {
            const dayCount = stats.shiftCounts.get("DAY") || 0;
            const midDayCount = stats.shiftCounts.get("MID-DAY") || 0;
            // DAY와 MID-DAY를 균형있게 배분
            if (shiftType === "DAY" && dayCount > midDayCount) {
              score -= 5; // DAY가 많으면 MID-DAY 선호
            } else if (shiftType === "MID-DAY" && midDayCount > dayCount) {
              score -= 5; // MID-DAY가 많으면 DAY 선호
            } else {
              score += 5; // 균형있으면 보너스
            }
          }

          // 8. A~D 간호사 주말/공휴일 OFF 공평성 (중요!)
          if (
            (nurse === "A" ||
              nurse === "B" ||
              nurse === "C" ||
              nurse === "D") &&
            isWeekendOrHolidayDay
          ) {
            // 주말/공휴일에는 A~D 중 2명은 근무, 2명은 OFF
            // OFF를 받을 때: 다른 A~D 간호사들의 주말 OFF 횟수와 비교
            const abcdNurses = ["A", "B", "C", "D"] as NurseType[];
            const abcdWeekendOffCounts = abcdNurses.map((n) => {
              const s = nurseStats.get(n)!;
              return { nurse: n, count: s.weekendOffCount };
            });
            const avgAbcdWeekendOff =
              abcdWeekendOffCounts.reduce((sum, item) => sum + item.count, 0) /
              abcdWeekendOffCounts.length;
            const currentNurseWeekendOff = stats.weekendOffCount;

            // OFF를 받을 때: 평균보다 적으면 보너스 (공평하게 분배)
            if (shiftType === "OFF") {
              if (currentNurseWeekendOff < avgAbcdWeekendOff) {
                score += 20; // 평균보다 적으면 큰 보너스
              } else if (currentNurseWeekendOff > avgAbcdWeekendOff) {
                score -= 20; // 평균보다 많으면 큰 페널티
              }
            } else {
              // 근무를 할 때: 주말 OFF가 이미 많으면 근무 선호
              if (currentNurseWeekendOff > avgAbcdWeekendOff) {
                score += 15; // 주말 OFF가 많으면 근무 보너스
              }
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestNurse = nurse;
          }
        }

        if (bestNurse) {
          currentAssignments.push(bestNurse);
          assignedNurses.add(bestNurse);
          schedule.push({
            date: new Date(day),
            nurse: bestNurse,
            shift: shiftType,
          });
          const stats = nurseStats.get(bestNurse)!;

          // 통계 업데이트
          const prevShift = stats.lastShift;
          stats.lastShift = shiftType;

          // 연속 근무 체크
          if (prevShift === shiftType) {
            stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
          } else {
            stats.consecutiveSameShift = 0;
          }

          // 근무 시간대별 횟수 업데이트
          const currentCount = stats.shiftCounts.get(shiftType) || 0;
          stats.shiftCounts.set(shiftType, currentCount + 1);

          // 최근 2일간 패턴 업데이트
          if (!stats.lastTwoShifts) {
            stats.lastTwoShifts = [];
          }
          stats.lastTwoShifts.push(shiftType);
          if (stats.lastTwoShifts.length > 2) {
            stats.lastTwoShifts.shift(); // 가장 오래된 것 제거
          }
        } else {
          // 배정 실패 시 빈 슬롯
          break;
        }
      }
    }

    // 나머지 간호사들은 OFF 배정 (E, F는 평일에는 이미 배정됨)
    // 주말/공휴일에는 A~D 간호사들의 OFF를 공평하게 분배
    const unassignedNurses = nurses.filter((n) => !assignedNurses.has(n));

    if (isWeekendOrHolidayDay) {
      // 주말/공휴일: A~D 간호사들의 OFF를 공평하게 분배
      const unassignedAbcd = unassignedNurses.filter(
        (n) => n === "A" || n === "B" || n === "C" || n === "D",
      );
      const unassignedOthers = unassignedNurses.filter(
        (n) => n !== "A" && n !== "B" && n !== "C" && n !== "D",
      );

      // A~D 간호사들을 주 단위 OFF 횟수 순으로 정렬 (적은 순서대로)
      // 주 단위 OFF가 부족한 간호사 우선 배정
      const sortedAbcd = unassignedAbcd.sort((a, b) => {
        const weeklyOffA = weeklyOffCount.get(a) || 0;
        const weeklyOffB = weeklyOffCount.get(b) || 0;
        const targetA = weeklyOffTarget.get(a) || 2;
        const targetB = weeklyOffTarget.get(b) || 2;
        const diffA = weeklyOffA - targetA; // 음수면 부족
        const diffB = weeklyOffB - targetB; // 음수면 부족

        // 주 단위 OFF가 부족한 순서대로 (부족한 정도가 큰 순서)
        if (diffA !== diffB) {
          return diffA - diffB;
        }
        // 같으면 주말 OFF 횟수 순
        const statsA = nurseStats.get(a)!;
        const statsB = nurseStats.get(b)!;
        return statsA.weekendOffCount - statsB.weekendOffCount;
      });

      // A~D 중 주말 OFF가 적은 간호사부터 OFF 배정 (최대 2명)
      // 주말/공휴일에는 A~D 중 2명은 근무, 2명은 OFF
      const abcdOffCount = sortedAbcd.length;
      const targetAbcdOff = Math.min(2, abcdOffCount); // 최대 2명만 OFF

      for (let i = 0; i < sortedAbcd.length; i++) {
        const nurse = sortedAbcd[i];
        if (i < targetAbcdOff) {
          // OFF 배정
          schedule.push({ date: new Date(day), nurse, shift: "OFF" });
          const stats = nurseStats.get(nurse)!;
          stats.offCount++;
          stats.weekendOffCount++;
          // 주 단위 OFF 카운트 업데이트
          const currentWeeklyOff = weeklyOffCount.get(nurse) || 0;
          weeklyOffCount.set(nurse, currentWeeklyOff + 1);
          const offCount = stats.shiftCounts.get("OFF") || 0;
          stats.shiftCounts.set("OFF", offCount + 1);
          const prevShift = stats.lastShift;
          stats.lastShift = "OFF";
          if (prevShift === "OFF") {
            stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
          } else {
            stats.consecutiveSameShift = 0;
          }
          if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
          stats.lastTwoShifts.push("OFF");
          if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
        } else {
          // 나머지는 근무 배정 (DAY 또는 EVENING)
          // 이미 배정된 근무 시간대 확인 (dayAssignments에서 확인)
          const currentDayAssignments = dayAssignments.get("DAY") || [];
          const currentEveningAssignments = dayAssignments.get("EVENING") || [];
          const dayCount = currentDayAssignments.length;
          const eveningCount = currentEveningAssignments.length;

          // DAY와 EVENING 중 적은 쪽에 배정
          const shiftToAssign = dayCount < eveningCount ? "DAY" : "EVENING";
          const targetAssignments = dayAssignments.get(shiftToAssign) || [];
          targetAssignments.push(nurse);
          dayAssignments.set(shiftToAssign, targetAssignments);

          schedule.push({ date: new Date(day), nurse, shift: shiftToAssign });
          const stats = nurseStats.get(nurse)!;
          const prevShift = stats.lastShift;
          stats.lastShift = shiftToAssign;
          if (prevShift === shiftToAssign) {
            stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
          } else {
            stats.consecutiveSameShift = 0;
          }
          const shiftCount = stats.shiftCounts.get(shiftToAssign) || 0;
          stats.shiftCounts.set(shiftToAssign, shiftCount + 1);
          if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
          stats.lastTwoShifts.push(shiftToAssign);
          if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
        }
      }

      // 나머지 간호사들 (G, H 등)은 OFF 배정
      // E, F는 이미 주말/공휴일에 OFF로 배정되었으므로 제외
      const othersExcludingEF = unassignedOthers.filter(
        (n) => n !== "E" && n !== "F",
      );
      for (const nurse of othersExcludingEF) {
        schedule.push({ date: new Date(day), nurse, shift: "OFF" });
        const stats = nurseStats.get(nurse)!;
        stats.offCount++;
        stats.weekendOffCount++;
        // 주 단위 OFF 카운트 업데이트
        const currentWeeklyOff = weeklyOffCount.get(nurse) || 0;
        weeklyOffCount.set(nurse, currentWeeklyOff + 1);
        const offCount = stats.shiftCounts.get("OFF") || 0;
        stats.shiftCounts.set("OFF", offCount + 1);
        const prevShift = stats.lastShift;
        stats.lastShift = "OFF";
        if (prevShift === "OFF") {
          stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
        } else {
          stats.consecutiveSameShift = 0;
        }
        if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
        stats.lastTwoShifts.push("OFF");
        if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
      }
    } else {
      // 평일: E, F는 이미 배정되어 있어야 하므로 제외하고 나머지만 OFF 배정
      const unassignedExcludingEF = unassignedNurses.filter(
        (n) => n !== "E" && n !== "F",
      );

      // E, F가 배정되지 않았다면 강제 배정 (에러 방지)
      if (unassignedNurses.includes("E")) {
        console.warn(
          `경고: E간호사가 평일에 배정되지 않았습니다. 강제 배정합니다.`,
        );
        const weekShift = eWeekShift;
        const eAssignments = dayAssignments.get(weekShift) || [];
        eAssignments.push("E");
        dayAssignments.set(weekShift, eAssignments);
        schedule.push({ date: new Date(day), nurse: "E", shift: weekShift });
        const stats = nurseStats.get("E")!;
        const prevShift = stats.lastShift;
        stats.lastShift = weekShift;
        if (prevShift === weekShift) {
          stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
        } else {
          stats.consecutiveSameShift = 0;
        }
        const shiftCount = stats.shiftCounts.get(weekShift) || 0;
        stats.shiftCounts.set(weekShift, shiftCount + 1);
        if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
        stats.lastTwoShifts.push(weekShift);
        if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
      }

      if (unassignedNurses.includes("F")) {
        console.warn(
          `경고: F간호사가 평일에 배정되지 않았습니다. 강제 배정합니다.`,
        );
        const weekShift = fWeekShift;
        const fAssignments = dayAssignments.get(weekShift) || [];
        fAssignments.push("F");
        dayAssignments.set(weekShift, fAssignments);
        schedule.push({ date: new Date(day), nurse: "F", shift: weekShift });
        const stats = nurseStats.get("F")!;
        const prevShift = stats.lastShift;
        stats.lastShift = weekShift;
        if (prevShift === weekShift) {
          stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
        } else {
          stats.consecutiveSameShift = 0;
        }
        const shiftCount = stats.shiftCounts.get(weekShift) || 0;
        stats.shiftCounts.set(weekShift, shiftCount + 1);
        if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
        stats.lastTwoShifts.push(weekShift);
        if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
      }

      // 나머지 간호사들 (A~D, G~H)은 OFF 배정
      // 주 단위 OFF가 부족한 간호사 우선 배정
      const sortedByWeeklyOff = unassignedExcludingEF.sort((a, b) => {
        const weeklyOffA = weeklyOffCount.get(a) || 0;
        const weeklyOffB = weeklyOffCount.get(b) || 0;
        return weeklyOffA - weeklyOffB; // OFF가 적은 순서대로
      });

      for (const nurse of sortedByWeeklyOff) {
        schedule.push({ date: new Date(day), nurse, shift: "OFF" });
        const stats = nurseStats.get(nurse)!;
        stats.offCount++;
        stats.weekdayOffCount++;
        // 주 단위 OFF 카운트 업데이트
        const currentWeeklyOff = weeklyOffCount.get(nurse) || 0;
        weeklyOffCount.set(nurse, currentWeeklyOff + 1);
        // OFF도 통계에 반영
        const offCount = stats.shiftCounts.get("OFF") || 0;
        stats.shiftCounts.set("OFF", offCount + 1);
        const prevShift = stats.lastShift;
        stats.lastShift = "OFF";
        if (prevShift === "OFF") {
          stats.consecutiveSameShift = (stats.consecutiveSameShift || 0) + 1;
        } else {
          stats.consecutiveSameShift = 0;
        }
        if (!stats.lastTwoShifts) stats.lastTwoShifts = [];
        stats.lastTwoShifts.push("OFF");
        if (stats.lastTwoShifts.length > 2) stats.lastTwoShifts.shift();
      }
    }
  }

  return schedule;
}
