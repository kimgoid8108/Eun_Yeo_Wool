/**
 * 경기 기록 API 서비스
 *
 * 경기 기록, 팀 정보, 선수 기록 등 관련 API 호출을 담당하는 서비스 모듈입니다.
 *
 * 주요 기능:
 * - 팀 정보 및 경기 결과 CRUD 작업
 * - 날짜별 경기 기록 조회
 * - 선수 경기 기록 저장 및 조회
 *
 * 사용처:
 * - app/records/page.tsx: 기록지 페이지의 모든 데이터 CRUD 작업
 *   - getRecordsByDate: 날짜별 기록 조회
 *   - createTeamOnly: 팀 생성
 *   - addPlayerToTeam: 팀에 선수 추가
 *   - createMatch, updateMatch, deleteMatch: 경기 결과 관리
 * - components/records/AttendanceTable.tsx: 출석 기록 저장 및 조회
 *   - savePlayerRecord: 선수 출석 기록 저장
 *   - getPlayerRecords: 날짜별 선수 기록 조회
 */

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { TeamRequest, TeamResponse, MatchCreateRequest, MatchUpdateRequest, MatchResponse, DateRecordsResponse, PlayerRecordRequest, PlayerRecordResponse, MatchRecordsResponse } from "@/types/api";

/**
 * 특정 날짜의 경기 기록 조회
 */
export async function getRecordsByDate(dateId: string): Promise<DateRecordsResponse> {
  return apiGet<DateRecordsResponse>(`/records/${dateId}`);
}

/**
 * 모든 경기 기록 목록 조회
 * 엔드포인트: GET /match-records
 */
export async function getAllMatchRecords(): Promise<MatchRecordsResponse[]> {
  console.log("[recordsService] Fetching all match records:", {
    endpoint: "/match-records",
  });

  try {
    const response = await apiGet<MatchRecordsResponse[]>("/match-records");
    console.log("[recordsService] All match records fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("[recordsService] Failed to fetch all match records:", {
      endpoint: "/match-records",
      error,
    });
    // 에러 발생 시 빈 배열 반환
    return [];
  }
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
export async function createMatch(data: MatchCreateRequest): Promise<MatchResponse> {
  return apiPost<MatchResponse>("/matches", data);
}

/**
 * 경기 결과 수정
 */
export async function updateMatch(matchId: string, data: Partial<MatchUpdateRequest>): Promise<MatchResponse> {
  return apiPut<MatchResponse>(`/matches/${matchId}`, data);
}

/**
 * 경기 결과 삭제
 */
export async function deleteMatch(matchId: string): Promise<void> {
  return apiDelete<void>(`/matches/${matchId}`);
}

/**
 * 선수 경기 기록 추가/수정
 * 엔드포인트: POST /player-records
 * 백엔드 DTO: CreatePlayerRecordDto
 *
 * 출석 상태는 boolean 하나로만 관리:
 * - true: 참석 (체크됨)
 * - false: 불참 (체크 안됨)
 *
 * Payload 필드 (4개만 허용):
 * - playerId: number (필수)
 * - teamId: number (필수)
 * - dateId: number (필수)
 * - attendance: boolean (필수)
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
export async function savePlayerRecord(data: { playerId: number; teamId: number; dateId: number; attendance: boolean }): Promise<void> {
  // 백엔드 DTO에 맞게 payload 명시적으로 재구성
  // 서버 DTO에 정의된 필드만 포함 (yellowCard, redCard 등 불필요한 필드 절대 포함하지 않음)
  const payload: PlayerRecordRequest = {
    playerId: data.playerId,
    teamId: data.teamId,
    dateId: data.dateId,
    attendance: data.attendance,
  };

  console.log("[recordsService] Saving player record:", {
    endpoint: "/player-records",
    payload,
  });

  try {
    await apiPost<void>("/player-records", payload);
    console.log("[recordsService] Player record saved successfully:", payload);
  } catch (error) {
    console.error("[recordsService] Failed to save player record:", {
      endpoint: "/player-records",
      payload,
      error,
    });
    throw error;
  }
}

/**
 * 팀의 선수 경기 기록 조회
 * 엔드포인트: GET /player-records?dateId={dateId}
 */
export async function getPlayerRecords(dateId: number): Promise<PlayerRecordResponse[]> {
  console.log("[recordsService] Fetching player records:", {
    endpoint: "/player-records",
    dateId,
  });

  try {
    const response = await apiGet<PlayerRecordResponse[]>("/player-records", {
      dateId,
    });
    console.log("[recordsService] Player records fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("[recordsService] Failed to fetch player records:", {
      endpoint: "/player-records",
      dateId,
      error,
    });
    // 에러 발생 시 빈 배열 반환 (저장된 데이터가 없음을 의미)
    return [];
  }
}
