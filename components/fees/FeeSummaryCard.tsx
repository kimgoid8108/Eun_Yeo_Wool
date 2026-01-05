import { calcBalance } from '@/utils/calcBalance';

export default function FeeSummaryCard() {
  const balance = calcBalance();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">현재 회비 잔액</p>
          <p className="text-3xl font-bold text-gray-800">
            {balance.toLocaleString()}원
          </p>
        </div>
        <div className="text-4xl text-green-500">💰</div>
      </div>
    </div>
  );
}
