/**
 * 날짜 관리 커스텀 훅
 *
 * 기록지 페이지에서 날짜 목록과 선택된 날짜를 관리하는 로직을 담당합니다.
 *
 * @param {Day[]} initialDays - 초기 날짜 목록
 * @returns {object} 날짜 관리 관련 상태 및 함수들
 *
 * 사용처:
 * - app/records/page.tsx: 기록지 페이지에서 날짜 선택 및 네비게이션 관리
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Day } from "@/data/days";
import * as recordsService from "@/services/recordsService";

export function useDateManagement(initialDays: Day[]) {
  // 날짜 목록 (백엔드 API에서 불러온 데이터)
  const [days, setDays] = useState<Day[]>(initialDays);
  // 선택된 날짜 ID
  const [selectedDateId, setSelectedDateId] = useState<string>("");
  // 날짜 드롭다운 열림/닫힘 상태
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  // 날짜 추가 모달 열림/닫힘 상태
  const [isAddDateModalOpen, setIsAddDateModalOpen] = useState<boolean>(false);
  // 로딩 상태
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  // 백엔드에서 저장된 날짜 목록 불러오기
  const loadDatesFromAPI = useCallback(async () => {
    setIsLoadingDates(true);
    try {
      console.log("[useDateManagement] Loading dates from API...");
      const matchRecords = await recordsService.getAllMatchRecords();
      console.log("[useDateManagement] API response:", matchRecords);

        // API 응답을 Day 형식으로 변환
        const apiDays: Day[] = matchRecords
          .map((record) => {
            // ✅ 날짜 유효성 검사
            const date = new Date(record.date);
            if (isNaN(date.getTime())) {
              console.warn("[useDateManagement] Invalid date in record:", record);
              return null; // 유효하지 않은 날짜는 필터링
            }

            const dateId = record.dateId || date.getTime();
            return {
              id: String(dateId),
              day: date.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              }),
              dateId: dateId,
            };
          })
          .filter((day): day is Day => day !== null); // null 제거

      // API에서 불러온 날짜와 초기 날짜를 병합
      const allDays = [...initialDays, ...apiDays];
      const uniqueDays = allDays.filter(
        (day, index, self) => index === self.findIndex((d) => d.dateId === day.dateId)
      );
      const sortedDays = uniqueDays.sort((a, b) => a.dateId - b.dateId);

      console.log("[useDateManagement] Merged days:", sortedDays);
      setDays(sortedDays);
    } catch (error) {
      console.error("[useDateManagement] Failed to load dates from API:", error);
      // 에러 발생 시 초기 날짜만 사용
      setDays(initialDays);
    } finally {
      setIsLoadingDates(false);
    }
  }, [initialDays]);

  // 초기 마운트 시 날짜 목록 불러오기
  useEffect(() => {
    loadDatesFromAPI();
  }, [loadDatesFromAPI]);

  // 초기화: 가장 최근 날짜를 기본값으로 설정
  useEffect(() => {
    if (days.length > 0 && !selectedDateId) {
      setSelectedDateId(days[days.length - 1].id);
    }
  }, [selectedDateId, days]);

  // 날짜 추가 핸들러
  const handleAddDate = useCallback((newDay: Day) => {
    setDays((prev) => {
      // 중복 체크
      if (prev.some((day) => day.dateId === newDay.dateId)) {
        return prev;
      }
      // 날짜 순서대로 정렬하여 추가
      const updated = [...prev, newDay].sort((a, b) => a.dateId - b.dateId);
      console.log("[useDateManagement] Date added:", newDay, "Updated days:", updated);
      return updated;
    });
    // 새로 추가된 날짜를 선택
    setSelectedDateId(newDay.id);
  }, []);

  // 날짜 추가 모달 열기
  const handleOpenAddDateModal = useCallback(() => {
    setIsAddDateModalOpen(true);
  }, []);

  // 현재 날짜의 인덱스
  const currentDateIndex = useMemo(() => {
    return days.findIndex((d) => d.id === selectedDateId);
  }, [selectedDateId, days]);

  // 이전 날짜로 이동 핸들러
  const handlePreviousDate = useCallback(() => {
    if (currentDateIndex > 0) {
      setSelectedDateId(days[currentDateIndex - 1].id);
    }
  }, [currentDateIndex, days]);

  // 다음 날짜로 이동 핸들러
  const handleNextDate = useCallback(() => {
    if (currentDateIndex < days.length - 1) {
      setSelectedDateId(days[currentDateIndex + 1].id);
    }
  }, [currentDateIndex, days]);

  // 드롭다운에서 날짜 선택 핸들러
  const handleDateSelect = useCallback((dayId: string) => {
    setSelectedDateId(dayId);
  }, []);

  return {
    days,
    setDays,
    selectedDateId,
    setSelectedDateId,
    isDateDropdownOpen,
    setIsDateDropdownOpen,
    isAddDateModalOpen,
    setIsAddDateModalOpen,
    currentDateIndex,
    isLoadingDates,
    handleAddDate,
    handleOpenAddDateModal,
    handlePreviousDate,
    handleNextDate,
    handleDateSelect,
    loadDatesFromAPI, // 날짜 목록 새로고침 함수 export
  };
}
