"use client";

import { useEffect, useState } from "react";
// 로컬 데이터 import는 제거하거나 기본값으로만 사용합니다.
import OverviewCard from "@/components/dashboard/OverviewCard";
import RecentMatchCard from "@/components/dashboard/RecentMatchCard";
import MiniChart from "@/components/dashboard/MiniChart";
import FeeSummaryCard from "@/components/fees/FeeSummaryCard";

export default function Home() {
  // 1. 모든 실시간 데이터를 위한 상태 선언
  const [serverBalance, setServerBalance] = useState<number | null>(null);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // 2. 여러 API를 동시에 호출 (회비, 경기 기록 등)
        const [feeRes, matchRes, recordRes] = await Promise.all([
          fetch("https://jochukback.onrender.com/membershipfees"),
          fetch("https://jochukback.onrender.com/matches"), // 경기 목록 API가 있다고 가정
          fetch("https://jochukback.onrender.com/match-records"), // 출석 기록 API가 있다고 가정
        ]);

        // 회비 계산
        if (feeRes.ok) {
          const fees = await feeRes.json();
          const total = fees.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
          setServerBalance(total);
        }

        // 전체 경기 수 계산
        if (matchRes.ok) {
          const matches = await matchRes.json();
          setMatchCount(matches.length);
        }

        // 최근 경기 출석 인원 계산
        if (recordRes.ok) {
          const records = await recordRes.json();
          // 가장 최근 경기 ID를 찾거나 필터링 로직 추가 (지금은 전체 출석 기준)
          const attCount = records.filter((r: any) => r.attendance === true).length;
          setAttendanceCount(attCount);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* 실시간 출석 인원 */}
        <OverviewCard title="출석 인원" value={isLoading ? "..." : `${attendanceCount}명`} subtitle="전체 출석 데이터 기준" icon={<span className="text-3xl">👥</span>} />

        {/* 실시간 회비 잔액 */}
        {/* 현재 회비 잔액: 전체 입금 - 전체 지출 (정확한 합계 카드로 대체) */}
        <FeeSummaryCard />

        {/* 실시간 전체 경기 수 */}
        <OverviewCard title="전체 경기 수" value={isLoading ? "..." : `${matchCount}경기`} icon={<span className="text-3xl">📊</span>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MiniChart title="월별 출석 통계" data={[0, 0, 0, 0, 0]} labels={["1월", "2월", "3월", "4월", "5월"]} />
        <RecentMatchCard />
      </div>
    </div>
  );
}
