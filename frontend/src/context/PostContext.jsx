/**
 * FILE: frontend/src/context/PostContext.jsx
 * PURPOSE: Post management with SAFE optimistic updates (NO UI RESET)
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

  /* ---------------- LOAD POSTS ---------------- */
  const loadPosts = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await postApi.getPosts(filter);
      setPosts(data);
    } catch (err) {
      console.error('Load posts failed:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CREATE POST ---------------- */
  const createPost = async (content, files) => {
    try {
      const newPost = await postApi.createPost(content, files);
      setPosts(prev => [newPost, ...prev]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /* ---------------- LIKE POST (FIXED) ---------------- */
  const likePost = async (postId) => {
    const userId = user?._id || user?.id;
    let rollbackPost = null;

    setPosts(prev =>
      prev.map(post => {
        if (post._id === postId) {
          rollbackPost = post; // store original
          const isLiked = post.likes?.includes(userId);
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter(id => id !== userId)
              : [...(post.likes || []), userId]
          };
        }
        return post;
      })
    );

    try {
      await postApi.likePost(postId);
      return { success: true };
    } catch (err) {
      // 🔥 rollback ONLY this post
      setPosts(prev =>
        prev.map(post =>
          post._id === postId ? rollbackPost : post
        )
      );
      return { success: false, error: err.message };
    }
  };

  /* ---------------- COMMENT ---------------- */
  const commentOnPost = async (postId, text) => {
    try {
      const updatedPost = await postApi.commentOnPost(postId, text);
      setPosts(prev =>
        prev.map(post => (post._id === postId ? updatedPost : post))
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /* ---------------- SHARE POST (FIXED) ---------------- */
  const sharePost = async (postId) => {
    let rollbackPost = null;

    setPosts(prev =>
      prev.map(post => {
        if (post._id === postId) {
          rollbackPost = post;
          return { ...post, shares: (post.shares || 0) + 1 };
        }
        return post;
      })
    );

    try {
      await postApi.sharePost(postId);
      return { success: true };
    } catch (err) {
      setPosts(prev =>
        prev.map(post =>
          post._id === postId ? rollbackPost : post
        )
      );
      return { success: false, error: err.message };
    }
  };

  /* ---------------- DELETE ---------------- */
  const deletePost = async (postId) => {
    try {
      await postApi.deletePost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /* ---------------- LIKE COMMENT (FIXED) ---------------- */
  const likeComment = async (postId, commentId) => {
    const userId = user?._id || user?.id;
    let rollbackPost = null;

    setPosts(prev =>
      prev.map(post => {
        if (post._id === postId) {
          rollbackPost = post;
          return {
            ...post,
            comments: post.comments.map(c => {
              if (c._id === commentId) {
                const liked = c.likes?.includes(userId);
                return {
                  ...c,
                  likes: liked
                    ? c.likes.filter(id => id !== userId)
                    : [...(c.likes || []), userId]
                };
              }
              return c;
            })
          };
        }
        return post;
      })
    );

    try {
      await postApi.likeComment(postId, commentId);
      return { success: true };
    } catch (err) {
      setPosts(prev =>
        prev.map(post =>
          post._id === postId ? rollbackPost : post
        )
      );
      return { success: false, error: err.message };
    }
  };

  /* ---------------- REAL-TIME ---------------- */
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const onLike = ({ postId, userId, action }) => {
      setPosts(prev =>
        prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              likes:
                action === 'liked'
                  ? [...(post.likes || []), userId]
                  : post.likes.filter(id => id !== userId)
            };
          }
          return post;
        })
      );
    };

    on('post:liked', onLike);
    return () => off('post:liked', onLike);
  }, [socket, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) loadPosts();
  }, [filter, isAuthenticated]);

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        filter,
        setFilter,
        createPost,
        likePost,
        commentOnPost,
        sharePost,
        deletePost,
        likeComment
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
