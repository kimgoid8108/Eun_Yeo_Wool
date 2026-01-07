"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { scoringRules } from "@/data/rules";
import { savePlayerRecord, getPlayerRecords } from "@/services/recordsService";
import { getPlayers } from "@/services/playersService";
import { Player } from "@/types/api";
import { days } from "@/data/days";

type MatchScore = {
  team1Name: string;
  team2Name: string;
  team1Result: "WIN" | "DRAW" | "LOSE";
  team2Result: "WIN" | "DRAW" | "LOSE";
};

type PlayerRecordResponse = {
  playerId: number;
  attendance: boolean;
};

export interface PlayerStat {
  id: number;
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

// 상수
const POSITIONS = ["FW", "MF", "DF", "GK"] as const;
const EDITABLE_FIELDS = ["goals", "assists", "cleanSheet", "wins", "draws", "loses", "mom"] as const;

// 유틸리티 함수
const sortPlayerStats = (stats: PlayerStat[]): PlayerStat[] => {
  return [...stats].sort((a, b) => {
    if (a.attendance > 0 && b.attendance === 0) return -1;
    if (a.attendance === 0 && b.attendance > 0) return 1;
    return b.totalPoint - a.totalPoint;
  });
};

const calculateTotalPoint = (attendance: number, goals: number, assists: number, cleanSheet: number, mom: number): number => {
  const attendanceScore = attendance > 0 ? scoringRules.attendance : 0;
  return attendanceScore + goals * scoringRules.goal + assists * scoringRules.assist + cleanSheet * scoringRules.cleanSheet + mom * scoringRules.mom;
};

const calculateTeamRecord = (matches: MatchScore[], teamName: string) => {
  if (matches.length === 0) return { wins: 0, draws: 0, loses: 0 };

  const teamMatches = matches.filter((m) => m.team1Name === teamName || m.team2Name === teamName);
  let wins = 0;
  let draws = 0;
  let loses = 0;

  teamMatches.forEach((match) => {
    const teamResult = match.team1Name === teamName ? match.team1Result : match.team2Result;
    if (teamResult === "WIN") wins++;
    else if (teamResult === "DRAW") draws++;
    else if (teamResult === "LOSE") loses++;
  });

  return { wins, draws, loses };
};

const createPlayerRecordMap = (records: PlayerRecordResponse[]): Map<number, PlayerRecordResponse> => {
  const map = new Map<number, PlayerRecordResponse>();
  records.forEach((record) => {
    map.set(record.playerId, record);
  });
  return map;
};

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

// 출석 상태 타입: 프론트 전용 상태 (DB 저장 필드 제외)
type AttendanceState = {
  playerName: string;
  attendance: boolean;
};

export default function AttendanceTable({ selectedDate, teamName, customPlayers, matches = [], dateId, teamId }: AttendanceTableProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [editingCell, setEditingCell] = useState<{ playerId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showPlayerScores, setShowPlayerScores] = useState<boolean>(false);
  const [playerIdMap, setPlayerIdMap] = useState<Map<string, number>>(new Map());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // 출석 상태는 프론트 전용 상태로만 관리 (DB 저장 필드 제외)
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceState>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // 선수 ID 매핑 로드
  useEffect(() => {
    const loadPlayerIdMap = async () => {
      try {
        const apiPlayers: Player[] = await getPlayers();
        const map = new Map<string, number>();
        apiPlayers.forEach((player) => {
          map.set(player.name, player.id);
        });
        setPlayerIdMap(map);
      } catch (error) {
        console.error("[AttendanceTable] Failed to load players:", error);
      }
    };
    loadPlayerIdMap();
  }, []);

  // 승무패 계산 (메모이제이션)
  const teamRecord = useMemo(() => calculateTeamRecord(matches, teamName), [matches, teamName]);

  // 경기 결과 존재 여부 (메모이제이션)
  const hasMatchResults = useMemo(() => matches.some((m) => m.team1Name === teamName || m.team2Name === teamName), [matches, teamName]);

  // 선수 통계 로드
  useEffect(() => {
    if (!selectedDate || playerIdMap.size === 0) {
      if (!selectedDate) setPlayerStats([]);
      return;
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const loadPlayerStats = async () => {
      const numericDateId = typeof dateId === "number" ? dateId : days.find((d) => d.id === selectedDate)?.dateId;

      let playerRecordMap = new Map<number, PlayerRecordResponse>();
      if (typeof numericDateId === "number") {
        try {
          const savedRecords: PlayerRecordResponse[] = await getPlayerRecords(numericDateId);
          if (savedRecords?.length > 0) {
            playerRecordMap = createPlayerRecordMap(savedRecords);
          }
        } catch (error) {
          if (error instanceof Error && error.name !== "AbortError") {
            console.error("[AttendanceTable] Failed to load saved records from DB:", error);
          }
        }
      }

      // 모든 선수에 대해 프론트 상태 초기화 (DB에서 불러온 참석자 + 불참자 모두 포함)
      const stats: PlayerStat[] = customPlayers
        .map((player) => {
          const apiPlayerId = playerIdMap.get(player.name);
          if (apiPlayerId === undefined) {
            console.warn(`[AttendanceTable] Player ID not found for: ${player.name}`);
            return null;
          }

          // DB에서 저장된 기록 조회 (참석자만 DB에 저장되므로, 있으면 참석, 없으면 불참)
          const savedRecord = playerRecordMap.get(apiPlayerId);
          const attendanceValue = savedRecord?.attendance ?? false;
          const attendance = attendanceValue ? 1 : 0;

          const totalPoint = calculateTotalPoint(attendance, 0, 0, 0, 0);

          return {
            id: apiPlayerId,
            name: player.name,
            position: player.position,
            attendance,
            goals: 0,
            assists: 0,
            cleanSheet: 0,
            wins: teamRecord.wins,
            draws: teamRecord.draws,
            loses: teamRecord.loses,
            mom: 0,
            totalPoint,
          };
        })
        .filter((stat): stat is PlayerStat => stat !== null);

      // 프론트 전용 출석 상태 초기화 (playerName 포함)
      const initialAttendanceMap: Record<number, AttendanceState> = {};
      stats.forEach((stat) => {
        const savedRecord = playerRecordMap.get(stat.id);
        initialAttendanceMap[stat.id] = {
          playerName: stat.name,
          attendance: savedRecord?.attendance ?? false,
        };
      });
      setAttendanceMap(initialAttendanceMap);
      setPlayerStats(sortPlayerStats(stats));
    };

    loadPlayerStats();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedDate, customPlayers, teamName, dateId, playerIdMap, teamRecord]);

  // 핸들러들
  const handleCellClick = useCallback((playerId: number, field: string, currentValue: number) => {
    setEditingCell({ playerId, field });
    setEditValue(currentValue.toString());
  }, []);

  const updatePlayerStat = useCallback((playerId: number, updater: (player: PlayerStat) => PlayerStat) => {
    setPlayerStats((prev) => sortPlayerStats(prev.map((p) => (p.id === playerId ? updater(p) : p))));
  }, []);

  const handleSave = useCallback(
    (playerId: number, field: string) => {
      const value = Math.max(0, parseInt(editValue) || 0);
      updatePlayerStat(playerId, (player) => {
        const updated = { ...player, [field]: value };
        updated.totalPoint = calculateTotalPoint(updated.attendance, updated.goals, updated.assists, updated.cleanSheet, updated.mom);
        return updated;
      });
      setEditingCell(null);
      setEditValue("");
    },
    [editValue, updatePlayerStat]
  );

  const handleAttendanceToggle = useCallback(
    (playerId: number) => {
      // 프론트 전용 출석 상태 업데이트
      setAttendanceMap((prev) => {
        const current = prev[playerId];
        if (!current) return prev;
        return {
          ...prev,
          [playerId]: {
            playerName: current.playerName,
            attendance: !current.attendance,
          },
        };
      });
      // UI 상태 업데이트
      updatePlayerStat(playerId, (player) => {
        const newAttendance = player.attendance > 0 ? 0 : 1;
        const updated = { ...player, attendance: newAttendance };
        updated.totalPoint = calculateTotalPoint(updated.attendance, updated.goals, updated.assists, updated.cleanSheet, updated.mom);
        return updated;
      });
    },
    [updatePlayerStat]
  );

  const handleToggleAllAttendance = useCallback(() => {
    setPlayerStats((prev) => {
      const allAttended = prev.length > 0 && prev.every((player) => player.attendance > 0);
      const newAttendanceValue = !allAttended;
      const newAttendance = newAttendanceValue ? 1 : 0;

      // 프론트 전용 출석 상태 업데이트
      setAttendanceMap((currentMap) => {
        const newMap: Record<number, AttendanceState> = {};
        prev.forEach((player) => {
          const current = currentMap[player.id];
          newMap[player.id] = {
            playerName: current?.playerName ?? player.name,
            attendance: newAttendanceValue,
          };
        });
        return newMap;
      });

      return sortPlayerStats(
        prev.map((player) => {
          const updated = { ...player, attendance: newAttendance };
          updated.totalPoint = calculateTotalPoint(updated.attendance, updated.goals, updated.assists, updated.cleanSheet, updated.mom);
          return updated;
        })
      );
    });
  }, []);

  const isAllAttended = useMemo(() => {
    if (playerStats.length === 0) return false;
    return playerStats.every((player) => {
      const attendanceState = attendanceMap[player.id];
      return attendanceState?.attendance === true;
    });
  }, [playerStats, attendanceMap]);

  const handleCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, playerId: number, field: string) => {
      if (e.key === "Enter") {
        handleSave(playerId, field);
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleEditValueChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const handlePositionChange = useCallback((playerId: number, position: string) => {
    setPlayerStats((prev) => prev.map((player) => (player.id === playerId ? { ...player, position } : player)));
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (dateId === undefined || teamId === undefined || playerStats.length === 0) {
      alert(dateId === undefined ? "날짜 정보가 없어 저장할 수 없습니다." : teamId === undefined ? "팀 정보가 없어 저장할 수 없습니다." : "저장할 데이터가 없습니다.");
      return;
    }

    setIsSaving(true);
    try {
      // 참석자(attendance === true)만 필터링하여 DB에 저장
      const playersToSave = playerStats.filter((player) => {
        const attendanceState = attendanceMap[player.id];
        return attendanceState?.attendance === true;
      });

      if (playersToSave.length === 0) {
        alert("저장할 참석자가 없습니다.");
        setIsSaving(false);
        return;
      }

      // 참석자만 DB에 저장 (payload: playerId, teamId, dateId, attendance: true)
      const savePromises = playersToSave.map((player) =>
        savePlayerRecord({
          playerId: player.id,
          teamId,
          dateId,
          attendance: true, // 참석자만 저장하므로 항상 true
        })
      );

      await Promise.all(savePromises);
      alert(`참석자 ${playersToSave.length}명의 데이터가 저장되었습니다!`);

      // DB 저장 후 최신 데이터 다시 불러오기 (참석자만 DB에 있음)
      const numericDateId = typeof dateId === "number" ? dateId : days.find((d) => d.id === selectedDate)?.dateId;

      if (typeof numericDateId === "number") {
        try {
          const savedRecords: PlayerRecordResponse[] = await getPlayerRecords(numericDateId);
          const playerRecordMap = createPlayerRecordMap(savedRecords);

          // 프론트 전용 출석 상태 업데이트 (DB에서 불러온 참석자 + 프론트 상태의 불참자 모두 유지)
          setAttendanceMap((prevMap) => {
            const updatedMap: Record<number, AttendanceState> = { ...prevMap };
            // DB에서 불러온 참석자 정보로 업데이트
            savedRecords.forEach((record) => {
              const existing = prevMap[record.playerId];
              updatedMap[record.playerId] = {
                playerName: existing?.playerName ?? playerStats.find((p) => p.id === record.playerId)?.name ?? "",
                attendance: record.attendance, // DB에서 불러온 값 (항상 true)
              };
            });
            // 불참자는 프론트 상태 유지 (DB에 저장되지 않았으므로 프론트 상태 그대로)
            return updatedMap;
          });

          // UI 상태 업데이트 (참석자만 DB에서 불러온 값으로 업데이트, 불참자는 프론트 상태 유지)
          setPlayerStats((prev) =>
            sortPlayerStats(
              prev.map((stat) => {
                const savedRecord = playerRecordMap.get(stat.id);
                if (savedRecord) {
                  // DB에 저장된 참석자: DB 값으로 업데이트
                  const attendance = savedRecord.attendance ? 1 : 0;
                  const updated = { ...stat, attendance };
                  updated.totalPoint = calculateTotalPoint(attendance, 0, 0, 0, 0);
                  return updated;
                }
                // DB에 없는 불참자: 프론트 상태 유지
                return stat;
              })
            )
          );
        } catch (error) {
          console.error("[AttendanceTable] Failed to reload saved records after save:", error);
        }
      }
    } catch (error) {
      console.error("[AttendanceTable] Failed to save all records to DB:", error);
      alert("데이터 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [playerStats, dateId, teamId, attendanceMap, selectedDate]);

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
