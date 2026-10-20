
import PageMeta from "../../components/common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";
import AuthLayout from "./AuthPageLayout";

/* =========================================================
   SOLAR TRADE HUB — DASHBOARD SIGN IN PAGE

   Responsibilities:
   - Page metadata
   - Authentication layout
   - Dashboard sign-in form

   Authentication logic:
   components/auth/SignInForm.tsx

   Session management:
   context/AuthContext.tsx

   API integration:
   services/auth.service.ts
========================================================= */

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Solar Trade Hub Dashboard"
        description="Sign in to the Solar Trade Hub Dashboard to manage products, suppliers, installers, customer requests, tenders, orders, deals, careers, and marketplace operations."
      />

      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
