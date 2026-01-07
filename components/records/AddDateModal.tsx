"use client";

import { useState, useCallback } from "react";
import { Day } from "@/data/days";

interface AddDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDate: (date: Day) => void;
  existingDays: Day[];
}

/**
 * 날짜 추가 모달 컴포넌트
 * - 날짜 선택기로 날짜 선택
 * - 토요일인지 검증
 * - 중복 날짜 체크
 */
export default function AddDateModal({ isOpen, onClose, onAddDate, existingDays }: AddDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 날짜 선택 핸들러
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = e.target.value;
    setSelectedDate(dateString);
    setError("");
  }, []);

  // 날짜 추가 핸들러
  const handleAdd = useCallback(() => {
    if (!selectedDate) {
      setError("날짜를 선택해주세요.");
      return;
    }

    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);

    // 토요일인지 확인 (토요일 = 6)
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 6) {
      setError("토요일만 선택할 수 있습니다.");
      return;
    }

    // 2026년 이후인지 확인
    if (date.getFullYear() < 2026) {
      setError("2026년 이후의 날짜만 선택할 수 있습니다.");
      return;
    }

    // 중복 날짜 체크
    const dateId = date.getTime();
    const isDuplicate = existingDays.some((day) => day.dateId === dateId);
    if (isDuplicate) {
      setError("이미 추가된 날짜입니다.");
      return;
    }

    // 날짜 포맷팅
    const formattedDate = date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });

    const newDay: Day = {
      id: String(dateId),
      day: formattedDate,
      dateId: dateId,
    };

    onAddDate(newDay);
    setSelectedDate("");
    setError("");
    onClose();
  }, [selectedDate, existingDays, onAddDate, onClose]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    setSelectedDate("");
    setError("");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">경기 날짜 추가</h2>

        <div className="mb-4">
          <label htmlFor="date-input" className="block text-sm font-medium text-gray-700 mb-2">
            날짜 선택 (토요일만 가능)
          </label>
          <input
            id="date-input"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min="2026-01-01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
            취소
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
