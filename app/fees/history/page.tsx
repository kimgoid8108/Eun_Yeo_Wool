import ExpenseTable from '@/components/fees/ExpenseTable';

export default function FeesHistoryPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">회비 사용 내역</h1>
      <ExpenseTable />
    </div>
  );
}
