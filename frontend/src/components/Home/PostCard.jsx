/* 
 * FILE: frontend/src/components/Home/PostCard.jsx
 * PURPOSE: LinkedIn-style post card with professional design
 */
import React, { useState } from 'react';
import { MoreHorizontal, Edit2, Trash2, ThumbsUp, MessageSquare, Share2, Send } from 'lucide-react';
import { getTimeAgo } from '@/utils/helpers';

const PostCard = ({ 
  post, 
  user, 
  onLike, 
  onComment, 
  onShare, 
  onDelete, 
  onEdit 
}) => {
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState('');

  const isLiked = post.likes?.includes(user?._id || user?.id);
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;
  const sharesCount = post.shares || 0;
  const isOwnPost = post.userId?._id === user?._id || post.userId?.id === user?.id;

  const handleEditPost = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditingPost(true);
    setEditContent(post.content);
    setActiveDropdown(false);
  };

  const saveEditPost = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    await onEdit(post._id, editContent);
    setEditingPost(false);
    setEditContent('');
  };

  const handleDeletePost = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (window.confirm('Delete this post? This cannot be undone.')) {
      await onDelete(post._id);
      setActiveDropdown(false);
    }
  };

  const getMediaGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    return 'grid-cols-2';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={post.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
            alt={post.userId?.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-[15px] leading-tight">
              {post.userId?.name}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {post.userId?.role}
            </p>
            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
              <span>{getTimeAgo(post.createdAt)}</span>
              <span>•</span>
              <span>🌐</span>
            </p>
          </div>
          {isOwnPost && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveDropdown(!activeDropdown);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition"
              >
                <MoreHorizontal size={20} />
              </button>
              {activeDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-10">
                  <button
                    type="button"
                    onClick={handleEditPost}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Edit2 size={16} />
                    <span>Edit post</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 size={16} />
                    <span>Delete post</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="mt-3">
          {editingPost ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEditPost}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditingPost(false);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}
        </div>
      </div>

      {/* Post Media */}
      {post.media && post.media.length > 0 && (
        <div className={`grid ${getMediaGridClass(post.media.length)} gap-0.5 bg-slate-100`}>
          {post.media.map((m, i) => (
            <div key={i} className="relative bg-slate-50 flex items-center justify-center max-h-[500px] overflow-hidden">
              {m.type === 'image' ? (
                <img
                  src={m.url}
                  alt=""
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              ) : (
                <video
                  src={m.url}
                  controls
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post Stats */}
      {(likesCount > 0 || commentsCount > 0 || sharesCount > 0) && (
        <div className="px-4 py-2.5 flex items-center justify-between text-sm text-slate-500 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {likesCount > 0 && (
              <button className="flex items-center gap-1.5 hover:text-blue-600 transition group">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <ThumbsUp size={11} className="text-white fill-white" />
                </div>
                <span className="text-slate-600 group-hover:underline">
                  {likesCount}
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            {commentsCount > 0 && (
              <button 
                className="hover:text-blue-600 hover:underline transition"
                onClick={() => onComment(post)}
              >
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
            {sharesCount > 0 && (
              <span>{sharesCount} {sharesCount === 1 ? 'share' : 'shares'}</span>
            )}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="px-2 py-1.5 grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => onLike(post._id)}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
            isLiked
              ? 'text-blue-600 bg-blue-50'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ThumbsUp size={18} className={isLiked ? 'fill-blue-600' : ''} />
          <span>Like</span>
        </button>
        
        <button
          type="button"
          onClick={() => onComment(post)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          <MessageSquare size={18} />
          <span>Comment</span>
        </button>
        
        <button
          type="button"
          onClick={() => onShare(post)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          <Send size={18} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;