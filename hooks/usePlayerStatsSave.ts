/**
 * 선수 통계 저장 관리 커스텀 훅
 *
 * 선수 통계를 DB에 저장하는 로직을 담당합니다.
 *
 * @param {PlayerStat[]} playerStats - 선수 통계 배열
 * @param {Record<number, AttendanceState>} attendanceMap - 출석 상태 맵
 * @param {number | undefined} dateId - 날짜 ID
 * @param {number | undefined} teamId - 팀 ID
 * @param {string} selectedDate - 선택된 날짜 ID (days의 id는 number임)
 * @param {function} setPlayerStats - 선수 통계 업데이트 함수
 * @param {function} setAttendanceMap - 출석 상태 업데이트 함수
 * @returns {object} 저장 관련 상태 및 함수들
 *
 * 사용처:
 * - components/records/AttendanceTable.tsx: 출석 테이블에서 선수 통계 저장
 */

import { useState, useCallback } from "react";
import { PlayerStat, AttendanceState, PlayerRecordResponse } from "@/types/playerStats";
import { savePlayerRecord, getPlayerRecords } from "@/services/recordsService";
import { days } from "@/data/days";
import { sortPlayerStats, calculateTotalPoint, createPlayerRecordMap } from "@/utils/playerStatsUtils";

export function usePlayerStatsSave(
  playerStats: PlayerStat[],
  attendanceMap: Record<number, AttendanceState>,
  dateId: number | undefined,
  teamId: number | undefined,
  selectedDate: string,
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStat[]>>,
  setAttendanceMap: React.Dispatch<React.SetStateAction<Record<number, AttendanceState>>>
) {
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSaveAll = useCallback(async () => {
    if (dateId === undefined || teamId === undefined || playerStats.length === 0) {
      alert(dateId === undefined ? "날짜 정보가 없어 저장할 수 없습니다." : teamId === undefined ? "팀 정보가 없어 저장할 수 없습니다." : "저장할 데이터가 없습니다.");
      return;
    }

    setIsSaving(true);
    try {
      // 참석자(attendance === true)만 필터링하여 DB에 저장
      const playersToSave = playerStats.filter((player) => {
        const attendanceState = attendanceMap[player.id];
        return attendanceState?.attendance === true;
      });

      if (playersToSave.length === 0) {
        alert("저장할 참석자가 없습니다.");
        setIsSaving(false);
        return;
      }

      // 참석자만 DB에 저장 (payload: playerId, teamId, dateId, attendance: true)
      const savePromises = playersToSave.map((player) =>
        savePlayerRecord({
          playerId: player.id,
          teamId,
          dateId,
          attendance: true, // 참석자만 저장하므로 항상 true
        })
      );

      await Promise.all(savePromises);
      alert(`참석자 ${playersToSave.length}명의 데이터가 저장되었습니다!`);

      // DB 저장 후 최신 데이터 다시 불러오기 (참석자만 DB에 있음)
      // days[].id: number, selectedDate: string
      // -> id를 string으로 변환 후 비교
      const foundDay = days.find((d) => String(d.id) === String(selectedDate));
      const numericDateId = typeof dateId === "number" ? dateId : foundDay?.id;

      if (typeof numericDateId === "number") {
        try {
          const savedRecords: PlayerRecordResponse[] = await getPlayerRecords(numericDateId.toString());
          const playerRecordMap = createPlayerRecordMap(savedRecords);

          // 프론트 전용 출석 상태 업데이트 (DB에서 불러온 참석자 + 프론트 상태의 불참자 모두 유지)
          setAttendanceMap((prevMap) => {
            const updatedMap: Record<number, AttendanceState> = { ...prevMap };
            // DB에서 불러온 참석자 정보로 업데이트
            savedRecords.forEach((record) => {
              const existing = prevMap[record.playerId];
              updatedMap[record.playerId] = {
                playerName: existing?.playerName ?? playerStats.find((p) => p.id === record.playerId)?.name ?? "",
                attendance: record.attendance, // DB에서 불러온 값 (항상 true)
              };
            });
            // 불참자는 프론트 상태 유지 (DB에 저장되지 않았으므로 프론트 상태 그대로)
            return updatedMap;
          });

          // UI 상태 업데이트 (참석자만 DB에서 불러온 값으로 업데이트, 불참자는 프론트 상태 유지)
          setPlayerStats((prev) =>
            sortPlayerStats(
              prev.map((stat) => {
                const savedRecord = playerRecordMap.get(stat.id);
                if (savedRecord) {
                  // DB에 저장된 참석자: DB 값으로 업데이트
                  const attendance = savedRecord.attendance ? 1 : 0;
                  const updated = { ...stat, attendance };
                  updated.totalPoint = calculateTotalPoint(attendance, 0, 0, 0, 0);
                  return updated;
                }
                // DB에 없는 불참자: 프론트 상태 유지
                return stat;
              })
            )
          );
        } catch (error) {
          console.error("[usePlayerStatsSave] Failed to reload saved records after save:", error);
        }
      }
    } catch (error) {
      console.error("[usePlayerStatsSave] Failed to save all records to DB:", error);
      alert("데이터 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [playerStats, dateId, teamId, attendanceMap, selectedDate, setPlayerStats, setAttendanceMap]);

  return {
    isSaving,
    handleSaveAll,
  };
}
