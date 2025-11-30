import { useState } from "react";
import { format } from "date-fns";
import type { NurseType, VacationDay } from "../types";
import { NURSE_IDS } from "../constants/nurses";

interface VacationInputProps {
  vacations: VacationDay[];
  onAddVacation: (vacation: VacationDay) => void;
  onRemoveVacation: (nurse: NurseType, date: Date) => void;
  nurseLabels: Record<NurseType, string>;
}

export default function VacationInput({
  vacations,
  onAddVacation,
  onRemoveVacation,
  nurseLabels,
}: VacationInputProps) {
  const [selectedNurse, setSelectedNurse] = useState<NurseType>("A");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const handleAdd = () => {
    if (!selectedDate) return;
    const date = new Date(selectedDate);
    onAddVacation({ nurse: selectedNurse, date });
    setSelectedDate("");
  };

  const handleRemove = (nurse: NurseType, date: Date) => {
    onRemoveVacation(nurse, date);
  };

  const getDisplayName = (nurse: NurseType) => {
    const label = nurseLabels[nurse]?.trim();
    return label && label.length > 0 ? label : `${nurse} 간호사`;
  };

  return (
    <div className="relative w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">
            휴무 관리
          </p>
          <h3 className="text-2xl font-bold text-slate-900">연차 입력</h3>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white">
          {vacations.length}건
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex flex-col text-sm font-medium text-slate-600">
            간호사
            <select
              value={selectedNurse}
              onChange={(e) => setSelectedNurse(e.target.value as NurseType)}
              className="mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              {NURSE_IDS.map((nurse) => (
                <option key={nurse} value={nurse}>
                  ID {nurse} · {getDisplayName(nurse)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-600">
            날짜
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </label>
        </div>

        <button
          onClick={handleAdd}
          className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10"
        >
          연차 추가하기
        </button>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-slate-500 mb-2 flex items-center justify-between">
          등록된 연차
        </h4>
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
          {vacations.length === 0 && (
            <p className="text-sm text-slate-400 bg-white/70 border border-dashed border-slate-200 rounded-xl py-6 text-center">
              아직 등록된 연차가 없습니다.
            </p>
          )}
          {vacations.map((vacation, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-100 bg-white/60"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {getDisplayName(vacation.nurse)} (ID {vacation.nurse})
                </p>
                <p className="text-xs text-slate-500">
                  {format(vacation.date, "yyyy년 MM월 dd일")}
                </p>
              </div>
              <button
                onClick={() => handleRemove(vacation.nurse, vacation.date)}
                className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
