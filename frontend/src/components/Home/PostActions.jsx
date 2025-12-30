/* 
 * FILE: frontend/src/components/Home/PostActions.jsx
 * PURPOSE: Like, Comment, Share, Repost action buttons
 */
import React from 'react';
import { Heart, MessageCircle, Share2, Repeat2 } from 'lucide-react';

const PostActions = ({ post, isLiked, onLike, onComment, onShare }) => {
  return (
    <div className="p-2 grid grid-cols-4 gap-1">
      <button
        onClick={() => onLike(post._id)}
        className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition ${
          isLiked
            ? 'text-red-500 bg-red-50 hover:bg-red-100'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Heart size={20} className={isLiked ? 'fill-current' : ''} />
        <span>Like</span>
      </button>
      
      <button
        onClick={() => onComment(post)}
        className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
      >
        <MessageCircle size={20} />
        <span>Comment</span>
      </button>
      
      <button
        onClick={() => onShare(post)}
        className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
      >
        <Share2 size={20} />
        <span>Share</span>
      </button>
      
      <button className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">
        <Repeat2 size={20} />
        <span>Repost</span>
      </button>
    </div>
  );
};

export default PostActions;