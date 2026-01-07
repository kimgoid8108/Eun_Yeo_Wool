/**
 * 임원 카드 컴포넌트
 *
 * 임원 정보를 카드 형태로 표시하는 컴포넌트입니다.
 *
 * 사용처:
 * - app/executives/page.tsx: 회원명단 페이지에서 임원 정보 표시
 */
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
