"use client";

import { useState, useEffect } from "react";
import { players } from "@/data/players";
import { records } from "@/data/records";
import { scoringRules } from "@/data/rules";

interface PlayerStat {
  id: string;
  name: string;
  position: string;
  attendance: number;
  goals: number;
  assists: number;
  cleanSheet: number;
  wins: number;
  draws: number;
  loses: number;
  mom: number;
  totalPoint: number;
}

export default function AttendanceTable() {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [editingCell, setEditingCell] = useState<{ playerId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // 초기 데이터 로드
  useEffect(() => {
    const stats = players.map((player) => {
      const playerRecords = records.filter((r) => r.playerId === player.id);

      const attendance = playerRecords.filter((r) => r.attendance).length;
      const goals = playerRecords.reduce((sum, r) => sum + r.goals, 0);
      const assists = playerRecords.reduce((sum, r) => sum + r.assists, 0);
      const cleanSheet = playerRecords.filter((r) => r.cleanSheet).length;
      const wins = playerRecords.filter((r) => r.result === "WIN").length;
      const draws = playerRecords.filter((r) => r.result === "DRAW").length;
      const loses = playerRecords.filter((r) => r.result === "LOSE").length;
      const mom = playerRecords.filter((r) => r.isMOM).length;

      // 총점 계산 (승/무/패 제외)
      const attendanceScore = attendance > 0 ? scoringRules.attendance : 0;
      const totalPoint = attendanceScore + goals * scoringRules.goal + assists * scoringRules.assist + cleanSheet * scoringRules.cleanSheet + mom * scoringRules.mom;

      return {
        id: player.id,
        name: player.name,
        position: player.position,
        attendance,
        goals,
        assists,
        cleanSheet,
        wins,
        draws,
        loses,
        mom,
        totalPoint,
      };
    });

    stats.sort((a, b) => b.totalPoint - a.totalPoint);
    setPlayerStats(stats);
  }, []);

  const handleCellClick = (playerId: string, field: string, currentValue: number) => {
    setEditingCell({ playerId, field });
    setEditValue(currentValue.toString());
  };

  const handleSave = (playerId: string, field: string) => {
    const value = Math.max(0, parseInt(editValue) || 0);

    setPlayerStats((prev) => {
      const updated = prev.map((player) => {
        if (player.id === playerId) {
          const updatedPlayer = { ...player, [field]: value };

          // 총점 재계산 (승/무/패 제외)
          const attendanceScore = updatedPlayer.attendance > 0 ? scoringRules.attendance : 0;
          updatedPlayer.totalPoint =
            attendanceScore +
            updatedPlayer.goals * scoringRules.goal +
            updatedPlayer.assists * scoringRules.assist +
            updatedPlayer.cleanSheet * scoringRules.cleanSheet +
            updatedPlayer.mom * scoringRules.mom;

          return updatedPlayer;
        }
        return player;
      });

      // 총점 기준으로 재정렬
      updated.sort((a, b) => b.totalPoint - a.totalPoint);
      return updated;
    });

    setEditingCell(null);
    setEditValue("");
  };

  const handleAttendanceToggle = (playerId: string) => {
    setPlayerStats((prev) => {
      const updated = prev.map((player) => {
        if (player.id === playerId) {
          const updatedPlayer = { ...player, attendance: player.attendance > 0 ? 0 : 1 };

          // 총점 재계산 (승/무/패 제외)
          const attendanceScore = updatedPlayer.attendance > 0 ? scoringRules.attendance : 0;
          updatedPlayer.totalPoint =
            attendanceScore +
            updatedPlayer.goals * scoringRules.goal +
            updatedPlayer.assists * scoringRules.assist +
            updatedPlayer.cleanSheet * scoringRules.cleanSheet +
            updatedPlayer.mom * scoringRules.mom;

          return updatedPlayer;
        }
        return player;
      });

      // 총점 기준으로 재정렬
      updated.sort((a, b) => b.totalPoint - a.totalPoint);
      return updated;
    });
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, playerId: string, field: string) => {
    if (e.key === "Enter") {
      handleSave(playerId, field);
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const renderEditableCell = (player: PlayerStat, field: string, value: number) => {
    const isEditing = editingCell?.playerId === player.id && editingCell?.field === field;
    const isNameField = field === "name" || field === "totalPoint";
    const isAttendanceField = field === "attendance";
    const isWinDrawLoseField = field === "wins" || field === "draws" || field === "loses";

    if (isNameField && field === "name") {
      return <td className="px-4 py-5 truncate text-sm font-medium text-gray-900">{player.name}</td>;
    }

    if (isNameField && field === "totalPoint") {
      return <td className="px-4 py-5 text-center text-sm font-semibold text-gray-900">{player.totalPoint}</td>;
    }

    // 출석 필드는 체크박스로 표시
    if (isAttendanceField) {
      const isChecked = player.attendance > 0;
      return (
        <td className="px-4 py-5 text-center">
          <label className="flex items-center justify-center cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleAttendanceToggle(player.id)}
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
        <td className={`px-4 py-5 text-center ${bgColor}`}>
          <input
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(player.id, field)}
            onKeyDown={(e) => handleKeyDown(e, player.id, field)}
            className="w-16 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
            autoFocus
          />
        </td>
      );
    }

    const bgColor = isWinDrawLoseField ? "bg-yellow-100" : "";
    const hoverColor = isWinDrawLoseField ? "hover:bg-yellow-200" : "hover:bg-blue-50";

    return (
      <td
        className={`px-4 py-5 text-center text-sm text-gray-500 cursor-pointer ${bgColor} ${hoverColor} transition-colors`}
        onClick={() => handleCellClick(player.id, field, value)}
        title="클릭하여 수정">
        {value}
      </td>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-gray-200">
        <p className="text-sm text-blue-700">💡 수치를 클릭하면 편집할 수 있습니다. 출석은 체크박스로 변경 가능합니다. (이름, 총점 제외)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-24 px-4 py-3 text-left text-[20px] font-medium text-gray-500 uppercase tracking-wider">이름</th>
              <th className="w-24 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">출석</th>
              <th className="w-20 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">골</th>
              <th className="w-20 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">어시스트</th>
              <th className="w-24 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">클린시트</th>
              <th className="w-16 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider bg-yellow-100">승</th>
              <th className="w-16 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider bg-yellow-100">무</th>
              <th className="w-16 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider bg-yellow-100">패</th>
              <th className="w-16 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">MOM</th>
              <th className="w-20 px-4 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">총점</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {playerStats.map((player) => (
              <tr key={player.id} className="hover:bg-gray-50">
                {renderEditableCell(player, "name", 0)}
                {renderEditableCell(player, "attendance", player.attendance)}
                {renderEditableCell(player, "goals", player.goals)}
                {renderEditableCell(player, "assists", player.assists)}
                {renderEditableCell(player, "cleanSheet", player.cleanSheet)}
                {renderEditableCell(player, "wins", player.wins)}
                {renderEditableCell(player, "draws", player.draws)}
                {renderEditableCell(player, "loses", player.loses)}
                {renderEditableCell(player, "mom", player.mom)}
                {renderEditableCell(player, "totalPoint", player.totalPoint)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
