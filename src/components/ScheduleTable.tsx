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
        <td className="border border-gray-300 p-2 md:p-3 font-bold text-center bg-gray-100 sticky left-0 z-10">
          <div className="flex flex-col items-center gap-1 text-xs">
            <span className="text-base md:text-lg font-semibold">{label}</span>
            <span className="text-[10px] text-slate-500 tracking-wide">
              ID: {nurse}
            </span>
            {isManager && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] md:text-xs font-semibold flex items-center gap-1">
                <span role="img" aria-label="manager">
                  👩‍⚕️
                </span>
                매니저
              </span>
            )}
            {isNightSpecialist && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] md:text-xs font-semibold flex items-center gap-1">
                <span role="img" aria-label="moon">
                  🌙
                </span>
                NIGHT 전담
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
              className={`relative overflow-visible border border-gray-300 p-1 md:p-2 text-center text-xs md:text-sm font-medium ${
                displayShift ? SHIFT_COLORS[displayShift] : "bg-white"
              } ${highlight ? "border-l-2 border-r-2 border-red-300" : ""} ${
                isManual ? "ring-2 ring-slate-400" : ""
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
                <span className="absolute top-1 right-1 inline-block w-2 h-2 rounded-full bg-slate-500" />
              )}

              {isEditing ? (
                <div
                  className="absolute z-30 left-1/2 top-full mt-2 w-56 -translate-x-1/2 rounded-2xl border border-white/60 bg-white/85 backdrop-blur-xl p-4 shadow-2xl shadow-slate-900/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-500">
                    <span>수동 수정</span>
                    <button
                      className="text-slate-400 hover:text-slate-700 transition-colors"
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
                    className="w-full rounded-xl border border-slate-300 text-sm p-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  >
                    {SHIFT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {SHIFT_LABELS[option]}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex gap-2 text-xs">
                    <button
                      className="flex-1 rounded-xl bg-slate-900 text-white py-1.5 shadow"
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
                      className="flex-1 rounded-xl border border-slate-300 py-1.5"
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
        <table className="w-full border-collapse text-sm md:text-base">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-400">
              <th className="border border-gray-300 p-2 md:p-3 font-bold text-center bg-gray-200 sticky left-0 z-20 min-w-[80px]">
                간호사
              </th>
              {dates.map((date) => {
                const highlight = isWeekend(date) || isHolidayDate(date);
                return (
                  <th
                    key={date.toISOString()}
                    className={`border border-gray-300 p-1 md:p-2 text-center font-semibold min-w-[60px] md:min-w-[80px] ${
                      highlight ? "bg-red-50" : "bg-white"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-bold">
                      {format(date, 'M/d')}
                    </div>
                    <div
                      className={`text-[10px] md:text-xs ${
                        highlight ? 'text-red-600 font-bold' : 'text-gray-600'
                      }`}
                    >
                      {weekdayNames[date.getDay()]}
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

      <div className="p-4 border-t border-gray-300 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
          <span className="font-semibold">범례:</span>
          {SHIFT_OPTIONS.map((option) => (
            <div key={option} className="flex items-center gap-1">
              <div className={`w-4 h-4 rounded border ${SHIFT_COLORS[option]}`} />
              <span>{SHIFT_LABELS[option]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
