import AttendanceTable from '@/components/records/AttendanceTable';

export default function RecordsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">기록지</h1>
      <AttendanceTable />
    </div>
  );
}
