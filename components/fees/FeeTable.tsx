import { fees } from "@/data/fees";
import { groupFeesByMonth } from "@/utils/groupFeesByMonth";

export default function FeeTable() {
  // 월별 그룹화 및 요약 계산 (유틸리티 함수 사용)
  const monthlySummary = groupFeesByMonth(fees);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">월</th>
              <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">수입</th>
              <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">지출</th>
              <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">순수익</th>
              <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">상세</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {monthlySummary.map((summary) => (
              <tr key={summary.month} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{summary.month}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium text-center">+{summary.income.toLocaleString()}원</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium text-center">-{summary.expense.toLocaleString()}원</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-center ${summary.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {summary.net >= 0 ? "+" : ""}
                  {summary.net.toLocaleString()}원
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="space-y-1">
                    {summary.fees.map((fee) => (
                      <div key={fee.id} className={`text-xs ${fee.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {fee.date} - {fee.title} - {fee.type === "INCOME" ? "+" : "-"}
                        {fee.amount.toLocaleString()}원{fee.payer && ` (${fee.payer})`}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
