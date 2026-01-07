/**
 * 필요한 공간 페이지
 *
 * 향후 새로운 기능을 추가할 공간을 위한 페이지입니다.
 * 현재는 준비 중 메시지만 표시합니다.
 */
export default function SpacePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">필요한 공간</h1>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          추후 기능 추가 예정
        </h2>
        <p className="text-gray-500">
          이 페이지는 향후 새로운 기능을 추가할 공간입니다.
        </p>
      </div>
    </div>
  );
}
