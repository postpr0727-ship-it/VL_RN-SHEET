import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { ScheduleEntry, NurseType, ShiftType } from '../types';
import { NURSE_IDS } from '../constants/nurses';

const SHIFT_LABELS: Record<ShiftType, string> = {
  DAY: "DAY",
  "MID-DAY": "MID",
  EVENING: "EVE",
  NIGHT: "NIGHT",
  OFF: "OFF",
};

const WORK_SHIFTS: ShiftType[] = ["DAY", "MID-DAY", "EVENING", "NIGHT"];

interface ExportData {
  schedule: ScheduleEntry[];
  year: number;
  month: number;
  nurseLabels: Record<NurseType, string>;
}

export function exportToExcel({ schedule, year, month, nurseLabels }: ExportData) {
  const workbook = XLSX.utils.book_new();

  // 1. 근무표 시트 생성
  const scheduleData = createScheduleSheet(schedule, year, month, nurseLabels);
  const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
  
  // 열 너비 설정
  scheduleSheet['!cols'] = [
    { wch: 15 }, // 간호사 이름 열
    ...Array(31).fill({ wch: 8 }) // 날짜 열들
  ];

  XLSX.utils.book_append_sheet(workbook, scheduleSheet, '근무표');

  // 2. 통계 시트 생성
  const summaryData = createSummarySheet(schedule, nurseLabels);
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // 열 너비 설정
  summarySheet['!cols'] = [
    { wch: 15 }, // 간호사 이름
    { wch: 10 }, // DAY
    { wch: 10 }, // MID-DAY
    { wch: 10 }, // EVENING
    { wch: 10 }, // NIGHT
    { wch: 10 }, // OFF
    { wch: 10 }  // 총 근무
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, '월간 통계');

  // 파일명 생성
  const fileName = `근무표_${year}년_${month}월_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  // 파일 다운로드
  XLSX.writeFile(workbook, fileName);
}

function createScheduleSheet(
  schedule: ScheduleEntry[],
  year: number,
  month: number,
  nurseLabels: Record<NurseType, string>
): (string | number)[][] {
  const data: (string | number)[][] = [];

  // 헤더 행 생성
  const header = ['간호사'];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const dates: Date[] = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  dates.forEach((date) => {
    const day = format(date, 'M/d');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    header.push(`${day}(${weekday})`);
  });
  data.push(header);

  // 각 간호사의 근무 데이터 행 생성
  NURSE_IDS.forEach((nurse) => {
    const row: (string | number)[] = [];
    const nurseName = nurseLabels[nurse]?.trim() || `${nurse} 간호사`;
    row.push(nurseName);

    dates.forEach((date) => {
      const entry = schedule.find(
        (e) => e.nurse === nurse && 
        format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      row.push(entry ? SHIFT_LABELS[entry.shift] : '');
    });

    data.push(row);
  });

  return data;
}

function createSummarySheet(
  schedule: ScheduleEntry[],
  nurseLabels: Record<NurseType, string>
): (string | number)[][] {
  const data: (string | number)[][] = [];

  // 헤더 행
  data.push(['간호사', 'DAY', 'MID-DAY', 'EVENING', 'NIGHT', 'OFF', '총 근무']);

  // 통계 계산
  const summary = new Map<NurseType, Record<ShiftType, number>>();

  NURSE_IDS.forEach((nurse) => {
    summary.set(nurse, {
      DAY: 0,
      "MID-DAY": 0,
      EVENING: 0,
      NIGHT: 0,
      OFF: 0,
    });
  });

  schedule.forEach((entry) => {
    const nurseSummary = summary.get(entry.nurse);
    if (nurseSummary) {
      nurseSummary[entry.shift] += 1;
    }
  });

  // 각 간호사의 통계 행 생성
  NURSE_IDS.forEach((nurse) => {
    const nurseSummary = summary.get(nurse)!;
    const totalWork = WORK_SHIFTS.reduce(
      (sum, shift) => sum + nurseSummary[shift],
      0
    );

    const nurseName = nurseLabels[nurse]?.trim() || `${nurse} 간호사`;
    data.push([
      nurseName,
      nurseSummary.DAY,
      nurseSummary["MID-DAY"],
      nurseSummary.EVENING,
      nurseSummary.NIGHT,
      nurseSummary.OFF,
      totalWork,
    ]);
  });

  return data;
}

