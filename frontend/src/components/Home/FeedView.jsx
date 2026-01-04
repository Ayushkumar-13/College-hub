  /* 
  * FILE: frontend/src/components/Home/FeedView.jsx
  * PURPOSE: Posts list with loading state, empty state, and modals
  */
  import React from 'react';
  import { Home as HomeIcon, X, Send, MessageCircle, Share2, Heart } from 'lucide-react';
  import PostCard from './PostCard';
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
    shareModalOpen,
    setShareModalOpen,
    sharePostData,
    handleShareToFeed
  }) => {
    
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <HomeIcon size={50} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 text-lg">No posts yet. Be the first to share!</p>
        </div>
      );
    }

    return (
      <>
        {/* Posts List */}
        <div className="space-y-4">
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
            />
          ))}
        </div>

        {/* Comment Modal */}
        {commentModalOpen && selectedPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-lg font-bold">Comments</h2>
                <button
                  type="button"
                  onClick={() => {
                    setCommentModalOpen(false);
                    setCommentText('');
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
                            type="button"
                            onClick={() => handleCommentLike(comment._id)}
                            className={`flex items-center gap-1 hover:text-blue-600 font-medium transition ${commentLiked ? 'text-red-500' : ''}`}
                          >
                            <Heart size={12} className={commentLiked ? 'fill-current' : ''} />
                            <span>Like</span>
                            {commentLikesCount > 0 && <span>({commentLikesCount})</span>}
                          </button>

                          <button
                            type="button"
                            className="hover:text-blue-600 font-medium transition"
                          >
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
                      type="button"
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left"
                >
                  <MessageCircle size={20} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Send in a message</p>
                    <p className="text-xs text-slate-500">Share with specific people</p>
                  </div>
                </button>

                <button
                  type="button"
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
      </>
    );
  };

  export default FeedView;
