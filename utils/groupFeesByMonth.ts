/**
 * 회비 데이터 월별 그룹화 유틸리티 함수
 *
 * 회비 데이터를 월별로 그룹화하고, 각 월의 수입/지출/순수익을 계산합니다.
 *
 * @param {Fee[]} fees - 회비 데이터 배열
 * @returns {MonthlySummary[]} 월별 요약 데이터 배열
 *
 * 사용처:
 * - components/fees/FeeTable.tsx: 회비 테이블에서 월별 데이터 표시
 */

import { Fee } from '@/data/fees';

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  net: number;
  fees: Fee[];
}

export function groupFeesByMonth(fees: Fee[]): MonthlySummary[] {
  // 월별로 그룹화
  const groupedFees = fees.reduce((acc, fee) => {
    const month = fee.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(fee);
    return acc;
  }, {} as Record<string, typeof fees>);

  const months = Object.keys(groupedFees).sort().reverse();

  // 월별 수입/지출 계산
  return months.map((month) => {
    const monthFees = groupedFees[month];
    const income = monthFees.filter((f) => f.type === "INCOME").reduce((sum, f) => sum + f.amount, 0);
    const expense = monthFees.filter((f) => f.type === "EXPENSE").reduce((sum, f) => sum + f.amount, 0);

    return {
      month,
      income,
      expense,
      net: income - expense,
      fees: monthFees,
    };
  });
}
