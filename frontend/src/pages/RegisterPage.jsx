/*
 * FILE: frontend/src/pages/RegisterPage.jsx
 * PURPOSE: Enhanced Register Page with Role Restrictions (Owner, Director, Student)
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks';
import { USER_ROLES } from '@/utils/constants';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: USER_ROLES.STUDENT,
    department: '',
    bio: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Automatically manage department when role changes
  useEffect(() => {
    if (formData.role === USER_ROLES.DIRECTOR || formData.role === USER_ROLES.OWNER) {
      setFormData((prev) => ({ ...prev, department: '' }));
    }
  }, [formData.role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, role, department, bio } = formData;

    // ✅ Basic validations
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // ✅ Department required for Student, Faculty, Staff, HOD only
    if (
      !department &&
      ![USER_ROLES.DIRECTOR, USER_ROLES.OWNER].includes(role)
    ) {
      setError('Department is required for this role.');
      return;
    }

    // ✅ Phone required for all except Student
    if (role !== USER_ROLES.STUDENT && !phone) {
      setError('Phone number is required for non-student roles.');
      return;
    }

    // ✅ Prepare payload safely
    const payload = {
      name,
      email,
      password,
      role,
      bio: bio?.trim() || '',
      ...(role !== USER_ROLES.STUDENT ? { phone } : {}),
      ...(role !== USER_ROLES.DIRECTOR && role !== USER_ROLES.OWNER
        ? { department: department?.trim() }
        : {}),
    };

    try {
      setLoading(true);
      const result = await register(payload);

      if (result.success) navigate('/dashboard');
      else setError(result.error || 'Registration failed. Try again.');
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showDepartmentField =
    formData.role !== USER_ROLES.DIRECTOR && formData.role !== USER_ROLES.OWNER;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-800 to-pink-700 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 rounded-3xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3 shadow-lg">
            CS
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Create Account</h1>
          <p className="text-gray-500">Join College Social</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name *"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email *"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={
              formData.role === USER_ROLES.STUDENT
                ? 'Phone (Optional)'
                : 'Phone (Required)'
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />

          {/* Password Field */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password *"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Role Selection */}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
          >
            <option value={USER_ROLES.STUDENT}>Student</option>
            <option value={USER_ROLES.FACULTY}>Faculty</option>
            <option value={USER_ROLES.STAFF}>Staff</option>
            <option value={USER_ROLES.HOD}>HOD</option>
            <option value={USER_ROLES.DIRECTOR}>Director</option>
            <option value={USER_ROLES.OWNER}>Owner</option>
          </select>

          {/* ✅ Department Field (Hidden for Director/Owner) */}
          {showDepartmentField && (
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Department *"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          )}

          <input
            type="text"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Bio (Optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-md hover:scale-[1.02] transform transition disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            Go to Dashboard
          </button>
          <p className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
