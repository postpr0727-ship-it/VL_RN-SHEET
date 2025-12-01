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
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-stone-50 to-amber-50/20 py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-6 mb-6">
            <img 
              src="/logo.jpg" 
              alt="VL 레지던스 로고" 
              style={{ 
                height: "70px", 
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
              <p className="text-xs uppercase tracking-[0.3em] text-amber-900/60 mb-3 font-medium">
                Healthcare Service
              </p>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h1 className="text-4xl md:text-6xl font-light text-stone-900 mb-2 tracking-tight">
                    건강관리센터
                  </h1>
                  <h2 className="text-2xl md:text-3xl font-light text-stone-700 mb-3">
                    간호사 근무표
                  </h2>
                  <p className="text-sm md:text-base text-stone-600/80 font-light leading-relaxed max-w-xl">
                    24시간 상주하는 전담 간호사의 응급 케어와<br />
                    개인별 맞춤형 건강관리 서비스를 제공합니다
                  </p>
                </div>
                <span className="text-sm text-stone-500/80 font-light">
                  {format(new Date(year, month - 1), "yyyy년 MM월")}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/90 backdrop-blur-sm rounded-3xl px-6 md:px-8 py-5 shadow-lg shadow-stone-900/5 border border-amber-100/50">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handlePrevMonth}
              className="px-5 py-2.5 rounded-full bg-stone-50 text-stone-700 hover:bg-stone-100 transition-all duration-300 text-sm font-light border border-stone-200/50 hover:border-stone-300"
            >
              ← 이전 달
            </button>
            <h2 className="text-2xl md:text-3xl font-light text-stone-900">
              {year}년 {month}월
            </h2>
            <button
              onClick={handleNextMonth}
              className="px-5 py-2.5 rounded-full bg-stone-50 text-stone-700 hover:bg-stone-100 transition-all duration-300 text-sm font-light border border-stone-200/50 hover:border-stone-300"
            >
              다음 달 →
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowVacationInput(!showVacationInput)}
              className="px-5 py-2.5 rounded-full bg-amber-50 text-amber-900 hover:bg-amber-100 transition-all duration-300 text-sm font-light border border-amber-200/50 hover:border-amber-300"
            >
              연차 입력 {vacations.length > 0 && `(${vacations.length})`}
            </button>
            <button
              onClick={() => setShowNurseEditor(!showNurseEditor)}
              className="px-5 py-2.5 rounded-full bg-amber-50 text-amber-900 hover:bg-amber-100 transition-all duration-300 text-sm font-light border border-amber-200/50 hover:border-amber-300"
            >
              간호사 이름 설정
            </button>
            <button
              onClick={handleGenerateSchedule}
              className="px-7 py-2.5 rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-all duration-300 font-light text-sm shadow-md shadow-stone-900/20 hover:shadow-lg"
            >
              근무표 생성
            </button>
            <button
              onClick={() => exportToExcel({ schedule, year, month, nurseLabels })}
              className="px-7 py-2.5 rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-all duration-300 font-light text-sm shadow-md shadow-amber-900/20 hover:shadow-lg"
            >
              📊 구글시트 내보내기
            </button>
          </div>
        </div>

        {(showVacationInput || showNurseEditor) && (
          <div className="mb-8 flex flex-wrap gap-6">
            {showVacationInput && (
              <div className="flex-1 min-w-[400px] rounded-3xl border border-amber-100/50 bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-900/5 p-6">
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-900/60 mb-2 font-light">
                      휴무 관리
                    </p>
                    <h3 className="text-2xl font-light text-stone-900">연차 입력</h3>
                  </div>
                  <button
                    onClick={() => setShowVacationInput(false)}
                    className="text-stone-400 hover:text-stone-700 transition-colors text-xl font-light"
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
              <div className="flex-1 min-w-[400px] rounded-3xl border border-amber-100/50 bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-900/5 p-6">
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-900/60 mb-2 font-light">
                      간호사 정보
                    </p>
                    <h3 className="text-2xl font-light text-stone-900">이름 설정</h3>
                  </div>
                  <button
                    onClick={() => setShowNurseEditor(false)}
                    className="text-stone-400 hover:text-stone-700 transition-colors text-xl font-light"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.keys(nurseLabels).map((nurse) => (
                    <label
                      key={nurse}
                      className="flex flex-col text-xs font-light text-stone-600"
                    >
                      {nurse} 간호사
                      <input
                        type="text"
                        value={nurseLabels[nurse as NurseType] ?? nurse}
                        onChange={(e) => handleUpdateNurseLabel(nurse as NurseType, e.target.value)}
                        placeholder={`${nurse} 간호사`}
                        className="mt-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-light text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
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
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-stone-900/5 border border-amber-100/50 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-900/60 mb-3 font-light">
            Healthcare Service
          </p>
          <h3 className="text-2xl font-light text-stone-900 mb-6">근무 시간 안내</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm md:text-base">
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
              <div className="font-light text-stone-900 mb-1 text-base">DAY</div>
              <div className="text-stone-600 text-sm">07:00 - 16:00</div>
            </div>
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
              <div className="font-light text-stone-900 mb-1 text-base">MID-DAY</div>
              <div className="text-stone-600 text-sm">09:00 - 18:00</div>
            </div>
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
              <div className="font-light text-stone-900 mb-1 text-base">EVENING</div>
              <div className="text-stone-600 text-sm">12:00 - 21:00</div>
            </div>
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
              <div className="font-light text-stone-900 mb-1 text-base">NIGHT</div>
              <div className="text-stone-600 text-sm">21:00 - 07:00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
