"use client";

interface EmptyTeamMessageProps {
  onAddTeam: () => void;
}

/**
 * 빈 팀 메시지 컴포넌트
 *
 * 팀이 없을 때 표시되는 안내 메시지 컴포넌트입니다.
 *
 * 사용처:
 * - app/records/page.tsx: 기록지 페이지에서 팀이 없을 때 안내 메시지 표시
 */
export default function EmptyTeamMessage({ onAddTeam }: EmptyTeamMessageProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
      <p className="text-gray-500 text-lg">팀을 추가해주세요.</p>
      <button
        onClick={onAddTeam}
        className="mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">
        + 팀 추가
      </button>
    </div>
  );
}
