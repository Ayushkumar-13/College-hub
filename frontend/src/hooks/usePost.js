/* 
 * FILE: frontend/src/hooks/usePost.js
 * PURPOSE: Post management with WORKING real-time updates - ENHANCED DEBUG
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { postApi } from '@/api/postApi';

export const usePost = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { socket, connected } = useSocket();
  const listenersAttached = useRef(false);

  // CRITICAL DEBUG - This should appear in console
  console.log('🚀 usePost HOOK CALLED');
  console.log('🔍 usePost - Socket status:', { 
    hasSocket: !!socket, 
    connected,
    socketId: socket?.id,
    listenersAttached: listenersAttached.current
  });

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await postApi.getPosts(filter);
      setPosts(response || []);
      console.log('✅ Posts fetched:', (response || []).length);
    } catch (error) {
      console.error('❌ Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ==================== REAL-TIME SOCKET LISTENERS ====================
  useEffect(() => {
    console.log('🔄 useEffect triggered - checking socket:', {
      hasSocket: !!socket,
      connected,
      socketId: socket?.id
    });

    if (!socket) {
      console.log('⚠️ Socket not available yet');
      return;
    }

    if (!connected) {
      console.log('⚠️ Socket not connected yet');
      return;
    }

    if (listenersAttached.current) {
      console.log('⚠️ Listeners already attached, skipping');
      return;
    }

    console.log('📡 Setting up socket listeners on socket:', socket.id);

    // LIKE UPDATE - Only update count for OTHER users
    const handleLikeUpdate = (data) => {
      console.log('🎉 RECEIVED post:like:update:', data);
      
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const currentUserId = currentUser?._id || currentUser?.id;
      
      // Skip if this is MY OWN action (already updated optimistically)
      if (data.userId === currentUserId) {
        console.log('⏭️ Skipping own action - already updated');
        return;
      }
      
      setPosts(prev => {
        const updated = prev.map(post => {
          if (post._id !== data.postId) return post;
          
          console.log('🔄 Updating post likes for OTHER user:', {
            postId: data.postId,
            before: post.likes?.length,
            otherUserId: data.userId,
            liked: data.liked
          });

          // Update the likes array to reflect OTHER user's action
          let newLikes = [...(post.likes || [])];
          
          if (data.liked) {
            // Add OTHER user's like
            if (!newLikes.includes(data.userId)) {
              newLikes.push(data.userId);
            }
          } else {
            // Remove OTHER user's like
            newLikes = newLikes.filter(id => id !== data.userId);
          }

          return { ...post, likes: newLikes };
        });
        return updated;
      });
    };

    // ✅ COMMENT UPDATE - Show for ALL users including comment author
    const handleCommentUpdate = (data) => {
      console.log('🎉 RECEIVED post:comment:update:', data);
      
      setPosts(prev => {
        const updated = prev.map(post => {
          if (post._id !== data.postId) return post;
          
          console.log('🔄 Adding comment to post:', {
            postId: data.postId,
            commentsBefore: post.comments?.length,
            newComment: data.comment._id
          });

          // Check if comment already exists (avoid duplicates)
          const commentExists = post.comments?.some(c => c._id === data.comment._id);
          if (commentExists) {
            console.log('⚠️ Comment already exists, skipping');
            return post;
          }

          const newComments = [...(post.comments || []), data.comment];
          return { ...post, comments: newComments };
        });
        return updated;
      });
    };

    // ✅ REPLY UPDATE
    const handleReplyUpdate = (data) => {
      console.log('🎉 RECEIVED comment:reply:update:', data);
      
      setPosts(prev => {
        const updated = prev.map(post => {
          if (post._id !== data.postId) return post;
          
          const newComments = (post.comments || []).map(comment => {
            if (comment._id !== data.commentId) return comment;
            
            const replyExists = comment.replies?.some(r => r._id === data.reply._id);
            if (replyExists) return comment;
            
            return {
              ...comment,
              replies: [...(comment.replies || []), data.reply]
            };
          });
          
          return { ...post, comments: newComments };
        });
        return updated;
      });
    };

    // COMMENT LIKE UPDATE - Only for OTHER users
    const handleCommentLikeUpdate = (data) => {
      console.log('🎉 RECEIVED comment:like:update:', data);
      
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const currentUserId = currentUser?._id || currentUser?.id;
      
      // Skip if this is MY OWN action
      if (data.userId === currentUserId) {
        console.log('⏭️ Skipping own comment like - already updated');
        return;
      }
      
      setPosts(prev => prev.map(post => {
        if (post._id !== data.postId) return post;

        return {
          ...post,
          comments: (post.comments || []).map(comment => {
            if (comment._id !== data.commentId) return comment;

            console.log('🔄 Updating comment likes from OTHER user:', {
              commentId: data.commentId,
              before: comment.likes?.length,
              liked: data.liked
            });

            let newLikes = [...(comment.likes || [])];
            
            if (data.liked) {
              if (!newLikes.includes(data.userId)) {
                newLikes.push(data.userId);
              }
            } else {
              newLikes = newLikes.filter(id => id !== data.userId);
            }

            return { ...comment, likes: newLikes };
          })
        };
      }));
    };

    // REPLY LIKE UPDATE - Only for OTHER users
    const handleReplyLikeUpdate = (data) => {
      console.log('🎉 RECEIVED reply:like:update:', data);
      
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const currentUserId = currentUser?._id || currentUser?.id;
      
      if (data.userId === currentUserId) return;
      
      setPosts(prev => prev.map(post => {
        if (post._id !== data.postId) return post;

        return {
          ...post,
          comments: (post.comments || []).map(comment => {
            if (comment._id !== data.commentId) return comment;

            return {
              ...comment,
              replies: (comment.replies || []).map(reply => {
                if (reply._id !== data.replyId) return reply;

                let newLikes = [...(reply.likes || [])];
                if (data.liked) {
                  if (!newLikes.includes(data.userId)) newLikes.push(data.userId);
                } else {
                  newLikes = newLikes.filter(id => id !== data.userId);
                }

                return { ...reply, likes: newLikes };
              })
            };
          })
        };
      }));
    };

    // SHARE UPDATE
    const handleShareUpdate = (data) => {
      console.log('🎉 RECEIVED post:share:update:', data);
      setPosts(prev => prev.map(post => 
        post._id === data.postId 
          ? { ...post, shares: data.shares }
          : post
      ));
    };

    // POST CREATE
    const handlePostCreate = (newPost) => {
      console.log('🎉 RECEIVED post:create:', newPost);
      setPosts(prev => {
        // Check if post already exists
        const exists = prev.some(p => p._id === newPost._id);
        if (exists) {
          console.log('⚠️ Post already exists, skipping');
          return prev;
        }
        return [newPost, ...prev];
      });
    };

    // POST EDIT
    const handlePostEdit = (data) => {
      console.log('🎉 RECEIVED post:edit:update:', data);
      setPosts(prev => prev.map(post => 
        post._id === data.postId 
          ? { ...post, ...data.updatedData }
          : post
      ));
    };

    // POST DELETE
    const handlePostDelete = (data) => {
      console.log('🎉 RECEIVED post:delete:', data);
      setPosts(prev => prev.filter(post => post._id !== data.postId));
    };

    // Attach all listeners
    console.log('✅ Attaching socket listeners...');
    socket.on('post:like:update', handleLikeUpdate);
    socket.on('post:comment:update', handleCommentUpdate);
    socket.on('comment:like:update', handleCommentLikeUpdate);
    socket.on('comment:reply:update', handleReplyUpdate);
    socket.on('reply:like:update', handleReplyLikeUpdate);
    socket.on('post:share:update', handleShareUpdate);
    socket.on('post:create', handlePostCreate);
    socket.on('post:edit:update', handlePostEdit);
    socket.on('post:delete', handlePostDelete);

    listenersAttached.current = true;
    console.log('✅ All listeners attached successfully to socket:', socket.id);

    // Verify listeners are attached
    console.log('🔍 Verifying listeners:', {
      'post:like:update': socket.listeners('post:like:update').length,
      'post:comment:update': socket.listeners('post:comment:update').length,
      'post:share:update': socket.listeners('post:share:update').length
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('post:like:update', handleLikeUpdate);
      socket.off('post:comment:update', handleCommentUpdate);
      socket.off('comment:like:update', handleCommentLikeUpdate);
      socket.off('comment:reply:update', handleReplyUpdate);
      socket.off('reply:like:update', handleReplyLikeUpdate);
      socket.off('post:share:update', handleShareUpdate);
      socket.off('post:create', handlePostCreate);
      socket.off('post:edit:update', handlePostEdit);
      socket.off('post:delete', handlePostDelete);
      listenersAttached.current = false;
    };
  }, [socket, connected]);

  // ==================== API CALLS WITH OPTIMISTIC UPDATES ====================
  
  const likePost = async (postId) => {
    try {
      console.log('👍 Calling like API for post:', postId);
      
      // Optimistic update
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const userId = currentUser?._id || currentUser?.id;
      
      setPosts(prev => prev.map(post => {
        if (post._id !== postId) return post;
        
        const isLiked = post.likes?.includes(userId);
        return {
          ...post,
          likes: isLiked
            ? post.likes.filter(id => id !== userId)
            : [...(post.likes || []), userId]
        };
      }));

      // API call
      await postApi.likePost(postId);
      console.log('✅ Like API successful');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Like API failed:', error);
      // Rollback on error
      fetchPosts();
      return { success: false };
    }
  };

  const commentOnPost = async (postId, text) => {
    try {
      console.log('💬 Calling comment API for post:', postId);
      await postApi.commentOnPost(postId, text);
      console.log('✅ Comment API successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Comment API failed:', error);
      return { success: false };
    }
  };

  const replyToComment = async (postId, commentId, text) => {
    try {
      console.log('💬 Calling reply API for comment:', commentId);
      await postApi.replyToComment(postId, commentId, text);
      console.log('✅ Reply API successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Reply API failed:', error);
      return { success: false };
    }
  };

  const likeComment = async (postId, commentId) => {
    try {
      console.log('❤️ Calling like comment API:', { postId, commentId });
      
      // Optimistic update
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const userId = currentUser?._id || currentUser?.id;
      
      setPosts(prev => prev.map(post => {
        if (post._id !== postId) return post;
        return {
          ...post,
          comments: (post.comments || []).map(comment => {
            if (comment._id !== commentId) return comment;
            const isLiked = comment.likes?.includes(userId);
            return {
              ...comment,
              likes: isLiked
                ? comment.likes.filter(id => id !== userId)
                : [...(comment.likes || []), userId]
            };
          })
        };
      }));

      await postApi.likeComment(postId, commentId);
      console.log('✅ Like comment API successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Like comment API failed:', error);
      fetchPosts();
      return { success: false };
    }
  };

  const likeReply = async (postId, commentId, replyId) => {
    try {
      console.log('❤️ Calling like reply API:', { postId, commentId, replyId });
      
      // Optimistic update
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const userId = currentUser?._id || currentUser?.id;
      
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
                  likes: isLiked
                    ? reply.likes.filter(id => id !== userId)
                    : [...(reply.likes || []), userId]
                };
              })
            };
          })
        };
      }));

      await postApi.likeReply(postId, commentId, replyId);
      console.log('✅ Like reply API successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Like reply API failed:', error);
      fetchPosts();
      return { success: false };
    }
  };

  const sharePost = async (postId) => {
    try {
      console.log('🔄 Calling share API for post:', postId);
      await postApi.sharePost(postId);
      console.log('✅ Share API successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Share API failed:', error);
      return { success: false };
    }
  };

  const createPost = async (content, files, postType, problemDescription) => {
    try {
      console.log('📝 Creating post...');
      const result = await postApi.createPost(content, files, postType, problemDescription);
      console.log('✅ Post created:', result);
      return { success: true, post: result };
    } catch (error) {
      console.error('❌ Create post failed:', error);
      return { success: false, error: error.message };
    }
  };

  const deletePost = async (postId) => {
    try {
      console.log('🗑️ Deleting post:', postId);
      await postApi.deletePost(postId);
      console.log('✅ Post deleted');
      setPosts(prev => prev.filter(p => p._id !== postId));
      return { success: true };
    } catch (error) {
      console.error('❌ Delete post failed:', error);
      return { success: false };
    }
  };

  const editPost = async (postId, content) => {
    try {
      console.log('✏️ Editing post:', postId);
      await postApi.editPost(postId, { content });
      console.log('✅ Post edited');
      setPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, content } : p
      ));
      return { success: true };
    } catch (error) {
      console.error('❌ Edit post failed:', error);
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
    replyToComment,
    sharePost,
    deletePost,
    editPost,
    likeComment,
    likeReply,
    refetch: fetchPosts
  };
};