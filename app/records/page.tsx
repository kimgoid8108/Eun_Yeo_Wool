"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import AttendanceTable from "@/components/records/AttendanceTable";
import InitialSetup from "@/components/records/InitialSetup";
import DateNavigation from "@/components/records/DateNavigation";
import ViewModeToggle from "@/components/records/ViewModeToggle";
import EmptyTeamMessage from "@/components/records/EmptyTeamMessage";
import MatchResultView from "@/components/records/MatchResultView";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { days } from "@/data/days";
import { TeamInfo, ViewMode, MatchScore } from "@/types/records";
import * as recordsService from "@/services/recordsService";
import { TeamResponse, MatchResponse, Player } from "@/types/api";
import { ApiError } from "@/lib/api";
import { getPlayers } from "@/services/playersService";

/**
 * 기록지 페이지
 * - 날짜별 경기 기록을 조회하고 편집할 수 있는 페이지
 * - 화살표 버튼 또는 스와이프로 날짜 이동 가능
 * - 드롭다운으로 날짜 직접 선택 가능
 */

export default function RecordsPage() {
  // 날짜별 팀 정보 (날짜 ID를 키로 사용)
  const [teamsByDate, setTeamsByDate] = useState<Record<string, TeamInfo[]>>({});
  // 날짜별 경기 결과 (날짜 ID를 키로 사용)
  const [matchesByDate, setMatchesByDate] = useState<Record<string, MatchScore[]>>({});
  // 초기 설정 모달 열림 여부
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 팀 ID 매핑 (API에서 받은 ID를 저장)
  const [teamIdMap, setTeamIdMap] = useState<Record<string, Record<string, string | number>>>({});

  // 선택된 날짜 ID (days.id를 저장)
  const [selectedDateId, setSelectedDateId] = useState<string>("");
  // 날짜 드롭다운 열림/닫힘 상태
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  // 현재 보기 모드 (records: 경기 기록, result: 경기 결과)
  const [viewMode, setViewMode] = useState<ViewMode>("records");

  // 날짜별 데이터 불러오기 (API)
  const loadRecordsByDate = useCallback(async (dateId: string) => {
    if (!dateId) return;

    setIsLoading(true);
    try {
      console.log("[RecordsPage] Loading records for dateId:", dateId);
      const response = await recordsService.getRecordsByDate(dateId);
      console.log("[RecordsPage] API Response:", response);

      // 팀 정보 변환 (TeamResponse -> TeamInfo)
      const teams: TeamInfo[] = response.teams.map((team) => ({
        teamName: team.teamName,
        players: team.players,
      }));

      // 팀 ID 매핑 저장
      setTeamIdMap((prev) => ({
        ...prev,
        [dateId]: response.teams.reduce((acc, team) => {
          acc[team.teamName] = team.id;
          return acc;
        }, {} as Record<string, string | number>),
      }));

      // 경기 결과 변환 (MatchResponse -> MatchScore)
      const matches: MatchScore[] = response.matches.map((match) => ({
        id: match.id,
        team1Name: match.team1Name,
        team1Score: match.team1Score,
        team1Result: match.team1Result,
        team2Name: match.team2Name,
        team2Score: match.team2Score,
        team2Result: match.team2Result,
      }));

      setTeamsByDate((prev) => ({
        ...prev,
        [dateId]: teams,
      }));

      setMatchesByDate((prev) => ({
        ...prev,
        [dateId]: matches,
      }));
    } catch (error) {
      // 에러 메시지 추출
      let errorMessage = "알 수 없는 오류가 발생했습니다.";
      let errorDetails: any = {};

      if (error instanceof ApiError) {
        errorMessage = error.message;
        errorDetails = {
          type: error.type,
          status: error.status,
          url: error.url,
          responseText: error.responseText,
        };
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = { name: error.name };
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = String(error.message);
      }

      console.error("[RecordsPage] Failed to load records:", {
        errorMessage,
        errorDetails,
        originalError: error,
      });

      // API 실패 시 localStorage에서 불러오기 (fallback)
      const savedTeams = localStorage.getItem("football_teams_by_date");
      const savedMatches = localStorage.getItem("football_matches_by_date");
      if (savedTeams) {
        try {
          const parsed = JSON.parse(savedTeams);
          setTeamsByDate(parsed);
          console.log("[RecordsPage] Loaded teams from localStorage (fallback)");
        } catch (e) {
          console.error("[RecordsPage] Failed to load teams from localStorage:", e);
        }
      }
      if (savedMatches) {
        try {
          const parsed = JSON.parse(savedMatches);
          setMatchesByDate(parsed);
          console.log("[RecordsPage] Loaded matches from localStorage (fallback)");
        } catch (e) {
          console.error("[RecordsPage] Failed to load matches from localStorage:", e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 선택된 날짜가 변경될 때마다 데이터 불러오기
  useEffect(() => {
    if (selectedDateId) {
      loadRecordsByDate(selectedDateId);
    }
  }, [selectedDateId, loadRecordsByDate]);

  // 초기화: 가장 최근 날짜를 기본값으로 설정
  useEffect(() => {
    if (days.length > 0 && !selectedDateId) {
      setSelectedDateId(days[days.length - 1].id);
    }
  }, [selectedDateId]);

  // 초기 설정 완료 핸들러
  const handleInitialSetupComplete = useCallback(
    async (teamName: string, players: { name: string; position: string }[]) => {
      if (!selectedDateId) return;

      const currentTeams = teamsByDate[selectedDateId] || [];
      // 최대 2팀까지만 추가 가능
      if (currentTeams.length >= 2) {
        alert("최대 2팀까지만 추가할 수 있습니다.");
        return;
      }

      setIsLoading(true);
      try {
        // 1. 선수 목록을 API에서 가져와서 이름으로 playerId 찾기
        const apiPlayers = await getPlayers();
        const playerMap = new Map<string, number>();
        apiPlayers.forEach((player: Player) => {
          playerMap.set(player.name, player.id);
        });

        // 2. 날짜 정보 가져오기 및 ISO 문자열로 변환
        const selectedDay = days.find((d) => d.id === selectedDateId);
        if (!selectedDay) {
          throw new Error("선택한 날짜를 찾을 수 없습니다.");
        }

        // 날짜 문자열에서 날짜 추출 (예: "2026년 1월 3일 (토)" -> "2026-01-03")
        const dateMatch = selectedDay.day.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (!dateMatch) {
          throw new Error("날짜 형식을 파싱할 수 없습니다.");
        }
        const [, year, month, day] = dateMatch;
        const dateString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        const joinedAt = new Date(dateString).toISOString();

        // 3. 팀 생성 API 호출 (POST /teams)
        const teamResponse = await recordsService.createTeamOnly(teamName);
        const teamId = teamResponse.id;
        if (!teamId || isNaN(teamId)) {
          throw new Error("팀 생성 후 유효한 teamId를 받지 못했습니다.");
        }

        // 4. 각 선수마다 개별 POST 요청 (Promise.all 사용)
        const playerRegistrationPromises = players.map(async (player) => {
          const playerId = playerMap.get(player.name);
          if (!playerId) {
            throw new Error(`선수 "${player.name}"의 ID를 찾을 수 없습니다.`);
          }
          return recordsService.addPlayerToTeam(teamId, playerId, joinedAt);
        });

        await Promise.all(playerRegistrationPromises);

        // 상태 업데이트
        setTeamsByDate((prev) => ({
          ...prev,
          [selectedDateId]: [...(prev[selectedDateId] || []), { teamName, players }],
        }));

        // 팀 ID 매핑 저장
        setTeamIdMap((prev) => {
          const currentDateMap = prev[selectedDateId] || {};
          return {
            ...prev,
            [selectedDateId]: {
              ...currentDateMap,
              [teamName]: teamResponse.id,
            },
          };
        });

        setIsSetupModalOpen(false);
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "팀 추가 중 오류가 발생했습니다.";
        console.error("[RecordsPage] Failed to create team:", {
          errorMessage,
          error,
        });
        alert(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId, teamsByDate]
  );

  // 현재 날짜의 팀 목록
  const currentTeams = useMemo(() => {
    return teamsByDate[selectedDateId] || [];
  }, [teamsByDate, selectedDateId]);

  // 팀 추가 가능 여부 (최대 2팀)
  const canAddTeam = useMemo(() => {
    return currentTeams.length < 2;
  }, [currentTeams.length]);

  // 현재 날짜에 이미 등록된 선수 이름 목록 (다른 팀에서 선택한 선수들)
  const registeredPlayerNames = useMemo(() => {
    const names = new Set<string>();
    currentTeams.forEach((team) => {
      team.players.forEach((player) => {
        names.add(player.name);
      });
    });
    return Array.from(names);
  }, [currentTeams]);

  // 현재 날짜의 팀 이름 목록
  const currentTeamNames = useMemo(() => {
    return currentTeams.map((team) => team.teamName);
  }, [currentTeams]);

  // 현재 날짜의 경기 목록
  const currentMatches = useMemo(() => {
    return matchesByDate[selectedDateId] || [];
  }, [matchesByDate, selectedDateId]);

  // 경기 추가 핸들러
  const handleAddMatch = useCallback(
    async (match: MatchScore) => {
      if (!selectedDateId) return;

      setIsLoading(true);
      try {
        // API로 경기 추가
        const response = await recordsService.createMatch({
          dateId: selectedDateId,
          team1Name: match.team1Name,
          team1Score: match.team1Score,
          team2Name: match.team2Name,
          team2Score: match.team2Score,
        });

        // 상태 업데이트
        setMatchesByDate((prev) => ({
          ...prev,
          [selectedDateId]: [
            ...(prev[selectedDateId] || []),
            {
              id: response.id,
              team1Name: response.team1Name,
              team1Score: response.team1Score,
              team1Result: response.team1Result,
              team2Name: response.team2Name,
              team2Score: response.team2Score,
              team2Result: response.team2Result,
            },
          ],
        }));
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "경기 추가 중 오류가 발생했습니다.";
        console.error("[RecordsPage] Failed to create match:", {
          errorMessage,
          error,
        });
        alert(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId]
  );

  // 경기 수정 핸들러
  const handleUpdateMatch = useCallback(
    async (matchId: string, match: MatchScore) => {
      if (!selectedDateId) return;

      setIsLoading(true);
      try {
        // API로 경기 수정
        const response = await recordsService.updateMatch(matchId, {
          dateId: selectedDateId,
          team1Name: match.team1Name,
          team1Score: match.team1Score,
          team2Name: match.team2Name,
          team2Score: match.team2Score,
        });

        // 상태 업데이트
        setMatchesByDate((prev) => ({
          ...prev,
          [selectedDateId]: (prev[selectedDateId] || []).map((m) =>
            m.id === matchId
              ? {
                  id: response.id,
                  team1Name: response.team1Name,
                  team1Score: response.team1Score,
                  team1Result: response.team1Result,
                  team2Name: response.team2Name,
                  team2Score: response.team2Score,
                  team2Result: response.team2Result,
                }
              : m
          ),
        }));
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "경기 수정 중 오류가 발생했습니다.";
        console.error("[RecordsPage] Failed to update match:", {
          errorMessage,
          error,
        });
        alert(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId]
  );

  // 경기 삭제 핸들러
  const handleDeleteMatch = useCallback(
    async (matchId: string) => {
      if (!selectedDateId) return;

      setIsLoading(true);
      try {
        // API로 경기 삭제
        await recordsService.deleteMatch(matchId);

        // 상태 업데이트
        setMatchesByDate((prev) => ({
          ...prev,
          [selectedDateId]: (prev[selectedDateId] || []).filter((m) => m.id !== matchId),
        }));
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "경기 삭제 중 오류가 발생했습니다.";
        console.error("[RecordsPage] Failed to delete match:", {
          errorMessage,
          error,
        });
        alert(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId]
  );

  // 현재 날짜의 인덱스 (useMemo로 최적화)
  const currentDateIndex = useMemo(() => {
    return days.findIndex((d) => d.id === selectedDateId);
  }, [selectedDateId]);

  // 이전 날짜로 이동 핸들러
  const handlePreviousDate = useCallback(() => {
    if (currentDateIndex > 0) {
      setSelectedDateId(days[currentDateIndex - 1].id);
    }
  }, [currentDateIndex]);

  // 다음 날짜로 이동 핸들러
  const handleNextDate = useCallback(() => {
    if (currentDateIndex < days.length - 1) {
      setSelectedDateId(days[currentDateIndex + 1].id);
    }
  }, [currentDateIndex]);

  // 드롭다운에서 날짜 선택 핸들러
  const handleDateSelect = useCallback((dayId: string) => {
    setSelectedDateId(dayId);
  }, []);

  // 스와이프 제스처 훅
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: handleNextDate,
    onSwipeRight: handlePreviousDate,
  });

  // 저장 핸들러 (localStorage 백업용)
  const handleSave = useCallback(() => {
    try {
      // 경기 기록 백업 저장
      localStorage.setItem("football_teams_by_date", JSON.stringify(teamsByDate));
      // 경기 결과 백업 저장
      localStorage.setItem("football_matches_by_date", JSON.stringify(matchesByDate));
      alert("백업 저장되었습니다!");
    } catch (error) {
      console.error("Failed to save data:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  }, [teamsByDate, matchesByDate]);

  return (
    <div className="p-6">
      {/* 페이지 제목 및 저장 버튼 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">기록지</h1>
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              로딩 중...
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            백업 저장
          </button>
        </div>
      </div>

      {/* 보기 모드 선택 버튼 */}
      <ViewModeToggle viewMode={viewMode} onModeChange={setViewMode} />

      {/* 날짜 네비게이션 섹션 */}
      <DateNavigation
        days={days}
        selectedDateId={selectedDateId}
        onDateSelect={handleDateSelect}
        isDateDropdownOpen={isDateDropdownOpen}
        onToggleDropdown={() => setIsDateDropdownOpen((prev) => !prev)}
        onCloseDropdown={() => setIsDateDropdownOpen(false)}
        onPrevious={handlePreviousDate}
        onNext={handleNextDate}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* 팀 추가 버튼 */}
      {selectedDateId && viewMode === "records" && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setIsSetupModalOpen(true)}
            disabled={!canAddTeam}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${canAddTeam ? "bg-green-500 text-white hover:bg-green-600 shadow-md" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
            {canAddTeam ? "+ 팀 추가" : "팀 추가 완료 (최대 2팀)"}
          </button>
        </div>
      )}

      {/* 선택된 날짜의 경기 기록 테이블 */}
      {selectedDateId &&
        viewMode === "records" &&
        currentTeams.map((team, index) => (
          <div key={index} className="mb-6">
            <AttendanceTable selectedDate={selectedDateId} teamName={team.teamName} customPlayers={team.players} matches={currentMatches} />
          </div>
        ))}

      {/* 팀이 없을 때 안내 메시지 */}
      {selectedDateId && viewMode === "records" && currentTeams.length === 0 && <EmptyTeamMessage onAddTeam={() => setIsSetupModalOpen(true)} />}

      {/* 경기 결과 화면 */}
      {selectedDateId && viewMode === "result" && (
        <MatchResultView
          selectedDateId={selectedDateId}
          teamNames={currentTeamNames}
          matches={currentMatches}
          onAddMatch={handleAddMatch}
          onUpdateMatch={handleUpdateMatch}
          onDeleteMatch={handleDeleteMatch}
        />
      )}

      {/* 드롭다운 외부 클릭 시 닫기 (오버레이) */}
      {isDateDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDateDropdownOpen(false)} />}

      {/* 초기 설정 모달 */}
      {isSetupModalOpen && (
        <InitialSetup onComplete={handleInitialSetupComplete} onClose={() => setIsSetupModalOpen(false)} registeredPlayerNames={registeredPlayerNames} existingTeamNames={currentTeamNames} />
      )}
    </div>
  );
}
