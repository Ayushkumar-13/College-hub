  /* 
  * FILE: frontend/src/components/Home/FeedView.jsx
  * PURPOSE: Posts list with loading state, empty state, and modals
  */
  import React, { useState } from 'react';
  import { Home as HomeIcon, X, Send, MessageCircle, Share2, ThumbsUp, CornerDownRight } from 'lucide-react';
  import PostCard from './PostCard';
  import Skeleton from '../Common/Skeleton';
  import { getTimeAgo } from '@/utils/helpers';

  const FeedView = ({ 
    posts, 
    loading, 
    user, 
    onLike, 
    onComment, 
    onShare, 
    onDelete, 
    onEdit,
    onCommentLike,
    commentModalOpen,
    setCommentModalOpen,
    selectedPost,
    commentText,
    setCommentText,
    handleComment,
    handleCommentLike,
    isCommenting,
    shareModalOpen,
    setShareModalOpen,
    sharePostData,
    handleShareToFeed,
    onViewLikes
  }) => {
    const [replyingTo, setReplyingTo] = useState(null);

    const submitComment = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      handleComment(e, replyingTo);
      setReplyingTo(null);
    };
    
    if (loading) {
      return (
        <div className="space-y-6 py-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800/60 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="avatar" />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="text" width="w-1/3" />
                  <Skeleton variant="text" width="w-1/4" height="h-3" />
                </div>
              </div>
              <Skeleton variant="text" />
              <Skeleton variant="text" width="w-5/6" />
              <Skeleton variant="card" />
            </div>
          ))}
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800/60">
          <HomeIcon size={50} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <p className="text-slate-500 text-lg font-medium">No posts yet. Be the first to share!</p>
        </div>
      );
    }

    return (
      <>
        {/* Posts List */}
        <div className="space-y-6">
          {posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              user={user}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onDelete={onDelete}
              onEdit={onEdit}
              onCommentLike={onCommentLike}
              onViewLikes={onViewLikes}
            />
          ))}
        </div>

        {/* Comment Modal */}
        {commentModalOpen && selectedPost && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200" onClick={() => {
              setCommentModalOpen(false);
              setCommentText('');
              setReplyingTo(null);
            }}>
            <div 
              className="bg-surface dark:bg-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col md:flex-row h-[90vh] sm:h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* LEFT PANE: Media Zone */}
              <div className="w-full md:w-[55%] lg:w-[60%] bg-black/95 border-b md:border-b-0 md:border-r border-border-card overflow-y-auto hidden-scrollbar relative hidden md:flex items-center justify-center">
                 {selectedPost.media && selectedPost.media.length > 0 ? (
                    <div className="w-full h-full flex flex-col overflow-y-auto hidden-scrollbar snap-y snap-mandatory scroll-smooth">
                       {selectedPost.media.map((m, idx) => (
                           <div key={idx} className="w-full min-h-full flex items-center justify-center snap-start snap-always p-2 bg-black">
                             {m.type === 'image' ? (
                               <img src={m.url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
                             ) : (
                               <video src={m.url} controls className="max-w-full max-h-[85vh] object-contain rounded-lg" />
                             )}
                           </div>
                       ))}
                    </div>
                 ) : (
                    <div className="w-full h-full p-8 flex flex-col justify-center items-center text-center bg-slate-50 dark:bg-slate-900">
                       <img src={selectedPost.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-xl mb-6" />
                       <h2 className="text-2xl font-bold text-text-main mb-4">{selectedPost.userId?.name}</h2>
                       <p className="text-[17px] text-text-main/90 leading-relaxed max-w-lg whitespace-pre-wrap">{selectedPost.content}</p>
                    </div>
                 )}
              </div>

              {/* RIGHT PANE: Header, Context, Comments, Input */}
              <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col bg-surface dark:bg-slate-900 h-full relative">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-border-card flex items-center justify-between bg-surface dark:bg-slate-900 z-10 shrink-0">
                  <h2 className="text-lg font-bold text-text-main">
                    Comments
                    <span className="ml-2 text-sm font-normal text-text-dim bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {selectedPost.comments?.length || 0}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setCommentModalOpen(false);
                      setCommentText('');
                      setReplyingTo(null);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors -mr-2"
                  >
                    <X size={20} className="text-text-main" />
                  </button>
                </div>

                {/* Core Scroll Area */}
                <div className="flex-1 overflow-y-auto hidden-scrollbar scroll-smooth">
                  
                  {/* Original Post Context Header */}
                  <div className="p-5 border-b border-border-card bg-slate-50/50 dark:bg-slate-800/10 shrink-0">
                    <div className="flex gap-4">
                      <img
                        src={selectedPost.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                        alt=""
                        className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 object-cover mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-text-main">{selectedPost.userId?.name}</p>
                        <p className="text-[14.5px] text-text-main/90 mt-1.5 whitespace-pre-wrap flex-wrap break-words leading-relaxed">{selectedPost.content}</p>
                        <p className="text-[12px] text-text-dim mt-2.5 font-medium">{getTimeAgo(selectedPost.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Comments Array */}
                  <div className="p-5 space-y-6">
                    {[...(selectedPost.comments || [])].reverse().map((comment, idx) => {
                      const commentLikesCount = comment.likes?.length || 0;
                      const repliesCount = comment.replies?.length || 0;
                      const commentLiked = comment.likes?.includes(user?._id || user?.id);

                      return (
                        <div key={comment._id || idx} className="flex gap-3">
                          <img
                            src={comment.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200 dark:border-slate-800"
                          />
                          <div className="flex-1 min-w-0">
                            {/* Comment Bubble */}
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 inline-block max-w-full shadow-sm">
                              <p className="font-bold text-[13px] text-text-main">{comment.userId?.name}</p>
                              <p className="text-[14px] text-text-main/95 mt-0.5 whitespace-pre-wrap break-words">{comment.text}</p>
                            </div>
                            
                            {/* Actions under bubble */}
                            <div className="flex items-center gap-4 mt-1.5 px-3 text-[12px] text-text-dim font-bold">
                              <button
                                type="button"
                                onClick={() => handleCommentLike(comment._id)}
                                className={`flex items-center gap-1 hover:text-blue-600 transition ${commentLiked ? 'text-blue-600' : ''}`}
                              >
                                <ThumbsUp size={12} className={commentLiked ? 'fill-current' : ''} />
                                <span>Like</span>
                              </button>
                              
                              {commentLikesCount > 0 && (
                                <button 
                                  type="button" 
                                  onClick={() => onViewLikes(comment._id, 'comment', selectedPost._id)}
                                  className="text-blue-600 hover:text-blue-700 hover:underline -ml-2"
                                >
                                  ({commentLikesCount})
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setReplyingTo({ commentId: comment._id, name: comment.userId?.name })}
                                className="hover:text-blue-600 transition"
                              >
                                Reply
                              </button>

                              <span className="font-medium text-slate-400">{getTimeAgo(comment.createdAt)}</span>
                            </div>

                            {/* Nested Replies */}
                            {repliesCount > 0 && (
                              <div className="mt-4 space-y-4 border-l-2 border-slate-200 dark:border-slate-700/50 pl-4 ml-2">
                                {[...(comment.replies || [])].map((reply, rIdx) => {
                                  const replyLikesCount = reply.likes?.length || 0;
                                  const replyLiked = reply.likes?.includes(user?._id || user?.id);

                                  return (
                                  <div key={rIdx} className="flex gap-2">
                                    <img
                                      src={reply.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                                      alt=""
                                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 inline-block max-w-full shadow-sm">
                                        <p className="font-bold text-[12px] text-text-main">{reply.userId?.name}</p>
                                        <p className="text-[13px] text-text-main/95 mt-0.5 whitespace-pre-wrap break-words">
                                          {/* Identify @Name */}
                                          {reply.text.startsWith('@') ? (
                                            <>
                                              <span className="text-blue-600 font-semibold">{reply.text.split(' ')[0]} </span>
                                              {reply.text.substring(reply.text.indexOf(' ') + 1)}
                                            </>
                                          ) : (
                                            reply.text
                                          )}
                                        </p>
                                      </div>
                                      
                                      {/* Actions under reply bubble */}
                                      <div className="flex items-center gap-3 mt-1 px-3 text-[11px] text-text-dim font-bold">
                                        <button
                                          type="button"
                                          onClick={() => onReplyLike(selectedPost._id, comment._id, reply._id)}
                                          className={`flex items-center gap-1 hover:text-blue-600 transition ${replyLiked ? 'text-blue-600' : ''}`}
                                        >
                                          <ThumbsUp size={11} className={replyLiked ? 'fill-current' : ''} />
                                          <span>Like</span>
                                        </button>
                                        
                                        {replyLikesCount > 0 && (
                                          <button 
                                            type="button" 
                                            onClick={() => onViewLikes(reply._id, 'reply', selectedPost._id, comment._id)}
                                            className="text-blue-600 hover:text-blue-700 hover:underline -ml-1.5"
                                          >
                                            ({replyLikesCount})
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => setReplyingTo({ commentId: comment._id, name: reply.userId?.name })}
                                          className="hover:text-blue-600 transition"
                                        >
                                          Reply
                                        </button>

                                        <span className="font-medium text-slate-400">{getTimeAgo(reply.createdAt)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sticky Input Footer */}
                <div className="p-4 border-t border-border-card bg-surface dark:bg-slate-900 shrink-0">
                  <div className="flex gap-3 relative">
                    <img
                      src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                      alt=""
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800"
                    />
                    <div className="flex-1 flex gap-2">
                      {replyingTo && (
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 absolute -top-10 left-12 text-[11px] font-bold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 border border-slate-100 dark:border-slate-700 transition"
                        >
                          <X size={12} strokeWidth={3} />
                          Cancel reply
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder={replyingTo ? `Replying to @${replyingTo.name}...` : "Write a comment..."}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submitComment(e);
                          }
                        }}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-text-main border border-transparent focus:border-blue-500 rounded-full px-5 py-3 text-sm outline-none transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={submitComment}
                        disabled={!commentText.trim() || isCommenting}
                        className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[44px]"
                      >
                        {isCommenting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {shareModalOpen && sharePostData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-surface dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-card animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-main">Share</h2>
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800  text-left group"
                >
                  <MessageCircle size={20} className="text-blue-600 dark:text-blue-500" />
                  <div>
                    <p className="font-semibold text-sm text-text-main">Send in a message</p>
                    <p className="text-xs text-text-dim/70 font-medium">Share with specific people</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleShareToFeed}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800  text-left group"
                >
                  <Share2 size={20} className="text-green-600 dark:text-green-500" />
                  <div>
                    <p className="font-semibold text-sm text-text-main">Share to feed</p>
                    <p className="text-xs text-text-dim/70 font-medium">Post to your timeline</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  export default FeedView;
