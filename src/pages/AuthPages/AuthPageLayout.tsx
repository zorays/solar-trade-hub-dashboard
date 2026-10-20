
import type { ReactNode } from "react";
import { Link } from "react-router";

import GridShape from "../../components/common/GridShape";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

/* =========================================================
   SOLAR TRADE HUB DASHBOARD
   AUTHENTICATION PAGE LAYOUT

   Branding:
   - Solar Trade Hub official favicon
   - Orange #ff4b1f
   - Purple #5b2eff
   - Dark charcoal background

   Logo:
   public/favicon.png

   Public assets are accessible from the root:
   /favicon.png
========================================================= */

interface AuthLayoutProps {
  children: ReactNode;
}

/* =========================================================
   AUTH LAYOUT
========================================================= */

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <div className="flex min-h-screen w-full">

        {/* =================================================
            LEFT PANEL — AUTHENTICATION FORM
        ================================================= */}

        <div className="relative flex w-full items-center justify-center bg-white px-5 py-6 dark:bg-gray-900 lg:w-[52%] lg:px-10">
          <div className="w-full max-w-[460px]">
            {children}
          </div>
        </div>

        {/* =================================================
            RIGHT PANEL — BRAND
        ================================================= */}

        <div className="relative hidden min-h-screen overflow-hidden bg-[#111827] lg:flex lg:w-[48%]">

          {/* BACKGROUND DECORATION */}

          <div className="absolute inset-0">
            <div className="absolute -right-24 -top-24 h-[300px] w-[300px] rounded-full bg-[#5b2eff]/20 blur-[100px]" />

            <div className="absolute -bottom-24 -left-20 h-[280px] w-[280px] rounded-full bg-[#ff4b1f]/20 blur-[100px]" />

            <div className="absolute inset-0 opacity-[0.12]">
              <GridShape />
            </div>
          </div>

          {/* MAIN CONTENT */}

          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-10 xl:px-16">

            {/* =================================================
                LOGO AND ADMIN PORTAL LABEL
            ================================================= */}

            <div className="flex items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex min-w-0 items-center gap-3"
                aria-label="Solar Trade Hub Dashboard"
              >
                {/* OFFICIAL SOLAR TRADE HUB ICON */}

                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ff4b1f] shadow-[0_8px_24px_rgba(255,75,31,0.3)]">
                  <img
                    src="/favicon.png"
                    alt=""
                    width={44}
                    height={44}
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* BRAND NAME */}

                <div className="min-w-0">
                  <div className="text-[20px] font-bold leading-none text-white">
                    Solar Trade Hub
                  </div>

                  <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em]">
                    <span className="text-[#ff4b1f]">
                      Connect
                    </span>

                    <span className="mx-1 text-white/30">
                      •
                    </span>

                    <span className="text-[#5b2eff]">
                      Trade
                    </span>

                    <span className="mx-1 text-white/30">
                      •
                    </span>

                    <span className="text-white/50">
                      Grow
                    </span>
                  </div>
                </div>
              </Link>

              <span className="shrink-0 text-xs font-medium text-white/40">
                Admin Portal
              </span>
            </div>

            {/* =================================================
                MAIN BRAND MESSAGE
            ================================================= */}

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
                A unified dashboard for managing products,
                suppliers, installers, tenders, orders and
                platform users.
              </p>

              {/* =================================================
                  INFORMATION CARDS
              ================================================= */}

              <div className="mt-8 grid grid-cols-2 gap-3">

                {/* MARKETPLACE */}

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff4b1f]/15 text-[#ff6540]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M4 19V9l8-4 8 4v10" />
                      <path d="M8 19v-6h8v6" />
                    </svg>
                  </div>

                  <div className="text-sm font-semibold text-white">
                    Marketplace
                  </div>

                  <div className="mt-1 text-xs text-white/45">
                    Products &amp; trading
                  </div>
                </div>

                {/* NETWORK */}

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b2eff]/20 text-[#a18cff]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
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
                    Suppliers &amp; installers
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

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

        {/* =================================================
            THEME SWITCH
        ================================================= */}

        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
