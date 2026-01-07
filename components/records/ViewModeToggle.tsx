"use client";

interface ViewModeToggleProps {
  viewMode: "records" | "result";
  onModeChange: (mode: "records" | "result") => void;
}

/**
 * 보기 모드 토글 컴포넌트
 *
 * 경기 기록과 경기 결과 모드를 전환하는 컴포넌트입니다.
 *
 * 사용처:
 * - app/records/page.tsx: 기록지 페이지에서 보기 모드 전환
 */
export default function ViewModeToggle({ viewMode, onModeChange }: ViewModeToggleProps) {
  return (
    <div className="mb-4 flex gap-3">
      <button
        onClick={() => onModeChange("records")}
        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
          viewMode === "records" ? "bg-blue-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}>
        경기 기록
      </button>
      <button
        onClick={() => onModeChange("result")}
        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
          viewMode === "result" ? "bg-blue-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}>
        경기 결과
      </button>
    </div>
  );
}
