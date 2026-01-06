/**
 * 경기 기록 API 서비스
 * - 팀 정보 및 경기 결과 CRUD 작업
 */

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import {
  TeamRequest,
  TeamResponse,
  MatchRequest,
  MatchResponse,
  DateRecordsResponse,
} from "@/types/api";

/**
 * 특정 날짜의 경기 기록 조회
 */
export async function getRecordsByDate(dateId: string): Promise<DateRecordsResponse> {
  return apiGet<DateRecordsResponse>(`/api/records/${dateId}`);
}

/**
 * 팀 추가
 */
export async function createTeam(data: TeamRequest): Promise<TeamResponse> {
  return apiPost<TeamResponse>("/api/teams", data);
}

/**
 * 팀 수정
 */
export async function updateTeam(teamId: string, data: Partial<TeamRequest>): Promise<TeamResponse> {
  return apiPut<TeamResponse>(`/api/teams/${teamId}`, data);
}

/**
 * 팀 삭제
 */
export async function deleteTeam(teamId: string): Promise<void> {
  return apiDelete<void>(`/api/teams/${teamId}`);
}

/**
 * 경기 결과 추가
 */
export async function createMatch(data: MatchRequest): Promise<MatchResponse> {
  return apiPost<MatchResponse>("/api/matches", data);
}

/**
 * 경기 결과 수정
 */
export async function updateMatch(matchId: string, data: Partial<MatchRequest>): Promise<MatchResponse> {
  return apiPut<MatchResponse>(`/api/matches/${matchId}`, data);
}

/**
 * 경기 결과 삭제
 */
export async function deleteMatch(matchId: string): Promise<void> {
  return apiDelete<void>(`/api/matches/${matchId}`);
}
