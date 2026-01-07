/**
 * 대시보드 개요 카드 컴포넌트
 *
 * 통계 정보를 카드 형태로 표시하는 재사용 가능한 컴포넌트입니다.
 *
 * 사용처:
 * - app/page.tsx: 대시보드 메인 페이지에서 출석 인원, 회비 잔액, 전체 경기 수 등 통계 표시
 */
interface OverviewCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
}

export default function OverviewCard({ title, value, icon, subtitle }: OverviewCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
