/**
 * 선수 통계 데이터 관리 커스텀 훅
 *
 * 선수 통계를 로드하고 관리하는 로직을 담당합니다.
 *
 * @param {string} selectedDate - 선택된 날짜 ID (string, 실제 days의 id는 number임)
 * @param {Array} customPlayers - 커스텀 선수 목록
 * @param {number} dateId - 날짜 ID (숫자, 직접 주입받거나 undefined)
 * @param {Map<string, number>} playerIdMap - 선수 ID 매핑
 * @param {{ wins: number; draws: number; loses: number }} teamRecord - 팀 승무패 기록
 * @returns {object} 선수 통계 관련 상태 및 함수들
 *
 * 사용처:
 * - components/records/AttendanceTable.tsx: 출석 테이블에서 선수 통계 로드 및 관리
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { PlayerStat, AttendanceState, PlayerRecordResponse } from "@/types/playerStats";
import { getPlayerRecords } from "@/services/recordsService";
import { days, Day } from "@/data/days";
import { sortPlayerStats, calculateTotalPoint, createPlayerRecordMap } from "@/utils/playerStatsUtils";

export function usePlayerStats(
  selectedDate: string,
  customPlayers: { name: string; position: string }[],
  dateId: number | undefined,
  playerIdMap: Map<string, number>,
  teamRecord: { wins: number; draws: number; loses: number }
) {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceState>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // 선수 통계 로드
  useEffect(() => {
    if (!selectedDate || playerIdMap.size === 0) {
      if (!selectedDate) setPlayerStats([]);
      return;
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const loadPlayerStats = async () => {
      let numericDateId: number | undefined = undefined;

      // 1. dateId로 우선 사용 (정확함)
      if (typeof dateId === "number") {
        numericDateId = dateId;
      }
      // 2. days에서 string to number 매칭 (id: number ←→ selectedDate: string)
      else {
        // days[].id는 number, selectedDate는 string
        const foundDay: Day | undefined = days.find((d) => String(d.id) === String(selectedDate));
        // day.id는 number
        if (foundDay) {
          numericDateId = foundDay.id;
        }
      }
      // 3. 못 찾으면 undefined가 유지됨

      let playerRecordMap = new Map<number, PlayerRecordResponse>();
      if (typeof numericDateId === "number") {
        try {
          const savedRecords: PlayerRecordResponse[] = await getPlayerRecords(numericDateId);
          if (savedRecords?.length > 0) {
            playerRecordMap = createPlayerRecordMap(savedRecords);
          }
        } catch (error) {
          if (error instanceof Error && error.name !== "AbortError") {
            console.error("[usePlayerStats] Failed to load saved records from DB:", error);
          }
        }
      }

      // 모든 선수에 대해 프론트 상태 초기화 (DB에서 불러온 참석자 + 불참자 모두 포함)
      const stats: PlayerStat[] = customPlayers
        .map((player) => {
          const apiPlayerId = playerIdMap.get(player.name);
          if (apiPlayerId === undefined) {
            console.warn(`[usePlayerStats] Player ID not found for: ${player.name}`);
            return null;
          }

          // DB에서 저장된 기록 조회 (참석자만 DB에 저장되므로, 있으면 참석, 없으면 불참)
          const savedRecord = playerRecordMap.get(apiPlayerId);
          const attendanceValue = savedRecord?.attendance ?? false;
          const attendance = attendanceValue ? 1 : 0;

          const totalPoint = calculateTotalPoint(attendance, 0, 0, 0, 0);

          return {
            id: apiPlayerId,
            name: player.name,
            position: player.position,
            attendance,
            goals: 0,
            assists: 0,
            cleanSheet: 0,
            wins: teamRecord.wins,
            draws: teamRecord.draws,
            loses: teamRecord.loses,
            mom: 0,
            totalPoint,
          };
        })
        .filter((stat): stat is PlayerStat => stat !== null);

      // 프론트 전용 출석 상태 초기화 (playerName 포함)
      const initialAttendanceMap: Record<number, AttendanceState> = {};
      stats.forEach((stat) => {
        const savedRecord = playerRecordMap.get(stat.id);
        initialAttendanceMap[stat.id] = {
          playerName: stat.name,
          attendance: savedRecord?.attendance ?? false,
        };
      });
      setAttendanceMap(initialAttendanceMap);
      setPlayerStats(sortPlayerStats(stats));
    };

    loadPlayerStats();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedDate, customPlayers, dateId, playerIdMap, teamRecord]);

  const updatePlayerStat = useCallback((playerId: number, updater: (player: PlayerStat) => PlayerStat) => {
    setPlayerStats((prev) => sortPlayerStats(prev.map((p) => (p.id === playerId ? updater(p) : p))));
  }, []);

  return {
    playerStats,
    setPlayerStats,
    attendanceMap,
    setAttendanceMap,
    updatePlayerStat,
  };
}
