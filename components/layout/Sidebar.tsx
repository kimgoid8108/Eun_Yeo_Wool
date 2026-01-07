/**
 * 사이드바 컴포넌트
 *
 * 네비게이션 메뉴를 표시하는 사이드바 컴포넌트입니다.
 * 모바일 환경에서 햄버거 메뉴로 동작합니다.
 *
 * 사용처:
 * - app/layout.tsx: 전체 레이아웃에서 좌측 사이드바로 사용
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  { href: "/", label: "메인" },
  { href: "/executives", label: "회원명단" },
  { href: "/records", label: "경기 기록" },
  { href: "/fees", label: "회비 기록" },
  { href: "/fees/history", label: "회비 사용내역" },
  { href: "/space", label: "필요한 공간" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 모바일 메뉴 버튼 */}
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 p-2 md:hidden bg-white rounded-md shadow-md" aria-label="메뉴 열기">
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* 사이드바 */}
      <aside
        className={`
          h-full w-[290px] bg-gray-800 text-center text-white flex-shrink-0
          fixed md:relative
          top-0 left-0
          transform transition-transform duration-300 ease-in-out
          z-40 md:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
        <div className="flex flex-col h-full pt-16 md:pt-0">
          <nav className="flex-1 px-4 py-8 flex flex-col items-center justify-center">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block w-full px-4 py-4 text-center rounded-lg transition-colors ${isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 모바일 오버레이 */}
        {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsOpen(false)} />}
      </aside>
    </>
  );
}
