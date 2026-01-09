/**
 * 지출 내역 테이블 + 직접 추가 폼 (개별 경비 지출내역 뷰, 설명 포함)
 */
"use client";
import React, { useEffect, useState, useRef } from "react";

// API 서버 주소
const API_BASE_URL = "https://jochukback.onrender.com";

// API 지출내역 타입
interface Expense {
  id?: string;
  expenseDate: string;
  amount: number;
  category: string;
  description?: string;
}

interface NewExpenseInput {
  expenseDate: string;
  category: string;
  amount: string;
  desc: string;
}

// 천단위 콤마 포매팅 함수
function formatAmountComma(value: string): string {
  // 숫자만 추출
  const onlyNums = value.replace(/[^\d]/g, "");
  // 0이면 빈 문자열로 유지
  if (!onlyNums) return "";
  // 천단위 콤마 추가
  return Number(onlyNums).toLocaleString("ko-KR");
}

export default function ExpenseTable() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 새 지출 입력 폼 상태 (날짜 기본값 오늘 설정)
  const [showInputBox, setShowInputBox] = useState(false);
  const [newExpense, setNewExpense] = useState<NewExpenseInput>({
    expenseDate: new Date().toISOString().slice(0, 10),
    category: "",
    amount: "",
    desc: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const refreshBalance = () => {};

  // 1. 전체 지출 불러오기
  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("지출 내역을 불러오지 못했습니다.");

      const data = await res.json();
      const expenseData = Array.isArray(data) ? data : data.expenses || [];

      const sorted = expenseData.sort((a: Expense, b: Expense) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
      setExpenses(sorted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // 금액 입력에서 천단위 콤마 및 음수 입력 막기
  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.target.name === "amount") {
      let rawValue = e.target.value.replace(/,/g, "");
      // 숫자만 입력 허용(천단위포맷 입력 시에도 대응)
      if (rawValue === "" || (/^\d+$/.test(rawValue) && Number(rawValue) >= 0)) {
        // 천단위 포매팅
        const formatted = formatAmountComma(rawValue);
        setNewExpense((prev) => ({ ...prev, amount: formatted }));
        setInputError(null);

        // 커서 뒤로 밀리는 이슈 임시 대응 (inputmode=numeric이면 커서 끝으로 포커스)
        if (amountInputRef.current) {
          // 다음 프레임에 커서 끝으로
          const inputEl = amountInputRef.current;
          setTimeout(() => {
            inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
          }, 0);
        }
      }
      // 잘못된 값(음수 등)은 그냥 무시 (입력 반영 안함)
    } else {
      setNewExpense((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      setInputError(null);
    }
  };

  // 저장 로직 재작성 (monthCount 필드 사용, amount 천단위 제거 없이 처리)
  const handleSaveExpense = async () => {
    // 쉼표제거 없이 바로 변환 (혹시라도 유입 가능성 대비)
    const amountNum = Number(newExpense.amount.replace(/,/g, ""));

    // 1. 필수 입력값 체크
    if (!newExpense.expenseDate || !newExpense.category || amountNum <= 0) {
      setInputError("필수 항목을 모두 입력해주세요.");
      return;
    }

    // 2. monthCount 생성 (서버가 원하는 YYYYMM 숫자 형식)
    // "2026-01-09" -> year: "2026", month: "01"
    const [year, month] = newExpense.expenseDate.split("-");
    // 💡 문자열을 합친 후 전체를 숫자로 변환 (202601)
    const monthCountValue = parseInt(year + month, 10);

    const payload = {
      expenseDate: newExpense.expenseDate,
      category: newExpense.category,
      amount: amountNum,
      description: newExpense.desc || "",
      // ✅ 서버 에러 메시지에 명시된 정확한 필드명 (C 대문자 확인)
      monthCount: monthCountValue,
    };

    console.log("보내는 데이터:", payload); // monthCount 형태 체크

    setSaveLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // 서버의 검증 에러 메시지가 배열로 올 경우 처리
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message || "서버 저장 실패";
        throw new Error(errorMsg);
      }

      alert("지출이 등록되었습니다!");

      // ... 초기화 로직
      setNewExpense({
        expenseDate: new Date().toISOString().slice(0, 10),
        category: "",
        amount: "",
        desc: "",
      });
      setShowInputBox(false);
      fetchExpenses();
      // (필요시) refreshBalance();
    } catch (err: any) {
      console.error("최종 저장 에러:", err.message);
      setInputError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden m-4">
      {/* 타이틀 및 버튼 섹션 */}
      <div className="px-6 py-4 flex items-center justify-between border-b bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">회계 지출 관리</h2>
        <button
          onClick={() => setShowInputBox(!showInputBox)}
          className={`px-4 py-2 rounded-md font-bold transition-all ${showInputBox ? "bg-gray-400 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow"}`}>
          {showInputBox ? "입력 취소" : "새 지출 입력"}
        </button>
      </div>

      {/* 입력 박스 폼 */}
      {showInputBox && (
        <div className="p-6 bg-blue-50 border-b border-blue-100 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">날짜</label>
              <input
                type="date"
                name="expenseDate"
                value={newExpense.expenseDate}
                onChange={onChangeInput}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label>
              <input
                type="text"
                name="category"
                placeholder="식비, 대관료 등"
                value={newExpense.category}
                onChange={onChangeInput}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">금액</label>
              <input
                ref={amountInputRef}
                type="text"
                name="amount"
                placeholder="0"
                value={newExpense.amount}
                inputMode="numeric"
                pattern="[0-9,]*"
                onChange={onChangeInput}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white text-left"
                autoComplete="off"
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">설명/비고</label>
              <input
                type="text"
                name="desc"
                placeholder="상세 내용 입력"
                value={newExpense.desc}
                onChange={onChangeInput}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            {inputError && <p className="text-red-500 text-sm font-semibold">{inputError}</p>}
            <button
              onClick={handleSaveExpense}
              disabled={saveLoading}
              className="ml-auto bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 disabled:bg-gray-300 transition-all shadow">
              {saveLoading ? "저장 중..." : "지출 등록"}
            </button>
          </div>
        </div>
      )}

      {/* 리스트 테이블 섹션 */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-20 text-center text-gray-400 animate-pulse">데이터를 불러오는 중...</div>
        ) : error ? (
          <div className="py-20 text-center text-red-500 font-medium">{error}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">비고/설명</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    등록된 지출 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                expenses.map((ex, i) => (
                  <tr key={ex.id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{new Date(ex.expenseDate).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}</td>
                    <td className="px-6 py-4 text-center text-sm font-medium">{ex.category}</td>
                    <td className="px-6 py-4 text-center text-sm text-red-600 font-bold">-{ex.amount.toLocaleString()}원</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">{ex.description || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
