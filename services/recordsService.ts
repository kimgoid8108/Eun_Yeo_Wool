/**
 * 경기 기록 API 서비스
 *
 * 날짜별 팀 조회 시, 해당 날짜(dateId)에 해당하는 팀만 보여주고,
 * 다른 날짜의 팀이 섞여서 나오는 문제(예: 1월 3일팀을 불러올 때 5월 9일팀까지 같이 나오는 현상)를 방지합니다.
 *
 * 프론트에서 날짜 칸을 누르면, 해당 날짜에 추가된 팀이 어떤 것들인지 바로 확인할 수 있도록
 * 해당 날짜(dateId)에 등록된 팀만 조회하는 API를 제공합니다.
 *
 * 이 파일은 경기 기록/팀/선수 기록 등 관련 API 호출 모듈입니다.
 */

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { TeamRequest, TeamResponse, MatchCreateRequest, MatchUpdateRequest, MatchResponse, DateRecordsResponse, PlayerRecordRequest, PlayerRecordResponse, MatchRecordsResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://jochukback.onrender.com";

function getDateStringKST(dateInput: string | number): string {
  // dateInput이 yyyy-mm-dd string이면 그대로, 숫자(timestamp)이면 KST로 맞추기
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  let timestamp: number;
  if (typeof dateInput === "string" && !isNaN(Number(dateInput))) {
    timestamp = Number(dateInput);
  } else if (typeof dateInput === "number") {
    timestamp = dateInput;
  } else {
    throw new Error("[recordsService] Invalid dateId: " + String(dateInput));
  }
  // KST는 UTC+9, 자바스크립트 Date.UTC 기준으로 맞춥니다
  const d = new Date(timestamp);
  // KST 기준 날짜로 변환 (timestamp가 이미 KST면 여기에 +9시간 더하면 안됨)
  // 서버 저장이 UTC 타임스탬프라면 +9시간, 클라에서 밀리초로 전달이면 그대로
  // 일단 시간대를 보정하지 않고 그대로 변환 (문제시 여기 조정)
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function getRecordsByDate(dateId: string | number): Promise<DateRecordsResponse & { addedTeams: any[] }> {
  let dateStr: string;
  try {
    dateStr = getDateStringKST(dateId);
  } catch (e) {
    console.error("[recordsService] getRecordsByDate invalid dateId:", dateId, e);
    throw e;
  }

  // 1) 해당 날짜의 매치만 조회
  let matches: any[] = [];
  try {
    matches = await apiGet<any[]>(`/matches/${dateStr}`);
    if (!Array.isArray(matches)) matches = [];
  } catch (e) {
    matches = [];
  }
  matches = (matches || []).filter((m) => m && m.matchDate === dateStr);
  if (matches.length === 0) {
    try {
      const allMatches = await apiGet<any[]>(`/matches`);
      matches = (allMatches || []).filter((m) => m && m.matchDate === dateStr);
    } catch (e) {
      matches = [];
    }
  }

  // 2) 해당 날짜의 선수 출석 기록만!
  let playerRecords: any[] = [];
  try {
    playerRecords = await apiGet<any[]>(`/player-records`, { dateId: dateStr });
    playerRecords = (playerRecords || []).filter((rec) => {
      if (!rec) return false;
      if (rec.dateId === dateStr) return true;
      if (typeof rec.dateId === "number") {
        try {
          const recDateStr = getDateStringKST(rec.dateId);
          if (recDateStr === dateStr) return true;
        } catch (_) {}
      }
      // team의 dateId까지 검사
      if (rec.team && rec.team.dateId) {
        try {
          const teamDateStr = getDateStringKST(rec.team.dateId);
          if (teamDateStr === dateStr) return true;
        } catch (_) {}
      }
      return false;
    });
  } catch (err) {
    playerRecords = [];
  }

  // 3) 해당 날짜(dateId)에 생성된 팀 모두 조회
  let teamsRaw: any[] = [];
  try {
    teamsRaw = await apiGet<any[]>(`/teams`);
    if (!Array.isArray(teamsRaw)) teamsRaw = [];
  } catch (err) {
    teamsRaw = [];
  }

  // 날짜에 추가(등록)된 팀 구하기
  const addedTeams = (teamsRaw || []).filter((team) => {
    if (!team) return false;
    // 1. team.dateId: "yyyy-mm-dd" string
    if (typeof team.dateId === "string" && team.dateId === dateStr) return true;
    // 2. team.dateId: number 형식 timestamp
    if (team.dateId && typeof team.dateId !== "string" && !isNaN(Number(team.dateId))) {
      try {
        const dStr = getDateStringKST(team.dateId);
        if (dStr === dateStr) return true;
      } catch (_) {}
    }
    // 3. team.createdAt, team.created_at
    for (const createdField of ["createdAt", "created_at"]) {
      if (team[createdField]) {
        if (typeof team[createdField] === "string") {
          if (team[createdField].startsWith(dateStr)) return true;
          try {
            const created = new Date(team[createdField]);
            if (!isNaN(created.getTime())) {
              const pad = (n: number) => n.toString().padStart(2, "0");
              const createdStr = `${created.getFullYear()}-${pad(created.getMonth() + 1)}-${pad(created.getDate())}`;
              if (createdStr === dateStr) return true;
            }
          } catch (_) {}
        }
      }
    }
    // 4. team.matchDate
    if (team.matchDate && team.matchDate === dateStr) return true;
    return false;
  });

  const teamsForThisDate = addedTeams;

  // 팀/출석/매치팀Id 기반으로 key 세트 구성
  const playerRecordTeamIds = new Set(playerRecords.map((rec) => Number(rec.teamId ?? rec.team?.id)).filter((tid) => typeof tid === "number" && !isNaN(tid)));
  const matchTeamIds = new Set(matches.map((m) => Number(m.teamId ?? m.team_id)).filter((tid) => typeof tid === "number" && !isNaN(tid)));
  const rawDateTeamIds = new Set(teamsForThisDate.map((team) => Number(team.id)).filter((tid) => typeof tid === "number" && !isNaN(tid)));
  const validTeamIds = new Set([...playerRecordTeamIds, ...matchTeamIds, ...rawDateTeamIds]);
  const teamsMap: Record<string, any> = {};

  // 출석 기반 팀 맵 세팅
  for (const rec of playerRecords) {
    const teamId = rec.team?.id ?? rec.teamId;
    if (!teamId || !validTeamIds.has(Number(teamId))) continue;
    if (rec.team?.dateId) {
      try {
        const recTeamDateStr = getDateStringKST(rec.team.dateId);
        if (recTeamDateStr !== dateStr) continue;
      } catch (_) {
        continue;
      }
    }
    const key = String(teamId);
    if (!teamsMap[key]) {
      teamsMap[key] = {
        id: rec.team?.id ?? teamId,
        teamName: rec.team?.teamName ?? `팀_${teamId ?? "unknown"}`,
        dateId: dateStr,
        players: [],
      };
    }
    if (rec.player) {
      let recDateStr: string | null = null;
      if (typeof rec.dateId === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rec.dateId)) {
        recDateStr = rec.dateId;
      } else if (typeof rec.dateId === "number" && !isNaN(rec.dateId)) {
        try {
          recDateStr = getDateStringKST(rec.dateId);
        } catch (_) {
          recDateStr = null;
        }
      }
      if (recDateStr === dateStr || !rec.dateId) {
        teamsMap[key].players.push(rec.player);
      }
    }
  }

  // 매치에서만 있고 출석기록엔 없는 팀 추가
  for (const m of matches) {
    const tId = m.teamId ?? m.team_id;
    if ((typeof tId === "number" || typeof tId === "string") && !isNaN(Number(tId)) && validTeamIds.has(Number(tId)) && !teamsMap[String(tId)]) {
      if (m.matchDate && m.matchDate !== dateStr) continue;
      teamsMap[String(tId)] = {
        id: tId,
        teamName: m.teamName ?? m.team_name ?? `팀_${tId}`,
        dateId: dateStr,
        players: [],
      };
    }
  }

  // 해당 날짜에 생성된 팀인데 출석/매치 기록에 전혀 없는 팀도 추가
  for (const team of teamsForThisDate) {
    const tId = team.id;
    if (!tId || !validTeamIds.has(Number(tId))) continue;
    const key = String(tId);
    if (!teamsMap[key]) {
      teamsMap[key] = {
        id: tId,
        teamName: team.teamName ?? team.name ?? `팀_${tId}`,
        dateId: dateStr,
        players: [],
      };
    }
  }

  // 혹시라도 validTeamIds에 없는 team이 teamsForThisDate에 있으면 강제로도 한 번 더 확정 보장
  for (const team of teamsForThisDate) {
    const tId = team.id;
    if (!tId) continue;
    const key = String(tId);
    if (!teamsMap[key]) {
      teamsMap[key] = {
        id: tId,
        teamName: team.teamName ?? team.name ?? `팀_${tId}`,
        dateId: dateStr,
        players: [],
      };
    }
  }

  const teams = Object.values(teamsMap);

  return {
    teams,
    matches,
    addedTeams, // 해당 날짜에 추가된 팀 목록을 별도로 제공
  };
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
 * dateId 등 추가정보 필요하면 options 인자에도 전달
 */
export async function createTeamOnly(name: string, options: Partial<{ dateId: string | number }> = {}): Promise<{ id: number }> {
  console.log("[recordsService] Creating team:", {
    endpoint: `/teams`,
    name,
    options,
  });

  try {
    const payload: any = {
      teamName: name,
    };
    if ("dateId" in options && options.dateId !== undefined) {
      payload.dateId = options.dateId;
    }
    const response = await apiPost<{ id: number }>(`/teams`, payload);
    console.log("[recordsService] Team created successfully:", response);
    return response;
  } catch (error) {
    console.error("[recordsService] Failed to create team:", {
      endpoint: `/teams`,
      name,
      options,
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
    console.log("[recordsService] Player added successfully:", {
      teamId,
      playerId,
    });
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
 * - dateId: number | string (필수)
 * - attendance: boolean (필수)
 */
export async function savePlayerRecord(data: { playerId: number; teamId: number; dateId: number | string; attendance: boolean }): Promise<void> {
  const payload: PlayerRecordRequest = {
    playerId: data.playerId,
    teamId: data.teamId,
    dateId: typeof data.dateId === "string" ? Number(new Date(data.dateId).getTime()) : data.dateId,
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
 *
 * dateId (밀리초|날짜string)으로 반드시 날짜별로만 조회!
 */
export async function getPlayerRecords(dateId: string | number): Promise<PlayerRecordResponse[]> {
  try {
    const response = await apiGet<PlayerRecordResponse[]>("/player-records", { dateId });
    return (response || []).filter((rec) => {
      if (!rec || rec.dateId === undefined || rec.dateId === null) return false;
      if (String(rec.dateId) === String(dateId)) {
        return true;
      }
      if (typeof rec.dateId === "number" && typeof dateId === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateId)) {
        try {
          const dStr = getDateStringKST(rec.dateId);
          return dStr === dateId;
        } catch (_) {
          return false;
        }
      }
      return false;
    });
  } catch (error) {
    console.error("[recordsService] getPlayerRecords error:", {
      endpoint: "/player-records",
      dateId,
      error,
    });
    return [];
  }
}
