/**
 * 출석 관리 커스텀 훅
 *
 * 출석 상태를 관리하고 전체 출석 토글 기능을 제공합니다.
 *
 * @param {PlayerStat[]} playerStats - 선수 통계 배열
 * @param {Record<number, AttendanceState>} attendanceMap - 출석 상태 맵
 * @param {function} setAttendanceMap - 출석 상태 업데이트 함수
 * @param {function} setPlayerStats - 선수 통계 업데이트 함수
 * @param {function} updatePlayerStat - 선수 통계 업데이트 함수 (개별 업데이트용)
 * @returns {object} 출석 관리 관련 함수 및 상태
 *
 * 사용처:
 * - components/records/AttendanceTable.tsx: 출석 테이블에서 출석 상태 관리
 */

import { useMemo, useCallback } from "react";
import { PlayerStat, AttendanceState } from "@/types/playerStats";
import { calculateTotalPoint } from "@/utils/playerStatsUtils";
import { sortPlayerStats } from "@/utils/playerStatsUtils";

export function useAttendanceManagement(
  playerStats: PlayerStat[],
  attendanceMap: Record<number, AttendanceState>,
  setAttendanceMap: React.Dispatch<React.SetStateAction<Record<number, AttendanceState>>>,
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStat[]>>,
  updatePlayerStat: (playerId: number, updater: (player: PlayerStat) => PlayerStat) => void
) {
  // 전체 출석 여부 확인
  const isAllAttended = useMemo(() => {
    if (playerStats.length === 0) return false;
    return playerStats.every((player) => {
      const attendanceState = attendanceMap[player.id];
      return attendanceState?.attendance === true;
    });
  }, [playerStats, attendanceMap]);

  // 개별 출석 토글 핸들러
  const handleAttendanceToggle = useCallback(
    (playerId: number) => {
      // 프론트 전용 출석 상태 업데이트
      setAttendanceMap((prev) => {
        const current = prev[playerId];
        if (!current) return prev;
        return {
          ...prev,
          [playerId]: {
            playerName: current.playerName,
            attendance: !current.attendance,
          },
        };
      });
      // UI 상태 업데이트
      updatePlayerStat(playerId, (player) => {
        const newAttendance = player.attendance > 0 ? 0 : 1;
        const updated = { ...player, attendance: newAttendance };
        updated.totalPoint = calculateTotalPoint(updated.attendance, updated.goals, updated.assists, updated.cleanSheet, updated.mom);
        return updated;
      });
    },
    [setAttendanceMap, updatePlayerStat]
  );

  // 전체 출석 토글 핸들러
  const handleToggleAllAttendance = useCallback(() => {
    const allAttended = playerStats.length > 0 && playerStats.every((player) => player.attendance > 0);
    const newAttendanceValue = !allAttended;
    const newAttendance = newAttendanceValue ? 1 : 0;

    // 프론트 전용 출석 상태 업데이트
    setAttendanceMap((currentMap) => {
      const newMap: Record<number, AttendanceState> = {};
      playerStats.forEach((player) => {
        const current = currentMap[player.id];
        newMap[player.id] = {
          playerName: current?.playerName ?? player.name,
          attendance: newAttendanceValue,
        };
      });
      return newMap;
    });

    // UI 상태 업데이트 (전체 업데이트)
    setPlayerStats((prev) =>
      sortPlayerStats(
        prev.map((player) => {
          const updated = { ...player, attendance: newAttendance };
          updated.totalPoint = calculateTotalPoint(updated.attendance, updated.goals, updated.assists, updated.cleanSheet, updated.mom);
          return updated;
        })
      )
    );
  }, [playerStats, setAttendanceMap, setPlayerStats]);

  return {
    isAllAttended,
    handleAttendanceToggle,
    handleToggleAllAttendance,
  };
}
