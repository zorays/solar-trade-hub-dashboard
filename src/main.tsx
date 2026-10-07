import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";

import App from "./App.tsx";

import {
  AppWrapper,
} from "./components/common/PageMeta.tsx";

import {
  ThemeProvider,
} from "./context/ThemeContext.tsx";

import {
  AuthProvider,
} from "./context/AuthContext.tsx";

/* =========================================================
   SOLAR TRADE HUB DASHBOARD
========================================================= */

const rootElement =
  document.getElementById(
    "root"
  );

if (!rootElement) {
  throw new Error(
    "Root element was not found."
  );
}

createRoot(
  rootElement
).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppWrapper>
          <App />
        </AppWrapper>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);