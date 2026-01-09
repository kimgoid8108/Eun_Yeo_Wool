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
  const [teamIdMap, setTeamIdMap] = useState<Record<string, Record<string, number>>>({});

  // 날짜별 데이터 불러오기 (API)
  const loadRecordsByDate = useCallback(async (dateId: string, daysList: Day[]) => {
    if (!dateId) {
      // dateId가 없으면 데이터 초기화
      setTeamsByDate((prev) => ({ ...prev, [dateId]: [] }));
      setMatchesByDate((prev) => ({ ...prev, [dateId]: [] }));
      return;
    }

    setIsLoading(true);
    try {
      console.log("[useRecordsData] Loading records for dateId:", dateId, "daysList:", daysList);

      // d를 any로 지정하여 id 속성 접근 에러 해결
      const day = (daysList as any[]).find((d: any) => String(d.id) === String(dateId));
      if (!day) {
        console.error("[useRecordsData] Day not found for dateId:", dateId);
        alert(`날짜 정보를 찾을 수 없습니다. (dateId: ${dateId})`);
        return;
      }

      // day.dateId가 없을 경우를 대비해 day.id나 day.date 등 후보군을 탐색
      const numericDateId = day.dateId || day.id || (day as any).date;
      console.log("[useRecordsData] Found day:", day, "numericDateId:", numericDateId);

      // API 호출 시 숫자 dateId 사용
      console.log("[useRecordsData] Calling API with dateId:", String(numericDateId));
      const response = await recordsService.getRecordsByDate(String(numericDateId));
      console.log("[useRecordsData] API Response:", response);
      console.log("[useRecordsData] Response teams count:", response.teams?.length || 0);
      console.log("[useRecordsData] Response matches count:", response.matches?.length || 0);

      // ✅ 1. 팀 정보 변환 부분 수정:
      //    teamName이 '핑크팀_2026-01-03_1767861232811'과 같이 오면,
      //    UI에는 '핑크팀'만 표시되도록 처리(아니면 _가 없으면 그대로 사용)
      const teams: TeamInfo[] = response.teams.map((team: any) => {
        const displayName = team.teamName && team.teamName.includes("_") ? team.teamName.split("_")[0] : team.teamName;
        return {
          teamName: displayName,
          players: team.players,
        };
      });

      // ✅ 2. 팀 ID 매핑 저장 부분 (displayName 기준으로 작성)
      setTeamIdMap((prev) => {
        const newDateMap: Record<string, number> = response.teams.reduce((acc: any, team: any) => {
          const displayName = team.teamName && team.teamName.includes("_") ? team.teamName.split("_")[0] : team.teamName;
          acc[displayName] = team.id;
          return acc;
        }, {} as Record<string, number>);
        return {
          ...prev,
          [dateId]: newDateMap,
        };
      });

      // ✅ Swagger 기준: MatchResponse -> MatchScore 변환 (서버 응답 그대로 사용)
      const matches: MatchScore[] = response.matches.map((match) => {
        console.log("[useRecordsData] Mapping match:", {
          id: match.id,
          team1Name: match.team1Name,
          team1Score: match.team1Score,
          team1Result: match.team1Result,
          team2Name: match.team2Name,
          team2Score: match.team2Score,
          team2Result: match.team2Result,
        });
        // 서버에서 받은 id를 string으로 변환
        return {
          id: String(match.id),
          team1Name: match.team1Name,
          team1Score: match.team1Score,
          team1Result: match.team1Result,
          team2Name: match.team2Name,
          team2Score: match.team2Score,
          team2Result: match.team2Result,
        };
      });

      // ✅ 3. 팀 정보는 이 날짜의 teams만으로 완전히 덮어쓴다
      setTeamsByDate((prev) => ({
        ...prev,
        [dateId]: teams, // 해당 날짜에 서버에서 받아온 팀만 반영
      }));

      setMatchesByDate((prev) => {
        const updated = {
          ...prev,
          [dateId]: matches,
        };
        console.log("[useRecordsData] Updated matchesByDate:", updated);
        return updated;
      });

      console.log("[useRecordsData] Successfully loaded:", {
        teamsCount: teams.length,
        matchesCount: matches.length,
        dateId,
      });
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
        dateId,
      });

      // ✅ 에러 발생 시 사용자에게 알림 표시
      if (error instanceof ApiError) {
        if (error.status === 404) {
          // 404 에러는 데이터가 없는 것으로 간주 (에러 표시 안 함)
          console.log("[useRecordsData] No records found for dateId:", dateId);
          setTeamsByDate((prev) => ({ ...prev, [dateId]: [] }));
          setMatchesByDate((prev) => ({ ...prev, [dateId]: [] }));
        } else {
          alert(`경기 데이터를 불러오는 중 오류가 발생했습니다.\n\n${errorMessage}`);
        }
      } else {
        alert(`경기 데이터를 불러오는 중 오류가 발생했습니다.\n\n${errorMessage}`);
      }
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
    loadRecordsByDate, // 데이터 새로고침을 위해 export
  };
}
