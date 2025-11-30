import ExcelJS from 'exceljs';
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

export async function exportToExcel({ schedule, year, month, nurseLabels }: ExportData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`${year}년 ${month}월 근무표`);
  
  const dates = getDatesInMonth(year, month);

  // === 근무표 섹션 ===
  
  // 근무표 헤더
  const headerRow = worksheet.addRow(['간호사', ...dates.map(date => {
    const day = format(date, 'M/d');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${day}(${weekday})`;
  })]);

  // 헤더 스타일
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF475569' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // 각 간호사의 근무 데이터
  NURSE_IDS.forEach((nurse) => {
    const row = worksheet.addRow([
      nurseLabels[nurse]?.trim() || `${nurse} 간호사`,
      ...dates.map(date => {
        const entry = schedule.find(
          (e) => e.nurse === nurse && 
          format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        return entry ? SHIFT_LABELS[entry.shift] : '';
      })
    ]);

    // 간호사 이름 열 스타일
    const nameCell = row.getCell(1);
    nameCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    nameCell.font = { bold: true };
    nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
    nameCell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };

    // 날짜 열들에 색상 적용
    dates.forEach((date, colIndex) => {
      const cell = row.getCell(colIndex + 2);
      const entry = schedule.find(
        (e) => e.nurse === nurse && 
        format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      if (entry && entry.shift) {
        const style = getShiftStyle(entry.shift);
        cell.fill = style.fill;
        cell.font = style.font;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
  });

  // 빈 행 2개 추가
  worksheet.addRow([]);
  worksheet.addRow([]);

  // === 통계 섹션 ===
  
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
  const summaryHeaderRow = worksheet.addRow([
    ...Array(dates.length + 1).fill(''),
    '간호사',
    'DAY',
    'MID-DAY',
    'EVENING',
    'NIGHT',
    'OFF',
    '총 근무'
  ]);

  // 통계 헤더 스타일
  summaryHeaderRow.eachCell((cell, colNumber) => {
    if (colNumber > dates.length + 1) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF475569' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  });

  // 각 간호사의 통계 행
  NURSE_IDS.forEach((nurse) => {
    const nurseSummary = summary.get(nurse)!;
    const totalWork = WORK_SHIFTS.reduce(
      (sum, shift) => sum + nurseSummary[shift],
      0
    );

    const row = worksheet.addRow([
      ...Array(dates.length + 1).fill(''),
      nurseLabels[nurse]?.trim() || `${nurse} 간호사`,
      nurseSummary.DAY,
      nurseSummary["MID-DAY"],
      nurseSummary.EVENING,
      nurseSummary.NIGHT,
      nurseSummary.OFF,
      totalWork
    ]);

    // 간호사 이름 열 스타일
    const nameCell = row.getCell(dates.length + 2);
    nameCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    nameCell.font = { bold: true };
    nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
    nameCell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };

    // 통계 데이터 셀 스타일
    for (let col = dates.length + 3; col <= dates.length + 8; col++) {
      const cell = row.getCell(col);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  });

  // 열 너비 설정
  worksheet.getColumn(1).width = 15; // 간호사 이름 열
  for (let i = 2; i <= dates.length + 1; i++) {
    worksheet.getColumn(i).width = 8; // 날짜 열들
  }
  worksheet.getColumn(dates.length + 2).width = 15; // 통계 간호사 이름
  for (let i = dates.length + 3; i <= dates.length + 8; i++) {
    worksheet.getColumn(i).width = 10; // 통계 데이터 열들
  }

  // 파일명 생성
  const fileName = `근무표_${year}년_${month}월_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
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

function getShiftStyle(shift: ShiftType): { fill: any, font: any } {
  const styles: Record<ShiftType, { fill: any, font: any }> = {
    DAY: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDBEAFE' }
      },
      font: { bold: true, color: { argb: 'FF1E40AF' } }
    },
    "MID-DAY": {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }
      },
      font: { bold: true, color: { argb: 'FF166534' } }
    },
    EVENING: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' }
      },
      font: { bold: true, color: { argb: 'FF92400E' } }
    },
    NIGHT: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE9D5FF' }
      },
      font: { bold: true, color: { argb: 'FF6B21A8' } }
    },
    OFF: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
      },
      font: { bold: true, color: { argb: 'FF4B5563' } }
    }
  };

  return styles[shift];
}
