/**
 * 선수 통계 관련 유틸리티 함수
 *
 * 사용처:
 * - components/records/AttendanceTable.tsx: 출석 테이블에서 선수 통계 계산 및 정렬
 */

import { scoringRules } from "@/data/rules";
import { PlayerStat, MatchScore, PlayerRecordResponse } from "@/types/playerStats";

/**
 * 선수 통계 정렬 함수
 * 출석한 선수를 먼저 표시하고, 총점 순으로 정렬합니다.
 *
 * @param {PlayerStat[]} stats - 정렬할 선수 통계 배열
 * @returns {PlayerStat[]} 정렬된 선수 통계 배열
 */
export function sortPlayerStats(stats: PlayerStat[]): PlayerStat[] {
  return [...stats].sort((a, b) => {
    if (a.attendance > 0 && b.attendance === 0) return -1;
    if (a.attendance === 0 && b.attendance > 0) return 1;
    return b.totalPoint - a.totalPoint;
  });
}

/**
 * 선수 총점 계산 함수
 *
 * @param {number} attendance - 출석 여부 (0 또는 1)
 * @param {number} goals - 골 수
 * @param {number} assists - 어시스트 수
 * @param {number} cleanSheet - 클린시트 수
 * @param {number} mom - MOM 수
 * @returns {number} 계산된 총점
 */
export function calculateTotalPoint(attendance: number, goals: number, assists: number, cleanSheet: number, mom: number): number {
  const attendanceScore = attendance > 0 ? scoringRules.attendance : 0;
  return attendanceScore + goals * scoringRules.goal + assists * scoringRules.assist + cleanSheet * scoringRules.cleanSheet + mom * scoringRules.mom;
}

/**
 * 팀 승무패 기록 계산 함수
 *
 * @param {MatchScore[]} matches - 경기 결과 배열
 * @param {string} teamName - 팀 이름
 * @returns {{ wins: number; draws: number; loses: number }} 팀의 승무패 기록
 */
export function calculateTeamRecord(matches: MatchScore[], teamName: string) {
  if (matches.length === 0) return { wins: 0, draws: 0, loses: 0 };

  const teamMatches = matches.filter((m) => m.team1Name === teamName || m.team2Name === teamName);
  let wins = 0;
  let draws = 0;
  let loses = 0;

  teamMatches.forEach((match) => {
    const teamResult = match.team1Name === teamName ? match.team1Result : match.team2Result;
    if (teamResult === "WIN") wins++;
    else if (teamResult === "DRAW") draws++;
    else if (teamResult === "LOSE") loses++;
  });

  return { wins, draws, loses };
}

/**
 * 선수 기록 배열을 Map으로 변환하는 함수
 *
 * @param {PlayerRecordResponse[]} records - 선수 기록 배열
 * @returns {Map<number, PlayerRecordResponse>} playerId를 키로 하는 Map
 */
export function createPlayerRecordMap(records: PlayerRecordResponse[]): Map<number, PlayerRecordResponse> {
  const map = new Map<number, PlayerRecordResponse>();
  records.forEach((record) => {
    map.set(record.playerId, record);
  });
  return map;
}
