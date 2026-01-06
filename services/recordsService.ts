/**
 * 경기 기록 API 서비스
 * - 팀 정보 및 경기 결과 CRUD 작업
 */

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { TeamRequest, TeamResponse, MatchRequest, MatchResponse, DateRecordsResponse } from "@/types/api";

/**
 * 특정 날짜의 경기 기록 조회
 */
export async function getRecordsByDate(dateId: string): Promise<DateRecordsResponse> {
  return apiGet<DateRecordsResponse>(`/records/${dateId}`);
}

/**
 * 팀 생성
 * 엔드포인트: POST /teams
 * DTO: { teamName: string }
 */
export async function createTeamOnly(name: string): Promise<{ id: number }> {
  console.log("[recordsService] Creating team:", {
    endpoint: "/teams",
    name,
  });

  try {
    const response = await apiPost<{ id: number }>("/teams", {
      teamName: name,
    });
    console.log("[recordsService] Team created successfully:", response);
    return response;
  } catch (error) {
    console.error("[recordsService] Failed to create team:", {
      endpoint: "/teams",
      name,
      error,
    });
    throw error;
  }
}

/**
 * 팀에 선수 추가 (개별 선수 등록)
 * 엔드포인트: POST /team-players
 * DTO: { teamId: number, playerId: number, joinedAt: string (ISO 8601) }
 */
export async function addPlayerToTeam(teamId: number, playerId: number, joinedAt: string): Promise<void> {
  console.log("[recordsService] Adding player to team:", {
    endpoint: "/team-players",
    teamId,
    playerId,
    joinedAt,
  });

  try {
    await apiPost<void>("/team-players", {
      teamId,
      playerId,
      joinedAt,
    });
    console.log("[recordsService] Player added successfully:", { teamId, playerId });
  } catch (error) {
    console.error("[recordsService] Failed to add player to team:", {
      endpoint: "/team-players",
      teamId,
      playerId,
      joinedAt,
      error,
    });
    throw error;
  }
}

/**
 * 팀 추가 (레거시 - 호환성 유지)
 * 엔드포인트: POST /team-players
 * @deprecated 이 함수는 더 이상 사용되지 않습니다. addPlayerToTeam을 사용하세요.
 */
export async function createTeam(data: TeamRequest): Promise<TeamResponse> {
  console.log("[recordsService] Creating team:", {
    endpoint: "/team-players",
    data,
    dataStringified: JSON.stringify(data),
  });

  try {
    const response = await apiPost<TeamResponse>("/team-players", data);
    console.log("[recordsService] Team created successfully:", response);
    return response;
  } catch (error) {
    console.error("[recordsService] Failed to create team:", {
      endpoint: "/team-players",
      data,
      error,
    });
    throw error;
  }
}

/**
 * 팀 수정
 */
export async function updateTeam(teamId: string, data: Partial<TeamRequest>): Promise<TeamResponse> {
  return apiPut<TeamResponse>(`/teams/${teamId}`, data);
}

/**
 * 팀 삭제
 */
export async function deleteTeam(teamId: string): Promise<void> {
  return apiDelete<void>(`/teams/${teamId}`);
}

/**
 * 경기 결과 추가
 */
export async function createMatch(data: MatchRequest): Promise<MatchResponse> {
  return apiPost<MatchResponse>("/matches", data);
}

/**
 * 경기 결과 수정
 */
export async function updateMatch(matchId: string, data: Partial<MatchRequest>): Promise<MatchResponse> {
  return apiPut<MatchResponse>(`/matches/${matchId}`, data);
}

/**
 * 경기 결과 삭제
 */
export async function deleteMatch(matchId: string): Promise<void> {
  return apiDelete<void>(`/matches/${matchId}`);
}
