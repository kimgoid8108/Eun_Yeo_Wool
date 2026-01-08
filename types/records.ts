/**
 * 기록지 관련 타입 정의
 */

export interface TeamInfo {
  teamName: string;
  players: PlayerInfo[];
}

export interface PlayerInfo {
  name: string;
  position: string;
}

export type ViewMode = "records" | "result";

/**
 * 경기 결과 타입
 */
export type MatchResult = "WIN" | "DRAW" | "LOSE";

/**
 * 경기 입력 타입 (모달에서 사용)
 */
export interface MatchInput {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
}

/**
 * 경기 결과 인터페이스
 */
export interface MatchScore {
  id?: string; // 경기 고유 ID
  team1Name: string; // 첫 번째 팀 이름
  team1Score: number; // 첫 번째 팀 스코어
  team1Result: MatchResult; // 첫 번째 팀 결과 (승무패)
  team2Name: string; // 두 번째 팀 이름
  team2Score: number; // 두 번째 팀 스코어
  team2Result: MatchResult; // 두 번째 팀 결과 (승무패)
}
