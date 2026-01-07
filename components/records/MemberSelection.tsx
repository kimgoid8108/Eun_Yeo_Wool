"use client";

import { useState, useMemo } from "react";

/**
 * 회원 정보 인터페이스 (API 응답 변환 후)
 */
interface LocalPlayer {
  id: string;
  name: string;
  position: string;
}

interface MemberSelectionProps {
  members: LocalPlayer[];
  selectedMembers: Set<string>;
  registeredPlayerNames: string[];
  onMemberToggle: (memberId: string, memberName: string, memberPosition: string) => void;
  onSelectAll: () => void;
}

/**
 * 회원 명단 선택 컴포넌트
 *
 * 회원 목록에서 선수를 선택하는 컴포넌트입니다.
 * - 회원 목록을 체크박스로 표시
 * - 전체 선택/해제 기능
 * - 검색 기능으로 선수 빠르게 찾기
 * - 이미 등록된 선수는 체크 표시만 (선수 목록에는 추가되지 않음)
 *
 * 사용처:
 * - components/records/InitialSetup.tsx: 초기 설정 모달에서 회원 선택 컴포넌트로 사용
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

  // 검색어로 필터링된 회원 목록 (이름만 검색)
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return members;
    }
    const query = searchQuery.toLowerCase().trim();
    return members.filter((member) => member.name.toLowerCase().includes(query));
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
          placeholder="이름으로 검색..."
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
                    {member.name}
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
