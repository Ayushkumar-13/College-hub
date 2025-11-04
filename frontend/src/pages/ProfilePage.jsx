/*
 * FILE: frontend/src/pages/ProfilePage.jsx
 * PURPOSE: Display and edit user's profile with Navbar - NO COVER IMAGE
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save } from 'lucide-react';
import { useAuth } from '@/hooks';
import Navbar from '@/components/Navbar';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
    year: user?.year || '',
    bio: user?.bio || '',
  });

  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        college: user.college || '',
        department: user.department || '',
        year: user.year || '',
        bio: user.bio || '',
      });
      setAvatar(user.avatar || '');
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);

      const formDataToSend = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] && formData[key] !== user?.[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (avatarFile) formDataToSend.append('avatar', avatarFile);

      // Check if there are any changes
      if ([...formDataToSend.entries()].length === 0) {
        alert('⚠️ No changes to save');
        setUpdating(false);
        return;
      }

      const token = localStorage.getItem('token');

      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      let data;
      const contentType = res.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        alert(`❌ Server error: Received non-JSON response (${res.status})`);
        return;
      }

      if (!res.ok) {
        console.error('Update failed:', data);
        alert(`❌ Failed to update: ${data?.error || 'Unknown error'}`);
        return;
      }

      const updatedUser = data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (updateUser) updateUser(updatedUser);

      setAvatar(updatedUser.avatar);
      setAvatarPreview(updatedUser.avatar);
      setAvatarFile(null);

      const avatarInput = document.getElementById('avatarUpload');
      if (avatarInput) avatarInput.value = '';

      alert('✅ Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      alert(`❌ Failed to update profile: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8 transition-all hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img src={avatarPreview} alt={formData.name} className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl transition-all group-hover:scale-105" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} id="avatarUpload" className="hidden" />
              <label htmlFor="avatarUpload" className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 p-2.5 rounded-full text-white shadow-md cursor-pointer transition-all opacity-0 group-hover:opacity-100">
                <Camera size={18} />
              </label>
            </div>
            <h2 className="text-2xl font-semibold mt-4 text-gray-800">{formData.name}</h2>
            <p className="text-gray-500 text-sm mt-1">@{formData.username}</p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-gray-100 focus:bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-gray-100 focus:bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-gray-100 focus:bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-gray-100 focus:bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">College</label>
              <input type="text" name="college" value={formData.college} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-gray-100 focus:bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Department</label>
                <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-gray-100 focus:bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Year</label>
                <select name="year" value={formData.year} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-gray-100 focus:bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all">
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" className="w-full px-4 py-3 rounded-xl bg-gray-100 focus:bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all resize-none" placeholder="Tell us about yourself..."></textarea>
            </div>

            <button onClick={handleUpdateProfile} disabled={updating} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-60">
              {updating ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;