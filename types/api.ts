/**
 * API 요청/응답 타입 정의
 */

import { TeamInfo } from "./records";

/**
 * API 응답 래퍼
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

/* ============================
   팀 관련
============================ */

export interface TeamRequest {
  dateId: string;
  teamName: string;
  players: { name: string; position: string }[];
}

export interface TeamResponse extends TeamInfo {
  id: number; // ✅ number로 고정
  dateId: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ============================
   경기 관련
============================ */

/** 경기 생성 요청 */
export interface MatchCreateRequest {
  matchDate: string;
  matchOrder: number;
  teamId: number;
  team1Score: number;
  team2Score: number;
}

/** 경기 수정 요청 */
export interface MatchUpdateRequest {
  matchDate: string;
  matchOrder: number;
  teamId: number;
  team1Score: number;
  team2Score: number;
}

/** 경기 응답 */
export interface MatchResponse {
  id: string; // Swagger 기준: string 또는 number일 수 있음 (실제 응답 확인 필요)
  dateId: string;

  team1Id: number;
  team1Name: string;
  team1Score: number;
  team1Result: "WIN" | "LOSE" | "DRAW";

  team2Id: number;
  team2Name: string;
  team2Score: number;
  team2Result: "WIN" | "LOSE" | "DRAW";

  createdAt?: string;
  updatedAt?: string;
}

/** 날짜별 기록 */
export interface DateRecordsResponse {
  teams: TeamResponse[];
  matches: MatchResponse[];
}

/** 모든 경기 기록 목록 응답 */
export interface MatchRecordsResponse {
  dateId: number;
  date: string; // ISO 8601 형식
  teams?: TeamResponse[];
  matches?: MatchResponse[];
}

/* ============================
   선수 관련
============================ */

export interface PlayerResponse {
  id: number;
  name: string;
  createdAt: string;
}

export type Player = PlayerResponse;

/* ============================
   선수 경기 기록
============================ */

export interface PlayerRecordRequest {
  playerId: number;
  teamId: number;
  dateId: number;
  attendance: boolean;
}

export interface PlayerRecordResponse {
  playerId: number;
  teamId: number;
  dateId: number;
  attendance: boolean;
}
