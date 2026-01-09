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

/**
 * 내부 표준 Day 형식:
 * {
 *   id: number (ms timestamp)
 *   date: string (yyyy-mm-dd 등 형식, 실제로 한글로 변환해서 표시)
 *   location: string (optional)
 *   players?: any[]
 * }
 */
export function useDateManagement(initialDays: Day[]) {
  // 날짜 목록 (백엔드 API에서 불러온 데이터 포함)
  const [days, setDays] = useState<Day[]>(initialDays);
  // 선택된 날짜 ID (string)
  const [selectedDateId, setSelectedDateId] = useState<string>(""); // <-- 에러 해결: 선언 추가
  // 날짜 드롭다운 열림/닫힘 상태
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  // 날짜 추가 모달 열림/닫힘 상태
  const [isAddDateModalOpen, setIsAddDateModalOpen] = useState<boolean>(false);
  // 로딩 상태
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  // 백엔드에서 저장된 날짜 목록 불러오기 (API → Day 변환 표준화)
  const loadDatesFromAPI = useCallback(async () => {
    setIsLoadingDates(true);
    try {
      console.log("[useDateManagement] Loading dates from API...");
      const matchRecords = await recordsService.getAllMatchRecords();
      console.log("[useDateManagement] API response:", matchRecords);

      // matchRecords → Day[]
      const apiDays = matchRecords
        .map((record: any) => {
          // 날짜 필드 찾아 해석: record.date (ISO or anything parsable)
          const rawDate = record.date || record.day || record.dayStr;
          const dateObj = new Date(rawDate);
          if (isNaN(dateObj.getTime())) {
            console.warn("[useDateManagement] Invalid date in record:", record);
            return null;
          }

          // id를 timestamp로 전환 (number)
          const id = typeof record.dateId !== "undefined" ? Number(record.dateId) : dateObj.getTime();

          return {
            id, // number, timestamp
            date: dateObj.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            }),
            location: record.location || "경기장",
          } as Day;
        })
        .filter((x): x is Day => x !== null);

      // ID를 숫자로 고정하고 병합 (중복 제거)
      // initialDays도 id: number 보장됨
      const allDays = [...initialDays, ...apiDays];

      // ID(=timestamp) 기준으로 중복 제거
      const dedupedDays: Day[] = allDays.filter((day, idx, arr) => arr.findIndex((d) => Number(d.id) === Number(day.id)) === idx);
      // ID(=timestamp) 오름차순
      const sortedDays = dedupedDays.sort((a, b) => Number(a.id) - Number(b.id));
      console.log("[useDateManagement] Merged days:", sortedDays);
      setDays(sortedDays);
    } catch (error) {
      console.error("[useDateManagement] Failed to load dates from API:", error);
      setDays(initialDays);
    } finally {
      setIsLoadingDates(false);
    }
  }, [initialDays]);

  // 초기 마운트 시 날짜 목록 불러오기
  useEffect(() => {
    loadDatesFromAPI();
  }, [loadDatesFromAPI]);

  // 초기화: 가장 최근 날짜를 기본값으로(오름차순 마지막 id)
  useEffect(() => {
    if (days.length > 0 && !selectedDateId) {
      setSelectedDateId(String(days[days.length - 1].id));
    }
  }, [selectedDateId, days]);

  // 날짜 추가 핸들러
  const handleAddDate = useCallback((newDay: Day) => {
    setDays((prev) => {
      // id 기준 중복 체크
      if (prev.some((day) => Number(day.id) === Number(newDay.id))) {
        return prev;
      }
      const updated = [...prev, newDay].sort((a, b) => Number(a.id) - Number(b.id));
      console.log("[useDateManagement] Date added:", newDay, "Updated days:", updated);
      return updated;
    });
    // 새로 추가된 날짜 선택
    setSelectedDateId(String(newDay.id));
  }, []);

  // 날짜 추가 모달 열기
  const handleOpenAddDateModal = useCallback(() => {
    setIsAddDateModalOpen(true);
  }, []);

  // 현재 날짜의 인덱스 (문자열-숫자 가능)
  const currentDateIndex = useMemo(() => {
    return days.findIndex((d) => String(d.id) === String(selectedDateId));
  }, [selectedDateId, days]);

  // 이전 날짜로 이동 핸들러
  const handlePreviousDate = useCallback(() => {
    if (currentDateIndex > 0) {
      setSelectedDateId(String(days[currentDateIndex - 1].id));
    }
  }, [currentDateIndex, days]);

  // 다음 날짜로 이동 핸들러
  const handleNextDate = useCallback(() => {
    if (currentDateIndex < days.length - 1) {
      setSelectedDateId(String(days[currentDateIndex + 1].id));
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
