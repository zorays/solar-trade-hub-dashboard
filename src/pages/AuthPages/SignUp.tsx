import PageMeta from "../../components/common/PageMeta";
import SignUpForm from "../../components/auth/SignUpForm";
import AuthLayout from "./AuthPageLayout";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Create Account | Solar Trade Hub Dashboard"
        description="Create your Solar Trade Hub dashboard account and access the administration platform."
      />

      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}