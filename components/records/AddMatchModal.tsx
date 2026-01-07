"use client";

import { useState, useEffect, useCallback } from "react";
import { MatchScore, MatchResult } from "@/types/records";

interface AddMatchModalProps {
  teamNames: string[];
  initialMatch?: MatchScore;
  onSave: (match: MatchScore) => void;
  onClose: () => void;
  isEditMode?: boolean;
}

/**
 * 경기 추가/수정 모달 컴포넌트
 *
 * 경기 결과를 추가하거나 수정하는 모달 컴포넌트입니다.
 * - 경기 스코어 입력
 * - 팀 선택 및 스코어 입력
 *
 * 사용처:
 * - components/records/MatchResultView.tsx: 경기 결과 뷰에서 경기 추가/수정 모달로 사용
 */
export default function AddMatchModal({
  teamNames,
  initialMatch,
  onSave,
  onClose,
  isEditMode = false,
}: AddMatchModalProps) {
  const [team1Name, setTeam1Name] = useState(initialMatch?.team1Name || teamNames[0] || "");
  const [team1Score, setTeam1Score] = useState(initialMatch?.team1Score.toString() || "0");
  const [team2Name, setTeam2Name] = useState(initialMatch?.team2Name || teamNames[1] || "");
  const [team2Score, setTeam2Score] = useState(initialMatch?.team2Score.toString() || "0");

  // 팀이 2개가 아닌 경우 처리
  useEffect(() => {
    if (teamNames.length >= 2) {
      if (!initialMatch) {
        setTeam1Name(teamNames[0]);
        setTeam2Name(teamNames[1]);
      }
    }
  }, [teamNames, initialMatch]);

  // 승무패 계산 함수
  const calculateResult = useCallback((score1: number, score2: number): "WIN" | "DRAW" | "LOSE" => {
    if (score1 > score2) return "WIN";
    if (score1 < score2) return "LOSE";
    return "DRAW";
  }, []);

  // 제출 핸들러
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (team1Name === team2Name) {
        alert("서로 다른 팀을 선택해주세요.");
        return;
      }

      const score1 = parseInt(team1Score, 10);
      const score2 = parseInt(team2Score, 10);

      if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
        alert("올바른 스코어를 입력해주세요.");
        return;
      }

      // 승무패 자동 계산
      const team1Result = calculateResult(score1, score2);
      const team2Result = calculateResult(score2, score1);

      const match: MatchScore = {
        id: initialMatch?.id || `match-${Date.now()}`,
        team1Name,
        team1Score: score1,
        team1Result,
        team2Name,
        team2Score: score2,
        team2Result,
      };

      onSave(match);
    },
    [team1Name, team1Score, team2Name, team2Score, initialMatch, onSave, calculateResult]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? "경기 수정" : "경기 추가"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 팀1 선택 및 스코어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">팀 1</label>
            <select
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              required>
              {teamNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
              placeholder="스코어"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* VS 표시 */}
          <div className="text-center text-gray-400 font-medium text-lg">VS</div>

          {/* 팀2 선택 및 스코어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">팀 2</label>
            <select
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              required>
              {teamNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
              placeholder="스코어"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium">
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
              {isEditMode ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
