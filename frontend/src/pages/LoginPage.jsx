import AuthLayout from "@/components/Auth/AuthLayout";
import LoginForm from "@/components/Auth/LoginForm";

const LoginPage = () => {
  return (
    <AuthLayout title="Welcome Back" subtitle="Faculty & staff — login with email and password">
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
