/**
 * FILE: frontend/src/context/PostContext.jsx
 * PURPOSE: Post management with optimistic updates and real-time sync
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { postApi } from '@/api/postApi';
import { AuthContext } from './AuthContext';
import { useSocket } from '@/hooks';

export const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { socket, on, off } = useSocket();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Load posts
  const loadPosts = async () => {
    if (!isAuthenticated) return;
    
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
      const newPost = await postApi.createPost(content, files);
      setPosts(prev => [newPost, ...prev]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Like post with optimistic update
  const likePost = async (postId) => {
    const userId = user?._id || user?.id;
    
    // Optimistic update
    setPosts(prev => prev.map(post => {
      if (post._id === postId) {
        const isLiked = post.likes?.includes(userId);
        return {
          ...post,
          likes: isLiked 
            ? post.likes.filter(id => id !== userId)
            : [...(post.likes || []), userId]
        };
      }
      return post;
    }));

    try {
      await postApi.likePost(postId);
      return { success: true };
    } catch (error) {
      // Revert on error
      await loadPosts();
      return { success: false, error: error.message };
    }
  };

  // Comment on post
  const commentOnPost = async (postId, text) => {
    try {
      const updatedPost = await postApi.commentOnPost(postId, text);
      setPosts(prev => prev.map(post => 
        post._id === postId ? updatedPost : post
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Share post with optimistic update
  const sharePost = async (postId) => {
    // Optimistic update
    setPosts(prev => prev.map(post => {
      if (post._id === postId) {
        return { ...post, shares: (post.shares || 0) + 1 };
      }
      return post;
    }));

    try {
      await postApi.sharePost(postId);
      return { success: true };
    } catch (error) {
      // Revert on error
      await loadPosts();
      return { success: false, error: error.message };
    }
  };

  // Repost
  const repostPost = async (postId) => {
    try {
      const repost = await postApi.repostPost(postId);
      setPosts(prev => [repost, ...prev]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Edit post
  const editPost = async (postId, content) => {
    try {
      const updatedPost = await postApi.editPost(postId, content);
      setPosts(prev => prev.map(post => 
        post._id === postId ? updatedPost : post
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    try {
      await postApi.deletePost(postId);
      setPosts(prev => prev.filter(post => post._id !== postId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Like comment
  const likeComment = async (postId, commentId) => {
    try {
      await postApi.likeComment(postId, commentId);
      await loadPosts();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Listen for real-time post updates
  useEffect(() => {
    if (socket && isAuthenticated) {
      const handleNewPost = (post) => {
        setPosts(prev => [post, ...prev]);
      };

      const handlePostLiked = ({ postId, userId, action }) => {
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              likes: action === 'liked'
                ? [...(post.likes || []), userId]
                : (post.likes || []).filter(id => id !== userId)
            };
          }
          return post;
        }));
      };

      const handlePostCommented = ({ postId, comment }) => {
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), comment]
            };
          }
          return post;
        }));
      };

      on('post:new', handleNewPost);
      on('post:liked', handlePostLiked);
      on('post:commented', handlePostCommented);

      return () => {
        off('post:new', handleNewPost);
        off('post:liked', handlePostLiked);
        off('post:commented', handlePostCommented);
      };
    }
  }, [socket, isAuthenticated, on, off]);

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
    repostPost,
    editPost,
    deletePost,
    likeComment,
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};