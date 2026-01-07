/**
 * 경기 기록 데이터 관리 커스텀 훅
 *
 * 날짜별 팀 정보와 경기 결과 데이터를 관리하고 API에서 불러오는 로직을 담당합니다.
 *
 * @param {string} selectedDateId - 선택된 날짜 ID
 * @param {Day[]} days - 날짜 목록
 * @returns {object} 기록 데이터 관련 상태 및 함수들
 *
 * 사용처:
 * - app/records/page.tsx: 기록지 페이지에서 날짜별 팀 및 경기 데이터 관리
 */

import { useState, useEffect, useCallback } from "react";
import { Day } from "@/data/days";
import { TeamInfo, MatchScore } from "@/types/records";
import * as recordsService from "@/services/recordsService";
import { ApiError } from "@/lib/api";

export function useRecordsData(selectedDateId: string, days: Day[]) {
  // 날짜별 팀 정보 (날짜 ID를 키로 사용)
  const [teamsByDate, setTeamsByDate] = useState<Record<string, TeamInfo[]>>({});
  // 날짜별 경기 결과 (날짜 ID를 키로 사용)
  const [matchesByDate, setMatchesByDate] = useState<Record<string, MatchScore[]>>({});
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 팀 ID 매핑 (API에서 받은 ID를 저장)
  const [teamIdMap, setTeamIdMap] = useState<Record<string, Record<string, string | number>>>({});

  // 날짜별 데이터 불러오기 (API)
  const loadRecordsByDate = useCallback(async (dateId: string, daysList: Day[]) => {
    if (!dateId) return;

    setIsLoading(true);
    try {
      console.log("[useRecordsData] Loading records for dateId:", dateId);

      // dateId를 숫자로 변환 (days.dateId 사용)
      const day = daysList.find(d => d.id === dateId);
      const numericDateId = day?.dateId ? day.dateId : parseInt(dateId, 10);

      // API 호출 시 숫자 dateId 사용
      const response = await recordsService.getRecordsByDate(String(numericDateId));
      console.log("[useRecordsData] API Response:", response);

      // 팀 정보 변환 (TeamResponse -> TeamInfo)
      const teams: TeamInfo[] = response.teams.map((team) => ({
        teamName: team.teamName,
        players: team.players,
      }));

      // 팀 ID 매핑 저장
      setTeamIdMap((prev) => {
        const newDateMap: Record<string, string | number> = response.teams.reduce((acc, team) => {
          acc[team.teamName] = team.id;
          return acc;
        }, {} as Record<string, string | number>);

        return {
          ...prev,
          [dateId]: newDateMap,
        };
      });

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
      let errorDetails: Record<string, unknown> = {};

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

      console.error("[useRecordsData] Failed to load records:", {
        errorMessage,
        errorDetails,
        originalError: error,
      });

      // 에러 발생 시 빈 배열로 초기화 (팀이 없는 상태)
      setTeamsByDate((prev) => ({
        ...prev,
        [dateId]: [],
      }));
      setMatchesByDate((prev) => ({
        ...prev,
        [dateId]: [],
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 선택된 날짜가 변경될 때마다 데이터 불러오기
  useEffect(() => {
    if (selectedDateId) {
      loadRecordsByDate(selectedDateId, days);
    }
  }, [selectedDateId, days, loadRecordsByDate]);

  return {
    teamsByDate,
    setTeamsByDate,
    matchesByDate,
    setMatchesByDate,
    isLoading,
    setIsLoading,
    teamIdMap,
    setTeamIdMap,
  };
}
