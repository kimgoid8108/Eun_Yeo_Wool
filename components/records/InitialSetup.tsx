"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PlayerInfo } from "@/types/records";
import { getPlayers } from "@/services/playersService";
import { Player as ApiPlayer } from "@/types/api";
import { ApiError } from "@/lib/api";
import MemberSelection from "./MemberSelection";
import PlayerList from "./PlayerList";

/**
 * API Player를 로컬 Player 형식으로 변환
 * API 응답에는 position이 없으므로 기본값 "FW" 설정
 */
interface LocalPlayer {
  id: string;
  name: string;
  position: string;
}

function convertApiPlayerToLocal(apiPlayer: ApiPlayer): LocalPlayer {
  return {
    id: String(apiPlayer.id),
    name: apiPlayer.name,
    position: "FW", // 기본값 설정 (API에 position이 없으므로)
  };
}

interface InitialSetupProps {
  onComplete: (teamName: string, players: PlayerInfo[]) => void;
  onClose: () => void;
  registeredPlayerNames?: string[]; // 이미 다른 팀에 등록된 선수 이름 목록
  existingTeamNames?: string[]; // 현재 날짜에 이미 존재하는 팀 이름 목록
}

/**
 * 초기 설정 컴포넌트
 * - 팀 이름과 선수 이름을 등록
 * - 회원 명단에서 선수를 선택할 수 있음
 * - 이미 다른 팀에 등록된 선수들은 체크된 상태로 표시
 */
const POSITIONS = ["FW", "MF", "DF", "GK"] as const;

