/**
 * FILE: frontend/src/context/PostContext.jsx
 * PURPOSE: Global Post management with Context and Real-time Socket sync
 */
import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import { postApi } from '@/api/postApi';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';

export const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { socket, connected } = useContext(SocketContext);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const listenersAttached = useRef(false);

  /* ---------------- LOAD POSTS ---------------- */
  const fetchPosts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await postApi.getPosts(filter);
      setPosts(data || []);
      console.log('✅ Posts loaded:', (data || []).length);
    } catch (err) {
      console.error('❌ Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, isAuthenticated]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /* ---------------- REAL-TIME SOCKET LISTENERS ---------------- */
  useEffect(() => {
    if (!socket || !connected || !isAuthenticated) return;
    if (listenersAttached.current) return;

    console.log('📡 PostContext: Attaching socket listeners:', socket.id);

    const handleLikeUpdate = (data) => {
      const currentUserId = user?._id || user?.id;
      if (data.userId === currentUserId) return;
      
      setPosts(prev => prev.map(post => {
        if (post._id !== data.postId) return post;
        let newLikes = [...(post.likes || [])];
        if (data.liked) {
          if (!newLikes.includes(data.userId)) newLikes.push(data.userId);
        } else {
          newLikes = newLikes.filter(id => id !== data.userId);
        }
        return { ...post, likes: newLikes };
      }));
    };

    const handleCommentUpdate = (data) => {
      setPosts(prev => prev.map(post => {
        if (post._id !== data.postId) return post;
        if (post.comments?.some(c => c._id === data.comment._id)) return post;
        return { ...post, comments: [...(post.comments || []), data.comment] };
      }));
    };

    const handleCommentEdit = (data) => {
      setPosts(prev => prev.map(post => {
        if (post._id !== data.postId) return post;
        return {
          ...post,
          comments: (post.comments || []).map(comment =>
            comment._id === data.commentId ? { ...comment, text: data.text } : comment
          )
        };
      }));
    };

    const handleCommentDelete = (data) => {
      setPosts(prev => prev.map(post => {
        if (post._id !== data.postId) return post;
        return {
          ...post,
          comments: (post.comments || []).filter(comment => comment._id !== data.commentId)
        };
      }));
    };

    const handleReplyUpdate = (data) => {
      setPosts(prev => prev.map(post => {
        if (post._id !== data.postId) return post;
        const newComments = (post.comments || []).map(comment => {
          if (comment._id !== data.commentId) return comment;
          if (comment.replies?.some(r => r._id === data.reply._id)) return comment;
          return { ...comment, replies: [...(comment.replies || []), data.reply] };
        });
        return { ...post, comments: newComments };
      }));
    };

    const handlePostDelete = (data) => {
      console.log('🎉 RECEIVED post:delete:', data);
      setPosts(prev => prev.filter(post => post._id !== data.postId));
    };

    const handlePostEdit = (data) => {
      setPosts(prev => prev.map(post => 
        post._id === data.postId ? { ...post, ...data.updatedData } : post
      ));
    };

    // Attach
    socket.on('post:like:update', handleLikeUpdate);
    socket.on('post:comment:update', handleCommentUpdate);
    socket.on('comment:edit:update', handleCommentEdit);
    socket.on('comment:delete:update', handleCommentDelete);
    socket.on('comment:reply:update', handleReplyUpdate);
    socket.on('post:delete', handlePostDelete);
    socket.on('post:edit:update', handlePostEdit);

    listenersAttached.current = true;

    return () => {
      socket.off('post:like:update', handleLikeUpdate);
      socket.off('post:comment:update', handleCommentUpdate);
      socket.off('comment:edit:update', handleCommentEdit);
      socket.off('comment:delete:update', handleCommentDelete);
      socket.off('comment:reply:update', handleReplyUpdate);
      socket.off('post:delete', handlePostDelete);
      socket.off('post:edit:update', handlePostEdit);
      listenersAttached.current = false;
    };
  }, [socket, connected, isAuthenticated, user]);

  /* ---------------- ACTIONS ---------------- */

  const createPost = async (content, files, type, problemDescription) => {
    try {
      const result = await postApi.createPost(content, files, type, problemDescription);
      setPosts(prev => [result, ...prev]);
      return { success: true, post: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const likePost = async (postId) => {
    const userId = user?._id || user?.id;
    setPosts(prev => prev.map(post => {
      if (post._id !== postId) return post;
      const alreadyLiked = post.likes?.includes(userId);
      return {
        ...post,
        likes: alreadyLiked 
          ? post.likes.filter(id => id !== userId)
          : [...(post.likes || []), userId]
      };
    }));
    try {
      await postApi.likePost(postId);
      return { success: true };
    } catch (err) {
      fetchPosts();
      return { success: false };
    }
  };

  const deletePost = async (postId) => {
    try {
      console.log('🗑️ Deleting post:', postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      await postApi.deletePost(postId);
      window.showToast?.('Post deleted successfully', 'success');
      return { success: true };
    } catch (err) {
      console.error('❌ Delete failed:', err);
      window.showToast?.('Failed to delete post', 'error');
      fetchPosts();
      return { success: false };
    }
  };

  const editPost = async (postId, content, removedMediaIds = [], newFiles = []) => {
    try {
      console.log('✏️ Editing post:', postId, { removedMediaIds, newFilesCount: newFiles.length });
      const updatedPost = await postApi.editPost(postId, content, removedMediaIds, newFiles);
      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      window.showToast?.('Post updated successfully', 'success');
      return { success: true };
    } catch (err) {
      console.error('❌ Edit post failed:', err);
      window.showToast?.('Failed to update post', 'error');
      return { success: false };
    }
  };

  const commentOnPost = async (postId, text) => {
    try {
      await postApi.commentOnPost(postId, text);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  };

  const editComment = async (postId, commentId, text) => {
    try {
      await postApi.editComment(postId, commentId, text);
      setPosts(prev => prev.map(post => {
        if (post._id !== postId) return post;
        return {
          ...post,
          comments: (post.comments || []).map(comment =>
            comment._id === commentId ? { ...comment, text } : comment
          )
        };
      }));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      await postApi.deleteComment(postId, commentId);
      setPosts(prev => prev.map(post => {
        if (post._id !== postId) return post;
        return {
          ...post,
          comments: (post.comments || []).filter(comment => comment._id !== commentId)
        };
      }));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  };

  const replyToComment = async (postId, commentId, text) => {
    try {
      await postApi.replyToComment(postId, commentId, text);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  };

  const likeComment = async (postId, commentId) => {
    const userId = user?._id || user?.id;
    setPosts(prev => prev.map(post => {
      if (post._id !== postId) return post;
      return {
        ...post,
        comments: (post.comments || []).map(comment => {
          if (comment._id !== commentId) return comment;
          const isLiked = comment.likes?.includes(userId);
          return {
            ...comment,
            likes: isLiked ? comment.likes.filter(id => id !== userId) : [...(comment.likes || []), userId]
          };
        })
      };
    }));
    try {
      await postApi.likeComment(postId, commentId);
      return { success: true };
    } catch (err) {
      fetchPosts();
      return { success: false };
    }
  };

  const likeReply = async (postId, commentId, replyId) => {
    const userId = user?._id || user?.id;
    setPosts(prev => prev.map(post => {
      if (post._id !== postId) return post;
      return {
        ...post,
        comments: (post.comments || []).map(comment => {
          if (comment._id !== commentId) return comment;
          return {
            ...comment,
            replies: (comment.replies || []).map(reply => {
              if (reply._id !== replyId) return reply;
              const isLiked = reply.likes?.includes(userId);
              return {
                ...reply,
                likes: isLiked ? reply.likes.filter(id => id !== userId) : [...(reply.likes || []), userId]
              };
            })
          };
        })
      };
    }));
    try {
      await postApi.likeReply(postId, commentId, replyId);
      return { success: true };
    } catch (err) {
      fetchPosts();
      return { success: false };
    }
  };

  const sharePost = async (postId) => {
    try {
      await postApi.sharePost(postId);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  };

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
        editComment,
        deleteComment,
        replyToComment,
        sharePost,
        deletePost,
        editPost,
        likeComment,
        likeReply,
        refetch: fetchPosts
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
