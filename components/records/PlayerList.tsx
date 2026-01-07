"use client";

interface Player {
  name: string;
  position: string;
}

interface PlayerListProps {
  players: Player[];
  positions: string[];
  onAddPlayer: () => void;
  onRemovePlayer: (index: number) => void;
  onPlayerChange: (index: number, field: "name" | "position", value: string) => void;
}

/**
 * 선수 목록 컴포넌트
 *
 * 선수 정보를 입력하고 관리하는 컴포넌트입니다.
 * - 선수 이름과 포지션을 입력/수정
 * - 선수 추가/삭제 기능
 *
 * 사용처:
 * - components/records/InitialSetup.tsx: 초기 설정 모달에서 선수 목록 컴포넌트로 사용
 */
export default function PlayerList({ players, positions, onAddPlayer, onRemovePlayer, onPlayerChange }: PlayerListProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">선수 목록</label>
        <button type="button" onClick={onAddPlayer} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
          + 선수 추가
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {players.map((player, index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="text"
              value={player.name}
              onChange={(e) => onPlayerChange(index, "name", e.target.value)}
              placeholder="선수 이름"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={player.position}
              onChange={(e) => onPlayerChange(index, "position", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            {players.length > 1 && (
              <button
                type="button"
                onClick={() => onRemovePlayer(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded">
                삭제
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
