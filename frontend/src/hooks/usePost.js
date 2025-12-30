/* 
 * FILE: frontend/src/hooks/usePost.js
 * PURPOSE: Post management hook with real-time socket updates
 */
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import api from '@/services/api';

export const usePost = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { socket, connected } = useSocket();

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts?filter=${filter}`);
      setPosts(response.data.posts || response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('📡 Setting up post socket listeners');

    // POST LIKED
    const handlePostLiked = ({ postId, userId, likesCount }) => {
      console.log('❤️ Received post:liked', { postId, userId, likesCount });
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: [...(post.likes || []), userId],
              likesCount: likesCount 
            }
          : post
      ));
    };

    // POST UNLIKED
    const handlePostUnliked = ({ postId, userId, likesCount }) => {
      console.log('💔 Received post:unliked', { postId, userId, likesCount });
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: (post.likes || []).filter(id => id !== userId),
              likesCount: likesCount 
            }
          : post
      ));
    };

    // POST COMMENTED
    const handlePostCommented = ({ postId, comment, commentsCount }) => {
      console.log('💬 Received post:commented', { postId, comment, commentsCount });
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              comments: [...(post.comments || []), comment],
              commentsCount: commentsCount 
            }
          : post
      ));
    };

    // COMMENT LIKED
    const handleCommentLiked = ({ postId, commentId, userId, likesCount }) => {
      console.log('❤️ Received comment:liked', { postId, commentId, userId });
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? {
              ...post,
              comments: (post.comments || []).map(comment =>
                comment._id === commentId
                  ? { ...comment, likes: [...(comment.likes || []), userId] }
                  : comment
              )
            }
          : post
      ));
    };

    // POST SHARED
    const handlePostShared = ({ postId, sharesCount }) => {
      console.log('🔄 Received post:shared', { postId, sharesCount });
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, shares: sharesCount }
          : post
      ));
    };

    // POST DELETED
    const handlePostDeleted = ({ postId }) => {
      console.log('🗑️ Received post:deleted', { postId });
      setPosts(prev => prev.filter(post => post._id !== postId));
    };

    // POST EDITED
    const handlePostEdited = ({ postId, content }) => {
      console.log('✏️ Received post:edited', { postId, content });
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, content }
          : post
      ));
    };

    // Attach listeners
    socket.on('post:liked', handlePostLiked);
    socket.on('post:unliked', handlePostUnliked);
    socket.on('post:commented', handlePostCommented);
    socket.on('comment:liked', handleCommentLiked);
    socket.on('post:shared', handlePostShared);
    socket.on('post:deleted', handlePostDeleted);
    socket.on('post:edited', handlePostEdited);

    // Cleanup
    return () => {
      socket.off('post:liked', handlePostLiked);
      socket.off('post:unliked', handlePostUnliked);
      socket.off('post:commented', handlePostCommented);
      socket.off('comment:liked', handleCommentLiked);
      socket.off('post:shared', handlePostShared);
      socket.off('post:deleted', handlePostDeleted);
      socket.off('post:edited', handlePostEdited);
    };
  }, [socket, connected]);

  // Create post
  const createPost = async (content, files, postType, problemDescription) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('postType', postType);
      if (problemDescription) {
        formData.append('problemDescription', problemDescription);
      }
      files.forEach(file => formData.append('media', file));

      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPosts(prev => [response.data.post, ...prev]);
      return { success: true, post: response.data.post };
    } catch (error) {
      console.error('Failed to create post:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to create post' };
    }
  };

  // Like post
  const likePost = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      const { liked, likesCount } = response.data;

      // Emit socket event
      if (socket && connected) {
        socket.emit(liked ? 'post:like' : 'post:unlike', {
          postId,
          userId: response.data.userId,
          likesCount
        });
      }

      // Update local state immediately
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: liked 
                ? [...(post.likes || []), response.data.userId]
                : (post.likes || []).filter(id => id !== response.data.userId),
              likesCount 
            }
          : post
      ));

      return { success: true };
    } catch (error) {
      console.error('Failed to like post:', error);
      return { success: false };
    }
  };

  // Comment on post
  const commentOnPost = async (postId, text) => {
    try {
      const response = await api.post(`/posts/${postId}/comment`, { text });
      const { comment, commentsCount } = response.data;

      // Emit socket event
      if (socket && connected) {
        socket.emit('post:comment', {
          postId,
          comment,
          commentsCount
        });
      }

      // Update local state
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              comments: [...(post.comments || []), comment],
              commentsCount 
            }
          : post
      ));

      return { success: true, comment };
    } catch (error) {
      console.error('Failed to comment:', error);
      return { success: false };
    }
  };

  // Like comment
  const likeComment = async (postId, commentId) => {
    try {
      const response = await api.post(`/posts/${postId}/comments/${commentId}/like`);
      const { likesCount } = response.data;

      // Emit socket event
      if (socket && connected) {
        socket.emit('comment:like', {
          postId,
          commentId,
          userId: response.data.userId,
          likesCount
        });
      }

      // Update local state
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? {
              ...post,
              comments: (post.comments || []).map(comment =>
                comment._id === commentId
                  ? { ...comment, likes: [...(comment.likes || []), response.data.userId] }
                  : comment
              )
            }
          : post
      ));

      return { success: true };
    } catch (error) {
      console.error('Failed to like comment:', error);
      return { success: false };
    }
  };

  // Share post
  const sharePost = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/share`);
      const { sharesCount } = response.data;

      // Emit socket event
      if (socket && connected) {
        socket.emit('post:share', {
          postId,
          userId: response.data.userId,
          sharesCount
        });
      }

      // Update local state
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, shares: sharesCount }
          : post
      ));

      return { success: true };
    } catch (error) {
      console.error('Failed to share post:', error);
      return { success: false };
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);

      // Emit socket event
      if (socket && connected) {
        socket.emit('post:delete', { postId });
      }

      // Update local state
      setPosts(prev => prev.filter(post => post._id !== postId));

      return { success: true };
    } catch (error) {
      console.error('Failed to delete post:', error);
      return { success: false };
    }
  };

  // Edit post
  const editPost = async (postId, content) => {
    try {
      const response = await api.put(`/posts/${postId}`, { content });

      // Emit socket event
      if (socket && connected) {
        socket.emit('post:edit', { postId, content });
      }

      // Update local state
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, content }
          : post
      ));

      return { success: true, post: response.data.post };
    } catch (error) {
      console.error('Failed to edit post:', error);
      return { success: false };
    }
  };

  return {
    posts,
    loading,
    filter,
    setFilter,
    createPost,
    likePost,
    commentOnPost,
    sharePost,
    deletePost,
    editPost,
    likeComment,
    refetch: fetchPosts
  };
};