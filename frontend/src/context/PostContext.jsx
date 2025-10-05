/*
 * FILE: frontend/src/context/PostContext.jsx
 * LOCATION: college-social-platform/frontend/src/context/PostContext.jsx
 * PURPOSE: Post management context (CRUD, like, comment, share)
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { postApi } from '@/api/postApi';
import { AuthContext } from './AuthContext';

export const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Load posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postApi.getPosts(filter);
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create post
  const createPost = async (content, files) => {
    try {
      await postApi.createPost(content, files);
      await loadPosts();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.error };
    }
  };

  // Like post
  const likePost = async (postId) => {
    try {
      await postApi.likePost(postId);
      await loadPosts();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.error };
    }
  };

  // Comment on post
  const commentOnPost = async (postId, text) => {
    try {
      await postApi.commentOnPost(postId, text);
      await loadPosts();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.error };
    }
  };

  // Share post
  const sharePost = async (postId) => {
    try {
      await postApi.sharePost(postId);
      await loadPosts();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.error };
    }
  };

  // Repost
  const repostPost = async (postId) => {
    try {
      await postApi.repostPost(postId);
      await loadPosts();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.error };
    }
  };

  // Load posts when filter changes or user logs in
  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();
    }
  }, [filter, isAuthenticated]);

  const value = {
    posts,
    loading,
    filter,
    setFilter,
    loadPosts,
    createPost,
    likePost,
    commentOnPost,
    sharePost,
    repostPost
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};