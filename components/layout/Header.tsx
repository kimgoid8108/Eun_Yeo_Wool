/**
 * 헤더 컴포넌트
 *
 * 애플리케이션 상단 헤더를 표시하는 컴포넌트입니다.
 *
 * 사용처:
 * - app/layout.tsx: 전체 레이아웃에서 상단 헤더로 사용
 */
export default function Header() {
  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="px-4 py-4 md:px-8">
        <h1 className="text-2xl font-bold text-gray-800 flex justify-center">은여울FC 대시보드</h1>
      </div>
    </header>
  );
}
