import AuthLayout from "@/components/Auth/AuthLayout";
import RegisterForm from "@/components/Auth/RegisterForm";

const RegisterPage = () => {
  return (
    <AuthLayout title="Create Account" subtitle="Join College Social">
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;
