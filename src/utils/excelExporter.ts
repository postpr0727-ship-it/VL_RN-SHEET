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

// 색상 정의 (RGB 형식)
const SHIFT_COLORS: Record<ShiftType, { font: string, fill: string }> = {
  DAY: { 
    font: "1E40AF", // 진한 파란색 텍스트
    fill: "DBEAFE"  // 밝은 파란색 배경
  },
  "MID-DAY": { 
    font: "166534", // 진한 초록색 텍스트
    fill: "D1FAE5"  // 밝은 초록색 배경
  },
  EVENING: { 
    font: "92400E", // 진한 노란색 텍스트
    fill: "FEF3C7"  // 밝은 노란색 배경
  },
  NIGHT: { 
    font: "6B21A8", // 진한 보라색 텍스트
    fill: "E9D5FF"  // 밝은 보라색 배경
  },
  OFF: { 
    font: "4B5563", // 진한 회색 텍스트
    fill: "F3F4F6"  // 밝은 회색 배경
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
  const dates = getDatesInMonth(year, month);

  // 하나의 시트에 근무표와 통계 모두 포함
  const sheetData = createCombinedSheet(schedule, year, month, nurseLabels, dates);
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
  // 스타일 적용
  applyStyles(worksheet, schedule, dates, nurseLabels);

  // 열 너비 설정
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
  nurseLabels: Record<NurseType, string>,
  dates: Date[]
): (string | number)[][] {
  const data: (string | number)[][] = [];

  // === 근무표 섹션 ===
  
  // 근무표 헤더
  const scheduleHeader: (string | number)[] = ['간호사'];
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

  // 빈 행 추가
  data.push([]);

  // === 통계 섹션 ===
  
  // 통계 헤더
  const summaryHeader: (string | number)[] = [];
  for (let i = 0; i < dates.length; i++) {
    summaryHeader.push('');
  }
  summaryHeader.push('│', '간호사', 'DAY', 'MID-DAY', 'EVENING', 'NIGHT', 'OFF', '총 근무');
  data.push(summaryHeader);

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
    for (let i = 0; i < dates.length; i++) {
      row.push('');
    }
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

  return data;
}

function applyStyles(
  worksheet: XLSX.WorkSheet,
  schedule: ScheduleEntry[],
  dates: Date[],
  nurseLabels: Record<NurseType, string>
) {
  if (!worksheet['!ref']) return;
  
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const scheduleEndRow = NURSE_IDS.length; // 헤더(0) + 간호사 수
  const scheduleEndCol = dates.length; // 간호사 이름 열(0) + 날짜 열들
  const summaryStartRow = scheduleEndRow + 2; // 빈 행 포함
  const summaryStartCol = dates.length + 1; // 구분선 다음 열

  // 헤더 스타일
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

  // 근무표 헤더 스타일 (첫 번째 행)
  for (let col = 0; col <= scheduleEndCol; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) {
      worksheet[cellAddress] = { v: '', t: 's' };
    }
    worksheet[cellAddress].s = headerStyle;
  }

  // 통계 헤더 스타일
  for (let col = summaryStartCol; col < summaryStartCol + 7; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: summaryStartRow, c: col });
    if (!worksheet[cellAddress]) {
      worksheet[cellAddress] = { v: '', t: 's' };
    }
    worksheet[cellAddress].s = headerStyle;
  }

  // 간호사 이름 열 스타일
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

  // 근무표의 간호사 이름 열
  for (let row = 1; row <= scheduleEndRow; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = nameColumnStyle;
  }

  // 통계의 간호사 이름 열
  for (let row = summaryStartRow + 1; row < summaryStartRow + 1 + NURSE_IDS.length; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: summaryStartCol });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = nameColumnStyle;
  }

  // 근무표 데이터 셀에 색상 적용
  for (let row = 1; row <= scheduleEndRow; row++) {
    const nurse = NURSE_IDS[row - 1];
    for (let col = 1; col <= scheduleEndCol; col++) {
      const date = dates[col - 1];
      const entry = schedule.find(
        (e) => e.nurse === nurse && 
        format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { v: '', t: 's' };
      }

      if (entry && SHIFT_COLORS[entry.shift]) {
        const colors = SHIFT_COLORS[entry.shift];
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: colors.font } },
          fill: { fgColor: { rgb: colors.fill } },
          alignment: { horizontal: "center", vertical: "center" as const },
          border: {
            top: { style: "thin" as const },
            bottom: { style: "thin" as const },
            left: { style: "thin" as const },
            right: { style: "thin" as const }
          }
        };
      } else {
        worksheet[cellAddress].s = {
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

  for (let row = summaryStartRow + 1; row < summaryStartRow + 1 + NURSE_IDS.length; row++) {
    for (let col = summaryStartCol + 1; col < summaryStartCol + 7; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = summaryDataStyle;
    }
  }

  // 나머지 빈 셀들에 기본 테두리 적용
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { v: '', t: 's' };
      }
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
