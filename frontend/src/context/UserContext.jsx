/*
 * FILE: frontend/src/context/UserContext.jsx
 * LOCATION: college-social-platform/frontend/src/context/UserContext.jsx
 * PURPOSE: User management context (users list, follow/unfollow)
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { userApi } from '@/api/userApi';
import { AuthContext } from './AuthContext';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState({});

  // Load all users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Follow user
  const followUser = async (userId) => {
    try {
      if (followedUsers[userId]) {
        await userApi.unfollowUser(userId);
      } else {
        await userApi.followUser(userId);
      }
      setFollowedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
      await loadUsers();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.error };
    }
  };

  // Get user by ID
  const getUserById = (userId) => {
    return users.find(u => u._id === userId);
  };

  // Load users on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const value = {
    users,
    loading,
    followedUsers,
    loadUsers,
    followUser,
    getUserById
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};