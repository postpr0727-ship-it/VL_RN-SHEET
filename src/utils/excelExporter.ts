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
  const allData: any[][] = [];
  
  // === 근무표 섹션 ===
  
  // 근무표 헤더
  const headerRow: any[] = ['간호사'];
  dates.forEach((date) => {
    const day = format(date, 'M/d');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    headerRow.push(`${day}(${weekday})`);
  });
  allData.push(headerRow);

  // 각 간호사의 근무 데이터
  NURSE_IDS.forEach((nurse) => {
    const row: any[] = [];
    const nurseName = nurseLabels[nurse]?.trim() || `${nurse} 간호사`;
    row.push(nurseName);

    dates.forEach((date) => {
      const entry = schedule.find(
        (e) => e.nurse === nurse && 
        format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      row.push(entry ? SHIFT_LABELS[entry.shift] : '');
    });

    allData.push(row);
  });

  // 빈 행 2개 추가
  allData.push([]);
  allData.push([]);

  // === 통계 섹션 ===
  
  // 통계 헤더
  const summaryHeaderRow: any[] = [];
  // 날짜 열 개수만큼 빈 셀
  for (let i = 0; i <= dates.length; i++) {
    summaryHeaderRow.push('');
  }
  summaryHeaderRow.push('간호사', 'DAY', 'MID-DAY', 'EVENING', 'NIGHT', 'OFF', '총 근무');
  allData.push(summaryHeaderRow);

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
    const row: any[] = [];
    
    // 날짜 열 개수 + 1(간호사 이름 열)만큼 빈 셀
    for (let i = 0; i <= dates.length; i++) {
      row.push('');
    }
    row.push(nurseName);
    row.push(nurseSummary.DAY);
    row.push(nurseSummary["MID-DAY"]);
    row.push(nurseSummary.EVENING);
    row.push(nurseSummary.NIGHT);
    row.push(nurseSummary.OFF);
    row.push(totalWork);
    
    allData.push(row);
  });

  // 워크시트 생성
  const worksheet = XLSX.utils.aoa_to_sheet(allData);
  
  // 스타일 적용
  applyAllStyles(worksheet, schedule, dates, nurseLabels, allData.length);

  // 열 너비 설정
  worksheet['!cols'] = [
    { wch: 15 }, // 간호사 이름 열
    ...Array(dates.length).fill({ wch: 8 }), // 날짜 열들
    { wch: 15 }, // 간호사 이름 (통계)
    { wch: 10 }, // DAY
    { wch: 10 }, // MID-DAY
    { wch: 10 }, // EVENING
    { wch: 10 }, // NIGHT
    { wch: 10 }, // OFF
    { wch: 10 }  // 총 근무
  ];

  // 단 하나의 시트만 추가
  XLSX.utils.book_append_sheet(workbook, worksheet, `${year}년 ${month}월`);

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

