/*
 * FILE: frontend/src/context/UserContext.jsx
 * PURPOSE: User management context (users list, follow/unfollow, fetch, pagination)
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { userApi } from '@/api/userApi';
import { AuthContext } from './AuthContext';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user: currentUser } = useContext(AuthContext);

  // AuthContext does NOT provide "isAuthenticated", so create it here
  const isAuthenticated = Boolean(currentUser);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState({});

  /** -------------------------
   * Load all users
   * ------------------------- */
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAllUsers();
      setUsers(data);

      // Map followings
      if (currentUser?.following) {
        const followMap = {};
        currentUser.following.forEach(id => (followMap[id] = true));
        setFollowedUsers(followMap);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  /** -------------------------
   * Fetch users with pagination
   * ------------------------- */
  const fetchUsers = async ({ page = 1, limit = 18 } = {}) => {
    try {
      setLoading(true);

      const data = await userApi.getAllUsers({ page, limit });

      if (page === 1) {
        setUsers(data);
      } else {
        setUsers(prev => {
          const existingIds = new Set(prev.map(u => u._id));
          const filtered = data.filter(u => !existingIds.has(u._id));
          return [...prev, ...filtered];
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error fetching users:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /** -------------------------
   * Follow a user
   * ------------------------- */
  const followUser = async (userId) => {
    try {
      await userApi.followUser(userId);

      setFollowedUsers(prev => ({ ...prev, [userId]: true }));

      setUsers(prev =>
        prev.map(u =>
          u._id === userId
            ? { ...u, followers: [...(u.followers || []), currentUser?.id] }
            : u
        )
      );

      return { success: true };
    } catch (error) {
      console.error("Error following user:", error);
      return { success: false, error: error.message };
    }
  };

  /** -------------------------
   * Unfollow a user
   * ------------------------- */
  const unfollowUser = async (userId) => {
    try {
      await userApi.unfollowUser(userId);

      setFollowedUsers(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      setUsers(prev =>
        prev.map(u =>
          u._id === userId
            ? { ...u, followers: (u.followers || []).filter(id => id !== currentUser?.id) }
            : u
        )
      );

      return { success: true };
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return { success: false, error: error.message };
    }
  };

  /** -------------------------
   * Get user by ID
   * ------------------------- */
  const getUserById = (userId) => {
    return users.find(u => u._id === userId);
  };

  /** -------------------------
   * Load users when authenticated
   * ------------------------- */
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
    getUserById,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
