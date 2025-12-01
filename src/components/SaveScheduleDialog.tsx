import { useState } from "react";

interface SaveScheduleDialogProps {
  year: number;
  month: number;
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function SaveScheduleDialog({
  year,
  month,
  onSave,
  onClose,
}: SaveScheduleDialogProps) {
  const [name, setName] = useState(`${year}년 ${month}월 근무표`);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="rounded-3xl border border-amber-100/50 bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-900/5 p-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-900/90 mb-2 font-medium">
            근무표 저장
          </p>
          <h3 className="text-2xl font-light text-stone-900">저장하기</h3>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 transition-colors text-xl font-light"
        >
          ✕
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-stone-700 mb-2">
          저장 이름
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="근무표 이름을 입력하세요"
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-normal text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave();
            }
          }}
        />
        <p className="mt-2 text-xs text-stone-500 font-light">
          {year}년 {month}월 근무표를 저장합니다.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 px-6 py-3 rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-all duration-300 font-light text-sm shadow-md shadow-amber-900/20 hover:shadow-lg"
        >
          저장
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 rounded-full bg-stone-50 text-stone-700 hover:bg-stone-100 transition-all duration-300 font-light text-sm border border-stone-200/50"
        >
          취소
        </button>
      </div>
    </div>
  );
}

