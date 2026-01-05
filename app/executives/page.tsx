import { executives } from '@/data/executives';
import { players } from '@/data/players';
import ExecutiveCard from '@/components/executives/ExecutiveCard';
import MemberCard from '@/components/executives/MemberCard';

export default function ExecutivesPage() {
  // 일반 회원 목록 (임원이 아닌 회원)
  const regularMembers = players.filter((player) => !player.isExecutive);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">회원 명단</h1>

      {/* 임원단 섹션 */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">임원단</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {executives.map((executive, index) => (
            <ExecutiveCard
              key={index}
              role={executive.role}
              name={executive.name}
            />
          ))}
        </div>
      </div>

      {/* 일반 회원 섹션 */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">일반 회원</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularMembers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              일반 회원이 없습니다.
            </div>
          ) : (
            regularMembers.map((member) => (
              <MemberCard
                key={member.id}
                name={member.name}
                position={member.position}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
