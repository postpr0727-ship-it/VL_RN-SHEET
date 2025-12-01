import type { ScheduleEntry, NurseType, ShiftType } from "../types";
import { NURSE_IDS } from "../constants/nurses";
const WORK_SHIFTS: ShiftType[] = ["DAY", "MID-DAY", "EVENING", "NIGHT"];

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
    <div className="w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-stone-900/5 border border-amber-100/50 p-6 md:p-8">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-900/60 mb-3 font-light">
        Monthly Statistics
      </p>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-light text-stone-900">월간 근무 통계</h3>
        <span className="text-sm text-stone-500/80 font-light">근무 종류별 횟수</span>
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
              className="border border-amber-100/50 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500/80 font-light uppercase tracking-wider">간호사</p>
                  <p className="text-xl font-light text-stone-900 mt-1">
                    {nurseLabels[nurse]?.trim() || nurse}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-500/80 font-light">총 근무</p>
                  <p className="text-lg font-light text-stone-900 mt-1">
                    {totalWork}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {WORK_SHIFTS.map((shift) => (
                  <div
                    key={`${nurse}-${shift}`}
                    className={`px-4 py-1.5 rounded-full border-2 border-amber-100/50 text-sm font-light bg-amber-50/30 text-stone-700`}
                  >
                    {shift}: {nurseSummary[shift]}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-stone-500/80 pt-2 border-t border-amber-100/50">
                <span className="font-light">OFF</span>
                <span className="font-light text-stone-700">{totalOff}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
