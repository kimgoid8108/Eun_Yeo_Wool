"use client";

import { useMemo, useCallback } from "react";
import { Day } from "@/data/days";

interface DateNavigationProps {
  days: Day[];
  selectedDateId: string;
  onDateSelect: (dayId: string) => void;
  isDateDropdownOpen: boolean;
  onToggleDropdown: () => void;
  onCloseDropdown: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

/**
 * 날짜 네비게이션 컴포넌트
 * - 화살표 버튼으로 날짜 이동
 * - 드롭다운으로 날짜 직접 선택
 * - 스와이프 제스처 지원
 */
export default function DateNavigation({
  days,
  selectedDateId,
  onDateSelect,
  isDateDropdownOpen,
  onToggleDropdown,
  onCloseDropdown,
  onPrevious,
  onNext,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: DateNavigationProps) {
  const selectedDay = useMemo(() => days.find((d) => d.id === selectedDateId), [days, selectedDateId]);
  const currentDateIndex = useMemo(() => days.findIndex((d) => d.id === selectedDateId), [days, selectedDateId]);
  const canGoPrevious = useMemo(() => currentDateIndex > 0, [currentDateIndex]);
  const canGoNext = useMemo(() => currentDateIndex < days.length - 1, [currentDateIndex]);

  const handleDateSelect = useCallback(
    (dayId: string) => {
      onDateSelect(dayId);
      onCloseDropdown();
    },
    [onDateSelect, onCloseDropdown]
  );

  return (
    <div
      className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-between">
        {/* 이전 날짜 버튼 */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`p-2 rounded-lg transition-all ${
            canGoPrevious
              ? "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="이전 날짜">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 날짜 표시 및 드롭다운 */}
        <div className="flex-1 mx-4 text-center relative">
          <button
            onClick={onToggleDropdown}
            className="w-full py-2 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">{selectedDay ? selectedDay.day : "날짜를 선택하세요"}</h2>
            <p className="text-sm text-gray-500 mt-1">{days.length > 0 && `${currentDateIndex + 1} / ${days.length}`}</p>
          </button>

          {/* 날짜 선택 드롭다운 목록 */}
          {isDateDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {days.map((day) => (
                <button
                  key={day.id}
                  onClick={() => handleDateSelect(day.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                    selectedDateId === day.id ? "bg-blue-100 font-semibold" : ""
                  }`}>
                  <div className="text-sm text-gray-800">{day.day}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 다음 날짜 버튼 */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-2 rounded-lg transition-all ${
            canGoNext
              ? "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="다음 날짜">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
