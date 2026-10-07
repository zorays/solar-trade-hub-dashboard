import PageMeta from "../../components/common/PageMeta";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import AuthLayout from "./AuthPageLayout";

/* =========================================================
   RESET PASSWORD PAGE
========================================================= */

export default function ResetPassword() {
  return (
    <>
      <PageMeta
        title="Reset Password | Solar Trade Hub Dashboard"
        description="Create a new password for your Solar Trade Hub dashboard account using a secure password reset link."
      />

      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
}