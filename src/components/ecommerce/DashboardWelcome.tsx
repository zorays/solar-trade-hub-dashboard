import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";

export default function DashboardWelcome() {
  const { user } = useAuth();

  const firstName = useMemo(() => {
    const name = user?.name?.trim();

    if (!name) {
      return null;
    }

    return name.split(/\s+/)[0];
  }, [user?.name]);

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      {/* LEFT */}
      <div>
        <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white md:text-[28px]">
          {firstName
            ? `Welcome back, ${firstName}!`
            : "Welcome back!"}
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 md:text-base">
          Here's what's happening on Solar Trade Hub today.
        </p>
      </div>

      {/* RIGHT */}
      <div className="sm:text-right">
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
          {currentDate}
        </p>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          Let's build a sustainable and self-reliant Pakistan{" "}
          <span aria-hidden="true">🌱</span>
        </p>
      </div>
    </div>
  );
}