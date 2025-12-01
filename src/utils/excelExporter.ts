import { format } from 'date-fns';
import type { ScheduleEntry, NurseType, ShiftType } from '../types';
import { NURSE_IDS } from '../constants/nurses';

const SHIFT_LABELS: Record<ShiftType, string> = {
  DAY: "D",
  "MID-DAY": "M",
  EVENING: "E",
  NIGHT: "N",
  OFF: "OFF",
};

const WORK_SHIFTS: ShiftType[] = ["DAY", "MID-DAY", "EVENING", "NIGHT"];

interface ExportData {
  schedule: ScheduleEntry[];
  year: number;
  month: number;
  nurseLabels: Record<NurseType, string>;
}

// CSV 값 이스케이프 함수
function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function exportToExcel({ schedule, year, month, nurseLabels }: ExportData) {
  const dates = getDatesInMonth(year, month);
  const csvRows: string[] = [];

  // === 근무표 섹션 ===
  
  // 헤더
  const headerRow = ['간호사', ...dates.map(date => {
    const day = format(date, 'M/d');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${day}(${weekday})`;
  })];
  csvRows.push(headerRow.map(escapeCsvValue).join(','));

  // 각 간호사의 근무 데이터
  NURSE_IDS.forEach((nurse) => {
    const nurseName = nurseLabels[nurse]?.trim() || `${nurse} 간호사`;
    const row = [nurseName];

    dates.forEach((date) => {
      const entry = schedule.find(
        (e) => e.nurse === nurse && 
        format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      row.push(entry ? SHIFT_LABELS[entry.shift] : '');
    });

    csvRows.push(row.map(escapeCsvValue).join(','));
  });

  // 빈 행 2개 추가
  csvRows.push('');
  csvRows.push('');

  // === 통계 섹션 (A열부터 시작) ===
  
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

  // 통계 헤더
  csvRows.push(['간호사', 'DAY', 'MID-DAY', 'EVENING', 'NIGHT', 'OFF', '총 근무'].map(escapeCsvValue).join(','));

  // 각 간호사의 통계 행
  NURSE_IDS.forEach((nurse) => {
    const nurseSummary = summary.get(nurse)!;
    const totalWork = WORK_SHIFTS.reduce(
      (sum, shift) => sum + nurseSummary[shift],
      0
    );
    const nurseName = nurseLabels[nurse]?.trim() || `${nurse} 간호사`;
    
    csvRows.push([
      nurseName,
      nurseSummary.DAY,
      nurseSummary["MID-DAY"],
      nurseSummary.EVENING,
      nurseSummary.NIGHT,
      nurseSummary.OFF,
      totalWork
    ].map(escapeCsvValue).join(','));
  });

  // CSV 파일 생성
  const csvContent = csvRows.join('\n');
  
  // BOM 추가 (한글 깨짐 방지 및 구글 시트 호환)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // 구글 시트 확장자로 저장 (.csv)
  const fileName = `근무표_${year}년_${month}월_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
  link.download = fileName;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function getDatesInMonth(year: number, month: number): Date[] {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const dates: Date[] = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  
  return dates;
}
