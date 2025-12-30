/* 
 * FILE: frontend/src/components/Home/PostCard.jsx
 * PURPOSE: Individual post card with header, content, media, and actions
 */
import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, Repeat2, Heart } from 'lucide-react';
import { getTimeAgo } from '@/utils/helpers';
import PostActions from './PostActions';

const PostCard = ({ 
  post, 
  user, 
  onLike, 
  onComment, 
  onShare, 
  onDelete, 
  onEdit,
  onCommentLike 
}) => {
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState('');

  const isLiked = post.likes?.includes(user?._id || user?.id);
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;
  const sharesCount = post.shares || 0;
  const isOwnPost = post.userId?._id === user?._id || post.userId?.id === user?.id;

  const handleEditPost = () => {
    setEditingPost(true);
    setEditContent(post.content);
    setActiveDropdown(false);
  };

  const saveEditPost = async () => {
    await onEdit(post._id, editContent);
    setEditingPost(false);
    setEditContent('');
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await onDelete(post._id);
      setActiveDropdown(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    await onCommentLike(commentId);
  };

  const getMediaGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    return 'grid-cols-2';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition">
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
                onClick={() => setActiveDropdown(!activeDropdown)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition"
              >
                <MoreVertical size={20} />
              </button>
              {activeDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10">
                  <button
                    onClick={handleEditPost}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit2 size={16} />
                    <span>Edit post</span>
                  </button>
                  <button
                    onClick={handleDeletePost}
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
          editingPost ? (
            <div className="mb-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveEditPost}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingPost(false)}
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

      {/* Post Media */}
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

      {/* Post Stats */}
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
      <PostActions 
        post={post}
        isLiked={isLiked}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
      />

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
                        className={`flex items-center gap-1 hover:text-blue-600 font-medium ${commentLiked ? 'text-red-500' : ''}`}
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
                onClick={() => onComment(post)}
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
};

export default PostCard;