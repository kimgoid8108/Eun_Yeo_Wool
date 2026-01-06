"use client";

import { useState, useMemo } from "react";
import type { Player } from "@/data/players";

interface MemberSelectionProps {
  members: Player[];
  selectedMembers: Set<string>;
  registeredPlayerNames: string[];
  onMemberToggle: (memberId: string, memberName: string, memberPosition: string) => void;
  onSelectAll: () => void;
}

/**
 * 회원 명단 선택 컴포넌트
 * - 회원 목록을 체크박스로 표시
 * - 전체 선택/해제 기능
 * - 검색 기능으로 선수 빠르게 찾기
 * - 이미 등록된 선수는 체크 표시만 (선수 목록에는 추가되지 않음)
 */
export default function MemberSelection({
  members,
  selectedMembers,
  registeredPlayerNames,
  onMemberToggle,
  onSelectAll,
}: MemberSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const registeredSet = new Set(registeredPlayerNames);

  // 검색어로 필터링된 회원 목록
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return members;
    }
    const query = searchQuery.toLowerCase().trim();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) || member.position.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">회원 명단</label>
        <button
          type="button"
          onClick={onSelectAll}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
          {selectedMembers.size === members.length ? "전체 해제" : "전체 선택"}
        </button>
      </div>

      {/* 검색 입력창 */}
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이름 또는 포지션으로 검색..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">검색 결과가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredMembers.map((member) => {
              const isRegistered = registeredSet.has(member.name);
              return (
                <label
                  key={member.id}
                  className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer ${
                    isRegistered ? "opacity-60" : ""
                  }`}
                  title={isRegistered ? "이미 다른 팀에 등록된 선수" : ""}>
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member.id)}
                    onChange={() => onMemberToggle(member.id, member.name, member.position)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    {member.name} ({member.position})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
