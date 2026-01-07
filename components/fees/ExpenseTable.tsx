/**
 * 지출 내역 테이블 컴포넌트
 *
 * 회비 지출 내역을 테이블 형태로 표시하는 컴포넌트입니다.
 *
 * 사용처:
 * - app/fees/history/page.tsx: 회비 사용내역 페이지에서 지출 내역 표시
 */
import { fees } from "@/data/fees";

export default function ExpenseTable() {
  const expenses = fees.filter((fee) => fee.type === "EXPENSE").sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">날짜</th>
              <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">항목</th>
              <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">금액</th>
              <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">비고</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  지출 내역이 없습니다.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {new Date(expense.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">{expense.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-red-600">-{expense.amount.toLocaleString()}원</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">{expense.payer || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
