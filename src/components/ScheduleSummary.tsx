import type { ScheduleEntry, NurseType, ShiftType } from "../types";
import { NURSE_IDS } from "../constants/nurses";
const WORK_SHIFTS: ShiftType[] = ["DAY", "MID-DAY", "EVENING", "NIGHT"];
const SHIFT_COLORS: Record<ShiftType, string> = {
  DAY: "bg-blue-50 text-blue-700 border-blue-200",
  "MID-DAY": "bg-green-50 text-green-700 border-green-200",
  EVENING: "bg-amber-50 text-amber-700 border-amber-200",
  NIGHT: "bg-purple-50 text-purple-700 border-purple-200",
  OFF: "bg-gray-100 text-gray-600 border-gray-200",
};

interface ScheduleSummaryProps {
  schedule: ScheduleEntry[];
  nurseLabels: Record<NurseType, string>;
}

export default function ScheduleSummary({
  schedule,
  nurseLabels,
}: ScheduleSummaryProps) {
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

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-bold">월간 근무 통계</h3>
        <span className="text-sm text-gray-500">근무 종류별 횟수</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {NURSE_IDS.map((nurse) => {
          const nurseSummary = summary.get(nurse)!;
          const totalWork = WORK_SHIFTS.reduce(
            (sum, shift) => sum + nurseSummary[shift],
            0,
          );
          const totalOff = nurseSummary["OFF"];
          return (
            <div
              key={nurse}
              className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">간호사</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {nurseLabels[nurse]?.trim() || nurse}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">총 근무</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {totalWork}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {WORK_SHIFTS.map((shift) => (
                  <div
                    key={`${nurse}-${shift}`}
                    className={`px-3 py-1 rounded-full border text-sm font-medium ${SHIFT_COLORS[shift]}`}
                  >
                    {shift}: {nurseSummary[shift]}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>OFF</span>
                <span className="font-semibold text-gray-700">{totalOff}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
