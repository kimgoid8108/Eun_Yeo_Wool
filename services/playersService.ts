/**
 * 회원(선수) API 서비스
 * - 회원 목록 조회
 */

import { apiGet } from "@/lib/api";
import { PlayerResponse } from "@/types/api";

/**
 * 전체 회원 목록 조회
 * 엔드포인트: GET /players
 */
export async function getPlayers(): Promise<PlayerResponse[]> {
  try {
    console.log("[playersService] Fetching players from API...");

    // API 응답: 직접 배열 형태 [{ id, name, createdAt }, ...]
    // lib/api.ts에서 HTML 응답 감지 및 API_BASE_URL 검증을 수행
    const response = await apiGet<PlayerResponse[]>("/players");

    console.log("[playersService] API response received:", {
      type: typeof response,
      isArray: Array.isArray(response),
      length: Array.isArray(response) ? response.length : "N/A",
      sample: Array.isArray(response) && response.length > 0 ? response[0] : null,
    });

    // 배열인지 확인
    if (Array.isArray(response)) {
      console.log("[playersService] Successfully loaded", response.length, "players");
      return response;
    }

    // 배열이 아닌 경우
    console.error("[playersService] Response is not an array:", {
      type: typeof response,
      value: response,
      keys: typeof response === "object" && response !== null ? Object.keys(response) : null,
    });
    throw new Error(`예상한 배열 형식이 아닙니다. 받은 타입: ${typeof response}`);
  } catch (error) {
    console.error("[playersService] Failed to fetch players:", error);

    // ApiError는 그대로 throw (lib/api.ts에서 이미 처리됨)
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(`회원 목록을 불러오는 중 오류가 발생했습니다: ${String(error)}`);
  }
}
