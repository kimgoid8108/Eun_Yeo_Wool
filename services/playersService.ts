/**
 * 회원(선수) API 서비스
 * - 회원 목록 조회
 */

import { apiGet } from "@/lib/api";
import { PlayerResponse } from "@/types/api";

/**
 * 전체 회원 목록 조회
 * 엔드포인트: GET /api/players
 * 참고: 서버 엔드포인트가 /players인 경우 /api를 제거해야 함
 */
export async function getPlayers(): Promise<PlayerResponse[]> {
  try {
    // 서버 엔드포인트: GET /players (또는 /api/players)
    // 사용자가 처음에 /players라고 했으므로 /api 없이 시도
    const response = await apiGet<PlayerResponse[]>("/players");

    // 빈 배열도 유효한 응답으로 처리
    if (Array.isArray(response)) {
      return response;
    }

    // 배열이 아닌 경우 빈 배열 반환
    console.warn("[playersService] Response is not an array:", response);
    return [];
  } catch (error) {
    console.error("[playersService] Failed to fetch players:", error);
    throw error; // 에러를 다시 throw하여 상위에서 처리
  }
}
