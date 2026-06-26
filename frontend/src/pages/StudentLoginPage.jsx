import AuthLayout from '@/components/Auth/AuthLayout';
import StudentLoginForm from '@/components/Auth/StudentLoginForm';

const StudentLoginPage = () => (
  <AuthLayout title="Student Login" subtitle="Select your path, name, then set or enter your password">
    <StudentLoginForm />
  </AuthLayout>
);

export default StudentLoginPage;
