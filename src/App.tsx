import { useState, useMemo, useCallback, useEffect } from "react";
import { format } from "date-fns";
import ScheduleTable from "./components/ScheduleTable";
import ScheduleSummary from "./components/ScheduleSummary";
import VacationInput from "./components/VacationInput";
import SaveScheduleDialog from "./components/SaveScheduleDialog";
import SavedSchedulesList from "./components/SavedSchedulesList";
import NurseManager from "./components/NurseManager";
import { generateSchedule } from "./utils/scheduleGenerator";
import { exportToExcel } from "./utils/excelExporter";
import { saveSchedule } from "./utils/scheduleStorage";
import { getHolidayDates } from "./utils/holidays";
import { loadNurseConfigs, saveNurseConfigs } from "./utils/nurseStorage";
import type { VacationDay, ShiftType, NurseType, ScheduleEntry, SavedSchedule, NurseConfig } from "./types";

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vacations, setVacations] = useState<VacationDay[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [manualEdits, setManualEdits] = useState<Record<string, ShiftType>>({});
  const [showVacationInput, setShowVacationInput] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showNurseManager, setShowNurseManager] = useState(false);
  const [nurseConfigs, setNurseConfigs] = useState<NurseConfig[]>(() => {
    return loadNurseConfigs();
  });
  
  // 간호사 설정이 변경되면 이름도 업데이트
  const nurseLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    nurseConfigs.forEach((config) => {
      labels[config.id] = config.name;
    });
    return labels as Record<NurseType, string>;
  }, [nurseConfigs]);
  
  const handleUpdateNurseConfigs = useCallback((configs: NurseConfig[]) => {
    setNurseConfigs(configs);
    saveNurseConfigs(configs);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const baseSchedule = useMemo(() => {
    return generateSchedule(year, month, vacations, nurseConfigs);
  }, [year, month, vacations, refreshKey, nurseConfigs]);

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


  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nurseLabels", JSON.stringify(nurseLabels));
    }
  }, [nurseLabels]);

  // 공휴일 자동 로드 (현재 연도 및 이전/다음 연도)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearsToLoad = [currentYear - 1, currentYear, currentYear + 1];
    
    // 각 연도의 공휴일을 미리 로드 (백그라운드에서 API 호출 시도)
    yearsToLoad.forEach((year) => {
      getHolidayDates(year);
    });
  }, []);

  // 연도가 변경될 때 공휴일 자동 로드
  useEffect(() => {
    // 현재 보고 있는 연도의 공휴일 로드
    getHolidayDates(year);
    
    // 이전/다음 연도도 미리 로드
    getHolidayDates(year - 1);
    getHolidayDates(year + 1);
  }, [year]);

  const handleSaveSchedule = useCallback(
    (name: string) => {
      saveSchedule(name, year, month, schedule, vacations, manualEdits, nurseLabels);
      setShowSaveDialog(false);
      alert("근무표가 저장되었습니다.");
    },
    [year, month, schedule, vacations, manualEdits, nurseLabels]
  );

  const handleLoadSchedule = useCallback(
    (savedSchedule: SavedSchedule) => {
      // 날짜 설정
      setCurrentDate(new Date(savedSchedule.year, savedSchedule.month - 1, 1));
      // 근무표 데이터 복원
      setVacations(savedSchedule.vacations);
      setManualEdits(savedSchedule.manualEdits);
      // nurseLabels는 nurseConfigs에서 자동으로 계산되므로 별도 설정 불필요
      // 근무표 재생성 트리거 (날짜가 변경되면 자동으로 재생성됨)
      setRefreshKey((prev) => prev + 1);
      setShowLoadDialog(false);
    },
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100/50 via-stone-100 to-amber-100/40 py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-6 mb-6">
            <img 
              src="/vl-logo.png" 
              alt="VL 레지던스 로고" 
              style={{ 
                height: "70px", 
                width: "auto",
                objectFit: "contain",
                display: "block"
              }}
              onError={(e) => {
                // fallback to svg if png fails
                const target = e.target as HTMLImageElement;
                if (target.src.endsWith('.png')) {
                  target.src = '/vl-logo.svg';
                } else {
                  console.error("로고 이미지 로드 실패:", e);
                  target.style.display = "none";
                }
              }}
            />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-900/90 mb-3 font-medium">
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
                  <p className="text-sm md:text-base text-stone-700 font-normal leading-relaxed max-w-xl">
                    24시간 상주하는 전담 간호사의 응급 케어와<br />
                    개인별 맞춤형 건강관리 서비스를 제공합니다
                  </p>
                </div>
                <span className="text-sm text-stone-700 font-normal">
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
              onClick={() => setShowNurseManager(!showNurseManager)}
              className="px-5 py-2.5 rounded-full bg-purple-50 text-purple-900 hover:bg-purple-100 transition-all duration-300 text-sm font-light border border-purple-200/50 hover:border-purple-300"
            >
              간호사 관리
            </button>
            <button
              onClick={handleGenerateSchedule}
              className="px-7 py-2.5 rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-all duration-300 font-light text-sm shadow-md shadow-stone-900/20 hover:shadow-lg"
            >
              근무표 생성
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-5 py-2.5 rounded-full bg-blue-50 text-blue-900 hover:bg-blue-100 transition-all duration-300 text-sm font-light border border-blue-200/50 hover:border-blue-300"
            >
              💾 저장
            </button>
            <button
              onClick={() => setShowLoadDialog(true)}
              className="px-5 py-2.5 rounded-full bg-blue-50 text-blue-900 hover:bg-blue-100 transition-all duration-300 text-sm font-light border border-blue-200/50 hover:border-blue-300"
            >
              📂 불러오기
            </button>
            <button
              onClick={() => exportToExcel({ schedule, year, month, nurseLabels })}
              className="px-7 py-2.5 rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-all duration-300 font-light text-sm shadow-md shadow-amber-900/20 hover:shadow-lg"
            >
              📊 구글시트 내보내기
            </button>
          </div>
        </div>

        {showSaveDialog && (
          <div className="mb-8">
            <SaveScheduleDialog
              year={year}
              month={month}
              onSave={handleSaveSchedule}
              onClose={() => setShowSaveDialog(false)}
            />
          </div>
        )}

        {showLoadDialog && (
          <div className="mb-8">
            <SavedSchedulesList
              onLoad={handleLoadSchedule}
              onClose={() => setShowLoadDialog(false)}
            />
          </div>
        )}

        {showNurseManager && (
          <div className="mb-8">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-900/90 mb-2 font-medium">
                  간호사 관리
                </p>
              </div>
              <button
                onClick={() => setShowNurseManager(false)}
                className="text-stone-400 hover:text-stone-700 transition-colors text-xl font-light"
              >
                ✕
              </button>
            </div>
            <NurseManager
              nurses={nurseConfigs}
              onUpdate={handleUpdateNurseConfigs}
            />
          </div>
        )}

        {showVacationInput && (
          <div className="mb-8">
            <div className="flex-1 min-w-[400px] rounded-3xl border border-amber-100/50 bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-900/5 p-6">
              <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-900/90 mb-2 font-medium">
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
          <p className="text-xs uppercase tracking-[0.2em] text-amber-900/90 mb-3 font-medium">
            Healthcare Service
          </p>
          <h3 className="text-2xl font-light text-stone-900 mb-6">근무 시간 안내</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm md:text-base">
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
              <div className="font-light text-stone-900 mb-1 text-base">DAY</div>
              <div className="text-stone-700 text-sm font-medium">07:00 - 16:00</div>
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
