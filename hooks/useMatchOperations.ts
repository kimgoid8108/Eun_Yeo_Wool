/**
 * 경기 CRUD 작업 커스텀 훅
 *
 * 경기 결과 추가, 수정, 삭제 작업을 관리하는 로직을 담당합니다.
 *
 * @param {string} selectedDateId - 선택된 날짜 ID
 * @param {Record<string, MatchScore[]>} matchesByDate - 날짜별 경기 결과
 * @param {function} setMatchesByDate - 경기 결과 상태 업데이트 함수
 * @param {function} setIsLoading - 로딩 상태 업데이트 함수
 * @returns {object} 경기 CRUD 관련 함수들
 *
 * 사용처:
 * - app/records/page.tsx: 기록지 페이지에서 경기 결과 추가/수정/삭제
 */

import { useCallback } from "react";
import { MatchScore } from "@/types/records";
import * as recordsService from "@/services/recordsService";
import { ApiError } from "@/lib/api";

export function useMatchOperations(
  selectedDateId: string,
  matchesByDate: Record<string, MatchScore[]>,
  setMatchesByDate: React.Dispatch<React.SetStateAction<Record<string, MatchScore[]>>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
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
        setMatchesByDate((prev) => {
          const currentDateMatches = prev[selectedDateId] || [];
          return {
            ...prev,
            [selectedDateId]: [
              ...currentDateMatches,
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
          };
        });
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "경기 추가 중 오류가 발생했습니다.";
        console.error("[useMatchOperations] Failed to create match:", {
          errorMessage,
          error,
        });
        alert(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId, setMatchesByDate, setIsLoading]
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
        setMatchesByDate((prev) => {
          const currentDateMatches = prev[selectedDateId] || [];
          return {
            ...prev,
            [selectedDateId]: currentDateMatches.map((m) =>
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
          };
        });
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "경기 수정 중 오류가 발생했습니다.";
        console.error("[useMatchOperations] Failed to update match:", {
          errorMessage,
          error,
        });
        alert(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDateId, setMatchesByDate, setIsLoading]
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
        setMatchesByDate((prev) => {
          const currentDateMatches = prev[selectedDateId] || [];
          return {
            ...prev,
            [selectedDateId]: currentDateMatches.filter((m) => m.id !== matchId),
          };
        });
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "경기 삭제 중 오류가 발생했습니다.";
        console.error("[useMatchOperations] Failed to delete match:", {
          errorMessage,
          error,
        });
        alert(errorMessage);
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
