"use client";

/**
 * 출석 테이블 컴포넌트
 *
 * 선수들의 출석 및 통계를 관리하는 테이블 컴포넌트입니다.
 *
 * 사용하는 커스텀 훅:
 * - usePlayerIdMap: 선수 ID 매핑 관리
 * - usePlayerStats: 선수 통계 데이터 관리
 * - useAttendanceManagement: 출석 상태 관리
 * - usePlayerStatsEditing: 선수 통계 편집 관리
 * - usePlayerStatsSave: 선수 통계 저장 관리
 *
 * 사용하는 유틸리티:
 * - utils/playerStatsUtils: 선수 통계 계산 및 정렬 함수
 *
 * 사용처:
 * - app/records/page.tsx: 기록지 페이지에서 팀별 출석 테이블 표시
 */

import React, { useState, useMemo } from "react";
import { MatchScore, PlayerStat } from "@/types/playerStats";
import { usePlayerIdMap } from "@/hooks/usePlayerIdMap";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { useAttendanceManagement } from "@/hooks/useAttendanceManagement";
import { usePlayerStatsEditing } from "@/hooks/usePlayerStatsEditing";
import { usePlayerStatsSave } from "@/hooks/usePlayerStatsSave";
import { calculateTeamRecord } from "@/utils/playerStatsUtils";

// 상수
const POSITIONS = ["FW", "MF", "DF", "GK"] as const;
const EDITABLE_FIELDS = ["goals", "assists", "cleanSheet", "wins", "draws", "loses", "mom"] as const;

// 컴포넌트
interface TableHeaderProps {
  onToggleAllAttendance: () => void;
  isAllAttended: boolean;
}

const TableHeader = React.memo(({ onToggleAllAttendance, isAllAttended }: TableHeaderProps) => {
  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="w-20 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider border border-gray-300">이름</th>
        <th className="w-24 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
          <div className="flex items-center justify-center gap-2">
            <span>출석</span>
            <input
              type="checkbox"
              checked={isAllAttended}
              onChange={onToggleAllAttendance}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              title="전체 출석/불참 토글"
            />
          </div>
        </th>
        <th className="w-20 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider border border-gray-300">골</th>
        <th className="w-20 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider border border-gray-300">어시스트</th>
        <th className="w-24 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider border border-gray-300">클린시트</th>
        <th className="w-16 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider bg-yellow-100 border border-gray-300">승</th>
        <th className="w-16 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider bg-yellow-100 border border-gray-300">무</th>
        <th className="w-16 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider bg-yellow-100 border border-gray-300">패</th>
        <th className="w-16 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider border border-gray-300">MOM</th>
        <th className="w-20 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider border border-gray-300">총점</th>
      </tr>
    </thead>
  );
});
TableHeader.displayName = "TableHeader";

interface EditableCellProps {
  player: PlayerStat;
  field: string;
  value: number;
  isEditing: boolean;
  editValue: string;
  onCellClick: (playerId: number, field: string, currentValue: number) => void;
  onSave: (playerId: number, field: string) => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, playerId: number, field: string) => void;
  onAttendanceToggle: (playerId: number) => void;
  onEditValueChange: (value: string) => void;
  onPositionChange: (playerId: number, position: string) => void;
}

