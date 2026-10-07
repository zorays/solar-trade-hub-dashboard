import { Link } from "react-router-dom";

export default function MissionBanner() {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-2xl
        border border-gray-200
        bg-[#0b1423]
        dark:border-gray-800
      "
      style={{
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(8, 17, 31, 0.98) 0%,
            rgba(8, 17, 31, 0.91) 30%,
            rgba(8, 17, 31, 0.56) 58%,
            rgba(8, 17, 31, 0.38) 76%,
            rgba(8, 17, 31, 0.72) 100%
          ),
          url("https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=2000&q=85")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center 52%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* SUBTLE ORANGE GLOW */}

      <div
        className="
          pointer-events-none
          absolute -left-20 top-1/2
          h-32 w-48
          -translate-y-1/2
          rounded-full
          bg-[#ff4b1f]/10
          blur-3xl
        "
      />

      <div
        className="
          relative z-10
          flex min-h-[96px]
          flex-col gap-5
          px-5 py-4
          sm:px-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        {/* LEFT CONTENT */}

        <div className="max-w-[650px]">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-px w-5 bg-[#ff4b1f]" />

            <span
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.24em]
                text-gray-300
              "
            >
              Our Mission
            </span>
          </div>

          <h3
            className="
              text-lg
              font-semibold
              leading-tight
              text-white
              sm:text-xl
            "
          >
            Trade Today for a Brighter Tomorrow
          </h3>

          <p
            className="
              mt-1.5
              text-xs
              leading-5
              text-gray-300
              sm:text-sm
            "
          >
            Connecting people, products and opportunities for a sustainable
            Pakistan.
          </p>
        </div>

        {/* CTA */}

        <Link
          to="/products"
          className="
            inline-flex
            w-fit shrink-0
            items-center justify-center
            gap-3
            rounded-xl
            bg-[#ff4b1f]
            px-5 py-3
            text-sm
            font-semibold
            text-white
            shadow-[0_8px_24px_rgba(255,75,31,0.28)]
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:bg-[#e83c12]
            hover:shadow-[0_10px_28px_rgba(255,75,31,0.35)]
          "
        >
          View Products

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}