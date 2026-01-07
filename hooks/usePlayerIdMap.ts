/**
 * 선수 ID 매핑 관리 커스텀 훅
 *
 * API에서 선수 목록을 가져와 이름을 키로 하는 ID 매핑을 생성합니다.
 *
 * @returns {Map<string, number>} 선수 이름을 키로 하는 ID 매핑
 *
 * 사용처:
 * - components/records/AttendanceTable.tsx: 출석 테이블에서 선수 ID 조회
 */

import { useState, useEffect } from "react";
import { getPlayers } from "@/services/playersService";
import { Player } from "@/types/api";

export function usePlayerIdMap(): Map<string, number> {
  const [playerIdMap, setPlayerIdMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const loadPlayerIdMap = async () => {
      try {
        const apiPlayers: Player[] = await getPlayers();
        const map = new Map<string, number>();
        apiPlayers.forEach((player) => {
          map.set(player.name, player.id);
        });
        setPlayerIdMap(map);
      } catch (error) {
        console.error("[usePlayerIdMap] Failed to load players:", error);
      }
    };
    loadPlayerIdMap();
  }, []);

  return playerIdMap;
}
