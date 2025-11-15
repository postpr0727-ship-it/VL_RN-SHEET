import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
} from "date-fns";
import type { ScheduleEntry, ShiftType } from "../types";

interface CalendarProps {
  year: number;
  month: number;
  schedule: ScheduleEntry[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const SHIFT_COLORS: Record<ShiftType, string> = {
  DAY: "bg-blue-100 text-blue-800 border-blue-300",
  "MID-DAY": "bg-green-100 text-green-800 border-green-300",
  EVENING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  NIGHT: "bg-purple-100 text-purple-800 border-purple-300",
  OFF: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function Calendar({
  year,
  month,
  schedule,
  onDateClick,
  selectedDate,
}: CalendarProps) {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // 첫 주의 시작일 계산 (일요일부터 시작)
  const firstDay = getDay(startDate);
  const emptyDays = Array(firstDay).fill(null);

  const getScheduleForDate = (date: Date) => {
    return schedule.filter((entry) => isSameDay(entry.date, date));
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4 md:p-6">
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-center font-bold text-sm md:text-base text-gray-700 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square"></div>
        ))}

        {days.map((day) => {
          const daySchedule = getScheduleForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={`
                aspect-square border rounded-lg p-1 md:p-2 cursor-pointer
                transition-all hover:shadow-md
                ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                ${isToday ? "bg-blue-50" : "bg-white"}
              `}
            >
              <div className="text-xs md:text-sm font-semibold mb-1">
                {format(day, "d")}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {daySchedule.slice(0, 3).map((entry, idx) => (
                  <div
                    key={idx}
                    className={`text-[8px] md:text-xs px-1 py-0.5 rounded border ${SHIFT_COLORS[entry.shift]}`}
                  >
                    {entry.nurse}: {entry.shift}
                  </div>
                ))}
                {daySchedule.length > 3 && (
                  <div className="text-[8px] md:text-xs text-gray-500">
                    +{daySchedule.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
