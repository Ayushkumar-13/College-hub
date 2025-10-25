/*
 * FILE: frontend/src/pages/ProfilePage.jsx
 * PURPOSE: Display and edit user's profile with cover photo - PRODUCTION READY
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Camera, Save, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [cover, setCover] = useState(user?.cover || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCover(URL.createObjectURL(file));
      setCoverFile(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const formData = new FormData();

      if (name && name !== user?.name) formData.append('name', name);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (coverFile) formData.append('cover', coverFile);

      const token = localStorage.getItem('token');
     const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/upload`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

let data;
try {
  data = await res.json();
} catch (err) {
  console.error('Failed to parse JSON:', err);
  alert('❌ Server did not respond with valid JSON.');
  return;
}

if (!res.ok) {
  alert(`❌ Failed to update: ${data?.error || 'Unknown error'}`);
  return;
}


      if (!res.ok) {
        alert(`❌ Failed to update: ${data.error || 'Unknown error'}`);
        return;
      }

      // Update user in localStorage
      const updatedUser = data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      alert('✅ Profile updated successfully!');
      setAvatar(updatedUser.avatar);
      setCover(updatedUser.cover);
    } catch (error) {
      console.error('Profile update error:', error);
      alert('❌ Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wide">Profile</h1>
          <div className="flex items-center gap-5">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <LogOut size={18} /> Logout
            </button>
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-md"
            />
          </div>
        </div>
      </header>

      {/* Cover Photo */}
      <div className="relative w-full h-60 md:h-72 bg-gray-200">
        <img
          src={cover || 'https://via.placeholder.com/1200x400?text=Cover+Photo'}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          id="coverUpload"
          className="hidden"
        />
        <label
          htmlFor="coverUpload"
          className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 p-3 rounded-full text-white shadow-lg cursor-pointer transition-all"
        >
          <ImageIcon size={18} />
        </label>
      </div>

      {/* Profile Info */}
      <main className="flex-grow flex justify-center items-start -mt-20 px-4">
        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8 transition-all hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img
                src={avatar}
                alt={name}
                className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl transition-all group-hover:scale-105"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                id="avatarUpload"
                className="hidden"
              />
              <label
                htmlFor="avatarUpload"
                className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 p-2.5 rounded-full text-white shadow-md cursor-pointer transition-all opacity-0 group-hover:opacity-100"
              >
                <Camera size={18} />
              </label>
            </div>
            <h2 className="text-2xl font-semibold mt-4 text-gray-800">{name}</h2>
            <p className="text-gray-500 text-sm mt-1">@{user?.username || 'user'}</p>
          </div>

          {/* Editable Fields */}
          <div className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 focus:bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-60"
            >
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
