/*
 * FILE: frontend/src/pages/ProfilePage.jsx
 * PURPOSE: Display and edit user's profile with Navbar - NO COVER IMAGE
 */

import React, { useState, useEffect } from 'react';
import { Camera, Save, UserCheck, GraduationCap } from 'lucide-react';
import UserAvatar from '@/components/Common/UserAvatar';
import { useAuth } from '@/hooks';
import { userApi } from '@/api/userApi';
import Navbar from '@/components/Navbar';
import { USER_ROLES } from '@/utils/constants';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

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

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    userApi.getProfile().then((data) => {
      if (updateUser) updateUser(data);
    }).catch(() => {});
  }, [updateUser]);

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
    <div className="min-h-screen bg-page ">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-surface dark:bg-slate-900 backdrop-blur-xl rounded-3xl shadow-2xl border border-border-card p-8 transition-all hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <UserAvatar
                name={formData.name}
                avatar={avatarPreview}
                size="2xl"
                className="border-4 border-white dark:border-slate-800 shadow-xl transition-transform group-hover:scale-[1.02]"
              />
              <input type="file" accept="image/*" onChange={handleAvatarChange} id="avatarUpload" className="hidden" />
              <label
                htmlFor="avatarUpload"
                className="absolute bottom-3 right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition-all hover:bg-indigo-700 hover:scale-105"
                title="Upload profile photo"
              >
                <Camera size={18} />
              </label>
            </div>
            <p className="mt-3 text-xs text-text-dim">Tap the camera icon to upload your profile photo</p>
            <h2 className="text-2xl font-semibold mt-3 text-text-main">{formData.name}</h2>
            <p className="text-text-dim text-sm mt-1">{user?.role}{user?.rollNumber ? ` · ${user.rollNumber}` : ''}</p>
          </div>

          {user?.role === USER_ROLES.STUDENT && (
            <div className="w-full mb-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 mb-3">
                <UserCheck size={18} /> Section Coordinator
              </p>
              {user.coordinator ? (
                <div className="flex items-center gap-4">
                  <UserAvatar name={user.coordinator.name} avatar={user.coordinator.avatar} size="lg" className="border-2 border-white shadow" />
                  <div>
                    <p className="font-semibold text-text-main">{user.coordinator.name}</p>
                    <p className="text-sm text-text-dim">{user.coordinator.email}</p>
                    {user.coordinator.phone && (
                      <p className="text-sm text-text-dim">{user.coordinator.phone}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-dim">No coordinator has been assigned to you yet.</p>
              )}
            </div>
          )}

          {user?.role === USER_ROLES.FACULTY && (
            <div className="w-full mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mb-3">
                <GraduationCap size={18} />
                Students Under My Coordination
                {user.coordinatorStudents?.length ? ` (${user.coordinatorStudents.length})` : ''}
              </p>
              {user.coordinatorStudents?.length > 0 ? (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {user.coordinatorStudents.map((s) => (
                    <div key={s._id} className="flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg">
                      <UserAvatar name={s.name} avatar={s.avatar} size="sm" />
                      <div>
                        <p className="font-medium text-text-main text-sm">{s.name}</p>
                        <p className="text-xs text-text-dim">
                          {s.rollNumber || 'No roll'}
                          {s.year ? ` · Year ${s.year}` : ''}
                          {s.branchId?.name ? ` · ${s.branchId.name}` : ''}
                          {s.sectionId?.name ? ` · Sec ${s.sectionId.name}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-dim">No students assigned to you as coordinator yet.</p>
              )}
            </div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-text-main font-medium mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-main focus:bg-surface dark:focus:bg-slate-800 border border-border-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-text-main font-medium mb-1">Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-main focus:bg-surface dark:focus:bg-slate-800 border border-border-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-text-main font-medium mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-main focus:bg-surface dark:focus:bg-slate-800 border border-border-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-text-main font-medium mb-1">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-main focus:bg-surface dark:focus:bg-slate-800 border border-border-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-text-main font-medium mb-1">College</label>
              <input type="text" name="college" value={formData.college} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-main focus:bg-surface dark:focus:bg-slate-800 border border-border-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-text-main font-medium mb-1">Department</label>
                <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-main focus:bg-surface dark:focus:bg-slate-800 border border-border-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
              </div>
 
              <div>
                <label className="block text-text-main font-medium mb-1">Year</label>
                <select name="year" value={formData.year} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-main focus:bg-surface dark:focus:bg-slate-800 border border-border-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all">
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-text-main font-medium mb-1">Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-main focus:bg-surface dark:focus:bg-slate-800 border border-border-card focus:ring-2 focus:ring-indigo-400 outline-none transition-all resize-none" placeholder="Tell us about yourself..."></textarea>
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