export default function InitialSetup({ onComplete, onClose, registeredPlayerNames = [], existingTeamNames = [] }: InitialSetupProps) {
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [memberList, setMemberList] = useState<LocalPlayer[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  // 이미 등록된 선수 이름 Set (useMemo로 최적화)
  const registeredSet = useMemo(() => new Set(registeredPlayerNames), [registeredPlayerNames]);

  // API에서 회원 명단 불러오기
  useEffect(() => {
    const loadMembers = async () => {
      setIsLoadingMembers(true);
      setMembersError(null);

      try {
        console.log("[InitialSetup] Fetching members from API...");
        const apiPlayers = await getPlayers();
        const convertedMembers = apiPlayers.map(convertApiPlayerToLocal);
        console.log("[InitialSetup] Loaded", convertedMembers.length, "members from API");
        setMemberList(convertedMembers);
      } catch (err) {
        console.error("[InitialSetup] Failed to load members:", err);
        let errorMessage = "회원 명단을 불러오는 중 오류가 발생했습니다.";

        if (err instanceof ApiError) {
          errorMessage = err.message || `서버 오류 (${err.status || "알 수 없음"})`;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setMembersError(errorMessage);
        // 에러 발생 시 빈 배열로 설정하여 계속 진행 가능하도록
        setMemberList([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, []);

  // 이미 등록된 선수들을 초기 선택 상태로 설정 (체크만 하고 선수 목록에는 추가하지 않음)
  useEffect(() => {
    if (registeredPlayerNames.length > 0 && memberList.length > 0) {
      const initialSelected = new Set<string>();
      memberList.forEach((member) => {
        if (registeredSet.has(member.name)) {
          initialSelected.add(member.id);
        }
      });
      setSelectedMembers(initialSelected);
    }
  }, [registeredPlayerNames, registeredSet, memberList]);

  // 회원 선택 핸들러
  const handleMemberToggle = useCallback(
    (memberId: string, memberName: string, memberPosition: string) => {
      const isRegistered = registeredSet.has(memberName);
      setSelectedMembers((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(memberId)) {
          newSelected.delete(memberId);
          // 선수 목록에서도 제거 (이미 등록된 선수가 아닌 경우에만)
          if (!isRegistered) {
            setPlayers((prevPlayers) => prevPlayers.filter((p) => p.name !== memberName));
          }
        } else {
          newSelected.add(memberId);
          // 이미 등록된 선수가 아닌 경우에만 선수 목록에 추가
          // 중복 체크: 이미 선수 목록에 같은 이름이 있는지 확인
          if (!isRegistered) {
            setPlayers((prevPlayers) => {
              // 이미 같은 이름의 선수가 있는지 확인
              const alreadyExists = prevPlayers.some((p) => p.name === memberName);
              if (alreadyExists) {
                return prevPlayers; // 이미 있으면 추가하지 않음
              }
              return [...prevPlayers, { name: memberName, position: memberPosition }];
            });
          }
        }
        return newSelected;
      });
    },
    [registeredSet]
  );

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    if (selectedMembers.size === memberList.length) {
      // 전체 해제
      setSelectedMembers(new Set());
      setPlayers([]);
    } else {
      // 전체 선택
      const allIds = new Set(memberList.map((m) => m.id));
      setSelectedMembers(allIds);
      // 이미 등록된 선수는 제외하고 선수 목록에 추가
      // 중복 방지: 현재 선수 목록과 합치되 중복 제거
      setPlayers((prevPlayers) => {
        const existingNames = new Set(prevPlayers.map((p) => p.name));
        const newPlayers = memberList.filter((m) => !registeredSet.has(m.name) && !existingNames.has(m.name)).map((m) => ({ name: m.name, position: m.position }));
        return [...prevPlayers, ...newPlayers];
      });
    }
  }, [selectedMembers.size, registeredSet]);

  const handleAddPlayer = useCallback(() => {
    setPlayers((prev) => [...prev, { name: "", position: "FW" }]);
  }, []);

  const handleRemovePlayer = useCallback((index: number) => {
    setPlayers((prev) => {
      const removedPlayer = prev[index];
      // 회원 목록에서 선택 해제
      const member = memberList.find((m) => m.name === removedPlayer.name);
      if (member) {
        setSelectedMembers((prevSelected) => {
          const newSelected = new Set(prevSelected);
          newSelected.delete(member.id);
          return newSelected;
        });
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handlePlayerChange = useCallback((index: number, field: "name" | "position", value: string) => {
    setPlayers((prev) => {
      const updated = [...prev];
      const oldPlayer = updated[index];
      updated[index] = { ...updated[index], [field]: value };

      // 이름이 변경된 경우 회원 목록 선택 상태도 업데이트
      if (field === "name") {
        const oldMember = memberList.find((m) => m.name === oldPlayer.name);
        const newMember = memberList.find((m) => m.name === value);

        setSelectedMembers((prevSelected) => {
          const newSelected = new Set(prevSelected);
          if (oldMember) newSelected.delete(oldMember.id);
          if (newMember) newSelected.add(newMember.id);
          return newSelected;
        });
      }

      return updated;
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedTeamName = teamName.trim();

      // 팀 이름 중복 체크
      if (existingTeamNames.includes(trimmedTeamName)) {
        alert("중복된 팀 이름입니다. 다른 팀 이름을 입력해주세요.");
        return;
      }

      // 이름이 입력된 선수만 필터링
      const validPlayers = players.filter((p) => p.name.trim() !== "");
      if (trimmedTeamName === "" || validPlayers.length === 0) {
        alert("팀 이름과 최소 1명의 선수 이름을 입력해주세요.");
        return;
      }
      onComplete(trimmedTeamName, validPlayers);
    },
    [teamName, players, onComplete, existingTeamNames]
  );

  return (
    <div className="fixed inset-0 bg-white bg-opacity-20 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">팀 추가</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6">팀 이름과 선수 정보를 입력해주세요.</p>

          {/* 회원 명단 로딩 중 */}
          {isLoadingMembers && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">회원 명단을 불러오는 중...</p>
            </div>
          )}

          {/* 회원 명단 로딩 에러 */}
          {membersError && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium text-sm mb-1">⚠️ 회원 명단 로딩 실패</p>
              <p className="text-yellow-700 text-xs">{membersError}</p>
              <p className="text-yellow-600 text-xs mt-2">수동으로 선수를 추가할 수 있습니다.</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 팀 이름 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">팀 이름</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="예: 핑크팀"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 회원 명단에서 선택 */}
            {!isLoadingMembers && (
              <MemberSelection
                members={memberList}
                selectedMembers={selectedMembers}
                registeredPlayerNames={registeredPlayerNames}
                onMemberToggle={handleMemberToggle}
                onSelectAll={handleSelectAll}
              />
            )}

            {/* 선수 목록 */}
            <PlayerList players={players} positions={[...POSITIONS]} onAddPlayer={handleAddPlayer} onRemovePlayer={handleRemovePlayer} onPlayerChange={handlePlayerChange} />

            {/* 제출 버튼 */}
            <div className="flex justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                disabled={isLoadingMembers}>
                설정 완료
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
