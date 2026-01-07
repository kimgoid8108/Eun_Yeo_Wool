/**
 * 회비 사용내역 페이지
 *
 * 회비 지출 내역을 조회하는 페이지입니다.
 *
 * 사용하는 컴포넌트:
 * - ExpenseTable: 지출 내역 테이블 표시
 */
import ExpenseTable from '@/components/fees/ExpenseTable';

export default function FeesHistoryPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">회비 사용 내역</h1>
      <ExpenseTable />
    </div>
  );
}
