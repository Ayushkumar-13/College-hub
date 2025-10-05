/*
 * FILE: frontend/src/pages/ProfilePage.jsx
 * LOCATION: college-social-platform/frontend/src/pages/ProfilePage.jsx
 * PURPOSE: Display and edit user's profile - FULLY CONNECTED TO BACKEND
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Camera } from 'lucide-react';
import { useAuth } from '@/hooks';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [updating, setUpdating] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      await updateProfile({ name, avatar });
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40 border-b-2 border-primary-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">Profile</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="p-3 hover:bg-red-50 rounded-xl text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut size={24} />
            </button>
            <img 
              src={user?.avatar} 
              alt={user?.name} 
              className="w-12 h-12 rounded-xl cursor-pointer ring-2 ring-primary-100 hover:ring-primary-300 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Profile Form */}
      <main className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative">
            <img src={avatar} alt={name} className="w-32 h-32 rounded-full object-cover ring-2 ring-primary-100" />
            <input 
              type="file" 
              onChange={handleAvatarChange} 
              className="hidden" 
              id="avatarUpload" 
            />
            <label htmlFor="avatarUpload" className="absolute bottom-0 right-0 bg-primary-500 p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-all">
              <Camera size={20} color="white" />
            </label>
          </div>
          <h2 className="text-xl font-bold">{name}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-gray-100 focus:ring-2 focus:ring-primary-300 outline-none transition-all"
            />
          </div>

          <button 
            onClick={handleUpdateProfile}
            disabled={updating}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-secondary-600 font-semibold shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
