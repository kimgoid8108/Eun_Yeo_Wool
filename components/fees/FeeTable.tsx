import { fees } from "@/data/fees";

export default function FeeTable() {
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
  const monthlySummary = months.map((month) => {
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
