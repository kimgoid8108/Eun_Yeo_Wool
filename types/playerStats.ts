/**
 * 선수 통계 관련 타입 정의
 *
 * 사용처:
 * - components/records/AttendanceTable.tsx: 출석 테이블에서 선수 통계 관리
 */

export interface PlayerStat {
  id: number;
  name: string;
  position: string;
  attendance: number;
  goals: number;
  assists: number;
  cleanSheet: number;
  wins: number;
  draws: number;
  loses: number;
  mom: number;
  totalPoint: number;
}

export type MatchScore = {
  team1Name: string;
  team2Name: string;
  team1Result: "WIN" | "DRAW" | "LOSE";
  team2Result: "WIN" | "DRAW" | "LOSE";
};

export type PlayerRecordResponse = {
  playerId: number;
  attendance: boolean;
};

/**
 * 출석 상태 타입: 프론트 전용 상태 (DB 저장 필드 제외)
 */
export type AttendanceState = {
  playerName: string;
  attendance: boolean;
};
