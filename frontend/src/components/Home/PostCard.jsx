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
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 dark:border-slate-800/60 hover:-translate-y-0.5 transition-all duration-300 ease-out overflow-hidden">
      {/* Post Header */}
      <div className="p-5 sm:p-6 pb-4">
        <div className="flex items-start gap-4">
          <img
            src={post.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
            alt={post.userId?.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[16px] leading-tight">
              {post.userId?.name}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium">
              {post.userId?.role}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5 flex items-center gap-1 font-medium">
              <span>{getTimeAgo(post.createdAt)}</span>
              <span>•</span>
              <span className="opacity-80">🌐</span>
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
                className="text-text-dim hover:text-text-main p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full "
              >
                <MoreHorizontal size={20} />
              </button>
              {activeDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-surface dark:bg-slate-800 rounded-lg shadow-xl border border-border-card py-1 z-10 transition-all">
                  <button
                    type="button"
                    onClick={handleEditPost}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-main hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <Edit2 size={16} />
                    <span>Edit post</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-border-card rounded-lg px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-text-dim/50"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEditPost}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditingPost(false);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-text-main rounded-full text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text-main/90 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}
        </div>
      </div>

      {/* Post Media */}
      {post.media && post.media.length > 0 && (
        <div className={`grid ${getMediaGridClass(post.media.length)} gap-0.5 bg-slate-100 dark:bg-slate-800 w-full mt-3`}>
          {post.media.map((m, i) => (
            <div key={i} className="relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center max-h-[500px] overflow-hidden">
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
        <div className="px-5 py-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {likesCount > 0 && (
              <button className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition group">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <ThumbsUp size={11} className="text-white fill-white" />
                </div>
                <span className="text-text-dim/80 group-hover:underline font-medium">
                  {likesCount}
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 font-medium">
            {commentsCount > 0 && (
              <button 
                className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition"
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
      <div className="px-3 py-2 grid grid-cols-3 gap-2 bg-slate-50/50 dark:bg-slate-900/20">
        <button
          type="button"
          onClick={() => onLike(post._id)}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out ${
            isLiked
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 scale-[1.02]'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ThumbsUp size={18} strokeWidth={2.5} className={isLiked ? 'fill-blue-600 dark:fill-blue-400' : ''} />
          <span>Like</span>
        </button>
        
        <button
          type="button"
          onClick={() => onComment(post)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all duration-300 ease-out"
        >
          <MessageSquare size={18} strokeWidth={2.5} />
          <span>Comment</span>
        </button>
        
        <button
          type="button"
          onClick={() => onShare(post)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all duration-300 ease-out"
        >
          <Send size={18} strokeWidth={2.5} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
