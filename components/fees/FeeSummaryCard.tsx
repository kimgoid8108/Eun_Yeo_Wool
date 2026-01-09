"use client";

import { useEffect, useState } from "react";

// API_BASE_URL: 환경변수 기반 + fallback 배포 주소
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://jochukback.onrender.com";

// 공통 fetch 함수: 서버가 500 등으로 실패해도 빈 배열 반환
const fetchList = async (endpoint: string) => {
  try {
    const apiBase = API_BASE_URL.replace(/\/+$/, "");
    const res = await fetch(`${apiBase}${endpoint}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      // 💡 500 에러가 나면 그냥 빈 배열을 반환해서 에러를 넘깁니다.
      console.warn(`${endpoint} 서버 상태 불안정 (${res.status}), 빈 데이터로 표시합니다.`);
      return [];
    }
    const data = await res.json();
    // /membershipfees → [] or { fees: [] }, /expenses → [] or { expenses: [] }
    if (Array.isArray(data)) return data;
    if (endpoint === "/membershipfees" && Array.isArray(data.fees)) return data.fees;
    if (endpoint === "/expenses" && Array.isArray(data.expenses)) return data.expenses;
    return [];
  } catch (err) {
    return [];
  }
};

export default function FeeSummaryCard() {
  const [summary, setSummary] = useState<{ income: number; expense: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        // 입금 전체 내역
        const incomeList: any[] = await fetchList("/membershipfees");
        const totalIncome = incomeList.reduce((sum, fee) => (typeof fee.amount === "number" ? sum + fee.amount : sum), 0);

        // 지출 전체 내역
        const expenseList: any[] = await fetchList("/expenses");
        const totalExpense = expenseList.reduce((sum, exp) => (typeof exp.amount === "number" ? sum + exp.amount : sum), 0);

        setSummary({ income: totalIncome, expense: totalExpense });
      } catch (err: any) {
        let msg = (typeof err?.message === "string" ? err.message : "") || "합계 정보를 불러오지 못했습니다.";
        // 환경변수로 설정한 경우만 체크 (빈 문자열도 OK)
        if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
          msg = "API 서버 주소(API_BASE_URL 환경변수)가 설정되지 않았습니다. .env 파일과 주소를 확인하세요.";
        }
        setError(msg);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  let net = summary ? summary.income - summary.expense : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">현재 회비 잔액(전체)</p>
          <p className="text-3xl font-bold text-gray-800">{loading ? "로딩 중..." : error ? error : typeof net === "number" ? `${net.toLocaleString()}원` : "-"}</p>
          {!process.env.NEXT_PUBLIC_API_BASE_URL ? <p className="text-red-400 mt-2 text-xs">회비는 월 1만원, 임원은 제외</p> : null}
        </div>
        <div className="text-4xl text-green-500">💰</div>
      </div>
      {summary && (
        <div className="mt-4 flex gap-8">
          <div>
            <div className="text-xs text-gray-500 mb-1">총 입금(누적)</div>
            <div className="text-lg text-blue-500 font-bold">{summary.income.toLocaleString()}원</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">총 지출(누적)</div>
            <div className="text-lg text-red-500 font-bold">{summary.expense.toLocaleString()}원</div>
          </div>
        </div>
      )}
    </div>
  );
}
