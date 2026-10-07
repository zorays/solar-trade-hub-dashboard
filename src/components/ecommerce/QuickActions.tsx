import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface QuickAction {
  title: string;
  href: string;
  icon: ReactNode;
  accent:
    | "orange"
    | "purple"
    | "green"
    | "blue"
    | "amber"
    | "slate";
}

const actions: QuickAction[] = [
  {
    title: "Add Product",
    href: "/products/add",
    accent: "orange",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="size-6"
        aria-hidden="true"
      >
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </svg>
    ),
  },
  {
    title: "Add Supplier",
    href: "/suppliers/add",
    accent: "purple",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="size-6"
        aria-hidden="true"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-2a6 6 0 0 1 6-6" />
        <path d="M17 8v6M14 11h6" />
      </svg>
    ),
  },
  {
    title: "Post Tender",
    href: "/tenders/add",
    accent: "green",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="size-6"
        aria-hidden="true"
      >
        <path d="M6 3h9l3 3v15H6V3Z" />
        <path d="M15 3v4h4" />
        <path d="M9 11h6M9 15h6" />
      </svg>
    ),
  },
  {
    title: "Verify Installer",
    href: "/installers/verification",
    accent: "blue",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="size-6"
        aria-hidden="true"
      >
        <path d="M12 3 5 6v5c0 4.6 2.9 8.7 7 10 4.1-1.3 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Manage Orders",
    href: "/orders",
    accent: "amber",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="size-6"
        aria-hidden="true"
      >
        <path d="M6 7h15l-2 8H8L6 4H3" />
        <circle cx="9" cy="19" r="1.4" />
        <circle cx="18" cy="19" r="1.4" />
      </svg>
    ),
  },
  {
    title: "View Reports",
    href: "/reports/marketplace",
    accent: "slate",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="size-6"
        aria-hidden="true"
      >
        <path d="M5 20V10" />
        <path d="M10 20V5" />
        <path d="M15 20v-8" />
        <path d="M20 20V3" />
      </svg>
    ),
  },
];

function accentClasses(
  accent: QuickAction["accent"]
) {
  switch (accent) {
    case "orange":
      return "bg-[#ff4b1f]/12 text-[#ff4b1f]";

    case "purple":
      return "bg-[#5b2eff]/12 text-[#7c4dff]";

    case "green":
      return "bg-green-500/12 text-green-500";

    case "blue":
      return "bg-blue-500/12 text-blue-500";

    case "amber":
      return "bg-amber-500/12 text-amber-500";

    case "slate":
      return "bg-slate-500/12 text-slate-400";
  }
}

export default function QuickActions() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* HEADER */}

      <div className="mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </h3>
      </div>

      {/* ACTION GRID */}

      <div className="grid flex-1 grid-cols-3 grid-rows-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className="
              group
              flex min-h-0
              flex-col items-center justify-center
              rounded-xl
              border border-gray-200
              bg-gray-50
              px-2 py-3
              text-center
              transition-all duration-200
              hover:-translate-y-0.5
              hover:border-gray-300
              hover:shadow-sm
              dark:border-gray-800
              dark:bg-white/[0.025]
              dark:hover:border-gray-700
              dark:hover:bg-white/[0.045]
            "
          >
            <div
              className={`
                flex size-11
                items-center justify-center
                rounded-xl
                transition-transform duration-200
                group-hover:scale-105
                ${accentClasses(action.accent)}
              `}
            >
              {action.icon}
            </div>

            <p className="mt-2 text-center text-[11px] font-medium leading-4 text-gray-800 dark:text-white/90">
              {action.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}