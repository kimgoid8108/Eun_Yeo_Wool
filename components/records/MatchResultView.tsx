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
}: MatchResultViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      {/* 경기 추가 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsAddModalOpen(true)}
          disabled={!canAddMatch}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            canAddMatch
              ? "bg-green-500 text-white hover:bg-green-600 shadow-md"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}>
          + 경기 추가
        </button>
      </div>

      {/* 경기 목록 */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            {canAddMatch ? "경기를 추가해주세요." : "팀을 2개 추가한 후 경기를 등록할 수 있습니다."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              {/* 표시 모드 */}
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center justify-center gap-4">
                  {/* 팀1 */}
                  <div className="text-center flex-1">
                    <div className="text-lg font-semibold text-gray-800">{match.team1Name}</div>
                    <div className="text-3xl font-bold text-blue-600 mt-2">{match.team1Score}</div>
                  </div>

                  {/* VS */}
                  <div className="text-gray-400 font-medium">VS</div>

                  {/* 팀2 */}
                  <div className="text-center flex-1">
                    <div className="text-lg font-semibold text-gray-800">{match.team2Name}</div>
                    <div className="text-3xl font-bold text-blue-600 mt-2">{match.team2Score}</div>
                  </div>
                </div>

                {/* 승자 표시 */}
                <div className="ml-6 text-center">
                  <div className="text-sm text-gray-500 mb-1">승자</div>
                  <div className={`text-lg font-semibold ${getWinner(match) === "무승부" ? "text-gray-600" : "text-green-600"}`}>
                    {getWinner(match)}
                  </div>
                </div>

                {/* 수정/삭제 버튼 */}
                <div className="ml-6 flex gap-2">
                  <button
                    onClick={() => setEditingMatchId(match.id)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteMatch(match.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
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
      {editingMatchId && (
        <AddMatchModal
          teamNames={teamNames}
          initialMatch={matches.find((m) => m.id === editingMatchId)}
          onSave={(updatedMatch) => handleUpdateMatch(editingMatchId, updatedMatch)}
          onClose={() => setEditingMatchId(null)}
          isEditMode={true}
        />
      )}
    </div>
  );
}
