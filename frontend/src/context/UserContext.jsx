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
  const { isAuthenticated, user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState({});

  // Load all users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAllUsers();
      setUsers(data);
      
      // Initialize followedUsers state from user data
      if (currentUser?.following) {
        const followMap = {};
        currentUser.following.forEach(userId => {
          followMap[userId] = true;
        });
        setFollowedUsers(followMap);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users with pagination support
  const fetchUsers = async ({ page = 1, limit = 18 } = {}) => {
    try {
      setLoading(true);
      const data = await userApi.getAllUsers({ page, limit });
      
      if (page === 1) {
        setUsers(data);
      } else {
        // Prevent duplicates by filtering out users that already exist
        setUsers(prev => {
          const existingIds = new Set(prev.map(u => u._id));
          const newUsers = data.filter(u => !existingIds.has(u._id));
          return [...prev, ...newUsers];
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Follow user
  const followUser = async (userId) => {
    try {
      await userApi.followUser(userId);
      
      // Update local state
      setFollowedUsers(prev => ({ ...prev, [userId]: true }));
      
      // Update the user's followers count in the users list
      setUsers(prev => prev.map(u => 
        u._id === userId 
          ? { ...u, followers: [...(u.followers || []), currentUser?.id] }
          : u
      ));
      
      return { success: true };
    } catch (error) {
      console.error('Error following user:', error);
      return { success: false, error: error.message };
    }
  };

  // Unfollow user
  const unfollowUser = async (userId) => {
    try {
      await userApi.unfollowUser(userId);
      
      // Update local state
      setFollowedUsers(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
      
      // Update the user's followers count in the users list
      setUsers(prev => prev.map(u => 
        u._id === userId 
          ? { ...u, followers: (u.followers || []).filter(id => id !== currentUser?.id) }
          : u
      ));
      
      return { success: true };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return { success: false, error: error.message };
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
    fetchUsers,
    followUser,
    unfollowUser,
    getUserById
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};