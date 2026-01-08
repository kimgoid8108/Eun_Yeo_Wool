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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://jochukback.onrender.com";

/**
 * 특정 날짜의 경기 기록 조회
 */
export async function getRecordsByDate(dateId: string): Promise<DateRecordsResponse> {
  // 프론트에서 전달되는 dateId는 밀리초 타임스탬프입니다.
  // 백엔드에 존재하는 엔드포인트들을 조합해 DateRecordsResponse 형태로 만들어 반환합니다.
  const numeric = Number(dateId);
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const d = new Date(numeric + KST_OFFSET);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

  // 1) 해당 날짜의 Matches 조회 (백엔드: /matches/:YYYY-MM-DD)
  // 1) 우선적으로 날짜별 Matches 엔드포인트 시도
  let matches = await apiGet<any[]>(`/matches/${dateStr}`);

  // 1a) 만약 엔드포인트가 비어있거나 지원하지 않으면 전체 조회 후 필터링
  if (!Array.isArray(matches) || matches.length === 0) {
    try {
      const allMatches = await apiGet<any[]>(`/matches`);
      matches = (allMatches || []).filter((m) => m.matchDate === dateStr);
    } catch (e) {
      matches = [];
    }
  }
  const playerRecords = await apiGet<any[]>(`/player-records`, { dateId: numeric });

  // 3) teams 구성: playerRecords를 teamId로 그룹화하여 팀과 선수 배열 생성
  const teamsMap: Record<string, any> = {};
  for (const rec of playerRecords) {
    const key = String(rec.teamId || "__no_team");
    if (!teamsMap[key]) {
      teamsMap[key] = {
        id: rec.team?.id ?? null,
        teamName: rec.team?.teamName ?? `팀_${rec.teamId ?? "unknown"}`,
        dateId: dateStr,
        players: [],
      };
    }
    if (rec.player) {
      teamsMap[key].players.push(rec.player);
    }
  }

  const teams = Object.values(teamsMap);

  // 4) matches 변환: 백엔드 Matches 엔티티를 프론트 타입(간단 매핑)으로 변환
  const mappedMatches = matches.map((m) => ({
    id: String(m.id),
    matchDate: m.matchDate ?? m.matchDate,
    matchOrder: m.matchOrder ?? m.match_order ?? null,
    teamId: m.teamId ?? m.team_id ?? null,
    createdAt: m.createdAt ?? m.created_at ?? null,
  }));

  return {
    teams,
    matches: matches,
  } as DateRecordsResponse;
}

/**
 * 모든 경기 기록 목록 조회
 * 엔드포인트: GET /match-records
 */
export async function getAllMatchRecords(): Promise<MatchRecordsResponse[]> {
  console.log("[recordsService] Fetching all match records:", {
    endpoint: `/match-records`,
  });

  try {
    const response = await apiGet<MatchRecordsResponse[]>(`/match-records`);
    console.log("[recordsService] All match records fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("[recordsService] Failed to fetch all match records:", {
      endpoint: `/match-records`,
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
    endpoint: `/teams`,
    name,
  });

  try {
    const response = await apiPost<{ id: number }>(`/teams`, {
      teamName: name,
    });
    console.log("[recordsService] Team created successfully:", response);
    return response;
  } catch (error) {
    console.error("[recordsService] Failed to create team:", {
      endpoint: `/teams`,
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
    endpoint: `/team-players`,
    teamId,
    playerId,
    joinedAt,
  });

  try {
    await apiPost<void>(`/team-players`, {
      teamId,
      playerId,
      joinedAt,
    });
    console.log("[recordsService] Player added successfully:", { teamId, playerId });
  } catch (error) {
    console.error("[recordsService] Failed to add player to team:", {
      endpoint: `/team-players`,
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
    endpoint: `/team-players`,
    data,
    dataStringified: JSON.stringify(data),
  });

  try {
    const response = await apiPost<TeamResponse>(`/team-players`, data);
    console.log("[recordsService] Team created successfully:", response);
    return response;
  } catch (error) {
    console.error("[recordsService] Failed to create team:", {
      endpoint: `/team-players`,
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
  return apiPost<MatchResponse>(`/matches`, data);
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
    endpoint: "/player-records/:dateId",
    dateId,
  });

  try {
    const response = await apiGet<PlayerRecordResponse[]>("/player-records/:dateId", {
      dateId,
    });
    console.log("[recordsService] Player records fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("[recordsService] Failed to fetch player records:", {
      endpoint: "/player-records/:dateId",
      dateId,
      error,
    });
    // 에러 발생 시 빈 배열 반환 (저장된 데이터가 없음을 의미)
    return [];
  }
}
