import FeeSummaryCard from '@/components/fees/FeeSummaryCard';
import FeeTable from '@/components/fees/FeeTable';

export default function FeesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">회비 기록</h1>
      <div className="mb-6">
        <FeeSummaryCard />
      </div>
      <FeeTable />
    </div>
  );
}
