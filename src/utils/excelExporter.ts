import * as XLSX from 'xlsx-js-style';
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

// 색상 정의
const SHIFT_COLORS: Record<ShiftType, { fgColor: { rgb: string }, bgColor: { rgb: string } }> = {
  DAY: { 
    fgColor: { rgb: "1E40AF" }, // 진한 파란색 텍스트
    bgColor: { rgb: "DBEAFE" }  // 밝은 파란색 배경
  },
  "MID-DAY": { 
    fgColor: { rgb: "166534" }, // 진한 초록색 텍스트
    bgColor: { rgb: "D1FAE5" }  // 밝은 초록색 배경
  },
  EVENING: { 
    fgColor: { rgb: "92400E" }, // 진한 노란색 텍스트
    bgColor: { rgb: "FEF3C7" }  // 밝은 노란색 배경
  },
  NIGHT: { 
    fgColor: { rgb: "6B21A8" }, // 진한 보라색 텍스트
    bgColor: { rgb: "E9D5FF" }  // 밝은 보라색 배경
  },
  OFF: { 
    fgColor: { rgb: "4B5563" }, // 진한 회색 텍스트
    bgColor: { rgb: "F3F4F6" }  // 밝은 회색 배경
  },
};

interface ExportData {
  schedule: ScheduleEntry[];
  year: number;
  month: number;
  nurseLabels: Record<NurseType, string>;
}

