import { matches } from '@/data/matches';
import { players } from '@/data/players';

export default function RecentMatchCard() {
  const recentMatches = matches.slice(-3).reverse();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">최근 경기</h2>
      <div className="space-y-4">
        {recentMatches.map((match) => {
          const momPlayer = match.momPlayerId
            ? players.find((p) => p.id === match.momPlayerId)
            : null;
          return (
            <div
              key={match.id}
              className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  {new Date(match.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="font-semibold text-gray-800">{match.score}</span>
              </div>
              {momPlayer && (
                <p className="text-xs text-gray-500">
                  MOM: <span className="font-medium">{momPlayer.name}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
