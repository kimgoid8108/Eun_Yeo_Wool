"use client";

import React, { useState, useCallback } from "react";
import { apiPost } from "@/lib/api";

// 데이터 타입 정의
export interface PlayerRecord {
  id: string;
  name: string;
  attendance: boolean;
  goals: number;
  assists: number;
  isWin: boolean;
  isDraw: boolean;
  isMom: boolean;
  totalScore: number;
}

export interface Day {
  id: string;
  day: string;
  dateId: number;
  players: PlayerRecord[];
  // eventDate?: string; // 서버 응답에 따라 있을 수 있음
}

interface AddDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDate: (date: Day) => void;
  existingDays: Day[];
}

export default function AddDateModal({ isOpen, onClose, onAddDate, existingDays }: AddDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 자동 점수 계산 (미사용)
  const calculateScore = (p: Partial<PlayerRecord>) => {
    let score = 0;
    if (p.isWin) score += 3;
    if (p.isDraw) score += 1;
    score += (p.goals || 0) * 2;
    score += (p.assists || 0) * 1;
    if (p.isMom) score += 5;
    return score;
  };

  // handleAdd 함수 리라이트 (중복 체크 로직 등 지시사항 반영)
  const handleAdd = useCallback(async () => {
    if (!selectedDate) {
      setError("날짜를 선택해주세요.");
      return;
    }

    const dateObj = new Date(selectedDate);
    dateObj.setHours(0, 0, 0, 0);

    // 토요일만 허용
    if (dateObj.getDay() !== 6) {
      setError("토요일만 선택할 수 있습니다.");
      return;
    }

    const dateId = dateObj.getTime();
    const isoDate = dateObj.toISOString();

    // [중복 체크 로직] dateId 또는 eventDate(ISO) 기준으로 기존 데이터 찾기
    const existingDay = existingDays.find((d) => String(d.dateId) === String(dateId) || (d as any).eventDate === isoDate);

    if (existingDay) {
      onAddDate(existingDay); // 부모에 "이미 있는 데이터 선택" 효과 전달
      onClose();
      return;
    }

    setIsSaving(true);

    try {
      // 서버에 POST 요청 (필수: eventDate)
      const response = await apiPost("/match-dates", {
        eventDate: isoDate, // 서버 필드명
        // 필요시 다른 필드도 같이 전송
      });

      // response 타입이 unknown일 수 있으니 명시적으로 타입 가드 후 전달
      if (response && typeof response === "object") {
        // 만약 data 필드가 있으면 data를, 없으면 response 자체를 전달
        const newDay = (response as any).data ?? response;
        onAddDate(newDay); // 성공 후 신규 날짜 객체 전달
      } else {
        // 예외 상황: 객체가 아닌 응답
        setError("서버 응답이 올바르지 않습니다.");
      }
      onClose();
    } catch (err: any) {
      if (typeof err.message === "string" && err.message.includes("이미 등록된")) {
        setError("이미 등록된 날짜입니다. 목록에서 선택해 주세요.");
      } else {
        setError(err.message || "날짜 저장 실패");
      }
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate, existingDays, onAddDate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-6 text-gray-900">📅 새 경기 날짜 등록</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">날짜 선택</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setError("");
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">⚠️ {error}</p>}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all">
              취소
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isSaving}
              className={`flex-1 py-3 text-white rounded-lg font-bold transition-all ${isSaving ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"}`}>
              {isSaving ? "저장 중..." : "등록하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
