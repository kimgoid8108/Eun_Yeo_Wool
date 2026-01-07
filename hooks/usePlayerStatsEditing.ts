/**
 * 선수 통계 편집 관리 커스텀 훅
 *
 * 선수 통계의 셀 편집 기능을 관리합니다.
 *
 * @param {function} updatePlayerStat - 선수 통계 업데이트 함수
 * @returns {object} 편집 관련 상태 및 함수들
 *
 * 사용처:
 * - components/records/AttendanceTable.tsx: 출석 테이블에서 선수 통계 편집
 */

import { useState, useCallback } from "react";
import { PlayerStat } from "@/types/playerStats";
import { calculateTotalPoint } from "@/utils/playerStatsUtils";

export function usePlayerStatsEditing(
  updatePlayerStat: (playerId: number, updater: (player: PlayerStat) => PlayerStat) => void
) {
  const [editingCell, setEditingCell] = useState<{ playerId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // 셀 클릭 핸들러
  const handleCellClick = useCallback((playerId: number, field: string, currentValue: number) => {
    setEditingCell({ playerId, field });
    setEditValue(currentValue.toString());
  }, []);

  // 저장 핸들러
  const handleSave = useCallback(
    (playerId: number, field: string) => {
      const value = Math.max(0, parseInt(editValue) || 0);
      updatePlayerStat(playerId, (player) => {
        const updated = { ...player, [field]: value };
        updated.totalPoint = calculateTotalPoint(updated.attendance, updated.goals, updated.assists, updated.cleanSheet, updated.mom);
        return updated;
      });
      setEditingCell(null);
      setEditValue("");
    },
    [editValue, updatePlayerStat]
  );

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, playerId: number, field: string) => {
      if (e.key === "Enter") {
        handleSave(playerId, field);
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // 편집 값 변경 핸들러
  const handleEditValueChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  // 포지션 변경 핸들러
  const handlePositionChange = useCallback(
    (playerId: number, position: string) => {
      updatePlayerStat(playerId, (player) => ({ ...player, position }));
    },
    [updatePlayerStat]
  );

  return {
    editingCell,
    editValue,
    handleCellClick,
    handleSave,
    handleCancel,
    handleKeyDown,
    handleEditValueChange,
    handlePositionChange,
  };
}
