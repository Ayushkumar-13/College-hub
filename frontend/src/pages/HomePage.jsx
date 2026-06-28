/* 
 * FILE: frontend/src/pages/HomePage.jsx
 * PURPOSE: Main home page - FIXED COMMENTS
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth, usePost } from '@/hooks';
import CreatePost from '@/components/Home/CreatePost';
import FeedView from '@/components/Home/FeedView';
import LikesModal from '@/components/Home/LikesModal';
import UserProfileCard from '@/components/Home/UserProfileCard';
import MessagingDrawer from '@/components/Messaging/MessagingDrawer';

const HomePage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    posts, 
    loading, 
    createPost, 
    likePost, 
    commentOnPost, 
    sharePost, 
    deletePost, 
    editPost, 
    likeComment,
    likeReply,
    replyToComment,
    editComment,
    deleteComment
  } = usePost();

  const [newPost, setNewPost] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Comment modal states
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // Share modal states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostData, setSharePostData] = useState(null);

  // View Likes Modal state
  const [likesModalData, setLikesModalData] = useState({ isOpen: false, targetId: null, postId: null, commentId: null, type: null });

  const handleViewLikes = (targetId, type, postId = null, commentId = null) => {
    setLikesModalData({ isOpen: true, targetId, type, postId, commentId });
  };

  // Prevent body scroll when modal is open without causing scroll jumps
  useEffect(() => {
    if (commentModalOpen || shareModalOpen || likesModalData.isOpen) {
      document.body.style.overflow = 'hidden';
      // To prevent strict jump, set overscrollBehavior
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    };
  }, [commentModalOpen, shareModalOpen, likesModalData.isOpen]);

  useEffect(() => {
    const postId = searchParams.get('post');
    if (!postId || posts.length === 0) return;

    const targetPost = posts.find((p) => String(p._id) === String(postId));
    if (targetPost) {
      setSelectedPost(targetPost);
      setCommentModalOpen(true);
    }

    requestAnimationFrame(() => {
      const el = document.getElementById(`post-${postId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => el?.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'), 3000);
    });

    searchParams.delete('post');
    setSearchParams(searchParams, { replace: true });
  }, [posts, searchParams, setSearchParams]);

  // ✅ Update selectedPost when posts change
  useEffect(() => {
    if (selectedPost && commentModalOpen) {
      const updatedPost = posts.find(p => p._id === selectedPost._id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    }
  }, [posts, commentModalOpen]);

  const handleCreatePost = async () => {
    if (!newPost.trim() && selectedFiles.length === 0) {
      window.showToast?.('Please add some content or media', 'warning');
      return;
    }

    setSubmitting(true);
    const result = await createPost(newPost, selectedFiles, 'feed', '');
    if (result.success) {
      setNewPost('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      window.showToast?.('Post created successfully!', 'success');
    } else {
      window.showToast?.(result.error || 'Failed to create post. Please try again.', 'error');
    }
    setSubmitting(false);
  };

  const openCommentModal = (post) => {
    setSelectedPost(post);
    setCommentModalOpen(true);
  };

  // ✅ FIXED: Don't close modal, keep it open to see your comment
  const handleComment = async (e, replyingToObject = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!commentText.trim() || isCommenting) return;
    
    setIsCommenting(true);
    try {
      if (replyingToObject) {
        const textPayload = `@${replyingToObject.name} ${commentText}`;
        console.log('💬 Submitting reply:', textPayload);
        const result = await replyToComment(selectedPost._id, replyingToObject.commentId, textPayload);
        if (result.success) setCommentText('');
        else alert('Failed to post reply');
      } else {
        console.log('💬 Submitting comment:', commentText);
        const result = await commentOnPost(selectedPost._id, commentText);
        if (result.success) setCommentText('');
        else alert('Failed to post comment');
      }
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    console.log('❤️ Liking comment:', commentId);
    await likeComment(selectedPost._id, commentId);
    // Socket will update automatically
  };

  const openShareModal = (post) => {
    setSharePostData(post);
    setShareModalOpen(true);
  };

  const handleShareToFeed = async () => {
    await sharePost(sharePostData._id);
    setShareModalOpen(false);
    window.showToast?.('Post shared successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-page ">
      <Navbar />
      
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div
          className="mx-auto w-full flex flex-col gap-6 min-[830px]:flex-row min-[830px]:gap-8 min-[830px]:items-start max-w-[680px] min-[830px]:max-w-[992px] min-[1200px]:max-w-[1384px]"
        >
          <aside className="hidden min-[830px]:block sticky top-20 w-[280px] shrink-0">
            <UserProfileCard user={user} />
          </aside>

          <section className="w-full min-w-0 flex-1 space-y-4">
            <CreatePost
              user={user}
              newPost={newPost}
              setNewPost={setNewPost}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              previewUrls={previewUrls}
              setPreviewUrls={setPreviewUrls}
              submitting={submitting}
              onSubmit={handleCreatePost}
            />

            <FeedView
              posts={posts}
              loading={loading}
              user={user}
              onLike={likePost}
              onComment={openCommentModal}
              onShare={openShareModal}
              onDelete={deletePost}
              onEdit={editPost}
              onCommentLike={likeComment}
              onReplyLike={likeReply}
              onCommentEdit={editComment}
              onCommentDelete={deleteComment}
              commentModalOpen={commentModalOpen}
              setCommentModalOpen={setCommentModalOpen}
              selectedPost={selectedPost}
              commentText={commentText}
              setCommentText={setCommentText}
              handleComment={handleComment}
              isCommenting={isCommenting}
              handleCommentLike={handleCommentLike}
              shareModalOpen={shareModalOpen}
              setShareModalOpen={setShareModalOpen}
              sharePostData={sharePostData}
              handleShareToFeed={handleShareToFeed}
              onViewLikes={handleViewLikes}
            />
          </section>

          <aside
            className="hidden min-[1200px]:flex w-[360px] shrink-0 flex-col justify-end sticky top-20 self-start"
            style={{ height: 'calc(100vh - 5rem)' }}
            aria-label="Messaging"
          >
            <MessagingDrawer user={user} />
          </aside>
        </div>
      </main>

      <LikesModal
        isOpen={likesModalData.isOpen}
        onClose={() => setLikesModalData({ ...likesModalData, isOpen: false })}
        targetId={likesModalData.targetId}
        postId={likesModalData.postId}
        commentId={likesModalData.commentId}
        type={likesModalData.type}
      />

    </div>
  );
};

export default HomePage;