const EditableCell = React.memo(
  ({ player, field, value, isEditing, editValue, onCellClick, onSave, onCancel, onKeyDown, onAttendanceToggle, onEditValueChange, onPositionChange }: EditableCellProps) => {
    const isAttendanceField = field === "attendance";
    const isWinDrawLoseField = field === "wins" || field === "draws" || field === "loses";

    if (field === "name") {
      return (
        <td className="px-4 py-5 border border-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-sx font-medium text-gray-900 truncate flex-1">{player.name}</span>
            <select
              value={player.position}
              onChange={(e) => onPositionChange(player.id, e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </td>
      );
    }

    if (field === "totalPoint") {
      const displayValue = player.attendance === 0 ? "/" : player.totalPoint;
      return <td className="px-4 py-5 text-center text-sm font-semibold text-gray-900 border border-gray-300">{displayValue}</td>;
    }

    if (isAttendanceField) {
      const isChecked = player.attendance > 0;
      const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onAttendanceToggle(player.id);
      };
      return (
        <td className="px-4 py-5 text-center border border-gray-300">
          <label className="flex items-center justify-center cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="ml-2 text-sm text-gray-700">{isChecked ? "출석" : "불참"}</span>
          </label>
        </td>
      );
    }

    if (isEditing) {
      const bgColor = isWinDrawLoseField ? "bg-yellow-100" : "";
      return (
        <td className={`px-4 py-5 text-center border border-gray-300 ${bgColor}`}>
          <input
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onBlur={() => onSave(player.id, field)}
            onKeyDown={(e) => onKeyDown(e, player.id, field)}
            className="w-16 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
            autoFocus
          />
        </td>
      );
    }

    const isAbsent = player.attendance === 0;
    const shouldShowSlash = isAbsent && (EDITABLE_FIELDS as readonly string[]).includes(field);

    const bgColor = isWinDrawLoseField ? "bg-yellow-100" : "";
    const hoverColor = shouldShowSlash ? "" : isWinDrawLoseField ? "hover:bg-yellow-200" : "hover:bg-blue-50";
    const cursorStyle = shouldShowSlash ? "cursor-default" : "cursor-pointer";

    return (
      <td
        className={`px-4 py-5 text-center text-sm text-gray-500 border border-gray-300 ${cursorStyle} ${bgColor} ${hoverColor} transition-colors`}
        onClick={shouldShowSlash ? undefined : () => onCellClick(player.id, field, value)}
        title={shouldShowSlash ? "" : "클릭하여 수정"}>
        {shouldShowSlash ? <span className="text-xl font-semibold text-gray-600">/</span> : value}
      </td>
    );
  }
);
EditableCell.displayName = "EditableCell";

interface PlayerRowProps {
  player: PlayerStat;
  editingCell: { playerId: number; field: string } | null;
  editValue: string;
  onCellClick: (playerId: number, field: string, currentValue: number) => void;
  onSave: (playerId: number, field: string) => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, playerId: number, field: string) => void;
  onAttendanceToggle: (playerId: number) => void;
  onEditValueChange: (value: string) => void;
  onPositionChange: (playerId: number, position: string) => void;
  teamName: string;
  hasMatchResults: boolean;
}

const PlayerRow = React.memo(
  ({ player, editingCell, editValue, onCellClick, onSave, onCancel, onKeyDown, onAttendanceToggle, onEditValueChange, onPositionChange, hasMatchResults }: PlayerRowProps) => {
    const isEditing = (field: string) => editingCell?.playerId === player.id && editingCell?.field === field;
    const noop = () => {};
    const handleCellClickForWinDrawLose = hasMatchResults ? noop : onCellClick;

    const fields = [
      { field: "name", value: 0 },
      { field: "attendance", value: player.attendance },
      { field: "goals", value: player.goals },
      { field: "assists", value: player.assists },
      { field: "cleanSheet", value: player.cleanSheet },
      { field: "wins", value: player.wins },
      { field: "draws", value: player.draws },
      { field: "loses", value: player.loses },
      { field: "mom", value: player.mom },
      { field: "totalPoint", value: player.totalPoint },
    ] as const;

    return (
      <tr className="hover:bg-gray-50 h-18">
        {fields.map(({ field, value }) => (
          <EditableCell
            key={field}
            player={player}
            field={field}
            value={value}
            isEditing={isEditing(field)}
            editValue={editValue}
            onCellClick={field === "wins" || field === "draws" || field === "loses" ? handleCellClickForWinDrawLose : onCellClick}
            onSave={onSave}
            onCancel={onCancel}
            onKeyDown={onKeyDown}
            onAttendanceToggle={onAttendanceToggle}
            onEditValueChange={onEditValueChange}
            onPositionChange={onPositionChange}
          />
        ))}
      </tr>
    );
  }
);
PlayerRow.displayName = "PlayerRow";

interface AttendanceTableProps {
  selectedDate: string;
  teamName: string;
  customPlayers: { name: string; position: string }[];
  matches?: MatchScore[];
  dateId?: number;
  teamId?: number;
}

