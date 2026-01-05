interface ExecutiveCardProps {
  role: string;
  name: string;
}

export default function ExecutiveCard({ role, name }: ExecutiveCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{role}</p>
          <p className="text-xl font-bold text-gray-800">{name}</p>
        </div>
        <div className="text-3xl text-blue-500">👤</div>
      </div>
    </div>
  );
}
