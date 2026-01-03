/* 
 * FILE: frontend/src/pages/HomePage.jsx
 * PURPOSE: Main home page - FIXED NO FORM RELOAD
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth, usePost } from '@/hooks';
import CreatePost from '@/components/Home/CreatePost';
import FilterBar from '@/components/Home/FilterBar';
import FeedView from '@/components/Home/FeedView';

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
    likeComment 
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

  // Share modal states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostData, setSharePostData] = useState(null);

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

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const result = await commentOnPost(selectedPost._id, commentText);
    if (result.success) {
      setCommentText('');
      setCommentModalOpen(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
            handleCommentLike={handleCommentLike}
            shareModalOpen={shareModalOpen}
            setShareModalOpen={setShareModalOpen}
            sharePostData={sharePostData}
            handleShareToFeed={handleShareToFeed}
          />
        </div>
      </main>
    </div>
  );
};

export default HomePage;