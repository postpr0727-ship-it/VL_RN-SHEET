import { useState } from "react";
import { format, isSameDay, isWeekend } from "date-fns";
import type { NurseType, ScheduleEntry, ShiftType } from "../types";
import { NURSE_IDS } from "../constants/nurses";

interface ScheduleTableProps {
  schedule: ScheduleEntry[];
  year: number;
  month: number;
  manualEdits: Record<string, ShiftType>;
  nurseLabels: Record<NurseType, string>;
  onUpdateEntry: (nurse: NurseType, date: Date, shift: ShiftType) => void;
}

const SHIFT_OPTIONS: ShiftType[] = ["DAY", "MID-DAY", "EVENING", "NIGHT", "OFF"];
const SHIFT_LABELS: Record<ShiftType, string> = {
  DAY: "D",
  "MID-DAY": "M",
  EVENING: "E",
  NIGHT: "N",
  OFF: "OFF",
};
const SHIFT_COLORS: Record<ShiftType, string> = {
  DAY: "bg-white text-gray-800 border-gray-300",
  "MID-DAY": "bg-white text-gray-800 border-gray-300",
  EVENING: "bg-white text-gray-800 border-gray-300",
  NIGHT: "bg-white text-gray-800 border-gray-300",
  OFF: "bg-white text-gray-800 border-gray-300",
};

const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];

function isHolidayDate(date: Date) {
  const holidays = [
    new Date(date.getFullYear(), 0, 1),
    new Date(date.getFullYear(), 2, 1),
    new Date(date.getFullYear(), 4, 5),
    new Date(date.getFullYear(), 4, 15),
    new Date(date.getFullYear(), 5, 6),
    new Date(date.getFullYear(), 7, 15),
    new Date(date.getFullYear(), 9, 3),
    new Date(date.getFullYear(), 9, 9),
    new Date(date.getFullYear(), 11, 25),
  ]

  return holidays.some(
    h => h.getMonth() === date.getMonth() && h.getDate() === date.getDate()
  )
}

