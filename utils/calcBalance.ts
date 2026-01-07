/**
 * 회비 잔액 계산 유틸리티 함수
 *
 * 수입(INCOME)과 지출(EXPENSE)을 합산하여 현재 회비 잔액을 계산합니다.
 *
 * @returns {number} 계산된 회비 잔액
 *
 * 사용처:
 * - app/page.tsx: 대시보드에서 현재 회비 잔액 표시
 * - components/fees/FeeSummaryCard.tsx: 회비 요약 카드에서 잔액 표시
 */
import { fees } from '@/data/fees';

export function calcBalance(): number {
  return fees.reduce((balance, fee) => {
    if (fee.type === 'INCOME') {
      return balance + fee.amount;
    } else {
      return balance - fee.amount;
    }
  }, 0);
}
