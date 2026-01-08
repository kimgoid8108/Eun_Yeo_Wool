"use client";

import { useState, useMemo, useCallback } from "react";
import { MatchScore, MatchResult } from "@/types/records";
import AddMatchModal from "./AddMatchModal";

interface MatchResultViewProps {
  selectedDateId: string;
  teamNames: string[]; // 현재 날짜의 팀 이름 목록
  matches: MatchScore[]; // 현재 날짜의 경기 목록
  onAddMatch: (match: MatchScore) => void;
  onUpdateMatch: (matchId: string, match: MatchScore) => void;
  onDeleteMatch: (matchId: string) => void;
  onSaveAll?: () => Promise<void>; // 모든 경기 저장 함수
  onLoadMatches?: () => Promise<void>; // 저장된 경기 불러오기 함수
  isLoading?: boolean; // 로딩 상태
}

/**
 * 경기 결과 뷰 컴포넌트
 *
 * 경기 결과를 표시하고 관리하는 컴포넌트입니다.
 * - 경기 목록 표시
 * - 경기 추가/수정/삭제 기능
 *
 * 사용처:
 * - app/records/page.tsx: 기록지 페이지에서 경기 결과 모드일 때 표시
 */
export default function MatchResultView({
  selectedDateId,
  teamNames,
  matches,
  onAddMatch,
  onUpdateMatch,
  onDeleteMatch,
  onSaveAll,
  onLoadMatches,
  isLoading = false,
}: MatchResultViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // 경기 추가 가능 여부 (팀이 2개 있어야 함)
  const canAddMatch = useMemo(() => teamNames.length === 2, [teamNames.length]);

  // 경기 추가 핸들러
  const handleAddMatch = useCallback(
    (match: MatchScore) => {
      onAddMatch(match);
      setIsAddModalOpen(false);
    },
    [onAddMatch]
  );

  // 경기 수정 핸들러
  const handleUpdateMatch = useCallback(
    (matchId: string, match: MatchScore) => {
      onUpdateMatch(matchId, match);
      setEditingMatchId(null);
    },
    [onUpdateMatch]
  );

  // 경기 삭제 핸들러
  const handleDeleteMatch = useCallback(
    (matchId: string) => {
      if (confirm("경기를 삭제하시겠습니까?")) {
        onDeleteMatch(matchId);
      }
    },
    [onDeleteMatch]
  );

  // 승자 계산
  const getWinner = useCallback((match: MatchScore) => {
    if (match.team1Score > match.team2Score) return match.team1Name;
    if (match.team2Score > match.team1Score) return match.team2Name;
    return "무승부";
  }, []);

  // 모든 경기 저장 핸들러
  const handleSaveAll = useCallback(async () => {
    if (!onSaveAll) return;

    if (matches.length === 0) {
      alert("저장할 경기가 없습니다.");
      return;
    }

    if (!confirm(`총 ${matches.length}개의 경기를 저장하시겠습니까?`)) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveAll();
      alert("모든 경기가 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("[MatchResultView] Failed to save all matches:", error);
      alert("경기 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [onSaveAll, matches.length]);

  // 저장된 경기 불러오기 핸들러
  const handleLoadMatches = useCallback(async () => {
    if (!onLoadMatches) return;

    console.log("[MatchResultView] Loading matches for dateId:", selectedDateId);
    console.log("[MatchResultView] Current matches before load:", matches);

    setIsLoadingMatches(true);
    try {
      await onLoadMatches();

      // 불러온 후 잠시 대기하여 상태 업데이트 확인
      setTimeout(() => {
        console.log("[MatchResultView] Matches after load:", matches);
        const matchCount = matches.length;
        if (matchCount > 0) {
          alert(`저장된 경기 ${matchCount}개를 불러왔습니다.`);
        } else {
          alert("저장된 경기가 없습니다.");
        }
      }, 100);
    } catch (error) {
      console.error("[MatchResultView] Failed to load matches:", error);
      const errorMsg = error instanceof Error ? error.message : "알 수 없는 오류";
      alert(`경기 불러오기 중 오류가 발생했습니다.\n\n${errorMsg}`);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [onLoadMatches, selectedDateId, matches]);

  // ✅ 디버깅: 현재 상태 확인
  console.log("[MatchResultView] Current state:", {
    selectedDateId,
    matchesCount: matches.length,
    matches: matches,
    teamNames,
    isLoading,
  });

  return (
    <div className="space-y-4">
      {/* 경기 추가 및 저장/불러오기 버튼 */}
      <div className="flex justify-between items-center mb-4 gap-2">
        <div className="flex gap-2">
          {/* 저장된 경기 불러오기 버튼 */}
          {onLoadMatches && (
            <button
              onClick={handleLoadMatches}
              disabled={isLoadingMatches || isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isLoadingMatches || isLoading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-purple-500 text-white hover:bg-purple-600 shadow-md"
              }`}>
              {isLoadingMatches ? "불러오는 중..." : "📥 경기 불러오기"}
            </button>
          )}
          {/* 경기 저장 버튼 */}
          {matches.length > 0 && onSaveAll && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isSaving || isLoading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
              }`}>
              {isSaving ? "저장 중..." : `💾 경기 저장 (${matches.length}개)`}
            </button>
          )}
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          disabled={!canAddMatch || isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            canAddMatch && !isLoading
              ? "bg-green-500 text-white hover:bg-green-600 shadow-md"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}>
          + 경기 추가
        </button>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
          <div className="text-gray-500 text-lg">경기 데이터를 불러오는 중...</div>
        </div>
      )}

      {/* 경기 목록 헤더 */}
      {!isLoading && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            경기 결과
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-700">
              총 {matches.length}경기
            </span>
            {matches.length > 0 && (
              <span className="text-sm text-gray-500">
                ({matches.filter((m) => m.team1Result === "WIN").length}승 / {matches.filter((m) => m.team1Result === "DRAW").length}무 / {matches.filter((m) => m.team1Result === "LOSE").length}패)
              </span>
            )}
          </div>
          {/* ✅ 디버깅: 현재 경기 목록 확인 */}
          {process.env.NODE_ENV === "development" && matches.length > 0 && (
            <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded">
              <div>로드된 경기 ID: {matches.map((m) => m.id || "no-id").join(", ")}</div>
              <div>경기 상세: {JSON.stringify(matches.map((m) => ({ id: m.id, team1: m.team1Name, team2: m.team2Name, score1: m.team1Score, score2: m.team2Score })))}</div>
            </div>
          )}
        </div>
      )}

      {/* 경기 목록 */}
      {!isLoading && matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-4">⚽</div>
          <p className="text-gray-500 text-lg font-medium mb-2">
            등록된 경기가 없습니다
          </p>
          <p className="text-gray-400 text-sm">
            {canAddMatch ? "경기 추가 버튼을 눌러 경기를 등록해주세요." : "팀을 2개 추가한 후 경기를 등록할 수 있습니다."}
          </p>
        </div>
      ) : !isLoading && (
        <div className="space-y-4">
          {matches.map((match, index) => {
            console.log("[MatchResultView] Rendering match:", {
              id: match.id,
              team1Name: match.team1Name,
              team1Score: match.team1Score,
              team2Name: match.team2Name,
              team2Score: match.team2Score,
            });

            const winner = getWinner(match);
            const isDraw = winner === "무승부";

            return (
            <div
              key={match.id || `match-${index}`}
              className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6 hover:shadow-lg transition-all">
              {/* 경기 정보 헤더 */}
              <div className="text-xs text-gray-400 mb-4 text-right">
                경기 #{index + 1} {match.id && `(ID: ${match.id})`}
              </div>

              {/* 경기 결과 표시 */}
              <div className="flex items-center justify-between">
                {/* 팀1 */}
                <div className="text-center flex-1">
                  <div className="text-xl font-bold text-gray-800 mb-2">{match.team1Name}</div>
                  <div className={`text-5xl font-bold ${match.team1Score > match.team2Score ? "text-green-600" : match.team1Score < match.team2Score ? "text-gray-400" : "text-blue-600"}`}>
                    {match.team1Score ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {match.team1Result === "WIN" && "승"}
                    {match.team1Result === "DRAW" && "무"}
                    {match.team1Result === "LOSE" && "패"}
                  </div>
                </div>

                {/* VS */}
                <div className="mx-6">
                  <div className="text-2xl font-bold text-gray-400">VS</div>
                </div>

                {/* 팀2 */}
                <div className="text-center flex-1">
                  <div className="text-xl font-bold text-gray-800 mb-2">{match.team2Name}</div>
                  <div className={`text-5xl font-bold ${match.team2Score > match.team1Score ? "text-green-600" : match.team2Score < match.team1Score ? "text-gray-400" : "text-blue-600"}`}>
                    {match.team2Score ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {match.team2Result === "WIN" && "승"}
                    {match.team2Result === "DRAW" && "무"}
                    {match.team2Result === "LOSE" && "패"}
                  </div>
                </div>

                {/* 승자 표시 */}
                <div className="ml-6 text-center min-w-[100px]">
                  <div className="text-sm text-gray-500 mb-2">결과</div>
                  <div className={`text-xl font-bold px-4 py-2 rounded-lg ${
                    isDraw
                      ? "bg-gray-100 text-gray-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {isDraw ? "무승부" : `${winner} 승`}
                  </div>
                </div>

                {/* 수정/삭제 버튼 */}
                <div className="ml-6 flex flex-col gap-2">
                  {/* ✅ Swagger 기준: 서버에서 받은 id만 사용 (임시 ID가 아닌 경우에만 버튼 표시) */}
                  {match.id && match.id !== `match-${index}` && (
                    <>
                      <button
                        onClick={() => {
                          console.log("[MatchResultView] Edit button clicked, match.id:", match.id);
                          if (match.id) {
                            setEditingMatchId(match.id);
                          }
                        }}
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        수정
                      </button>
                      <button
                        onClick={() => {
                          console.log("[MatchResultView] Delete button clicked, match.id:", match.id);
                          if (match.id) {
                            handleDeleteMatch(match.id);
                          }
                        }}
                        className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* 경기 추가 모달 */}
      {isAddModalOpen && (
        <AddMatchModal
          teamNames={teamNames}
          onSave={handleAddMatch}
          onClose={() => setIsAddModalOpen(false)}
          isEditMode={false}
        />
      )}

      {/* 경기 수정 모달 */}
      {/* ✅ Swagger 기준: 서버에서 받은 id만 사용하여 수정 */}
      {editingMatchId && (
        <AddMatchModal
          teamNames={teamNames}
          initialMatch={matches.find((m) => m.id === editingMatchId)}
          onSave={(updatedMatch) => {
            if (editingMatchId) {
              // ✅ 서버에서 받은 matchId만 사용
              handleUpdateMatch(editingMatchId, updatedMatch);
            }
          }}
          onClose={() => setEditingMatchId(null)}
          isEditMode={true}
        />
      )}
    </div>
  );
}
