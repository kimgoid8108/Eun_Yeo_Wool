import { useCallback } from "react";
import { MatchScore } from "@/types/records";
import * as recordsService from "@/services/recordsService";
import { ApiError } from "@/lib/api";
import { Day } from "@/data/days";

export function useMatchOperations(
  selectedDateId: string,
  matchesByDate: Record<string, MatchScore[]>,
  setMatchesByDate: React.Dispatch<React.SetStateAction<Record<string, MatchScore[]>>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  days: Day[],
  teamIdMap: Record<string, Record<string, number>>,
  loadRecordsByDate?: (dateId: string, daysList: Day[]) => Promise<void> // 데이터 새로고침 함수
) {
  /** =========================
   * 경기 추가
   ========================= */
  const handleAddMatch = useCallback(
    async (match: MatchScore) => {
      if (!selectedDateId) return;

      const selectedDay = days.find((d) => d.id === selectedDateId);
      if (!selectedDay?.dateId) {
        alert("선택한 날짜를 찾을 수 없습니다.");
        return;
      }

      const team1Id = teamIdMap[selectedDateId]?.[match.team1Name];
      const team2Id = teamIdMap[selectedDateId]?.[match.team2Name];

      if (typeof team1Id !== "number") {
        console.error("Invalid team1Id", {
          selectedDateId,
          teamName: match.team1Name,
          teamId: team1Id,
        });
        alert("팀 1 정보를 찾을 수 없습니다. 먼저 팀을 추가해주세요.");
        return;
      }

      if (typeof team2Id !== "number") {
        console.error("Invalid team2Id", {
          selectedDateId,
          teamName: match.team2Name,
          teamId: team2Id,
        });
        alert("팀 2 정보를 찾을 수 없습니다. 먼저 팀을 추가해주세요.");
        return;
      }

      // ✅ 날짜 변환: 로컬 날짜를 ISO 형식으로 변환 (타임존 문제 방지)
      const matchDate = (() => {
        const date = new Date(selectedDay.dateId);
        if (isNaN(date.getTime())) {
          console.error("[useMatchOperations] Invalid dateId:", selectedDay.dateId);
          throw new Error("유효하지 않은 날짜입니다.");
        }
        // 로컬 날짜를 YYYY-MM-DD 형식으로 변환 후 ISO 형식으로 변환
        // 타임존 문제를 피하기 위해 로컬 날짜를 사용
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        // ISO 형식으로 변환 (로컬 날짜 기준, UTC로 표시)
        const dateString = `${year}-${month}-${day}T00:00:00.000Z`;
        console.log("[useMatchOperations] Date conversion:", {
          dateId: selectedDay.dateId,
          localDate: `${year}-${month}-${day}`,
          isoDate: dateString,
          originalISO: date.toISOString(),
        });
        return dateString;
      })();
      const currentMatches = matchesByDate[selectedDateId] || [];

      // ✅ 중복 체크 제거: 같은 날짜에 여러 경기를 추가할 수 있도록 허용
      // 백엔드에서 중복 체크를 하거나, 사용자가 원하는 만큼 경기를 추가할 수 있음
      const matchOrder = currentMatches.length + 1;

      // ✅ 현재 데이터 상태 확인
      console.log("[useMatchOperations] Current state:", {
        selectedDateId,
        currentMatchesCount: currentMatches.length,
        currentMatches: currentMatches.map((m) => ({ id: m.id, team1: m.team1Name, team2: m.team2Name })),
        team1Id,
        team2Id,
        matchOrder,
      });

      setIsLoading(true);
      try {
        // API 요청에 스코어 정보 포함
        console.log("[useMatchOperations] Creating match with data:", {
          matchDate,
          matchOrder,
          teamId: team1Id,
          team1Score: match.team1Score,
          team2Score: match.team2Score,
          team1Name: match.team1Name,
          team2Name: match.team2Name,
        });

        const response = await recordsService.createMatch({
          matchDate,
          matchOrder,
          teamId: team1Id, // team1Id를 teamId로 전달
          team1Score: match.team1Score,
          team2Score: match.team2Score,
        });

        console.log("[useMatchOperations] API response:", response);

        // ✅ Swagger 기준: 서버에서 받은 response.id만 사용 (임시 ID 생성 금지)
        if (!response.id) {
          throw new Error("서버에서 경기 ID를 받지 못했습니다.");
        }

        // 경기 추가 후 상태 업데이트 (서버 응답 기준)
        const newMatch: MatchScore = {
          id: String(response.id), // 서버 ID를 string으로 변환 (타입 일관성)
          team1Name: response.team1Name,
          team1Score: response.team1Score,
          team1Result: response.team1Result,
          team2Name: response.team2Name,
          team2Score: response.team2Score,
          team2Result: response.team2Result,
        };

        console.log("[useMatchOperations] New match object:", newMatch);
        console.log("[useMatchOperations] Server response id:", response.id, "type:", typeof response.id);

        setMatchesByDate((prev) => {
          const updated = {
            ...prev,
            [selectedDateId]: [...(prev[selectedDateId] ?? []), newMatch],
          };
          console.log("[useMatchOperations] Updated matchesByDate:", updated);
          return updated;
        });
      } catch (error) {
        const msg = error instanceof ApiError ? error.message : "경기 추가 중 오류가 발생했습니다.";

        // ✅ 에러 발생 시 상세 정보 표시
        console.error("[useMatchOperations] Match creation failed:", {
          error,
          errorMessage: msg,
          currentMatches: matchesByDate[selectedDateId] || [],
          selectedDateId,
        });

        // ✅ "이미 경기가 있다"는 에러인 경우 데이터를 다시 불러오기
        if (error instanceof ApiError && msg.includes("이미") && msg.includes("경기")) {
          alert(`${msg}\n\n데이터를 새로고침합니다.`);
          // 데이터 다시 불러오기
          if (loadRecordsByDate && selectedDateId) {
            await loadRecordsByDate(selectedDateId, days);
          }
        } else {
          alert(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId, matchesByDate, days, teamIdMap, setMatchesByDate, setIsLoading, loadRecordsByDate]
  );

  /** =========================
   * 경기 수정
   ========================= */
  const handleUpdateMatch = useCallback(
    async (matchId: string, match: MatchScore) => {
      if (!selectedDateId) return;

      // ✅ Swagger 기준: 서버에서 받은 matchId만 사용
      if (!matchId || matchId.trim() === "") {
        alert("경기 ID가 없습니다. 수정할 수 없습니다.");
        return;
      }

      console.log("[useMatchOperations] Updating match:", { matchId, match });

      const selectedDay = days.find((d) => d.id === selectedDateId);
      if (!selectedDay?.dateId) {
        alert("선택한 날짜를 찾을 수 없습니다.");
        return;
      }

      const team1Id = teamIdMap[selectedDateId]?.[match.team1Name];
      const team2Id = teamIdMap[selectedDateId]?.[match.team2Name];

      if (typeof team1Id !== "number") {
        alert("팀 1 정보를 찾을 수 없습니다.");
        return;
      }

      if (typeof team2Id !== "number") {
        alert("팀 2 정보를 찾을 수 없습니다.");
        return;
      }

      // 기존 경기 찾기 (matchOrder 확인용)
      const existingMatch = matchesByDate[selectedDateId]?.find((m) => m.id === matchId);
      if (!existingMatch) {
        alert("수정할 경기를 찾을 수 없습니다.");
        return;
      }

      const matchOrder = matchesByDate[selectedDateId]?.findIndex((m) => m.id === matchId)! + 1;
      // ✅ 날짜 변환: 로컬 날짜를 ISO 형식으로 변환 (타임존 문제 방지)
      const matchDate = (() => {
        const date = new Date(selectedDay.dateId);
        if (isNaN(date.getTime())) {
          console.error("[useMatchOperations] Invalid dateId:", selectedDay.dateId);
          throw new Error("유효하지 않은 날짜입니다.");
        }
        // 로컬 날짜를 YYYY-MM-DD 형식으로 변환 후 ISO 형식으로 변환
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        // ISO 형식으로 변환 (로컬 날짜 기준, UTC로 표시)
        return `${year}-${month}-${day}T00:00:00.000Z`;
      })();

      setIsLoading(true);
      try {
        console.log("[useMatchOperations] Updating match with data:", {
          matchId,
          matchDate,
          matchOrder,
          teamId: team1Id,
          team1Score: match.team1Score,
          team2Score: match.team2Score,
        });

        // ✅ Swagger 기준: MatchUpdateRequest에 정의된 필드만 전송
        const response = await recordsService.updateMatch(matchId, {
          matchDate,
          matchOrder,
          teamId: team1Id,
          team1Score: match.team1Score,
          team2Score: match.team2Score,
        });

        console.log("[useMatchOperations] Update response:", response);

        // ✅ 서버 응답의 id만 사용
        if (!response.id) {
          throw new Error("서버에서 업데이트된 경기 ID를 받지 못했습니다.");
        }

        // ✅ 서버 응답 기준으로 상태 업데이트
        setMatchesByDate((prev) => ({
          ...prev,
          [selectedDateId]: (prev[selectedDateId] ?? []).map((m) =>
            m.id === matchId
              ? {
                  id: String(response.id), // 서버 ID를 string으로 변환
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
        const msg = error instanceof ApiError ? error.message : "경기 수정 중 오류가 발생했습니다.";
        alert(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId, days, teamIdMap, setMatchesByDate, setIsLoading]
  );

  /** =========================
   * 경기 삭제
   ========================= */
  const handleDeleteMatch = useCallback(
    async (matchId: string) => {
      if (!selectedDateId) return;

      // ✅ Swagger 기준: 서버에서 받은 matchId만 사용
      if (!matchId || matchId.trim() === "") {
        alert("경기 ID가 없습니다. 삭제할 수 없습니다.");
        return;
      }

      setIsLoading(true);
      try {
        // ✅ Swagger 기준: DELETE /matches/{id} - path parameter로 id 전달
        await recordsService.deleteMatch(matchId);

        setMatchesByDate((prev) => ({
          ...prev,
          [selectedDateId]: (prev[selectedDateId] ?? []).filter((m) => m.id !== matchId),
        }));
      } catch (error) {
        const msg = error instanceof ApiError ? error.message : "경기 삭제 중 오류가 발생했습니다.";
        alert(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId, setMatchesByDate, setIsLoading]
  );

  return {
    handleAddMatch,
    handleUpdateMatch,
    handleDeleteMatch,
  };
}
