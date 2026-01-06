"use client";

import { useState, useEffect } from "react";
import { executives } from "@/data/executives";
import { getPlayers } from "@/services/playersService";
import { Player } from "@/types/api";
import { ApiError } from "@/lib/api";
import ExecutiveCard from "@/components/executives/ExecutiveCard";
import MemberCard from "@/components/executives/MemberCard";

export default function ExecutivesPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("[ExecutivesPage] Fetching players from API...");
        const data = await getPlayers();

        console.log("[ExecutivesPage] Received data:", {
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 0,
          firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null,
        });

        // 배열인지 확인하고 설정
        if (Array.isArray(data) && data.length > 0) {
          console.log("[ExecutivesPage] Setting", data.length, "players to state");
          setPlayers(data);
        } else if (Array.isArray(data)) {
          console.log("[ExecutivesPage] Empty array received");
          setPlayers([]);
        } else {
          console.warn("[ExecutivesPage] Invalid data format:", data);
          setPlayers([]);
        }
      } catch (err) {
        console.error("[ExecutivesPage] Error caught:", err);

        let errorMessage = "회원 목록을 불러오는 중 오류가 발생했습니다.";

        if (err instanceof ApiError) {
          // HTML 응답 에러인지 확인
          const isHtmlError = err.message.includes("HTML") || err.message.includes("JSON이 아닌");

          if (isHtmlError) {
            errorMessage =
              "❌ 서버가 HTML을 반환했습니다.\n\n" +
              "이는 API 요청이 백엔드 서버가 아닌 Next.js 서버로 전송되었음을 의미합니다.\n\n" +
              "해결 방법:\n" +
              "1. .env.local 파일에 NEXT_PUBLIC_API_BASE_URL이 올바르게 설정되어 있는지 확인\n" +
              "2. 개발 서버를 재시작했는지 확인 (환경변수 변경 후 필수)\n" +
              "3. 브라우저 콘솔에서 [lib/api.ts] 로그 확인\n\n" +
              `상세 정보: ${err.message}`;
          } else {
            errorMessage = err.message || `서버 오류 (${err.status || "알 수 없음"})`;
          }

          console.error("[ExecutivesPage] ApiError details:", {
            message: err.message,
            status: err.status,
            type: err.type,
            url: err.url,
          });
        } else if (err instanceof Error) {
          errorMessage = err.message;
          console.error("[ExecutivesPage] Error instance:", {
            name: err.name,
            message: err.message,
            stack: err.stack,
          });
        } else {
          console.error("[ExecutivesPage] Unknown error type:", {
            error: err,
            type: typeof err,
          });
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">회원 명단</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    const isHtmlError = error.includes("HTML") || error.includes("JSON이 아닌");

    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">회원 명단</h1>
        <div className={`border rounded-lg p-4 mb-8 ${isHtmlError ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
          <p className={`font-medium mb-2 ${isHtmlError ? "text-yellow-800" : "text-red-800"}`}>
            {isHtmlError ? "⚠️ API 연결 오류" : "❌ 오류 발생"}
          </p>
          <pre className={`text-sm mt-1 whitespace-pre-wrap ${isHtmlError ? "text-yellow-700" : "text-red-600"}`}>
            {error}
          </pre>
        </div>
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">임원단</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {executives.map((executive, index) => (
              <ExecutiveCard key={index} role={executive.role} name={executive.name} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">회원 명단</h1>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">임원단</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {executives.map((executive, index) => (
            <ExecutiveCard key={index} role={executive.role} name={executive.name} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">일반 회원</h2>
        {/* 디버깅 정보 (개발용) */}
        {process.env.NODE_ENV === "development" && <div className="mb-4 text-xs text-gray-500">디버그: players.length = {players.length}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">등록된 회원이 없습니다.</div>
          ) : (
            players.map((member) => {
              console.log("[ExecutivesPage] Rendering member:", member);
              return <MemberCard key={member.id} name={member.name || "이름 없음"} position="" />;
            })
          )}
        </div>
        {players.length > 0 && <div className="mt-4 text-sm text-gray-600">총 {players.length}명의 회원이 등록되어 있습니다.</div>}
      </div>
    </div>
  );
}
