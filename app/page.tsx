import { matches } from '@/data/matches';
import { records } from '@/data/records';
import { calcBalance } from '@/utils/calcBalance';
import OverviewCard from '@/components/dashboard/OverviewCard';
import RecentMatchCard from '@/components/dashboard/RecentMatchCard';
import MiniChart from '@/components/dashboard/MiniChart';

export default function Home() {
  // 오늘 날짜 계산
  const today = new Date().toISOString().split('T')[0];
  const todayMatch = matches.find((match) => match.date === today);

  // 출석 인원 계산 (최근 경기 기준)
  const recentMatchId = matches[matches.length - 1]?.id;
  const attendanceCount = recentMatchId
    ? records.filter((r) => r.matchId === recentMatchId && r.attendance).length
    : 0;

  // 현재 회비 잔액
  const balance = calcBalance();

  // 최근 5개월 통계 데이터 (더미)
  const monthlyStats = [12, 15, 18, 14, 16];
  const monthlyLabels = ['1월', '2월', '3월', '4월', '5월'];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">대시보드</h1>

      {/* 오늘 경기 요약 */}
      {todayMatch && (
        <div className="mb-6">
          <OverviewCard
            title="오늘 경기"
            value={todayMatch.score}
            subtitle={`${new Date(todayMatch.date).toLocaleDateString('ko-KR')}`}
            icon={<span className="text-3xl">⚽</span>}
          />
        </div>
      )}

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <OverviewCard
          title="출석 인원"
          value={`${attendanceCount}명`}
          subtitle="최근 경기 기준"
          icon={<span className="text-3xl">👥</span>}
        />
        <OverviewCard
          title="현재 회비 잔액"
          value={`${balance.toLocaleString()}원`}
          icon={<span className="text-3xl">💰</span>}
        />
        <OverviewCard
          title="전체 경기 수"
          value={`${matches.length}경기`}
          icon={<span className="text-3xl">📊</span>}
        />
      </div>

      {/* 그래프와 최근 경기 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MiniChart
          title="월별 출석 통계"
          data={monthlyStats}
          labels={monthlyLabels}
        />
        <RecentMatchCard />
      </div>
    </div>
  );
}
