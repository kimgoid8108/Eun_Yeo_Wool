"use client";

import { useMemo, useCallback } from "react";
import DateNavigation from "./DateNavigation";
import { MatchRecordsResponse, TeamResponse } from "@/types/api"; // 타입 파일 경로 확인 필요

interface EnhancedTeamViewProps {
  teamsByDate: Record<string, TeamResponse[]>;
  selectedDateId: string;
  isLoading: boolean;
  setIsSetupModalOpen: (open: boolean) => void;
  days: MatchRecordsResponse[]; // API 응답 타입으로 직접 받기
  isDateDropdownOpen: boolean;
  onToggleDropdown: () => void;
  onCloseDropdown: () => void;
  onDateSelect: (dayId: string) => void;
}

export default function EnhancedTeamView({
  teamsByDate,
  selectedDateId,
  isLoading,
  setIsSetupModalOpen,
  days,
  isDateDropdownOpen,
  onToggleDropdown,
  onCloseDropdown,
  onDateSelect,
}: EnhancedTeamViewProps) {
  // 1. 현재 날짜의 팀 목록 추출 (selectedDateId는 string, API의 dateId는 number일 수 있어 방어 코드 작성)
  const currentTeams = useMemo(() => {
    return teamsByDate[selectedDateId] || [];
  }, [teamsByDate, selectedDateId]);

  // 2. 날짜 이동 로직 (이전/다음 버튼 활성화)
  const currentIndex = useMemo(() => days.findIndex((d) => String(d.dateId) === selectedDateId), [days, selectedDateId]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) onDateSelect(String(days[currentIndex - 1].dateId));
  }, [currentIndex, days, onDateSelect]);

  const handleNext = useCallback(() => {
    if (currentIndex < days.length - 1) onDateSelect(String(days[currentIndex + 1].dateId));
  }, [currentIndex, days, onDateSelect]);

  return (
    <div className="w-full">
      {/* 날짜 네비게이션: 타입 에러 해결 부분 */}
      <DateNavigation
        selectedDateId={selectedDateId}
        days={days.map((d) => ({
          id: String(d.dateId), // string으로 형변환
          day: new Date(d.date).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short",
          }),
          dateId: d.dateId, // 원본 number 유지
        }))}
        isDateDropdownOpen={isDateDropdownOpen}
        onToggleDropdown={onToggleDropdown}
        onCloseDropdown={onCloseDropdown}
        onDateSelect={onDateSelect}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onTouchStart={() => {}}
        onTouchMove={() => {}}
        onTouchEnd={() => {}}
      />

      {/* 컨텐츠 영역 */}
      <div className="mt-6">
        {isLoading ? (
          <div className="p-20 text-center text-gray-400">데이터 로딩 중...</div>
        ) : currentTeams.length === 0 ? (
          /* [해결] 다른 날짜 클릭 시 팀이 없으면 추가 버튼 노출 */
          <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-500 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg font-medium">등록된 팀 정보가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">경기를 시작하기 위해 첫 번째 팀을 등록해 주세요.</p>
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-95">
              + 팀 추가하기
            </button>
          </div>
        ) : (
          /* 팀이 있을 때 표시되는 영역 */
          <div className="space-y-6">
            {currentTeams.map((team, idx) => (
              <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{team.teamName || `${idx + 1}팀`}</h3>
                {/* 여기에 RecordTable 컴포넌트 사용 예정 */}
                <div className="py-8 text-center text-gray-300 italic bg-gray-50 rounded-lg">선수별 기록 정보가 표시됩니다.</div>
              </div>
            ))}

            {/* 팀이 1개만 있을 때 추가 팀 버튼 (최대 2팀) */}
            {currentTeams.length === 1 && (
              <button onClick={() => setIsSetupModalOpen(true)} className="w-full py-4 border-2 border-dashed border-blue-200 text-blue-500 rounded-xl font-medium hover:bg-blue-50 transition-colors">
                + 상대 팀 추가 등록
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
