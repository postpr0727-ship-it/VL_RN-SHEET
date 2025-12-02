import { useState, useEffect } from "react";
import type { NurseConfig, WorkConditionType } from "../types";

interface NurseManagerProps {
  nurses: NurseConfig[];
  onUpdate: (nurses: NurseConfig[]) => void;
}

export default function NurseManager({ nurses, onUpdate }: NurseManagerProps) {
  const [localNurses, setLocalNurses] = useState<NurseConfig[]>(nurses);

  useEffect(() => {
    setLocalNurses(nurses);
  }, [nurses]);

  const handleAddNurse = () => {
    const newId = `N${localNurses.length + 1}`;
    const newNurse: NurseConfig = {
      id: newId,
      name: `${newId} 간호사`,
      workCondition: "FLEXIBLE",
    };
    const updated = [...localNurses, newNurse];
    setLocalNurses(updated);
    onUpdate(updated);
  };

  const handleDeleteNurse = (id: string) => {
    if (localNurses.length <= 1) {
      alert("최소 1명의 간호사가 필요합니다.");
      return;
    }
    if (window.confirm("정말로 이 간호사를 삭제하시겠습니까?")) {
      const updated = localNurses.filter((n) => n.id !== id);
      setLocalNurses(updated);
      onUpdate(updated);
    }
  };

  const handleUpdateName = (id: string, name: string) => {
    const updated = localNurses.map((n) =>
      n.id === id ? { ...n, name } : n,
    );
    setLocalNurses(updated);
    onUpdate(updated);
  };

  const handleUpdateWorkCondition = (
    id: string,
    workCondition: WorkConditionType,
  ) => {
    const updated = localNurses.map((n) =>
      n.id === id ? { ...n, workCondition } : n,
    );
    setLocalNurses(updated);
    onUpdate(updated);
  };

  const getWorkConditionLabel = (condition: WorkConditionType): string => {
    switch (condition) {
      case "DAYTIME_ONLY":
        return "주간 전담";
      case "DAY_EVENING_ALTERNATE":
        return "주간/저녁 교대";
      case "NIGHT_ONLY":
        return "야간 전담";
      case "FLEXIBLE":
        return "유연";
      default:
        return condition;
    }
  };

  return (
    <div className="w-full rounded-3xl border border-amber-100/50 bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-900/5 p-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-900/90 mb-2 font-medium">
            간호사 관리
          </p>
          <h3 className="text-2xl font-light text-stone-900">
            간호사 설정
          </h3>
        </div>
        <button
          onClick={handleAddNurse}
          className="px-4 py-2 rounded-full bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          + 추가
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {localNurses.map((nurse) => (
          <div
            key={nurse.id}
            className="p-4 rounded-xl border border-stone-200/50 bg-stone-50/50"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  간호사 ID
                </label>
                <input
                  type="text"
                  value={nurse.id}
                  disabled
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleDeleteNurse(nurse.id)}
                className="mt-6 px-3 py-2 rounded-full bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                이름
              </label>
              <input
                type="text"
                value={nurse.name}
                onChange={(e) => handleUpdateName(nurse.id, e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-light text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                근무 조건
              </label>
              <select
                value={nurse.workCondition}
                onChange={(e) =>
                  handleUpdateWorkCondition(
                    nurse.id,
                    e.target.value as WorkConditionType,
                  )
                }
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-light text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
              >
                <option value="DAYTIME_ONLY">주간 전담 (DAY, MID-DAY만)</option>
                <option value="DAY_EVENING_ALTERNATE">
                  주간/저녁 교대 (주 단위 교대)
                </option>
                <option value="NIGHT_ONLY">야간 전담 (NIGHT만)</option>
                <option value="FLEXIBLE">유연 (모든 시간대 가능)</option>
              </select>
              <p className="mt-1 text-xs text-stone-500">
                현재: {getWorkConditionLabel(nurse.workCondition)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {localNurses.length === 0 && (
        <p className="text-center text-stone-500 py-8">
          등록된 간호사가 없습니다. "+ 추가" 버튼을 클릭하여 추가하세요.
        </p>
      )}
    </div>
  );
}


