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

// 색상 정의 (HTML RGB 형식)
const SHIFT_COLORS: Record<ShiftType, { bg: string, text: string }> = {
  DAY: { 
    bg: "#DBEAFE", // 밝은 파란색 배경
    text: "#1E40AF"  // 진한 파란색 텍스트
  },
  "MID-DAY": { 
    bg: "#D1FAE5", // 밝은 초록색 배경
    text: "#166534"  // 진한 초록색 텍스트
  },
  EVENING: { 
    bg: "#FEF3C7", // 밝은 노란색 배경
    text: "#92400E"  // 진한 노란색 텍스트
  },
  NIGHT: { 
    bg: "#E9D5FF", // 밝은 보라색 배경
    text: "#6B21A8"  // 진한 보라색 텍스트
  },
  OFF: { 
    bg: "#F3F4F6", // 밝은 회색 배경
    text: "#4B5563"  // 진한 회색 텍스트
  },
};

interface ExportData {
  schedule: ScheduleEntry[];
  year: number;
  month: number;
  nurseLabels: Record<NurseType, string>;
}

export function exportToExcel({ schedule, year, month, nurseLabels }: ExportData) {
  const dates = getDatesInMonth(year, month);

  // HTML 테이블 생성
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${year}년 ${month}월 근무표</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
      font-size: 12px;
    }
    th {
      background-color: #475569;
      color: white;
      font-weight: bold;
    }
    .nurse-name {
      background-color: #F1F5F9;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>${year}년 ${month}월 근무표</h1>
  <table>
`;

  // === 근무표 섹션 ===
  
  // 헤더
  html += '    <thead><tr><th>간호사</th>';
  dates.forEach((date) => {
    const day = format(date, 'M/d');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    html += `<th>${day}(${weekday})</th>`;
  });
  html += '</tr></thead>\n';
  
  // 각 간호사의 근무 데이터
  html += '    <tbody>\n';
  NURSE_IDS.forEach((nurse) => {
    const nurseName = nurseLabels[nurse]?.trim() || `${nurse} 간호사`;
    html += `      <tr><td class="nurse-name">${nurseName}</td>`;
    
    dates.forEach((date) => {
      const entry = schedule.find(
        (e) => e.nurse === nurse && 
        format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      if (entry && entry.shift) {
        const colors = SHIFT_COLORS[entry.shift];
        const label = SHIFT_LABELS[entry.shift];
        html += `<td style="background-color: ${colors.bg}; color: ${colors.text}; font-weight: bold;">${label}</td>`;
      } else {
        html += '<td></td>';
      }
    });
    
    html += '</tr>\n';
  });
  html += '    </tbody>\n';
  html += '  </table>\n\n';

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

  // 통계 테이블
  html += '  <h2>월간 근무 통계</h2>\n';
  html += '  <table>\n';
  html += '    <thead><tr><th>간호사</th><th>DAY</th><th>MID-DAY</th><th>EVENING</th><th>NIGHT</th><th>OFF</th><th>총 근무</th></tr></thead>\n';
  html += '    <tbody>\n';
  
  NURSE_IDS.forEach((nurse) => {
    const nurseSummary = summary.get(nurse)!;
    const totalWork = WORK_SHIFTS.reduce(
      (sum, shift) => sum + nurseSummary[shift],
      0
    );
    const nurseName = nurseLabels[nurse]?.trim() || `${nurse} 간호사`;
    
    html += `      <tr>
        <td class="nurse-name">${nurseName}</td>
        <td>${nurseSummary.DAY}</td>
        <td>${nurseSummary["MID-DAY"]}</td>
        <td>${nurseSummary.EVENING}</td>
        <td>${nurseSummary.NIGHT}</td>
        <td>${nurseSummary.OFF}</td>
        <td><strong>${totalWork}</strong></td>
      </tr>\n`;
  });
  
  html += '    </tbody>\n';
  html += '  </table>\n';
  html += '</body>\n</html>';

  // 파일 다운로드
  const fileName = `근무표_${year}년_${month}월_${format(new Date(), 'yyyyMMdd_HHmmss')}.html`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
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
