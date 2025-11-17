// FILE: frontend/src/components/Auth/RegisterForm.jsx

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks";
import { USER_ROLES } from "@/utils/constants";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: USER_ROLES.STUDENT,
    department: "",
    bio: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showDepartmentField =
    formData.role !== USER_ROLES.DIRECTOR &&
    formData.role !== USER_ROLES.OWNER;

  useEffect(() => {
    if (!showDepartmentField) {
      setFormData(prev => ({ ...prev, department: "" }));
    }
  }, [formData.role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, phone, password, role, department, bio } = formData;

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!department && showDepartmentField) {
      setError("Department is required for this role.");
      return;
    }

    if (role !== USER_ROLES.STUDENT && !phone) {
      setError("Phone number is required.");
      return;
    }

    const payload = {
      name,
      email,
      password,
      role,
      bio: bio.trim(),
      ...(role !== USER_ROLES.STUDENT ? { phone } : {}),
      ...(showDepartmentField ? { department: department.trim() } : {}),
    };

    try {
      setLoading(true);
      const result = await register(payload);

      if (result.success) navigate("/dashboard");
      else setError(result.error || "Registration failed. Try again.");
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

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
              ? "Phone (Optional)"
              : "Phone (Required)"
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
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

        {/* Roles */}
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
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        <p className="text-center text-gray-500 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </>
  );
};

export default RegisterForm;
