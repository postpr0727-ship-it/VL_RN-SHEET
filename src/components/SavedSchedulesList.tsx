import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { SavedSchedule } from "../types";
import { getSavedSchedules, deleteSavedSchedule } from "../utils/scheduleStorage";

interface SavedSchedulesListProps {
  onLoad: (schedule: SavedSchedule) => void;
  onClose: () => void;
}

export default function SavedSchedulesList({
  onLoad,
  onClose,
}: SavedSchedulesListProps) {
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);

  useEffect(() => {
    setSavedSchedules(getSavedSchedules());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("저장된 근무표를 삭제하시겠습니까?")) {
      deleteSavedSchedule(id);
      setSavedSchedules(getSavedSchedules());
    }
  };

  const handleLoad = (schedule: SavedSchedule) => {
    onLoad(schedule);
    onClose();
  };

  return (
    <div className="rounded-3xl border border-amber-100/50 bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-900/5 p-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-900/90 mb-2 font-medium">
            저장된 근무표
          </p>
          <h3 className="text-2xl font-light text-stone-900">불러오기</h3>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 transition-colors text-xl font-light"
        >
          ✕
        </button>
      </div>

      {savedSchedules.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          <p className="text-sm font-light">저장된 근무표가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {savedSchedules
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => handleLoad(schedule)}
                className="p-4 rounded-2xl border border-amber-100/50 bg-amber-50/30 hover:bg-amber-50/50 transition-all duration-300 cursor-pointer hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-stone-900 mb-1">
                      {schedule.name}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-stone-600">
                      <span className="font-medium">
                        {schedule.year}년 {schedule.month}월
                      </span>
                      <span className="font-light">
                        {format(new Date(schedule.createdAt), "yyyy.MM.dd HH:mm")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(schedule.id, e)}
                    className="ml-4 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-medium"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

