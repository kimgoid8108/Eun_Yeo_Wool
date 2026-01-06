"use client";

import { useState, useEffect } from "react";
import { executives } from "@/data/executives";
import { getPlayers } from "@/services/playersService";
import { PlayerResponse } from "@/types/api";
import { ApiError } from "@/lib/api";
import ExecutiveCard from "@/components/executives/ExecutiveCard";
import MemberCard from "@/components/executives/MemberCard";

export default function ExecutivesPage() {
  const [players, setPlayers] = useState<PlayerResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("[ExecutivesPage] Starting to fetch players...");
        const data = await getPlayers();
        console.log("[ExecutivesPage] Successfully loaded players:", data);
        setPlayers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[ExecutivesPage] Error caught:", err);

        let errorMessage = "회원 목록을 불러오는 중 오류가 발생했습니다.";

        if (err instanceof ApiError) {
          errorMessage = err.message || `서버 오류 (${err.status || "알 수 없음"})`;
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
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">회원 명단</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-800 font-medium">오류 발생</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">등록된 회원이 없습니다.</div>
          ) : (
            players.map((member) => <MemberCard key={member.id} name={member.name} position="" />)
          )}
        </div>
        {players.length > 0 && <div className="mt-4 text-sm text-gray-600">총 {players.length}명의 회원이 등록되어 있습니다.</div>}
      </div>
    </div>
  );
}
