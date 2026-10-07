import PageMeta from "../../components/common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Solar Trade Hub Dashboard"
        description="Sign in to the Solar Trade Hub administration dashboard to manage products, suppliers, installers, tenders, orders and marketplace activity."
      />

      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}