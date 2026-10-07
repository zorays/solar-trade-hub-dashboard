import PageMeta from "../../components/common/PageMeta";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
import AuthLayout from "./AuthPageLayout";

/* =========================================================
   FORGOT PASSWORD PAGE
========================================================= */

export default function ForgotPassword() {
  return (
    <>
      <PageMeta
        title="Forgot Password | Solar Trade Hub Dashboard"
        description="Recover access to your Solar Trade Hub dashboard account by requesting a secure password reset link."
      />

      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </>
  );
}