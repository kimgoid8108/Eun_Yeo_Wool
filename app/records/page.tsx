"use client";

import { useState, useMemo, useCallback } from "react";
import AttendanceTable from "@/components/records/AttendanceTable";
import InitialSetup from "@/components/records/InitialSetup";
import DateNavigation from "@/components/records/DateNavigation";
import ViewModeToggle from "@/components/records/ViewModeToggle";
import EmptyTeamMessage from "@/components/records/EmptyTeamMessage";
import MatchResultView from "@/components/records/MatchResultView";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useDateManagement } from "@/hooks/useDateManagement";
import { useRecordsData } from "@/hooks/useRecordsData";
import { useMatchOperations } from "@/hooks/useMatchOperations";
import { days as initialDays } from "@/data/days";
import { ViewMode } from "@/types/records";
import * as recordsService from "@/services/recordsService";
import { Player } from "@/types/api";
import { ApiError } from "@/lib/api";
import { getPlayers } from "@/services/playersService";
import AddDateModal from "@/components/records/AddDateModal";

/**
 * 기록지 페이지
 *
 * 날짜별 경기 기록을 조회하고 편집할 수 있는 페이지입니다.
 * - 화살표 버튼 또는 스와이프로 날짜 이동 가능
 * - 드롭다운으로 날짜 직접 선택 가능
 * - 팀 추가 및 경기 결과 관리 기능 제공
 *
 * 사용하는 커스텀 훅:
 * - useDateManagement: 날짜 목록 및 선택 관리
 * - useRecordsData: 날짜별 팀 및 경기 데이터 관리
 * - useMatchOperations: 경기 CRUD 작업 관리
 * - useSwipeGesture: 스와이프 제스처 처리
 */
export default function RecordsPage() {
  // 초기 설정 모달 열림 여부
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  // 현재 보기 모드 (records: 경기 기록, result: 경기 결과)
  const [viewMode, setViewMode] = useState<ViewMode>("records");

  // 날짜 관리 커스텀 훅 사용
  const {
    days,
    selectedDateId,
    isDateDropdownOpen,
    setIsDateDropdownOpen,
    isAddDateModalOpen,
    setIsAddDateModalOpen,
    handleAddDate,
    handleOpenAddDateModal,
    handlePreviousDate,
    handleNextDate,
    handleDateSelect,
  } = useDateManagement(initialDays);

  // 기록 데이터 관리 커스텀 훅 사용
  const {
    teamsByDate,
    setTeamsByDate,
    matchesByDate,
    setMatchesByDate,
    isLoading,
    setIsLoading,
    teamIdMap,
    setTeamIdMap,
  } = useRecordsData(selectedDateId, days);

  // 경기 CRUD 작업 커스텀 훅 사용
  const { handleAddMatch, handleUpdateMatch, handleDeleteMatch } = useMatchOperations(
    selectedDateId,
    matchesByDate,
    setMatchesByDate,
    setIsLoading
  );


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
        if (!selectedDay || !selectedDay.dateId) {
          throw new Error("선택한 날짜를 찾을 수 없습니다.");
        }

        // dateId(타임스탬프)를 Date 객체로 변환하여 ISO 문자열 생성
        const date = new Date(selectedDay.dateId);
        const joinedAt = date.toISOString();

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
        setTeamsByDate((prev) => {
          const currentDateTeams = prev[selectedDateId] || [];
          return {
            ...prev,
            [selectedDateId]: [...currentDateTeams, { teamName, players }],
          };
        });

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

  // 실제 데이터가 있는 날짜만 필터링 (더미 데이터 제거)
  const availableDays = useMemo(() => {
    return days.filter((day) => {
      const teams = teamsByDate[day.id] || [];
      const matches = matchesByDate[day.id] || [];
      // 팀이나 경기 데이터가 있는 날짜만 표시
      return teams.length > 0 || matches.length > 0;
    });
  }, [teamsByDate, matchesByDate]);


  // 스와이프 제스처 훅
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: handleNextDate,
    onSwipeRight: handlePreviousDate,
  });

  return (
    <div className="p-6">
      {/* 페이지 제목 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">기록지</h1>
        {isLoading && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            로딩 중...
          </div>
        )}
      </div>

      {/* 보기 모드 선택 버튼 */}
      <ViewModeToggle viewMode={viewMode} onModeChange={setViewMode} />

      {/* 날짜 네비게이션 섹션 (모든 토요일 날짜 선택 가능) */}
      {days.length > 0 && (
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
          onAddDate={handleOpenAddDateModal}
        />
      )}

      {/* 날짜 추가 모달 */}
      <AddDateModal
        isOpen={isAddDateModalOpen}
        onClose={() => setIsAddDateModalOpen(false)}
        onAddDate={handleAddDate}
        existingDays={days}
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
        currentTeams.map((team, index) => {
          // selectedDateId에서 dateId 가져오기
          const day = days.find(d => d.id === selectedDateId);
          const dateId = day?.dateId;
          // teamId 가져오기
          const teamIdValue = teamIdMap[selectedDateId]?.[team.teamName];
          const teamId = typeof teamIdValue === "number" ? teamIdValue : typeof teamIdValue === "string" ? parseInt(teamIdValue, 10) : undefined;

          return (
            <div key={index} className="mb-6">
              <AttendanceTable
                selectedDate={selectedDateId}
                teamName={team.teamName}
                customPlayers={team.players}
                matches={currentMatches}
                dateId={dateId}
                teamId={teamId}
              />
            </div>
          );
        })}

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
