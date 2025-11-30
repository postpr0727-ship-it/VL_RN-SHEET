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
  DAY: "DAY",
  "MID-DAY": "MID",
  EVENING: "EVE",
  NIGHT: "NIGHT",
  OFF: "OFF",
};
const SHIFT_COLORS: Record<ShiftType, string> = {
  DAY: "bg-blue-100 text-blue-800 border-blue-300",
  "MID-DAY": "bg-green-100 text-green-800 border-green-300",
  EVENING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  NIGHT: "bg-purple-100 text-purple-800 border-purple-300",
  OFF: "bg-gray-100 text-gray-600 border-gray-300",
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
        className={`border-b border-gray-300 hover:bg-gray-50 ${
          index % 2 === 0 ? "bg-white" : "bg-gray-50"
        }`}
      >
        <td className="border border-gray-300 p-0.5 font-bold text-center bg-gray-100 sticky left-0 z-10 min-w-[50px] max-w-[50px]">
          <div className="flex flex-col items-center gap-0 text-[9px]">
            <span className="text-[9px] font-semibold leading-tight">{label}</span>
            {isManager && (
              <span className="text-[6px] text-amber-700 font-semibold" role="img" aria-label="manager">
                👩‍⚕️
              </span>
            )}
            {isNightSpecialist && (
              <span className="text-[6px] text-indigo-700 font-semibold" role="img" aria-label="moon">
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
              className={`relative overflow-visible border border-gray-300 p-0 text-center text-[8px] font-medium w-[28px] min-w-[28px] max-w-[28px] ${
                displayShift ? SHIFT_COLORS[displayShift] : "bg-white"
              } ${highlight ? "border-l-2 border-r-2 border-red-300" : ""} ${
                isManual ? "ring-1 ring-slate-400" : ""
              }`}
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
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg">
      <div className="inline-block min-w-full">
        <table className="w-full border-collapse text-[8px] table-fixed">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-400">
              <th className="border border-gray-300 p-0.5 font-bold text-center bg-gray-200 sticky left-0 z-20 min-w-[50px] max-w-[50px]">
                <div className="text-[9px]">간호사</div>
              </th>
              {dates.map((date) => {
                const highlight = isWeekend(date) || isHolidayDate(date);
                return (
                  <th
                    key={date.toISOString()}
                    className={`border border-gray-300 p-0 text-center font-semibold w-[28px] min-w-[28px] max-w-[28px] ${
                      highlight ? "bg-red-50" : "bg-white"
                    }`}
                  >
                    <div className="text-[8px] font-bold leading-tight">
                      {format(date, 'd')}
                    </div>
                    <div
                      className={`text-[7px] leading-tight ${
                        highlight ? 'text-red-600 font-bold' : 'text-gray-600'
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

      <div className="p-2 border-t border-gray-300 bg-gray-50">
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="font-semibold">범례:</span>
          {SHIFT_OPTIONS.map((option) => (
            <div key={option} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded border ${SHIFT_COLORS[option]}`} />
              <span>{SHIFT_LABELS[option]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
