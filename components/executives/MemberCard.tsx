interface MemberCardProps {
  name: string;
  position: string;
}

export default function MemberCard({ name, position }: MemberCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-gray-800">{name}</p>
          {position && <p className="text-sm text-gray-600 mt-1">{position}</p>}
        </div>
        <div className="text-3xl text-gray-400">👤</div>
      </div>
    </div>
  );
}
