"use client";

import React, { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://jochukback.onrender.com";

// 한 달 회비는 10000원으로 고정
const FEE_PER_MONTH = 10000;

interface Fee {
  id: string;
  revenueDate: string;
  playerName: string;
  amount: number;
  monthCount: number;
}

interface NewIncomeInput {
  playerName: string;
  revenueDate: string;
  amount: string;
  // monthCount는 보여주기용, 직접 입력안함
  monthCount: string;
}

type PersonSummary = {
  playerName: string;
  totalAmount: number;
  totalMonthCount: number;
  transactions: Fee[];
};

export default function FeeTable() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInputBox, setShowInputBox] = useState(false);

  // monthCount는 직접 입력 대신 금액/한달회비로 실시간 자동계산
  const [newIncome, setNewIncome] = useState<NewIncomeInput>({
    playerName: "",
    revenueDate: new Date().toISOString().slice(0, 10),
    amount: "",
    monthCount: "1", // 디폴트 1회분 (₩10,000)
  });
  const [inputError, setInputError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [openNames, setOpenNames] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let ignore = false;

    async function fetchFees() {
      setLoading(true);
      setError(null);

      if (!API_BASE_URL) {
        setError("API 서버 주소가 설정되지 않았습니다. .env에 NEXT_PUBLIC_API_BASE_URL를 확인하세요.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/membershipfees`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          let message: string | undefined;
          try {
            const errText = await res.text();
            try {
              const json = JSON.parse(errText);
              message = json.message || errText;
            } catch {
              message = errText;
            }
            throw new Error(`서버 응답 오류 (${res.status})${message ? ": " + message : ""}`);
          } catch (err) {
            throw new Error(`서버 응답 오류 (${res.status})`);
          }
        }

        const data = await res.json();
        let feeList: Fee[] = Array.isArray(data) ? data : data.fees || [];
        feeList.sort((a, b) => new Date(b.revenueDate).getTime() - new Date(a.revenueDate).getTime());
        if (!ignore) setFees(feeList);
      } catch (err: any) {
        let fallback = err && typeof err.message === "string" ? err.message : "알 수 없는 오류";
        setError(err?.name === "TypeError" ? "서버와 연결할 수 없습니다. (CORS 또는 주소 확인)" : fallback);
      } finally {
        setLoading(false);
      }
    }

    fetchFees();
    return () => {
      ignore = true;
    };
  }, []);

  let personSummaryList: PersonSummary[] = [];
  if (fees && Array.isArray(fees) && fees.length > 0) {
    const group: Record<string, PersonSummary> = {};
    for (const fee of fees) {
      if (!group[fee.playerName]) {
        group[fee.playerName] = {
          playerName: fee.playerName,
          totalAmount: 0,
          totalMonthCount: 0,
          transactions: [],
        };
      }
      group[fee.playerName].transactions.push(fee);
      group[fee.playerName].totalAmount += fee.amount || 0;
      group[fee.playerName].totalMonthCount += fee.monthCount || 0;
    }
    personSummaryList = Object.values(group).sort((a, b) => a.playerName.localeCompare(b.playerName, "ko"));
  }

  const togglePersonDetail = (playerName: string) => {
    setOpenNames((prev) => ({
      ...prev,
      [playerName]: !prev[playerName],
    }));
  };

  // 금액 입력이 바뀔 때마다 회분도 자동계산해줌 (입력 필드는 amount만 사용)
  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let updated = { ...newIncome, [name]: value };

    if (name === "amount") {
      const amt = parseInt(value, 10);
      // 0 입력 혹은 음수/NaN은 1로 처리(그래도 서버에서 걸러짐)
      const monthCountCalc = amt > 0 ? Math.floor(amt / FEE_PER_MONTH) : 1;
      updated.monthCount = isNaN(monthCountCalc) || monthCountCalc < 1 ? "1" : monthCountCalc.toString();
    }

    setNewIncome(updated);
    setInputError(null);
  };

  // 실제 입력값을 통한 회비 등록 함수
  const handleSaveIncome = async () => {
    setSaveLoading(true);
    setInputError(null);

    // 필수값 체크 (입금자 이름, 금액, 날짜)
    if (!newIncome.playerName || !newIncome.amount || !newIncome.revenueDate) {
      setInputError("이름, 금액, 날짜를 모두 입력해주세요.");
      setSaveLoading(false);
      return;
    }
    const amountNum = Number(newIncome.amount);
    if (!amountNum || isNaN(amountNum) || amountNum < FEE_PER_MONTH) {
      setInputError(`금액을 ${FEE_PER_MONTH.toLocaleString()}원(1회분) 이상 입력해주세요.`);
      setSaveLoading(false);
      return;
    }

    const [year, month] = newIncome.revenueDate.split("-");
    if (!year || !month) {
      setInputError("올바른 날짜를 선택해주세요.");
      setSaveLoading(false);
      return;
    }
    // 회분 계산
    const monthCount = Math.floor(amountNum / FEE_PER_MONTH);

    if (monthCount < 1) {
      setInputError(`1회분(₩${FEE_PER_MONTH.toLocaleString()}) 이상 입력해주세요.`);
      setSaveLoading(false);
      return;
    }

    const payload = {
      playerName: newIncome.playerName,
      revenueDate: newIncome.revenueDate,
      amount: amountNum,
      monthCount: monthCount,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/membershipfees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("데이터 주입 성공! 이제 목록 조회가 가능할 것입니다.");
        window.location.reload();
      } else {
        const errData = await res.json();
        alert(`서버가 데이터를 거부함: ${errData.message}`);
      }
    } catch (err) {
      alert("네트워크 연결을 확인하세요.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">회비 입금 관리</h2>
        <button
          onClick={() => setShowInputBox((v) => !v)}
          className={`px-4 py-2 rounded-md font-bold transition-all ${showInputBox ? "bg-gray-400 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow"}`}>
          {showInputBox ? "입력 취소" : "새 회비 등록"}
        </button>
      </div>
      {showInputBox && (
        <div className="p-6 bg-blue-50 border-b border-blue-100 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">이름</label>
              <input
                type="text"
                name="playerName"
                placeholder="입금자 이름"
                value={newIncome.playerName}
                onChange={onChangeInput}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">날짜</label>
              <input
                type="date"
                name="revenueDate"
                value={newIncome.revenueDate}
                onChange={onChangeInput}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                금액 <span className="text-gray-400 text-[11px]">(1회분=₩10,000)</span>
              </label>
              <input
                type="number"
                name="amount"
                placeholder="10000"
                min={FEE_PER_MONTH}
                value={newIncome.amount}
                onChange={onChangeInput}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                회분(납부 개월) <span className="text-gray-400 text-[11px]">(자동계산)</span>
              </label>
              <input type="number" name="monthCount" placeholder="1" min={1} value={newIncome.monthCount} readOnly className="w-full p-2 border rounded bg-gray-100 text-gray-700" tabIndex={-1} />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            {inputError && <p className="text-red-500 text-sm font-semibold">{inputError}</p>}
            <button
              onClick={handleSaveIncome}
              disabled={saveLoading}
              className="ml-auto bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 disabled:bg-gray-300 transition-all shadow">
              {saveLoading ? "저장 중..." : "회비 등록"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-lg text-gray-500">불러오는 중...</div>
        ) : error ? (
          <div className="p-8 text-center text-lg text-red-500">{error}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">총 입금액</th>
                <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">총 납부 회수</th>
                <th className="px-6 py-3 text-center text-[20px] font-medium text-gray-500 uppercase tracking-wider">상세</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {personSummaryList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-base text-gray-400">
                    내역이 없습니다.
                  </td>
                </tr>
              ) : (
                personSummaryList.map((summary) => (
                  <React.Fragment key={summary.playerName}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{summary.playerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium text-center">+{summary.totalAmount.toLocaleString()}원</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-medium text-center">{summary.totalMonthCount.toLocaleString()}회분</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        <button type="button" onClick={() => togglePersonDetail(summary.playerName)} className="transition-all hover:underline text-blue-600 font-semibold">
                          {openNames[summary.playerName] ? "상세 닫기" : "상세 보기"}
                        </button>
                      </td>
                    </tr>
                    {openNames[summary.playerName] && (
                      <tr>
                        <td colSpan={4} className="bg-gray-50 px-6 pb-6 pt-2">
                          <div className="space-y-1">
                            {summary.transactions.map((fee) => (
                              <div key={fee.id} className="text-xs flex items-center gap-2 text-green-700">
                                <span className="font-mono text-gray-500">{fee.revenueDate}</span>
                                <span className="font-bold">
                                  +{fee.amount.toLocaleString()}원<span className="ml-1 text-gray-500">({fee.monthCount}회분)</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
