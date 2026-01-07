/**
 * 스와이프 제스처 커스텀 훅
 *
 * 터치 이벤트를 감지하여 좌우 스와이프 제스처를 처리합니다.
 * 모바일 환경에서 날짜 네비게이션 등에 활용됩니다.
 *
 * @param {UseSwipeGestureProps} props - 훅 설정 옵션
 * @param {() => void} props.onSwipeLeft - 왼쪽 스와이프 시 실행할 콜백
 * @param {() => void} props.onSwipeRight - 오른쪽 스와이프 시 실행할 콜백
 * @param {number} [props.minSwipeDistance=50] - 최소 스와이프 거리 (기본값: 50px)
 *
 * @returns {object} 터치 이벤트 핸들러 객체
 * @returns {function} onTouchStart - 터치 시작 핸들러
 * @returns {function} onTouchMove - 터치 이동 핸들러
 * @returns {function} onTouchEnd - 터치 종료 핸들러
 *
 * 사용처:
 * - app/records/page.tsx: 기록지 페이지에서 날짜 간 좌우 스와이프로 이동
 */
import { useState, useCallback } from "react";

interface UseSwipeGestureProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  minSwipeDistance?: number;
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, minSwipeDistance = 50 }: UseSwipeGestureProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }
  }, [touchStart, touchEnd, minSwipeDistance, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