export default function ScheduleTable({
  schedule,
  year,
  month,
  manualEdits,
  nurseLabels,
  onUpdateEntry,
}: ScheduleTableProps) {
  const [editingCell, setEditingCell] = useState<{
    nurse: NurseType;
    dateKey: string;
    value: ShiftType;
  } | null>(null);

  const getNurseSchedule = (nurse: NurseType, date: Date) => {
    const entry = schedule.find(
      (e) => e.nurse === nurse && isSameDay(e.date, date),
    );
    return entry?.shift ?? null;
  };

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const dates: Date[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  const renderRow = (nurse: NurseType, index: number) => {
    const isNightSpecialist = nurse === "G" || nurse === "H";
    const isManager = nurse === "E" || nurse === "F";
    const label = nurseLabels[nurse]?.trim() || nurse;

    return (
      <tr
        key={nurse}
        className={`border-b border-gray-300`}
        style={{ backgroundColor: 'white' }}
      >
        <td className="border border-stone-200/50 py-4 px-2 font-light text-center bg-stone-50/50 sticky left-0 z-10 w-[80px] min-w-[80px] max-w-[80px]">
          <div className="flex flex-col items-center gap-1 text-[8px]">
            <span className="text-[9px] font-light leading-tight whitespace-normal break-words text-stone-700">{label}</span>
            {isManager && (
              <span className="text-[7px] text-amber-700 font-light" role="img" aria-label="manager">
                👩‍⚕️
              </span>
            )}
            {isNightSpecialist && (
              <span className="text-[7px] text-stone-600 font-light" role="img" aria-label="moon">
                🌙
              </span>
            )}
          </div>
        </td>
        {dates.map((date) => {
          const shift = getNurseSchedule(nurse, date);
          const highlight = isWeekend(date) || isHolidayDate(date);
          const dateKey = format(date, "yyyy-MM-dd");
          const cellKey = `${nurse}-${dateKey}`;
          const displayShift = manualEdits[cellKey] ?? shift;
          const isManual = Boolean(manualEdits[cellKey]);
          const isEditing =
            editingCell?.nurse === nurse && editingCell?.dateKey === dateKey;

          return (
            <td
              key={`${nurse}-${date.toISOString()}`}
              className={`relative overflow-visible border border-stone-200/50 py-4 px-1 text-center text-[10px] font-light ${
                highlight ? "border-l-2 border-r-2 border-amber-300/50" : ""
              } ${
                isManual ? "ring-1 ring-amber-400/50" : ""
              }`}
              style={{
                width: `calc((100% - 80px) / ${dates.length})`,
                minWidth: '28px',
                backgroundColor: '#ffffff',
                color: '#1f2937'
              }}
              onClick={() =>
                setEditingCell({
                  nurse,
                  dateKey,
                  value: displayShift ?? "OFF",
                })
              }
            >
              {isManual && !isEditing && (
                <span className="absolute top-0.5 right-0.5 inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
              )}

              {isEditing ? (
                <div
                  className="absolute z-30 left-1/2 top-full mt-1 w-48 -translate-x-1/2 rounded-lg border border-white/60 bg-white/90 backdrop-blur-xl p-2 shadow-xl shadow-slate-900/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px] font-semibold text-slate-500">
                    <span>수동 수정</span>
                    <button
                      className="text-slate-400 hover:text-slate-700 transition-colors text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCell(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <select
                    value={editingCell.value}
                    onChange={(e) =>
                      setEditingCell((prev) =>
                        prev ? { ...prev, value: e.target.value as ShiftType } : prev,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 text-[10px] p-1 bg-white/70 focus:outline-none focus:ring-1 focus:ring-slate-900/20"
                  >
                    {SHIFT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {SHIFT_LABELS[option]}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5 flex gap-1.5 text-[10px]">
                    <button
                      className="flex-1 rounded-lg bg-slate-900 text-white py-1 shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingCell) {
                          onUpdateEntry(
                            editingCell.nurse,
                            new Date(editingCell.dateKey),
                            editingCell.value,
                          );
                        }
                        setEditingCell(null);
                      }}
                    >
                      저장
                    </button>
                    <button
                      className="flex-1 rounded-lg border border-slate-300 py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCell(null);
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                displayShift ? SHIFT_LABELS[displayShift] : ""
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="w-full overflow-x-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-stone-900/5 border border-amber-100/50">
      <style>{`
        table.schedule-table tbody td {
          background-color: #ffffff !important;
          color: #1f2937 !important;
        }
      `}</style>
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-900/60 mb-4 font-light">
          Monthly Schedule
        </p>
      </div>
      <div className="inline-block min-w-full px-6 pb-6">
        <table className="schedule-table w-full border-collapse text-[8px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-stone-50/80 border-b-2 border-amber-100">
              <th className="border border-stone-200/50 py-4 px-2 font-light text-center bg-stone-100/50 sticky left-0 z-20 w-[80px] min-w-[80px] max-w-[80px]">
                <div className="text-[9px] text-stone-700 font-light">간호사</div>
              </th>
              {dates.map((date) => {
                const highlight = isWeekend(date) || isHolidayDate(date);
                return (
                  <th
                    key={date.toISOString()}
                    className={`border border-stone-200/50 py-4 px-1 text-center font-light ${
                      highlight ? "bg-amber-50/80" : "bg-white"
                    }`}
                    style={{
                      width: `calc((100% - 80px) / ${dates.length})`,
                      minWidth: '28px'
                    }}
                  >
                    <div className="text-[10px] font-light text-stone-900 leading-tight mb-0.5">
                      {format(date, 'd')}
                    </div>
                    <div
                      className={`text-[8px] leading-tight font-light ${
                        highlight ? 'text-amber-700' : 'text-stone-500'
                      }`}
                    >
                      {weekdayNames[date.getDay()].charAt(0)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {NURSE_IDS.map((nurse, index) => renderRow(nurse, index))}
          </tbody>
        </table>
      </div>

      <div className="p-5 border-t border-amber-100/50 bg-stone-50/30 rounded-b-3xl">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="font-light text-stone-600 uppercase tracking-wider">범례:</span>
          {SHIFT_OPTIONS.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 border-stone-200 ${SHIFT_COLORS[option]}`} />
              <span className="text-stone-700 font-light">{SHIFT_LABELS[option]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
