import { useState, useMemo, useCallback, useEffect } from "react";
import { format } from "date-fns";
import ScheduleTable from "./components/ScheduleTable";
import ScheduleSummary from "./components/ScheduleSummary";
import VacationInput from "./components/VacationInput";
import { generateSchedule } from "./utils/scheduleGenerator";
import { exportToExcel } from "./utils/excelExporter";
import type { VacationDay, ShiftType, NurseType, ScheduleEntry } from "./types";

const DEFAULT_NURSE_LABELS: Record<NurseType, string> = {
  A: "A 간호사",
  B: "B 간호사",
  C: "C 간호사",
  D: "D 간호사",
  E: "E 간호사",
  F: "F 간호사",
  G: "G 간호사",
  H: "H 간호사",
};

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vacations, setVacations] = useState<VacationDay[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [manualEdits, setManualEdits] = useState<Record<string, ShiftType>>({});
  const [showNurseEditor, setShowNurseEditor] = useState(false);
  const [showVacationInput, setShowVacationInput] = useState(false);
  const [nurseLabels, setNurseLabels] = useState<Record<NurseType, string>>(
    () => {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("nurseLabels");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Record<NurseType, string>;
            return { ...DEFAULT_NURSE_LABELS, ...parsed };
          } catch {
            // ignore parse errors
          }
        }
      }
      return { ...DEFAULT_NURSE_LABELS };
    },
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const baseSchedule = useMemo(() => {
    return generateSchedule(year, month, vacations);
  }, [year, month, vacations, refreshKey]);

  const makeKey = useCallback(
    (nurse: NurseType, date: Date) => `${nurse}-${format(date, "yyyy-MM-dd")}`,
    [],
  );

  const schedule = useMemo<ScheduleEntry[]>(() => {
    return baseSchedule.map((entry) => {
      const key = makeKey(entry.nurse, entry.date);
      if (manualEdits[key]) {
        return { ...entry, shift: manualEdits[key] };
      }
      return entry;
    });
  }, [baseSchedule, manualEdits, makeKey]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleAddVacation = (vacation: VacationDay) => {
    setVacations((prev) => [...prev, vacation]);
  };

  const handleRemoveVacation = (nurse: string, date: Date) => {
    setVacations((prev) =>
      prev.filter(
        (v) =>
          !(
            v.nurse === nurse &&
            format(v.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
          ),
      ),
    );
  };

  const handleGenerateSchedule = () => {
    // 근무표 강제 재생성
    setRefreshKey((prev) => prev + 1);
  };

  const handleManualUpdate = useCallback(
    (nurse: NurseType, date: Date, shift: ShiftType) => {
      const key = makeKey(nurse, date);
      setManualEdits((prev) => ({
        ...prev,
        [key]: shift,
      }));
    },
    [makeKey],
  );

  const handleUpdateNurseLabel = useCallback(
    (nurse: NurseType, value: string) => {
      setNurseLabels((prev) => ({
        ...prev,
        [nurse]: value,
      }));
    },
    [],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nurseLabels", JSON.stringify(nurseLabels));
    }
  }, [nurseLabels]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 py-6 md:py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 md:mb-10">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src="/logo.jpg" 
              alt="VL LEWEST 로고" 
              style={{ 
                height: "60px", 
                width: "auto",
                objectFit: "contain",
                display: "block"
              }}
              onError={(e) => {
                console.error("로고 이미지 로드 실패:", e);
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500 mb-2">
                Smart Staffing
              </p>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <h1 className="text-3xl md:text-5xl font-bold text-slate-900">
                    건강센터 간호사 근무표
                  </h1>
                  <p className="text-sm md:text-base text-slate-500 mt-2">
                    공평한 근무 분배와 손쉬운 연차 관리까지 한 번에
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {format(new Date(year, month - 1), "yyyy.MM")}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur rounded-2xl px-4 md:px-6 py-3 shadow-sm border border-white/60">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handlePrevMonth}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              이전 달
            </button>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              {year}년 {month}월
            </h2>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              다음 달
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVacationInput(!showVacationInput)}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              연차 입력 {vacations.length > 0 && `(${vacations.length})`}
            </button>
            <button
              onClick={() => setShowNurseEditor(!showNurseEditor)}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              간호사 이름 설정
            </button>
            <button
              onClick={handleGenerateSchedule}
              className="px-6 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors font-semibold shadow-lg shadow-slate-900/10"
            >
              근무표 생성
            </button>
            <button
              onClick={() => exportToExcel({ schedule, year, month, nurseLabels })}
              className="px-6 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold shadow-lg shadow-green-900/10"
            >
              📊 엑셀 내보내기
            </button>
          </div>
        </div>

        {(showVacationInput || showNurseEditor) && (
          <div className="mb-6 flex flex-wrap gap-4">
            {showVacationInput && (
              <div className="flex-1 min-w-[400px] rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-lg shadow-slate-900/5 p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">
                      휴무 관리
                    </p>
                    <h3 className="text-xl font-bold text-slate-900">연차 입력</h3>
                  </div>
                  <button
                    onClick={() => setShowVacationInput(false)}
                    className="text-slate-400 hover:text-slate-700 transition-colors text-xl"
                  >
                    ✕
                  </button>
                </div>
                <VacationInput
                  vacations={vacations}
                  onAddVacation={handleAddVacation}
                  onRemoveVacation={handleRemoveVacation}
                  nurseLabels={nurseLabels}
                />
              </div>
            )}

            {showNurseEditor && (
              <div className="flex-1 min-w-[400px] rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-lg shadow-slate-900/5 p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">
                      간호사 정보
                    </p>
                    <h3 className="text-xl font-bold text-slate-900">이름 설정</h3>
                  </div>
                  <button
                    onClick={() => setShowNurseEditor(false)}
                    className="text-slate-400 hover:text-slate-700 transition-colors text-xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.keys(nurseLabels).map((nurse) => (
                    <label
                      key={nurse}
                      className="flex flex-col text-xs font-semibold text-slate-500"
                    >
                      {nurse} 간호사
                      <input
                        type="text"
                        value={nurseLabels[nurse as NurseType] ?? nurse}
                        onChange={(e) => handleUpdateNurseLabel(nurse as NurseType, e.target.value)}
                        placeholder={`${nurse} 간호사`}
                        className="mt-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <ScheduleTable
            schedule={schedule}
            year={year}
            month={month}
            manualEdits={manualEdits}
            nurseLabels={nurseLabels}
            onUpdateEntry={handleManualUpdate}
          />
        </div>

        <div className="mb-6">
          <ScheduleSummary schedule={schedule} nurseLabels={nurseLabels} />
        </div>
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold mb-4">근무 시간 안내</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm md:text-base">
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="font-semibold text-blue-800">DAY</div>
              <div className="text-blue-600">07:00 - 16:00</div>
            </div>
            <div className="p-3 bg-green-50 rounded-md">
              <div className="font-semibold text-green-800">MID-DAY</div>
              <div className="text-green-600">09:00 - 18:00</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-md">
              <div className="font-semibold text-yellow-800">EVENING</div>
              <div className="text-yellow-600">12:00 - 21:00</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-md">
              <div className="font-semibold text-purple-800">NIGHT</div>
              <div className="text-purple-600">21:00 - 07:00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
