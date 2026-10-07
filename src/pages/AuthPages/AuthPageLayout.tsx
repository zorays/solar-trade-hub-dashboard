import React from "react";
import { Link } from "react-router";

import GridShape from "../../components/common/GridShape";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <div className="flex min-h-screen w-full">
        {/* LEFT - AUTH FORM */}
        <div className="relative flex w-full items-center justify-center bg-white px-5 py-6 dark:bg-gray-900 lg:w-[52%] lg:px-10">
          <div className="w-full max-w-[460px]">
            {children}
          </div>
        </div>

        {/* RIGHT - BRAND PANEL */}
        <div className="relative hidden min-h-screen overflow-hidden bg-[#111827] lg:flex lg:w-[48%]">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute -right-24 -top-24 h-[300px] w-[300px] rounded-full bg-[#5b2eff]/20 blur-[100px]" />

            <div className="absolute -bottom-24 -left-20 h-[280px] w-[280px] rounded-full bg-[#ff4b1f]/20 blur-[100px]" />

            <div className="absolute inset-0 opacity-[0.12]">
              <GridShape />
            </div>
          </div>

          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-10 xl:px-16">
            {/* LOGO */}
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff4b1f] shadow-[0_8px_24px_rgba(255,75,31,0.3)]">
                  <svg
                    viewBox="0 0 40 40"
                    className="h-6 w-6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 8H24L32 16L23 25L16 18L22 12"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />

                    <path
                      d="M28 32H16L8 24L17 15L24 22L18 28"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </div>

                <div>
                  <div className="text-[20px] font-bold leading-none text-white">
                    Solar Trade Hub
                  </div>

                  <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em]">
                    <span className="text-[#ff4b1f]">Connect</span>
                    <span className="mx-1 text-white/30">•</span>
                    <span className="text-[#5b2eff]">Trade</span>
                    <span className="mx-1 text-white/30">•</span>
                    <span className="text-white/50">Grow</span>
                  </div>
                </div>
              </Link>

              <span className="text-xs font-medium text-white/40">
                Admin Portal
              </span>
            </div>

            {/* MAIN BRAND MESSAGE */}
            <div className="max-w-[520px]">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-[#ff4b1f]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff6a45]">
                  Solar Trade Hub
                </span>
              </div>

              <h2 className="text-[42px] font-bold leading-[1.05] tracking-[-0.04em] text-white xl:text-[48px]">
                Manage the
                <span className="block text-[#ff4b1f]">
                  Solar Marketplace
                </span>
                <span className="block">
                  Smarter.
                </span>
              </h2>

              <p className="mt-5 max-w-[470px] text-sm leading-6 text-white/60">
                A unified dashboard for managing products, suppliers,
                installers, tenders, orders and platform users.
              </p>

              {/* SMALL INFO ROW */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff4b1f]/15 text-[#ff6540]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M4 19V9l8-4 8 4v10" />
                      <path d="M8 19v-6h8v6" />
                    </svg>
                  </div>

                  <div className="text-sm font-semibold text-white">
                    Marketplace
                  </div>

                  <div className="mt-1 text-xs text-white/45">
                    Products & trading
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b2eff]/20 text-[#a18cff]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle cx="9" cy="7" r="4" />
                      <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
                      <path d="M17 11a4 4 0 0 1 4 4v6" />
                    </svg>
                  </div>

                  <div className="text-sm font-semibold text-white">
                    Network
                  </div>

                  <div className="mt-1 text-xs text-white/45">
                    Suppliers & installers
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <p className="text-xs text-white/40">
                Solar Trade Hub Dashboard
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-[#ff4b1f]" />
                <span className="text-white/45">
                  Secure Access
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* THEME SWITCH */}
        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}