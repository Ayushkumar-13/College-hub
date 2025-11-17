import AuthLayout from "@/components/Auth/AuthLayout";
import LoginForm from "@/components/Auth/LoginForm";

const LoginPage = () => {
  return (
    <AuthLayout title="Welcome Back" subtitle="Login to your account">
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
