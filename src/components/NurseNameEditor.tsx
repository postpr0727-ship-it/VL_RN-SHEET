import type { NurseType } from "../types";
import { NURSE_IDS } from "../constants/nurses";

interface NurseNameEditorProps {
  labels: Record<NurseType, string>;
  onUpdate: (nurse: NurseType, label: string) => void;
}

export default function NurseNameEditor({
  labels,
  onUpdate,
}: NurseNameEditorProps) {
  return (
    <div className="w-full rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-lg shadow-slate-900/5 p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">
            간호사 정보
          </p>
          <h3 className="text-2xl font-bold text-slate-900">이름 설정</h3>
        </div>
        <span className="text-xs text-slate-400">
          ID는 고정이며 표시 이름만 변경됩니다.
        </span>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {NURSE_IDS.map((nurse) => (
          <label
            key={nurse}
            className="flex flex-col text-xs font-semibold text-slate-500"
          >
            {nurse} 간호사
            <input
              type="text"
              value={labels[nurse] ?? nurse}
              onChange={(e) => onUpdate(nurse, e.target.value)}
              placeholder={`${nurse} 간호사`}
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