export function exportToExcel({ schedule, year, month, nurseLabels }: ExportData) {
  const workbook = XLSX.utils.book_new();

  // 하나의 시트에 근무표와 통계 모두 포함
  const { sheetData, range } = createCombinedSheet(schedule, year, month, nurseLabels);
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
  // 스타일 적용
  applyStyles(worksheet, schedule, year, month, nurseLabels, range);

  // 열 너비 설정
  const dates = getDatesInMonth(year, month);
  worksheet['!cols'] = [
    { wch: 15 }, // 간호사 이름 열
    ...Array(dates.length).fill({ wch: 8 }), // 날짜 열들
    { wch: 2 }, // 구분선
    { wch: 15 }, // 간호사 이름 (통계)
    { wch: 10 }, // DAY
    { wch: 10 }, // MID-DAY
    { wch: 10 }, // EVENING
    { wch: 10 }, // NIGHT
    { wch: 10 }, // OFF
    { wch: 10 }  // 총 근무
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `${year}년 ${month}월 근무표`);

  // 파일명 생성
  const fileName = `근무표_${year}년_${month}월_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  // 파일 다운로드
  XLSX.writeFile(workbook, fileName);
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

function createCombinedSheet(
  schedule: ScheduleEntry[],
  year: number,
  month: number,
  nurseLabels: Record<NurseType, string>
): { sheetData: (string | number)[][], range: { scheduleEndRow: number, scheduleEndCol: number } } {
  const data: (string | number)[][] = [];
  const dates = getDatesInMonth(year, month);

  // === 근무표 섹션 ===
  
  // 근무표 헤더
  const scheduleHeader = ['간호사'];
  dates.forEach((date) => {
    const day = format(date, 'M/d');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    scheduleHeader.push(`${day}(${weekday})`);
  });
  data.push(scheduleHeader);

  // 각 간호사의 근무 데이터
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

  const scheduleEndRow = data.length - 1;
  const scheduleEndCol = scheduleHeader.length - 1;

  // 빈 행 추가
  data.push([]);

  // === 통계 섹션 ===
  
  // 통계 헤더
  data.push(['', '', ...Array(dates.length - 2).fill(''), '│', '간호사', 'DAY', 'MID-DAY', 'EVENING', 'NIGHT', 'OFF', '총 근무']);

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

  // 각 간호사의 통계 행
  NURSE_IDS.forEach((nurse) => {
    const nurseSummary = summary.get(nurse)!;
    const totalWork = WORK_SHIFTS.reduce(
      (sum, shift) => sum + nurseSummary[shift],
      0
    );

    const nurseName = nurseLabels[nurse]?.trim() || `${nurse} 간호사`;
    const row: (string | number)[] = [];
    
    // 날짜 열 개수만큼 빈 셀 추가
    row.push(...Array(dates.length).fill(''));
    row.push('│'); // 구분선
    row.push(nurseName);
    row.push(nurseSummary.DAY);
    row.push(nurseSummary["MID-DAY"]);
    row.push(nurseSummary.EVENING);
    row.push(nurseSummary.NIGHT);
    row.push(nurseSummary.OFF);
    row.push(totalWork);
    
    data.push(row);
  });

  return { 
    sheetData: data, 
    range: { 
      scheduleEndRow, 
      scheduleEndCol 
    } 
  };
}

function applyStyles(
  worksheet: XLSX.WorkSheet,
  schedule: ScheduleEntry[],
  year: number,
  month: number,
  nurseLabels: Record<NurseType, string>,
  range: { scheduleEndRow: number, scheduleEndCol: number }
) {
  const dates = getDatesInMonth(year, month);
  
  // 헤더 스타일 (첫 번째 행)
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "475569" } },
    alignment: { horizontal: "center", vertical: "center" as const },
    border: {
      top: { style: "thin" as const },
      bottom: { style: "thin" as const },
      left: { style: "thin" as const },
      right: { style: "thin" as const }
    }
  };

  // 근무표 헤더 스타일 적용
  for (let col = 0; col <= range.scheduleEndCol; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = headerStyle;
  }

  // 통계 헤더 스타일 적용 (근무표 헤더 행 + 2)
  const summaryHeaderRow = range.scheduleEndRow + 2;
  const summaryStartCol = range.scheduleEndCol + 2; // 구분선 다음 열
  for (let col = summaryStartCol; col <= summaryStartCol + 6; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: summaryHeaderRow, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = headerStyle;
  }

  // 간호사 이름 열 스타일 (고정 회색 배경)
  const nameColumnStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "F1F5F9" } },
    alignment: { horizontal: "center", vertical: "center" as const },
    border: {
      top: { style: "thin" as const },
      bottom: { style: "thin" as const },
      left: { style: "thin" as const },
      right: { style: "thin" as const }
    }
  };

  // 근무표의 간호사 이름 열 스타일
  for (let row = 1; row <= range.scheduleEndRow; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = nameColumnStyle;
  }

  // 통계의 간호사 이름 열 스타일
  for (let row = summaryHeaderRow + 1; row < summaryHeaderRow + 1 + NURSE_IDS.length; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: summaryStartCol });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = nameColumnStyle;
  }

  // 근무표 데이터 셀에 색상 적용
  for (let row = 1; row <= range.scheduleEndRow; row++) {
    for (let col = 1; col <= range.scheduleEndCol; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (!cell || !cell.v) continue;

      const shiftValue = String(cell.v).trim();
      const shiftType = Object.keys(SHIFT_LABELS).find(
        key => SHIFT_LABELS[key as ShiftType] === shiftValue
      ) as ShiftType | undefined;

      if (shiftType && SHIFT_COLORS[shiftType]) {
        cell.s = {
          font: { bold: true, color: SHIFT_COLORS[shiftType].fgColor },
          fill: { fgColor: SHIFT_COLORS[shiftType].bgColor },
          alignment: { horizontal: "center", vertical: "center" as const },
          border: {
            top: { style: "thin" as const },
            bottom: { style: "thin" as const },
            left: { style: "thin" as const },
            right: { style: "thin" as const }
          }
        };
      }
    }
  }

  // 통계 데이터 셀 스타일
  const summaryDataStyle = {
    alignment: { horizontal: "center", vertical: "center" as const },
    border: {
      top: { style: "thin" as const },
      bottom: { style: "thin" as const },
      left: { style: "thin" as const },
      right: { style: "thin" as const }
    }
  };

  for (let row = summaryHeaderRow + 1; row < summaryHeaderRow + 1 + NURSE_IDS.length; row++) {
    for (let col = summaryStartCol + 1; col <= summaryStartCol + 6; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = summaryDataStyle;
    }
  }

  // 모든 셀에 기본 테두리 추가
  const rangeObj = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let row = 0; row <= rangeObj.e.r; row++) {
    for (let col = 0; col <= rangeObj.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) continue;
      if (!worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {
          border: {
            top: { style: "thin" as const },
            bottom: { style: "thin" as const },
            left: { style: "thin" as const },
            right: { style: "thin" as const }
          }
        };
      }
    }
  }
}