function applyAllStyles(
  worksheet: XLSX.WorkSheet,
  schedule: ScheduleEntry[],
  dates: Date[],
  nurseLabels: Record<NurseType, string>,
  totalRows: number
) {
  if (!worksheet['!ref']) return;

  const scheduleEndRow = NURSE_IDS.length; // 헤더 제외한 간호사 수
  const summaryStartRow = scheduleEndRow + 3; // 빈 행 2개 포함

  // 기본 헤더 스타일
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

  // 기본 테두리
  const defaultBorder = {
    border: {
      top: { style: "thin" as const },
      bottom: { style: "thin" as const },
      left: { style: "thin" as const },
      right: { style: "thin" as const }
    }
  };

  // === 근무표 헤더 스타일 ===
  for (let col = 0; col <= dates.length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellRef]) {
      worksheet[cellRef] = { v: '', t: 's' };
    }
    worksheet[cellRef].s = headerStyle;
  }

  // === 근무표 데이터 셀 ===
  for (let row = 1; row <= scheduleEndRow; row++) {
    const nurse = NURSE_IDS[row - 1];
    
    // 간호사 이름 열
    const nameCellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
    if (worksheet[nameCellRef]) {
      worksheet[nameCellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F1F5F9" } },
        alignment: { horizontal: "center", vertical: "center" as const },
        ...defaultBorder
      };
    }

    // 날짜 열들 - 색상 적용
    for (let col = 1; col <= dates.length; col++) {
      const date = dates[col - 1];
      const entry = schedule.find(
        (e) => e.nurse === nurse && 
        format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { v: '', t: 's' };
      }

      if (entry && entry.shift) {
        const style = getShiftStyle(entry.shift);
        worksheet[cellRef].s = style;
      } else {
        worksheet[cellRef].s = {
          alignment: { horizontal: "center", vertical: "center" as const },
          ...defaultBorder
        };
      }
    }
  }

  // === 통계 헤더 스타일 ===
  const summaryStartCol = dates.length + 1;
  for (let col = summaryStartCol; col < summaryStartCol + 7; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: summaryStartRow, c: col });
    if (!worksheet[cellRef]) {
      worksheet[cellRef] = { v: '', t: 's' };
    }
    worksheet[cellRef].s = headerStyle;
  }

  // === 통계 데이터 ===
  for (let row = summaryStartRow + 1; row < summaryStartRow + 1 + NURSE_IDS.length; row++) {
    // 간호사 이름 열
    const nameCellRef = XLSX.utils.encode_cell({ r: row, c: summaryStartCol });
    if (worksheet[nameCellRef]) {
      worksheet[nameCellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F1F5F9" } },
        alignment: { horizontal: "center", vertical: "center" as const },
        ...defaultBorder
      };
    }

    // 통계 데이터 셀들
    for (let col = summaryStartCol + 1; col < summaryStartCol + 7; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          alignment: { horizontal: "center", vertical: "center" as const },
          ...defaultBorder
        };
      }
    }
  }
}

function getShiftStyle(shift: ShiftType): any {
  const styles: Record<ShiftType, any> = {
    DAY: {
      font: { bold: true, color: { rgb: "1E40AF" } },
      fill: { fgColor: { rgb: "DBEAFE" } },
      alignment: { horizontal: "center", vertical: "center" as const },
      border: {
        top: { style: "thin" as const },
        bottom: { style: "thin" as const },
        left: { style: "thin" as const },
        right: { style: "thin" as const }
      }
    },
    "MID-DAY": {
      font: { bold: true, color: { rgb: "166534" } },
      fill: { fgColor: { rgb: "D1FAE5" } },
      alignment: { horizontal: "center", vertical: "center" as const },
      border: {
        top: { style: "thin" as const },
        bottom: { style: "thin" as const },
        left: { style: "thin" as const },
        right: { style: "thin" as const }
      }
    },
    EVENING: {
      font: { bold: true, color: { rgb: "92400E" } },
      fill: { fgColor: { rgb: "FEF3C7" } },
      alignment: { horizontal: "center", vertical: "center" as const },
      border: {
        top: { style: "thin" as const },
        bottom: { style: "thin" as const },
        left: { style: "thin" as const },
        right: { style: "thin" as const }
      }
    },
    NIGHT: {
      font: { bold: true, color: { rgb: "6B21A8" } },
      fill: { fgColor: { rgb: "E9D5FF" } },
      alignment: { horizontal: "center", vertical: "center" as const },
      border: {
        top: { style: "thin" as const },
        bottom: { style: "thin" as const },
        left: { style: "thin" as const },
        right: { style: "thin" as const }
      }
    },
    OFF: {
      font: { bold: true, color: { rgb: "4B5563" } },
      fill: { fgColor: { rgb: "F3F4F6" } },
      alignment: { horizontal: "center", vertical: "center" as const },
      border: {
        top: { style: "thin" as const },
        bottom: { style: "thin" as const },
        left: { style: "thin" as const },
        right: { style: "thin" as const }
      }
    }
  };

  return styles[shift] || {
    alignment: { horizontal: "center", vertical: "center" as const },
    border: {
      top: { style: "thin" as const },
      bottom: { style: "thin" as const },
      left: { style: "thin" as const },
      right: { style: "thin" as const }
    }
  };
}