export default function AttendanceTable({ selectedDate, teamName, customPlayers, matches = [], dateId, teamId }: AttendanceTableProps) {
  const [showPlayerScores, setShowPlayerScores] = useState<boolean>(false);

  // 선수 ID 매핑 로드 (커스텀 훅 사용)
  const playerIdMap = usePlayerIdMap();

  // 승무패 계산 (메모이제이션)
  const teamRecord = useMemo(() => calculateTeamRecord(matches, teamName), [matches, teamName]);

  // 경기 결과 존재 여부 (메모이제이션)
  const hasMatchResults = useMemo(() => matches.some((m) => m.team1Name === teamName || m.team2Name === teamName), [matches, teamName]);

  // 선수 통계 데이터 관리 (커스텀 훅 사용)
  const { playerStats, setPlayerStats, attendanceMap, setAttendanceMap, updatePlayerStat } = usePlayerStats(selectedDate, customPlayers, dateId, playerIdMap, teamRecord);

  // 출석 관리 (커스텀 훅 사용)
  const { isAllAttended, handleAttendanceToggle, handleToggleAllAttendance } = useAttendanceManagement(playerStats, attendanceMap, setAttendanceMap, setPlayerStats, updatePlayerStat);

  // 편집 관리 (커스텀 훅 사용)
  const { editingCell, editValue, handleCellClick, handleSave, handleCancel, handleKeyDown, handleEditValueChange, handlePositionChange } = usePlayerStatsEditing(updatePlayerStat);

  // 저장 관리 (커스텀 훅 사용)
  const { isSaving, handleSaveAll } = usePlayerStatsSave(playerStats, attendanceMap, dateId, teamId, selectedDate, setPlayerStats, setAttendanceMap);

  // 팀 승무패 표시 텍스트 (메모이제이션)
  const teamRecordText = useMemo(() => {
    if (matches.length > 0) {
      return `(${teamRecord.wins}승 ${teamRecord.draws}무 ${teamRecord.loses}패)`;
    }
    const wins = playerStats.reduce((sum, p) => sum + (p.wins || 0), 0);
    const draws = playerStats.reduce((sum, p) => sum + (p.draws || 0), 0);
    const loses = playerStats.reduce((sum, p) => sum + (p.loses || 0), 0);
    return `(${wins}승 ${draws}무 ${loses}패)`;
  }, [matches.length, teamRecord, playerStats]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden scrollbar-hide">
      <div className="p-4 bg-blue-50 border-b border-gray-200 flex items-center justify-between">
        <p className="text-sm text-blue-700">💡 수치를 클릭하면 편집할 수 있습니다. 출석은 체크박스로 변경 가능합니다. (이름, 총점 제외)</p>
        <button
          onClick={handleSaveAll}
          disabled={isSaving || dateId === undefined}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            isSaving || dateId === undefined ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-500 text-white hover:bg-green-600 shadow-md"
          }`}>
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              저장 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              저장
            </>
          )}
        </button>
      </div>
      <div
        className="p-4 bg-gray-200 border-b border-gray-200 flex justify-center items-center cursor-pointer hover:bg-gray-300 transition-colors relative group"
        onClick={() => setShowPlayerScores((prev) => !prev)}>
        <h2 className="text-xl text-gray-700">
          {teamName}
          <p>{teamRecordText}</p>
        </h2>
      </div>
      <div
        className={`overflow-x-auto scrollbar-hide transition-all duration-300 group ${showPlayerScores ? "opacity-0 max-h-0 overflow-hidden" : "opacity-100"} hover:opacity-100 hover:max-h-[5000px]`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <table className="w-full table-fixed border-collapse border border-gray-300">
          <TableHeader onToggleAllAttendance={handleToggleAllAttendance} isAllAttended={isAllAttended} />
          <tbody className="bg-white">
            {playerStats.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                editingCell={editingCell}
                editValue={editValue}
                onCellClick={handleCellClick}
                onSave={handleSave}
                onCancel={handleCancel}
                onKeyDown={handleKeyDown}
                onAttendanceToggle={handleAttendanceToggle}
                onEditValueChange={handleEditValueChange}
                onPositionChange={handlePositionChange}
                teamName={teamName}
                hasMatchResults={hasMatchResults}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// PlayerStat 타입을 외부에서 사용할 수 있도록 export
export type { PlayerStat } from "@/types/playerStats";
