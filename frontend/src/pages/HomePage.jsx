/*
 * FILE: frontend/src/pages/HomePage.jsx
 * PURPOSE: Production-ready home page with LinkedIn-style features
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Share2, Repeat2, MoreVertical,
  Image as ImageIcon, Video, X, Send, Edit2, Trash2, Home as HomeIcon
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth, usePost } from '@/hooks';
import { getTimeAgo } from '@/utils/helpers';
import { POST_FILTERS } from '@/utils/constants';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, loading, filter, setFilter, createPost, likePost, commentOnPost, sharePost, deletePost, editPost, likeComment } = usePost();

  const [newPost, setNewPost] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Comment modal states
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Share modal states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostData, setSharePostData] = useState(null);

  // Dropdown menu states
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');

  const [postType, setPostType] = useState('status'); // For post type selector
  const [problemDescription, setProblemDescription] = useState(''); // Problem description for "problem" posts

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (commentModalOpen || shareModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [commentModalOpen, shareModalOpen]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const urls = [];

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File too large: ${file.name} (max 10MB)`);
        return;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`Invalid file type: ${file.name}`);
        return;
      }
      validFiles.push(file);
      urls.push(URL.createObjectURL(file));
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleMentionInput = (e) => {
    setNewPost(e.target.value);
  };

  const handleCreatePost = async () => {
    if (postType === 'problem' && !problemDescription.trim()) {
      alert('Please add a problem description.');
      return;
    }
    if (!newPost.trim() && selectedFiles.length === 0) {
      alert('Please add some content or media');
      return;
    }

    setSubmitting(true);
    const result = await createPost(newPost, selectedFiles, postType, problemDescription);
    if (result.success) {
      setNewPost('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      setProblemDescription('');
      setPostType('status');
    } else {
      alert(result.error || 'Failed to create post');
    }
    setSubmitting(false);
  };

  const handleLike = async (postId) => {
    await likePost(postId);
  };

  const handleCommentLike = async (commentId) => {
    await likeComment(selectedPost._id, commentId);
    setSelectedPost(prev => ({
      ...prev,
      comments: prev.comments.map(c => c._id === commentId
        ? { ...c, likes: [...(c.likes || []), user._id] }
        : c
      )
    }));
  };

  const openCommentModal = (post) => {
    setSelectedPost(post);
    setCommentModalOpen(true);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    const result = await commentOnPost(selectedPost._id, commentText);
    if (result.success) {
      setCommentText('');
      setCommentModalOpen(false);
    }
  };

  const openShareModal = (post) => {
    setSharePostData(post);
    setShareModalOpen(true);
  };

  const handleShareToFeed = async () => {
    await sharePost(sharePostData._id);
    setShareModalOpen(false);
    alert('Post shared successfully!');
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(postId);
      setActiveDropdown(null);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post._id);
    setEditContent(post.content);
    setActiveDropdown(null);
  };

  const saveEditPost = async (postId) => {
    await editPost(postId, editContent);
    setEditingPost(null);
    setEditContent('');
  };

  const getMediaGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    return 'grid-cols-2';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* Navbar */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm p-3 flex gap-2 overflow-x-auto">
            {Object.values(POST_FILTERS).map(filterOption => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${filter === filterOption
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>

          {/* Create Post Section */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex flex-col gap-2 mb-4">

              {/* Post Type Selector */}
              <div className="flex gap-2 text-sm mb-2">
                {['status', 'problem'].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setPostType(type);
                      if (type === 'status') setProblemDescription('');
                    }}
                    className={`px-3 py-1 rounded-full transition font-medium ${
                      postType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Main Post Input */}
              <div className="flex gap-4">
                <img
                  src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                  alt=""
                  className="w-12 h-12 rounded-full ring-2 ring-slate-100"
                />
                <textarea
                  placeholder="What's on your mind? Use @ to mention someone..."
                  value={newPost}
                  onChange={handleMentionInput}
                  rows={3}
                  className="flex-1 bg-slate-50 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>

              {/* Problem Description */}
              {postType === 'problem' && (
                <textarea
                  placeholder="Describe the problem..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none mt-2"
                />
              )}
            </div>

            {/* Media Preview */}
            {previewUrls.length > 0 && (
              <div className={`grid ${getMediaGridClass(previewUrls.length)} gap-2 mb-4`}>
                {previewUrls.map((url, index) => {
                  const file = selectedFiles[index];
                  const isVideo = file?.type.startsWith('video/');

                  return (
                    <div key={index} className="relative group">
                      {isVideo ? (
                        <video src={url} className="w-full h-64 object-cover rounded-xl bg-white" controls />
                      ) : (
                        <img src={url} alt="" className="w-full h-64 object-cover rounded-xl bg-white" />
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black transition opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Post Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 text-green-600 hover:bg-green-50 px-4 py-2 rounded-full text-sm font-medium transition"
                >
                  <ImageIcon size={20} />
                  <span>Photo</span>
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-full text-sm font-medium transition"
                >
                  <Video size={20} />
                  <span>Video</span>
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={submitting || (!newPost.trim() && selectedFiles.length === 0)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-2.5 rounded-full hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
              <HomeIcon size={50} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 text-lg">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map(post => {
              const isLiked = post.likes?.includes(user?._id || user?.id);
              const likesCount = post.likes?.length || 0;
              const commentsCount = post.comments?.length || 0;
              const sharesCount = post.shares || 0;
              const isOwnPost = post.userId?._id === user?._id || post.userId?.id === user?.id;
              const isEditing = editingPost === post._id;

              return (
                <div key={post._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition">
                  {/* Post Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={post.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                        alt=""
                        className="w-12 h-12 rounded-full ring-2 ring-blue-100"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{post.userId?.name}</h3>
                        <p className="text-xs text-slate-500">
                          {post.userId?.role} • {getTimeAgo(post.createdAt)}
                        </p>
                      </div>
                      {isOwnPost && (
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === post._id ? null : post._id)}
                            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition"
                          >
                            <MoreVertical size={20} />
                          </button>
                          {activeDropdown === post._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10">
                              <button
                                onClick={() => handleEditPost(post)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Edit2 size={16} />
                                <span>Edit post</span>
                              </button>
                              <button
                                onClick={() => handleDeletePost(post._id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                                <span>Delete post</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {post.isRepost && (
                      <div className="flex items-center gap-2 text-pink-600 text-sm mb-3 font-medium">
                        <Repeat2 size={16} />
                        <span>Reposted</span>
                      </div>
                    )}

                    {post.content && (
                      isEditing ? (
                        <div className="mb-4">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => saveEditPost(post._id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPost(null)}
                              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-full text-sm hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mb-4 text-base text-slate-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      )
                    )}
                  </div>

                  {/* Post Media - LinkedIn Style (500px max, white bg) */}
                  {post.media && post.media.length > 0 && (
                    <div className={`grid ${getMediaGridClass(post.media.length)} gap-1 bg-white`}>
                      {post.media.map((m, i) => (
                        <div key={i} className="relative bg-white flex items-center justify-center max-h-[500px] overflow-hidden">
                          {m.type === 'image' ? (
                            <img
                              src={m.url}
                              alt=""
                              className="w-full h-auto max-h-[500px] object-contain"
                            />
                          ) : (
                            <video
                              src={m.url}
                              controls
                              className="w-full h-auto max-h-[500px] object-contain"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Post Stats - Only numbers */}
                  <div className="px-5 py-3 flex items-center justify-between text-sm text-slate-500 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      {likesCount > 0 && (
                        <span className="hover:text-blue-600 cursor-pointer">{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {commentsCount > 0 && <span className="hover:text-blue-600 cursor-pointer">{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>}
                      {sharesCount > 0 && <span className="hover:text-blue-600 cursor-pointer">{sharesCount} {sharesCount === 1 ? 'share' : 'shares'}</span>}
                    </div>
                  </div>

                  {/* Post Actions */}
                  <div className="p-2 grid grid-cols-4 gap-1">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition ${isLiked
                        ? 'text-red-500 bg-red-50 hover:bg-red-100'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      <Heart
                        size={20}
                        className={isLiked ? 'fill-current' : ''}
                      />
                      <span>Like</span>
                    </button>
                    <button
                      onClick={() => openCommentModal(post)}
                      className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      <MessageCircle size={20} />
                      <span>Comment</span>
                    </button>
                    <button
                      onClick={() => openShareModal(post)}
                      className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      <Share2 size={20} />
                      <span>Share</span>
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      <Repeat2 size={20} />
                      <span>Repost</span>
                    </button>
                  </div>

                  {/* Comments Preview */}
                  {commentsCount > 0 && (
                    <div className="px-5 pb-3 pt-2 border-t border-slate-100">
                      <div className="space-y-3">
                        {post.comments.slice(0, 1).map((comment, idx) => {
                          const commentLikesCount = comment.likes?.length || 0;
                          const repliesCount = comment.replies?.length || 0;
                          const commentLiked = comment.likes?.includes(user?._id || user?.id);

                          return (
                            <div key={idx} className="flex gap-3">
                              <img
                                src={comment.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                                alt=""
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1">
                                <div className="bg-slate-50 rounded-2xl px-4 py-2">
                                  <p className="font-semibold text-sm">{comment.userId?.name}</p>
                                  <p className="text-sm text-slate-700">{comment.text}</p>
                                </div>
                                <div className="flex items-center gap-4 mt-1 px-2 text-xs text-slate-500">
                                  <button
                                    onClick={() => handleCommentLike(comment._id)}
                                    className={`flex items-center gap-1 hover:text-blue-600 font-medium ${commentLiked ? 'text-red-500' : ''
                                      }`}
                                  >
                                    <Heart size={12} className={commentLiked ? 'fill-current text-red-500' : ''} />
                                    <span>Like</span>
                                    {commentLikesCount > 0 && <span>({commentLikesCount})</span>}
                                  </button>
                                  <button className="hover:text-blue-600 font-medium">
                                    Reply {repliesCount > 0 && `(${repliesCount})`}
                                  </button>
                                  <span>{getTimeAgo(comment.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {commentsCount > 1 && (
                          <button
                            onClick={() => openCommentModal(post)}
                            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                          >
                            View all {commentsCount} comments
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Comment Modal - Fixed scroll */}
      {commentModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold">Comments</h2>
              <button
                onClick={() => {
                  setCommentModalOpen(false);
                  setCommentText(''); // Clear on close
                }}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedPost.comments?.map((comment, idx) => {
                const commentLikesCount = comment.likes?.length || 0;
                const repliesCount = comment.replies?.length || 0;
                const commentLiked = comment.likes?.includes(user?._id || user?.id);

                return (
                  <div key={idx} className="flex gap-3">
                    <img
                      src={comment.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="bg-slate-50 rounded-2xl px-4 py-3">
                        <p className="font-semibold text-sm">{comment.userId?.name}</p>
                        <p className="text-sm text-slate-700">{comment.text}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 px-2 text-xs text-slate-500">
                        <button
                          onClick={() => handleCommentLike(comment._id)}
                          className={`flex items-center gap-1 hover:text-blue-600 font-medium transition ${commentLiked ? 'text-red-500' : ''}`}
                        >
                          <Heart size={12} className={commentLiked ? 'fill-current' : ''} />
                          <span>Like</span>
                          {commentLikesCount > 0 && <span>({commentLikesCount})</span>}
                        </button>
                        <button className="hover:text-blue-600 font-medium transition">
                          Reply {repliesCount > 0 && `(${repliesCount})`}
                        </button>
                        <span>{getTimeAgo(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 rounded-b-2xl">
              <div className="flex gap-3">
                <img
                  src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleComment();
                      }
                    }}
                    className="flex-1 bg-slate-50 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && sharePostData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Share</h2>
              <button onClick={() => setShareModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <button
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left"
              >
                <MessageCircle size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Send in a message</p>
                  <p className="text-xs text-slate-500">Share with specific people</p>
                </div>
              </button>

              <button
                onClick={handleShareToFeed}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left"
              >
                <Share2 size={20} className="text-green-600" />
                <div>
                  <p className="font-medium text-sm">Share to feed</p>
                  <p className="text-xs text-slate-500">Post to your timeline</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;