"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { records } from "@/data/records";
import { scoringRules } from "@/data/rules";

/**
 * 플레이어 통계 인터페이스
 */
export interface PlayerStat {
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

/**
 * 테이블 헤더 컴포넌트 Props
 */
interface TableHeaderProps {
  onToggleAllAttendance: () => void;
  isAllAttended: boolean;
}

/**
 * 테이블 헤더 컴포넌트
 */
function TableHeader({ onToggleAllAttendance, isAllAttended }: TableHeaderProps) {
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
}

/**
 * 편집 가능한 셀 컴포넌트 Props
 */
interface EditableCellProps {
  player: PlayerStat;
  field: string;
  value: number;
  isEditing: boolean;
  editValue: string;
  onCellClick: (playerId: string, field: string, currentValue: number) => void;
  onSave: (playerId: string, field: string) => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent, playerId: string, field: string) => void;
  onAttendanceToggle: (playerId: string) => void;
  onEditValueChange: (value: string) => void;
  onPositionChange: (playerId: string, position: string) => void;
}

/**
 * 편집 가능한 셀 컴포넌트
 * - 필드 타입에 따라 다른 UI 렌더링
 * - 이름/총점: 읽기 전용
 * - 출석: 체크박스
 * - 기타: 클릭 시 편집 모드
 */
