/**
 * API 요청/응답 타입 정의
 */

import { TeamInfo, MatchScore } from "./records";

/**
 * API 응답 래퍼 타입
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

/**
 * 경기 기록 관련 API 타입
 */

// 팀 정보 요청/응답
export interface TeamRequest {
  dateId: string;
  teamName: string;
  players: { name: string; position: string }[];
}

export interface TeamResponse extends TeamInfo {
  id: string;
  dateId: string;
  createdAt?: string;
  updatedAt?: string;
}

// 경기 결과 요청/응답
export interface MatchRequest {
  dateId: string;
  team1Name: string;
  team1Score: number;
  team2Name: string;
  team2Score: number;
}

export interface MatchResponse extends MatchScore {
  dateId: string;
  createdAt?: string;
  updatedAt?: string;
}

// 날짜별 데이터 조회 응답
export interface DateRecordsResponse {
  teams: TeamResponse[];
  matches: MatchResponse[];
}

/**
 * 회원(선수) 관련 API 타입
 */
export interface PlayerResponse {
  id: number;
  name: string;
  createdAt: string;
}

/**
 * Player 타입 (PlayerResponse의 별칭)
 * 서비스 레이어에서 사용
 */
export type Player = PlayerResponse;

/**
 * 선수 경기 기록 요청 타입 (백엔드 CreatePlayerRecordDto와 1:1 대응)
 *
 * 출석 상태는 boolean 하나로만 관리:
 * - true: 참석 (체크됨)
 * - false: 불참 (체크 안됨)
 *
 * 제거된 필드:
 * - yellowCard (더 이상 사용하지 않음)
 * - redCard (더 이상 사용하지 않음)
 * - isMOM (더 이상 사용하지 않음)
 * - matchId (더 이상 사용하지 않음)
 * - cleanSheet (더 이상 사용하지 않음)
 * - goal (더 이상 사용하지 않음)
 * - assist (더 이상 사용하지 않음)
 */
export interface PlayerRecordRequest {
  playerId: number;
  teamId: number;
  dateId: number;
  attendance: boolean;
}

/**
 * 선수 경기 기록 응답 타입
 *
 * 출석 상태는 boolean 하나로만 관리:
 * - true: 참석 (체크됨)
 * - false: 불참 (체크 안됨)
 *
 * 제거된 필드:
 * - yellowCard (더 이상 사용하지 않음)
 * - redCard (더 이상 사용하지 않음)
 * - isMOM (더 이상 사용하지 않음)
 * - matchId (더 이상 사용하지 않음)
 * - cleanSheet (더 이상 사용하지 않음)
 * - goal (더 이상 사용하지 않음)
 * - assist (더 이상 사용하지 않음)
 */
export interface PlayerRecordResponse {
  playerId: number;
  teamId: number;
  dateId: number;
  attendance: boolean;
}
