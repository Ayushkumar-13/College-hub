/* 
 * FILE: frontend/src/pages/HomePage.jsx
 * PURPOSE: Main home page - FIXED COMMENTS
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth, usePost } from '@/hooks';
import CreatePost from '@/components/Home/CreatePost';
import FilterBar from '@/components/Home/FilterBar';
import FeedView from '@/components/Home/FeedView';
import LikesModal from '@/components/Home/LikesModal';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    posts, 
    loading, 
    filter, 
    setFilter, 
    createPost, 
    likePost, 
    commentOnPost, 
    sharePost, 
    deletePost, 
    editPost, 
    likeComment,
    replyToComment
  } = usePost();

  const [newPost, setNewPost] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [postType, setPostType] = useState('status');
  const [problemDescription, setProblemDescription] = useState('');

  // Comment modal states
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // Share modal states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostData, setSharePostData] = useState(null);

  // View Likes Modal state
  const [likesModalData, setLikesModalData] = useState({ isOpen: false, targetId: null, postId: null, type: null });

  const handleViewLikes = (targetId, type, postId = null) => {
    setLikesModalData({ isOpen: true, targetId, type, postId });
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
    alert('Post shared successfully!');
  };

  return (
    <div className="min-h-screen bg-page ">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          
          <FilterBar filter={filter} setFilter={setFilter} />
          
          <CreatePost 
            user={user}
            newPost={newPost}
            setNewPost={setNewPost}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            previewUrls={previewUrls}
            setPreviewUrls={setPreviewUrls}
            submitting={submitting}
            postType={postType}
            setPostType={setPostType}
            problemDescription={problemDescription}
            setProblemDescription={setProblemDescription}
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
        </div>
      </main>

      <LikesModal
        isOpen={likesModalData.isOpen}
        onClose={() => setLikesModalData({ ...likesModalData, isOpen: false })}
        targetId={likesModalData.targetId}
        postId={likesModalData.postId}
        type={likesModalData.type}
      />
    </div>
  );
};

export default HomePage;