function EditableCell({ player, field, value, isEditing, editValue, onCellClick, onSave, onCancel, onKeyDown, onAttendanceToggle, onEditValueChange, onPositionChange }: EditableCellProps) {
  const isNameField = field === "name" || field === "totalPoint";
  const isAttendanceField = field === "attendance";
  const isWinDrawLoseField = field === "wins" || field === "draws" || field === "loses";

  // 포지션 옵션
  const positions = ["FW", "MF", "DF", "GK"];

  // 이름 필드: 이름과 포지션 선택 드롭다운
  if (field === "name") {
    return (
      <td className="px-4 py-5 border border-gray-300">
        <div className="flex items-center gap-2">
          <span className="text-sx font-medium text-gray-900 truncate flex-1">{player.name}</span>
          <select
            value={player.position}
            onChange={(e) => onPositionChange(player.id, e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
      </td>
    );
  }

  // 총점 필드: 읽기 전용 (불참한 경우 "/" 표시)
  if (field === "totalPoint") {
    const displayValue = player.attendance === 0 ? "/" : player.totalPoint;
    return <td className="px-4 py-5 text-center text-sm font-semibold text-gray-900 border border-gray-300">{displayValue}</td>;
  }

  // 출석 필드: 체크박스로 표시
  if (isAttendanceField) {
    const isChecked = player.attendance > 0;
    return (
      <td className="px-4 py-5 text-center border border-gray-300">
        <label className="flex items-center justify-center cursor-pointer">
          <input type="checkbox" checked={isChecked} onChange={() => onAttendanceToggle(player.id)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
          <span className="ml-2 text-sm text-gray-700">{isChecked ? "출석" : "불참"}</span>
        </label>
      </td>
    );
  }

  // 편집 모드: 숫자 입력 필드
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

  // 일반 모드: 클릭 가능한 셀 (불참한 선수는 골부터 총점까지 "/" 표시)
  const isAbsent = player.attendance === 0;
  const shouldShowSlash = isAbsent && (field === "goals" || field === "assists" || field === "cleanSheet" || field === "wins" || field === "draws" || field === "loses" || field === "mom");

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

/**
 * 선수 행 컴포넌트 Props
 */
interface PlayerRowProps {
  player: PlayerStat;
  editingCell: { playerId: string; field: string } | null;
  editValue: string;
  onCellClick: (playerId: string, field: string, currentValue: number) => void;
  onSave: (playerId: string, field: string) => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent, playerId: string, field: string) => void;
  onAttendanceToggle: (playerId: string) => void;
  onEditValueChange: (value: string) => void;
  onPositionChange: (playerId: string, position: string) => void;
  teamName: string;
  matches?: import("@/types/records").MatchScore[];
}

/**
 * 선수 행 컴포넌트
 * - 각 선수의 경기 기록을 한 행으로 표시
 */
function PlayerRow({ player, editingCell, editValue, onCellClick, onSave, onCancel, onKeyDown, onAttendanceToggle, onEditValueChange, onPositionChange, teamName, matches = [] }: PlayerRowProps) {
  return (
    <tr className="hover:bg-gray-50 h-18">
      <EditableCell
        player={player}
        field="name"
        value={0}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "name"}
        editValue={editValue}
        onCellClick={onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
      <EditableCell
        player={player}
        field="attendance"
        value={player.attendance}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "attendance"}
        editValue={editValue}
        onCellClick={onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
      <EditableCell
        player={player}
        field="goals"
        value={player.goals}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "goals"}
        editValue={editValue}
        onCellClick={onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
      <EditableCell
        player={player}
        field="assists"
        value={player.assists}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "assists"}
        editValue={editValue}
        onCellClick={onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
      <EditableCell
        player={player}
        field="cleanSheet"
        value={player.cleanSheet}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "cleanSheet"}
        editValue={editValue}
        onCellClick={onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
      <EditableCell
        player={player}
        field="wins"
        value={player.wins}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "wins"}
        editValue={editValue}
        onCellClick={hasMatchResults(matches, teamName) ? () => {} : onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
      <EditableCell
        player={player}
        field="draws"
        value={player.draws}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "draws"}
        editValue={editValue}
        onCellClick={hasMatchResults(matches, teamName) ? () => {} : onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
      <EditableCell
        player={player}
        field="loses"
        value={player.loses}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "loses"}
        editValue={editValue}
        onCellClick={hasMatchResults(matches, teamName) ? () => {} : onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
      <EditableCell
        player={player}
        field="mom"
        value={player.mom}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "mom"}
        editValue={editValue}
        onCellClick={onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
      <EditableCell
        player={player}
        field="totalPoint"
        value={player.totalPoint}
        isEditing={editingCell?.playerId === player.id && editingCell?.field === "totalPoint"}
        editValue={editValue}
        onCellClick={onCellClick}
        onSave={onSave}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onAttendanceToggle={onAttendanceToggle}
        onEditValueChange={onEditValueChange}
        onPositionChange={onPositionChange}
      />
    </tr>
  );
}

/**
 * AttendanceTable 컴포넌트 Props
 * @param selectedDate - 선택된 날짜 ID (days.id, matchId로 사용됨)
 * @param teamName - 팀 이름
 * @param customPlayers - 커스텀 선수 목록
 * @param matches - 경기 결과 목록 (선택적, 승무패 자동 계산용)
 */
interface AttendanceTableProps {
  selectedDate: string;
  teamName: string;
  customPlayers: { name: string; position: string }[];
  matches?: import("@/types/records").MatchScore[];
}

/**
 * 경기 결과가 있는지 확인하는 함수
 */
function hasMatchResults(matches: import("@/types/records").MatchScore[], teamName: string): boolean {
  return matches.some((m) => m.team1Name === teamName || m.team2Name === teamName);
}

/**
 * 경기 기록 테이블 컴포넌트
 * - 선택된 날짜의 경기 기록을 표시
 * - 플레이어별 통계를 계산하여 표시
 * - 셀 클릭으로 수치 편집 가능
 */
export default function AttendanceTable({ selectedDate, teamName, customPlayers, matches = [] }: AttendanceTableProps) {
  // 플레이어 통계 데이터
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  // 현재 편집 중인 셀 정보
  const [editingCell, setEditingCell] = useState<{ playerId: string; field: string } | null>(null);
  // 편집 중인 값
  const [editValue, setEditValue] = useState<string>("");
  // 선수 점수 표시 여부
  const [showPlayerScores, setShowPlayerScores] = useState<boolean>(false);

  /**
   * 총점 계산 함수 (중복 로직 제거)
   * @param attendance - 출석 여부 (0 또는 1)
   * @param goals - 골 수
   * @param assists - 어시스트 수
   * @param cleanSheet - 클린시트 수
   * @param mom - MOM 수
   * @returns 계산된 총점
   */
  const calculateTotalPoint = useCallback((attendance: number, goals: number, assists: number, cleanSheet: number, mom: number) => {
    const attendanceScore = attendance > 0 ? scoringRules.attendance : 0;
    return attendanceScore + goals * scoringRules.goal + assists * scoringRules.assist + cleanSheet * scoringRules.cleanSheet + mom * scoringRules.mom;
  }, []);

  /**
   * 선택된 날짜의 경기 기록을 기반으로 플레이어 통계 계산
   * selectedDate가 변경될 때마다 실행
   */
  useEffect(() => {
    if (!selectedDate) {
      setPlayerStats([]);
      return;
    }

    // selectedDate는 days.id이므로 matchId로 직접 사용
    const matchId = selectedDate;

    // 각 플레이어의 통계 계산 (customPlayers 사용)
    const stats = customPlayers.map((player, index) => {
      // 커스텀 플레이어의 id는 인덱스 기반으로 생성
      const playerId = String(index + 1);
      // 선택된 경기의 해당 플레이어 기록만 필터링
      const playerRecords = records.filter((r) => r.playerId === playerId && r.matchId === matchId);

      // 통계 집계
      const attendance = playerRecords.filter((r) => r.attendance).length;
      const goals = playerRecords.reduce((sum, r) => sum + r.goals, 0);
      const assists = playerRecords.reduce((sum, r) => sum + r.assists, 0);
      const cleanSheet = playerRecords.filter((r) => r.cleanSheet).length;
      const mom = playerRecords.filter((r) => r.isMOM).length;

      // 경기 결과에서 승무패 계산 (matches가 있으면 우선 사용)
      let wins = 0;
      let draws = 0;
      let loses = 0;

      if (matches.length > 0) {
        // 현재 팀의 경기 결과만 필터링
        const teamMatches = matches.filter((m) => m.team1Name === teamName || m.team2Name === teamName);
        teamMatches.forEach((match) => {
          const teamResult = match.team1Name === teamName ? match.team1Result : match.team2Result;
          if (teamResult === "WIN") wins++;
          else if (teamResult === "DRAW") draws++;
          else if (teamResult === "LOSE") loses++;
        });
      } else {
        // 기존 records 데이터에서 계산 (하위 호환성)
        wins = playerRecords.filter((r) => r.result === "WIN").length;
        draws = playerRecords.filter((r) => r.result === "DRAW").length;
        loses = playerRecords.filter((r) => r.result === "LOSE").length;
      }

      // 총점 계산
      const totalPoint = calculateTotalPoint(attendance, goals, assists, cleanSheet, mom);

      return {
        id: playerId,
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

    // 정렬: 출석한 선수는 총점 기준 내림차순, 불참한 선수는 맨 아래
    stats.sort((a, b) => {
      // 출석 여부로 먼저 분리
      if (a.attendance > 0 && b.attendance === 0) return -1; // 출석한 선수가 위
      if (a.attendance === 0 && b.attendance > 0) return 1; // 불참한 선수가 아래
      // 둘 다 출석했거나 둘 다 불참한 경우 총점 기준 정렬
      return b.totalPoint - a.totalPoint;
    });
    setPlayerStats(stats);
  }, [selectedDate, calculateTotalPoint, customPlayers]);

  /**
   * 셀 클릭 핸들러 - 편집 모드로 전환
   */
  const handleCellClick = useCallback((playerId: string, field: string, currentValue: number) => {
    setEditingCell({ playerId, field });
    setEditValue(currentValue.toString());
  }, []);

  /**
   * 편집 값 저장 핸들러
   * - 수정된 값을 저장하고 총점 재계산 및 정렬
   */
  const handleSave = useCallback(
    (playerId: string, field: string) => {
      const value = Math.max(0, parseInt(editValue) || 0);

      setPlayerStats((prev) => {
        const updated = prev.map((player) => {
          if (player.id === playerId) {
            const updatedPlayer = { ...player, [field]: value };
            // 총점 재계산
            updatedPlayer.totalPoint = calculateTotalPoint(updatedPlayer.attendance, updatedPlayer.goals, updatedPlayer.assists, updatedPlayer.cleanSheet, updatedPlayer.mom);
            return updatedPlayer;
          }
          return player;
        });

        // 정렬: 출석한 선수는 총점 기준 내림차순, 불참한 선수는 맨 아래
        updated.sort((a, b) => {
          if (a.attendance > 0 && b.attendance === 0) return -1;
          if (a.attendance === 0 && b.attendance > 0) return 1;
          return b.totalPoint - a.totalPoint;
        });
        return updated;
      });

      setEditingCell(null);
      setEditValue("");
    },
    [editValue, calculateTotalPoint]
  );

  /**
   * 출석 체크박스 토글 핸들러
   * - 출석/불참 상태를 변경하고 총점 재계산
   */
  const handleAttendanceToggle = useCallback(
    (playerId: string) => {
      setPlayerStats((prev) => {
        const updated = prev.map((player) => {
          if (player.id === playerId) {
            const updatedPlayer = { ...player, attendance: player.attendance > 0 ? 0 : 1 };
            // 총점 재계산
            updatedPlayer.totalPoint = calculateTotalPoint(updatedPlayer.attendance, updatedPlayer.goals, updatedPlayer.assists, updatedPlayer.cleanSheet, updatedPlayer.mom);
            return updatedPlayer;
          }
          return player;
        });

        // 정렬: 출석한 선수는 총점 기준 내림차순, 불참한 선수는 맨 아래
        updated.sort((a, b) => {
          if (a.attendance > 0 && b.attendance === 0) return -1;
          if (a.attendance === 0 && b.attendance > 0) return 1;
          return b.totalPoint - a.totalPoint;
        });
        return updated;
      });
    },
    [calculateTotalPoint]
  );

  /**
   * 전체 출석 토글 핸들러
   * - 모든 선수를 출석 또는 불참으로 일괄 변경
   */
  const handleToggleAllAttendance = useCallback(() => {
    setPlayerStats((prev) => {
      // 모든 선수가 출석했는지 확인
      const allAttended = prev.length > 0 && prev.every((player) => player.attendance > 0);
      const newAttendance = allAttended ? 0 : 1;

      const updated = prev.map((player) => {
        const updatedPlayer = { ...player, attendance: newAttendance };
        // 총점 재계산
        updatedPlayer.totalPoint = calculateTotalPoint(updatedPlayer.attendance, updatedPlayer.goals, updatedPlayer.assists, updatedPlayer.cleanSheet, updatedPlayer.mom);
        return updatedPlayer;
      });

      // 총점 기준 내림차순 정렬
      updated.sort((a, b) => b.totalPoint - a.totalPoint);
      return updated;
    });
  }, [calculateTotalPoint]);

  /**
   * 전체 출석 여부 확인
   * - 모든 선수가 출석했는지 반환
   */
  const isAllAttended = useMemo(() => {
    return playerStats.length > 0 && playerStats.every((player) => player.attendance > 0);
  }, [playerStats]);

  /**
   * 편집 취소 핸들러
   */
  const handleCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  /**
   * 키보드 이벤트 핸들러
   * - Enter: 저장
   * - Escape: 취소
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, playerId: string, field: string) => {
      if (e.key === "Enter") {
        handleSave(playerId, field);
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // 편집 값 변경 핸들러
  const handleEditValueChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  /**
   * 포지션 변경 핸들러
   * - 선수의 포지션을 변경
   */
  const handlePositionChange = useCallback((playerId: string, position: string) => {
    setPlayerStats((prev) => {
      return prev.map((player) => {
        if (player.id === playerId) {
          return { ...player, position };
        }
        return player;
      });
    });
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden scrollbar-hide">
      {/* 사용 안내 메시지 */}
      <div className="p-4 bg-blue-50 border-b border-gray-200">
        <p className="text-sm text-blue-700">💡 수치를 클릭하면 편집할 수 있습니다. 출석은 체크박스로 변경 가능합니다. (이름, 총점 제외)</p>
      </div>
      <div
        className="p-4 bg-gray-200 border-b border-gray-200 flex justify-center items-center cursor-pointer hover:bg-gray-300 transition-colors relative group"
        onClick={() => setShowPlayerScores(!showPlayerScores)}>
        <h2 className="text-xl text-gray-700">
          {teamName}
          <p>
            {(() => {
              // 경기 결과에서 팀 전체 승무패 계산
              if (matches.length > 0) {
                const teamMatches = matches.filter((m) => m.team1Name === teamName || m.team2Name === teamName);
                const wins = teamMatches.filter((m) => {
                  const result = m.team1Name === teamName ? m.team1Result : m.team2Result;
                  return result === "WIN";
                }).length;
                const draws = teamMatches.filter((m) => {
                  const result = m.team1Name === teamName ? m.team1Result : m.team2Result;
                  return result === "DRAW";
                }).length;
                const loses = teamMatches.filter((m) => {
                  const result = m.team1Name === teamName ? m.team1Result : m.team2Result;
                  return result === "LOSE";
                }).length;
                return `(${wins}승 ${draws}무 ${loses}패)`;
              } else {
                // 기존 방식 (하위 호환성)
                const wins = playerStats.reduce((sum, p) => sum + (p.wins || 0), 0);
                const draws = playerStats.reduce((sum, p) => sum + (p.draws || 0), 0);
                const loses = playerStats.reduce((sum, p) => sum + (p.loses || 0), 0);
                return `(${wins}승 ${draws}무 ${loses}패)`;
              }
            })()}
          </p>
        </h2>
      </div>

      {/* 경기 기록 테이블 */}
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
                matches={matches}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
