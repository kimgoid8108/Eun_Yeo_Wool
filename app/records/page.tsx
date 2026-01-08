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

export default function RecordsPage() {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("records");

  /** 날짜 관리 */
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

  /** 기록 데이터 */
  const { teamsByDate, setTeamsByDate, matchesByDate, setMatchesByDate, isLoading, setIsLoading, teamIdMap, setTeamIdMap, loadRecordsByDate } = useRecordsData(selectedDateId, days);

  /** 경기 CRUD */
  const { handleAddMatch, handleUpdateMatch, handleDeleteMatch } = useMatchOperations(selectedDateId, matchesByDate, setMatchesByDate, setIsLoading, days, teamIdMap, loadRecordsByDate);

  /**
   * 🔥 초기 팀 세팅
   */
  const handleInitialSetupComplete = useCallback(
    async (teamName: string, players: { name: string; position: string }[]) => {
      if (!selectedDateId) return;

      const currentTeams = teamsByDate[selectedDateId] || [];
      if (currentTeams.length >= 2) {
        alert("최대 2팀까지만 추가할 수 있습니다.");
        return;
      }

      setIsLoading(true);

      try {
        /** 선수 ID 매핑 */
        const apiPlayers = await getPlayers();
        const playerMap = new Map<string, number>();
        apiPlayers.forEach((p: Player) => {
          playerMap.set(p.name, p.id);
        });

        /** 날짜 */
        const selectedDay = days.find((d) => d.id === selectedDateId);
        if (!selectedDay?.dateId) {
          throw new Error("선택한 날짜를 찾을 수 없습니다.");
        }
        // ✅ 날짜 변환: dateId를 로컬 날짜로 변환하여 타임존 문제 방지
        const joinedAt = (() => {
          const date = new Date(selectedDay.dateId);
          if (isNaN(date.getTime())) {
            console.error("[RecordsPage] Invalid dateId:", selectedDay.dateId);
            throw new Error("유효하지 않은 날짜입니다.");
          }
          // 로컬 날짜를 YYYY-MM-DD 형식으로 변환 후 ISO 형식으로 변환
          // 타임존 문제를 피하기 위해 로컬 날짜를 사용
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          // ISO 형식으로 변환 (로컬 시간대 기준)
          return `${year}-${month}-${day}T00:00:00.000Z`;
        })();

        /**
         * ✅ 팀 이름 중복 허용을 위해 고유한 이름 생성
         * 서버에 전송: 고유한 이름 (날짜 + 타임스탬프)
         * UI 표시: 원래 팀 이름
         */
        const uniqueTeamName = `${teamName}_${selectedDay.dateId}_${Date.now()}`;

        /** 팀 생성 */
        const teamResponse = await recordsService.createTeamOnly(uniqueTeamName);

        if (!teamResponse?.id || isNaN(teamResponse.id)) {
          throw new Error("유효하지 않은 teamId");
        }

        const teamId = teamResponse.id;

        /** 선수 등록 */
        await Promise.all(
          players.map((player) => {
            const playerId = playerMap.get(player.name);
            if (!playerId) {
              throw new Error(`선수 ID 없음: ${player.name}`);
            }
            return recordsService.addPlayerToTeam(teamId, playerId, joinedAt);
          })
        );

        /** 상태 업데이트 (UI 기준) */
        setTeamsByDate((prev) => ({
          ...prev,
          [selectedDateId]: [...(prev[selectedDateId] || []), { teamName, players }],
        }));

        /**
         * 🔥 teamIdMap은 number만 저장
         */
        setTeamIdMap((prev) => ({
          ...prev,
          [selectedDateId]: {
            ...(prev[selectedDateId] || {}),
            [teamName]: teamId,
          },
        }));

        setIsSetupModalOpen(false);
      } catch (error) {
        const msg = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "팀 추가 중 오류 발생";
        console.error("[RecordsPage] Failed:", error);
        alert(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId, teamsByDate, days, setIsLoading, setTeamsByDate, setTeamIdMap]
  );

  /** 메모들 */
  const currentTeams = useMemo(() => teamsByDate[selectedDateId] || [], [teamsByDate, selectedDateId]);

  const canAddTeam = currentTeams.length < 2;

  const registeredPlayerNames = useMemo(() => {
    const set = new Set<string>();
    currentTeams.forEach((t) => t.players.forEach((p) => set.add(p.name)));
    return [...set];
  }, [currentTeams]);

  const currentTeamNames = currentTeams.map((t) => t.teamName);

  const currentMatches = matchesByDate[selectedDateId] || [];

  /** 스와이프 */
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: handleNextDate,
    onSwipeRight: handlePreviousDate,
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">기록지</h1>

      <ViewModeToggle viewMode={viewMode} onModeChange={setViewMode} />

      <DateNavigation
        days={days}
        selectedDateId={selectedDateId}
        onDateSelect={handleDateSelect}
        isDateDropdownOpen={isDateDropdownOpen}
        onToggleDropdown={() => setIsDateDropdownOpen((p) => !p)}
        onCloseDropdown={() => setIsDateDropdownOpen(false)}
        onPrevious={handlePreviousDate}
        onNext={handleNextDate}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onAddDate={handleOpenAddDateModal}
      />

      <AddDateModal isOpen={isAddDateModalOpen} onClose={() => setIsAddDateModalOpen(false)} onAddDate={handleAddDate} existingDays={days} />

      {selectedDateId && viewMode === "records" && (
        <div className="mb-4 flex justify-end">
          <button onClick={() => setIsSetupModalOpen(true)} disabled={!canAddTeam} className="px-4 py-2 rounded bg-green-500 text-white disabled:bg-gray-300">
            + 팀 추가
          </button>
        </div>
      )}

      {selectedDateId &&
        viewMode === "records" &&
        currentTeams.map((team, idx) => {
          const day = days.find((d) => d.id === selectedDateId);
          const dateId = day?.dateId;
          const teamId = teamIdMap[selectedDateId]?.[team.teamName];

          return <AttendanceTable key={idx} selectedDate={selectedDateId} teamName={team.teamName} customPlayers={team.players} matches={currentMatches} dateId={dateId} teamId={teamId} />;
        })}

      {selectedDateId && viewMode == "result" && (
        <MatchResultView
          selectedDateId={selectedDateId}
          teamNames={currentTeamNames}
          matches={currentMatches}
          onAddMatch={handleAddMatch}
          onUpdateMatch={handleUpdateMatch}
          onDeleteMatch={handleDeleteMatch}
          onSaveAll={async () => {
            // 현재 날짜의 모든 경기가 이미 저장되어 있으므로 데이터 새로고침만 수행
            if (loadRecordsByDate) {
              await loadRecordsByDate(selectedDateId, days);
            }
          }}
          onLoadMatches={async () => {
            // 저장된 경기를 서버에서 불러오기
            if (loadRecordsByDate && selectedDateId) {
              await loadRecordsByDate(selectedDateId, days);
            }
          }}
          isLoading={isLoading}
        />
      )}

      {isSetupModalOpen && (
        <InitialSetup onComplete={handleInitialSetupComplete} onClose={() => setIsSetupModalOpen(false)} registeredPlayerNames={registeredPlayerNames} existingTeamNames={currentTeamNames} />
      )}
    </div>
  );
}
